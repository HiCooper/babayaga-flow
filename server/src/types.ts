// ==========================================================================
// Shared types for the Control Tower platform
// ==========================================================================

export interface Project {
  id: string;
  name: string;
  repoUrl: string;
  description: string;
  domain: string;
  techTags: string[];
  status: 'active' | 'archived';
  health: 'green' | 'yellow' | 'red';
  dodConfig: DoDConfig;
  constraints: Constraint[];
  createdAt: string;
}

export interface DoDConfig {
  qualityGates: {
    types: string;
    lint: string;
    test: string;
    coverageThreshold: number;
    security: string;
  };
  antiGoals: string[];
  decisionsNeedingHuman: string[];
  ambiguousRequirementsStrategy: 'escalate' | 'guess';
  maxIterationsWithoutProgress: number;
  maxTokenBudget: number;
}

export interface Constraint {
  name: string;
  description: string;
  check: string;
  severity: 'error' | 'warning';
  autoFix: boolean;
}

export interface Agent {
  id: string;
  projectId: string;
  service: string;
  status: 'idle' | 'running' | 'blocked';
  mode: 'local' | 'cloud';
  currentIteration: number;
  currentPhase: string;
  currentAction: string;
  heartbeatAt: string;
  startedAt: string;
}

export interface Iteration {
  id: string;
  agentId: string;
  projectId: string;
  taskId: string;
  goal: string;
  currentAction?: string;
  num: number;
  total: number;
  status: 'running' | 'pass' | 'fail' | 'blocked';
  services: string[];
  meta: string;
  costTokens: number;
  tasks: SubTask[];
  startedAt: string;
  completedAt?: string;
}

export interface SubTask {
  name: string;
  service: string;
  status: 'done' | 'in-progress' | 'pending' | 'blocked';
}

export interface SelfCheck {
  id: string;
  iterationId: string;
  checkName: string;
  status: 'done' | 'running' | 'pending' | 'fail';
  durationMs: number;
}

export interface FileChange {
  id: string;
  iterationId: string;
  filePath: string;
  diffType: 'add' | 'mod' | 'delete';
  linesChanged: number;
}

export interface Decision {
  id: string;
  projectId: string;
  type: 'adr' | 'escalation';
  urgency: 'urgent' | 'normal';
  topic: string;
  context: string;
  options: DecisionOption[];
  chosen?: string;
  status: 'pending' | 'resolved';
  impact: DecisionImpact;
  createdAt: string;
  resolvedAt?: string;
}

export interface DecisionOption {
  name: string;
  recommended: boolean;
  pros: string[];
  cons: string[];
}

export interface DecisionImpact {
  constraints: string[];
  services: string[];
  costEstimate: string;
}

export interface TechDebt {
  id: string;
  projectId: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  cause: string;
  plan: string;
  overdue: boolean;
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface CrossDep {
  id: string;
  fromService: string;
  fromProject: string;
  toService: string;
  toProject: string;
  depType: string;
  risk: 'high' | 'medium' | 'low';
  impactDesc: string;
}

export interface OrgStandard {
  id: string;
  name: string;
  latestVersion: string;
  projects: Record<string, string>;
}

export interface HistoryIteration {
  id: string;
  goal: string;
  agent: string;
  services: string[];
  completed: string;
  tasksDone: number;
  cost: string;
}

// WebSocket message types
export type WSMessage =
  | { type: 'subscribe'; projectId: string }
  | { type: 'unsubscribe'; projectId: string }
  | { type: 'agent_state'; agentId: string; data: Partial<Agent> }
  | { type: 'iteration_update'; projectId: string; iteration: Iteration }
  | { type: 'check_update'; projectId: string; agentId: string; checks: SelfCheck[] }
  | { type: 'escalation'; projectId: string; decision: Decision }
  | { type: 'heartbeat'; agentId: string; at: string };

// API response wrappers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  page: number;
  perPage: number;
  total: number;
}
