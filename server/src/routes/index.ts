import { Router, Request, Response } from 'express';
import { ProjectService } from '../services/project.service';
import { AgentService } from '../services/agent.service';
import { DecisionService } from '../services/decision.service';
import { TechDebtService } from '../services/techdebt.service';
import { Repository } from '../db/repository';
import { wsHub } from '../ws/hub';

export function createRouter(repo: Repository): Router {
  const r = Router();
  const projectSvc = new ProjectService(repo);
  const agentSvc = new AgentService(repo);
  const decisionSvc = new DecisionService(repo);
  const debtSvc = new TechDebtService(repo);

  // ============================================================
  // Global stats
  // ============================================================
  r.get('/api/stats', (_req: Request, res: Response) => {
    res.json({ success: true, data: projectSvc.getStats() });
  });

  // ============================================================
  // Projects
  // ============================================================
  r.get('/api/projects', (_req: Request, res: Response) => {
    res.json({ success: true, data: projectSvc.listProjects() });
  });

  r.get('/api/projects/:id', (req: Request, res: Response) => {
    const p = projectSvc.getProject(req.params.id);
    if (!p) return res.status(404).json({ success: false, error: 'Project not found' });
    const agents = repo.listAgents(p.id);
    const iterations = agentSvc.getActiveIterations(p.id);
    const decisions = decisionSvc.listDecisions(p.id);
    const techDebts = debtSvc.listByProject(p.id);
    const history = repo.getHistoryIterations(p.id);
    res.json({ success: true, data: { ...p, agents, iterations, decisions, techDebts, history } });
  });

  r.post('/api/projects', (req: Request, res: Response) => {
    try {
      const p = projectSvc.registerProject(req.body);
      wsHub.broadcastAll({ type: 'iteration_update', projectId: p.id, iteration: {} as any });
      res.status(201).json({ success: true, data: p });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  });

  // ============================================================
  // Agents
  // ============================================================
  r.post('/api/projects/:id/agents/start', (req: Request, res: Response) => {
    try {
      const agent = agentSvc.startAgent(req.params.id, req.body.service || 'main', req.body.task);
      wsHub.broadcastProject(req.params.id, { type: 'agent_state', agentId: agent.id, data: agent });
      res.status(201).json({ success: true, data: agent });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  });

  r.get('/api/projects/:id/agents', (req: Request, res: Response) => {
    res.json({ success: true, data: repo.listAgents(req.params.id) });
  });

  r.post('/api/agents/:id/report', (req: Request, res: Response) => {
    try {
      const result = agentSvc.reportIteration(req.params.id, req.body);
      const agent = repo.getAgent(req.params.id)!;
      wsHub.broadcastProject(agent.projectId, {
        type: 'iteration_update', projectId: agent.projectId, iteration: result.iteration
      });
      if (result.escalation) {
        wsHub.broadcastProject(agent.projectId, {
          type: 'escalation', projectId: agent.projectId, decision: result.escalation
        });
      }
      res.json({ success: true, data: result });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  });

  r.post('/api/agents/:id/heartbeat', (req: Request, res: Response) => {
    const agent = repo.getAgent(req.params.id);
    if (!agent) return res.status(404).json({ success: false, error: 'Agent not found' });
    const now = new Date().toISOString();
    repo.updateAgent(req.params.id, { heartbeatAt: now, currentAction: req.body.action || agent.currentAction });
    wsHub.broadcastProject(agent.projectId, { type: 'heartbeat', agentId: agent.id, at: now });
    res.json({ success: true, data: { heartbeatAt: now } });
  });

  r.post('/api/agents/:id/stop', (req: Request, res: Response) => {
    const agent = repo.getAgent(req.params.id);
    if (!agent) return res.status(404).json({ success: false, error: 'Agent not found' });
    repo.updateAgent(req.params.id, { status: 'idle', currentPhase: '已停止' });
    wsHub.broadcastProject(agent.projectId, { type: 'agent_state', agentId: agent.id, data: { status: 'idle' } });
    res.json({ success: true, data: { stopped: true } });
  });

  // ============================================================
  // Iterations
  // ============================================================
  r.get('/api/projects/:id/iterations/active', (req: Request, res: Response) => {
    res.json({ success: true, data: agentSvc.getActiveIterations(req.params.id) });
  });

  r.get('/api/projects/:id/iterations/history', (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 10;
    const all = repo.getHistoryIterations(req.params.id);
    const start = (page - 1) * perPage;
    res.json({ success: true, data: all.slice(start, start + perPage), page, perPage, total: all.length });
  });

  // ============================================================
  // Decisions
  // ============================================================
  r.get('/api/decisions', (req: Request, res: Response) => {
    const projectId = req.query.projectId as string;
    res.json({ success: true, data: decisionSvc.listDecisions(projectId || undefined) });
  });

  r.get('/api/decisions/pending', (_req: Request, res: Response) => {
    res.json({ success: true, data: decisionSvc.getPendingDecisions() });
  });

  r.post('/api/decisions/:id/resolve', (req: Request, res: Response) => {
    try {
      const d = decisionSvc.resolveDecision(req.params.id, req.body.chosen);
      const projectId = d.projectId;
      wsHub.broadcastProject(projectId, {
        type: 'escalation', projectId, decision: d
      });
      res.json({ success: true, data: d });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  });

  // ============================================================
  // Tech Debt
  // ============================================================
  r.get('/api/tech-debts', (req: Request, res: Response) => {
    const projectId = req.query.projectId as string;
    res.json({ success: true, data: debtSvc.listByProject(projectId || '') || debtSvc.listAll() });
  });

  r.get('/api/projects/:id/tech-debts', (req: Request, res: Response) => {
    res.json({ success: true, data: debtSvc.listByProject(req.params.id) });
  });

  // ============================================================
  // Cross Deps & Standards
  // ============================================================
  r.get('/api/cross-deps', (_req: Request, res: Response) => {
    res.json({ success: true, data: repo.listCrossDeps() });
  });

  r.get('/api/standards', (_req: Request, res: Response) => {
    res.json({ success: true, data: repo.listStandards() });
  });

  return r;
}
