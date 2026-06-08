import { Project, Agent, Iteration, SelfCheck, Decision, TechDebt, CrossDep, OrgStandard, HistoryIteration } from '../types';

export interface Repository {
  // Projects
  listProjects(): Project[];
  getProject(id: string): Project | undefined;
  createProject(p: Project): void;

  // Agents
  listAgents(projectId: string): Agent[];
  getAgent(id: string): Agent | undefined;
  createAgent(a: Agent): void;
  updateAgent(id: string, data: Partial<Agent>): void;

  // Iterations
  listIterations(projectId: string): Iteration[];
  getActiveIterations(projectId: string): Iteration[];
  getHistoryIterations(projectId: string): HistoryIteration[];
  createIteration(it: Iteration): void;
  updateIteration(id: string, data: Partial<Iteration>): void;

  // Self checks
  createSelfCheck(c: SelfCheck): void;
  getChecksForIteration(iterationId: string): SelfCheck[];

  // Decisions
  listDecisions(projectId?: string): Decision[];
  getDecision(id: string): Decision | undefined;
  createDecision(d: Decision): void;
  resolveDecision(id: string, chosen: string): void;

  // Tech debt
  listTechDebts(projectId?: string): TechDebt[];
  createTechDebt(td: TechDebt): void;
  updateTechDebt(id: string, data: Partial<TechDebt>): void;

  // Cross deps
  listCrossDeps(): CrossDep[];

  // Standards
  listStandards(): OrgStandard[];
}
