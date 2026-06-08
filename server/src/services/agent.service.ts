import { Repository } from '../db/repository';
import { Agent, Iteration, SelfCheck, FileChange, Decision } from '../types';
import { v4 as uuid } from 'uuid';

export class AgentService {
  constructor(private repo: Repository) {}

  startAgent(projectId: string, service: string, task: { goal: string; taskId: string; totalIterations: number }): Agent {
    const project = this.repo.getProject(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const existingAgents = this.repo.listAgents(projectId);
    const nextNum = existingAgents.length + 1;
    const agent: Agent = {
      id: `agent-${nextNum}`,
      projectId,
      service,
      status: 'running',
      mode: 'local',
      currentIteration: 1,
      currentPhase: '计划中',
      currentAction: `理解任务: ${task.goal.slice(0, 50)}...`,
      heartbeatAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
    };
    this.repo.createAgent(agent);

    // Create first iteration
    const iteration: Iteration = {
      id: uuid(),
      agentId: agent.id,
      projectId,
      taskId: task.taskId,
      goal: task.goal,
      num: 1,
      total: task.totalIterations,
      status: 'running',
      services: [service],
      meta: `刚启动 · 预计 ${task.totalIterations} 轮`,
      costTokens: 0,
      tasks: [],
      startedAt: new Date().toISOString(),
    };
    this.repo.createIteration(iteration);

    return agent;
  }

  reportIteration(agentId: string, report: {
    iterationNum: number;
    phase: string;
    action: string;
    status: 'running' | 'pass' | 'fail' | 'blocked';
    checks: Omit<SelfCheck, 'id' | 'iterationId'>[];
    files: Omit<FileChange, 'id' | 'iterationId'>[];
    costTokens: number;
    services?: string[];
    meta?: string;
    tasks?: { name: string; service: string; status: 'done' | 'in-progress' | 'pending' | 'blocked' }[];
    escalation?: { topic: string; context: string; options: Decision['options']; urgency: 'urgent' | 'normal'; impact: Decision['impact'] };
  }): { iteration: Iteration; escalation?: Decision } {
    const agent = this.repo.getAgent(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    // Update agent
    this.repo.updateAgent(agentId, {
      currentIteration: report.iterationNum,
      currentPhase: report.phase,
      currentAction: report.action,
      status: report.status,
      heartbeatAt: new Date().toISOString(),
    });

    // Create/update iteration
    const activeIters = this.repo.getActiveIterations(agent.projectId);
    let iteration = activeIters.find(i => i.agentId === agentId);
    if (!iteration) {
      iteration = {
        id: uuid(), agentId, projectId: agent.projectId,
        taskId: '', goal: '', num: report.iterationNum, total: 1,
        status: report.status, services: report.services || [agent.service],
        meta: report.meta || '', costTokens: report.costTokens,
        tasks: report.tasks || [], startedAt: new Date().toISOString(),
      };
      this.repo.createIteration(iteration);
    } else {
      this.repo.updateIteration(iteration.id, {
        num: report.iterationNum, status: report.status,
        services: report.services || iteration.services,
        meta: report.meta || iteration.meta,
        costTokens: iteration.costTokens + report.costTokens,
        tasks: report.tasks || iteration.tasks,
      });
    }

    // Store checks
    report.checks.forEach(c => {
      this.repo.createSelfCheck({ id: uuid(), iterationId: iteration!.id, ...c });
    });

    // Handle escalation
    let escalation: Decision | undefined;
    if (report.escalation) {
      escalation = {
        id: `esc-${Date.now()}`,
        projectId: agent.projectId,
        type: 'escalation',
        urgency: report.escalation.urgency,
        topic: report.escalation.topic,
        context: report.escalation.context,
        options: report.escalation.options,
        status: 'pending',
        impact: report.escalation.impact,
        createdAt: new Date().toISOString(),
      };
      this.repo.createDecision(escalation);
      this.repo.updateAgent(agentId, { status: 'blocked', currentPhase: '等待人工决策' });
    }

    // If iteration passed, move to history
    if (report.status === 'pass') {
      this.repo.updateIteration(iteration.id, { completedAt: new Date().toISOString() });
    }

    return { iteration: this.repo.listIterations(agent.projectId).find(i => i.id === iteration!.id) || iteration, escalation };
  }

  getActiveIterations(projectId: string): Iteration[] {
    return this.repo.getActiveIterations(projectId);
  }
}
