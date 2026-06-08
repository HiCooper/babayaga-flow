import { v4 as uuid } from 'uuid';
import { Project, Agent, Iteration, SelfCheck, Decision, TechDebt, CrossDep, OrgStandard, HistoryIteration } from '../types';
import { Repository } from './repository';

export class MemoryStore implements Repository {
  private projects: Map<string, Project> = new Map();
  private agents: Map<string, Agent> = new Map();
  private iterations: Map<string, Iteration> = new Map();
  private checks: Map<string, SelfCheck[]> = new Map(); // iterationId -> checks
  private decisions: Map<string, Decision> = new Map();
  private techDebts: Map<string, TechDebt> = new Map();
  private crossDeps: CrossDep[] = [];
  private standards: OrgStandard[] = [];
  private history: Map<string, HistoryIteration[]> = new Map(); // projectId -> history

  // ================================================================
  // Projects
  // ================================================================
  listProjects(): Project[] { return Array.from(this.projects.values()); }
  getProject(id: string): Project | undefined { return this.projects.get(id); }
  createProject(p: Project): void { this.projects.set(p.id, p); }

  // ================================================================
  // Agents
  // ================================================================
  listAgents(projectId: string): Agent[] {
    return Array.from(this.agents.values()).filter(a => a.projectId === projectId);
  }
  getAgent(id: string): Agent | undefined { return this.agents.get(id); }
  createAgent(a: Agent): void { this.agents.set(a.id, a); }
  updateAgent(id: string, data: Partial<Agent>): void {
    const a = this.agents.get(id); if (a) Object.assign(a, data);
  }

  // ================================================================
  // Iterations
  // ================================================================
  listIterations(projectId: string): Iteration[] {
    return Array.from(this.iterations.values()).filter(i => i.projectId === projectId);
  }
  getActiveIterations(projectId: string): Iteration[] {
    return this.listIterations(projectId).filter(i => i.status === 'running' || i.status === 'blocked');
  }
  getHistoryIterations(projectId: string): HistoryIteration[] {
    return this.history.get(projectId) || [];
  }
  createIteration(it: Iteration): void { this.iterations.set(it.id, it); }
  updateIteration(id: string, data: Partial<Iteration>): void {
    const it = this.iterations.get(id); if (it) Object.assign(it, data);
  }

  // ================================================================
  // Self Checks
  // ================================================================
  createSelfCheck(c: SelfCheck): void {
    const arr = this.checks.get(c.iterationId) || [];
    arr.push(c); this.checks.set(c.iterationId, arr);
  }
  getChecksForIteration(iterationId: string): SelfCheck[] {
    return this.checks.get(iterationId) || [];
  }

  // ================================================================
  // Decisions
  // ================================================================
  listDecisions(projectId?: string): Decision[] {
    const all = Array.from(this.decisions.values());
    return projectId ? all.filter(d => d.projectId === projectId) : all;
  }
  getDecision(id: string): Decision | undefined { return this.decisions.get(id); }
  createDecision(d: Decision): void { this.decisions.set(d.id, d); }
  resolveDecision(id: string, chosen: string): void {
    const d = this.decisions.get(id);
    if (d) { d.chosen = chosen; d.status = 'resolved'; d.resolvedAt = new Date().toISOString(); }
  }

  // ================================================================
  // Tech Debt
  // ================================================================
  listTechDebts(projectId?: string): TechDebt[] {
    const all = Array.from(this.techDebts.values());
    return projectId ? all.filter(t => t.projectId === projectId) : all;
  }
  createTechDebt(td: TechDebt): void { this.techDebts.set(td.id, td); }
  updateTechDebt(id: string, data: Partial<TechDebt>): void {
    const td = this.techDebts.get(id); if (td) Object.assign(td, data);
  }

  // ================================================================
  // Cross Deps
  // ================================================================
  listCrossDeps(): CrossDep[] { return this.crossDeps; }
  setCrossDeps(deps: CrossDep[]): void { this.crossDeps = deps; }

  // ================================================================
  // Standards
  // ================================================================
  listStandards(): OrgStandard[] { return this.standards; }
  setStandards(s: OrgStandard[]): void { this.standards = s; }

  // ================================================================
  // History (add method)
  // ================================================================
  addHistory(projectId: string, item: HistoryIteration): void {
    const arr = this.history.get(projectId) || [];
    arr.push(item); this.history.set(projectId, arr);
  }
  setHistory(projectId: string, items: HistoryIteration[]): void {
    this.history.set(projectId, items);
  }

  // ================================================================
  // Seed helpers
  // ================================================================
  seedProject(p: Project): void { this.projects.set(p.id, p); }
  seedAgent(a: Agent): void { this.agents.set(a.id, a); }
  seedIteration(it: Iteration): void { this.iterations.set(it.id, it); }
  seedDecision(d: Decision): void { this.decisions.set(d.id, d); }
  seedTechDebt(td: TechDebt): void { this.techDebts.set(td.id, td); }
  seedHistory(projectId: string, items: HistoryIteration[]): void { this.history.set(projectId, items); }
}
