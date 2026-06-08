export interface Project {
  id: string; name: string; repoUrl: string; description: string;
  domain: string; techTags: string[]; status: string; health: string;
  createdAt: string; constraints: Constraint[];
}
export interface Constraint { name: string; description: string; check: string; severity: string; autoFix: boolean; }
export interface Agent {
  id: string; projectId: string; service: string; status: string;
  mode: string; currentIteration: number; currentPhase: string;
  currentAction: string; heartbeatAt: string; startedAt: string;
}
export interface Iteration {
  id: string; agentId: string; projectId: string; taskId: string;
  goal: string; currentAction?: string; num: number; total: number;
  status: string; services: string[]; meta: string; costTokens: number;
  tasks: SubTask[]; startedAt: string;
}
export interface SubTask { name: string; service: string; status: string; }
export interface Decision {
  id: string; projectId: string; type: string; urgency: string;
  topic: string; context: string; options: DecisionOption[];
  chosen?: string; status: string; impact: any; createdAt: string;
}
export interface DecisionOption { name: string; recommended: boolean; pros: string[]; cons: string[]; }
export interface TechDebt {
  id: string; projectId: string; description: string; severity: string;
  cause: string; plan: string; overdue: boolean; status: string;
}
export interface CrossDep {
  id: string; fromService: string; fromProject: string;
  toService: string; toProject: string; depType: string;
  risk: string; impactDesc: string;
}
export interface OrgStandard { id: string; name: string; latestVersion: string; projects: Record<string,string>; }
export interface HistoryIteration { id: string; goal: string; agent: string; services: string[]; completed: string; tasksDone: number; cost: string; }
export interface Stats { totalProjects: number; totalAgents: number; blockedAgents: number; pendingDecisions: number; totalTechDebt: number; }
export interface ProjectDetail extends Project { agents: Agent[]; iterations: Iteration[]; decisions: Decision[]; techDebts: TechDebt[]; history: HistoryIteration[]; }
