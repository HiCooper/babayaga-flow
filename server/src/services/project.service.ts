import { Repository } from '../db/repository';
import { Project, DoDConfig, Constraint } from '../types';

export class ProjectService {
  constructor(private repo: Repository) {}

  registerProject(input: { name: string; repoUrl: string; description?: string; domain?: string; techTags?: string[]; dodConfig?: DoDConfig; constraints?: Constraint[] }): Project {
    const existing = this.repo.listProjects().find(p => p.name === input.name);
    if (existing) throw new Error(`Project "${input.name}" already exists`);

    const project: Project = {
      id: input.name.toLowerCase().replace(/\s+/g, '-'),
      name: input.name,
      repoUrl: input.repoUrl,
      description: input.description || '',
      domain: input.domain || '',
      techTags: input.techTags || [],
      status: 'active',
      health: 'green',
      dodConfig: input.dodConfig || defaultDoD(),
      constraints: input.constraints || [],
      createdAt: new Date().toISOString(),
    };
    this.repo.createProject(project);
    return project;
  }

  getProject(id: string): Project | undefined {
    return this.repo.getProject(id);
  }

  listProjects(): Project[] {
    return this.repo.listProjects().filter(p => p.status === 'active');
  }

  getStats() {
    const projects = this.listProjects();
    const totalAgents = projects.reduce((sum, p) => sum + this.repo.listAgents(p.id).length, 0);
    const blockedAgents = projects.reduce((sum, p) => sum + this.repo.listAgents(p.id).filter(a => a.status === 'blocked').length, 0);
    const pendingDecisions = this.repo.listDecisions().filter(d => d.status === 'pending').length;
    const totalTechDebt = this.repo.listTechDebts().length;
    return { totalProjects: projects.length, totalAgents, blockedAgents, pendingDecisions, totalTechDebt };
  }
}

function defaultDoD(): DoDConfig {
  return {
    qualityGates: { types: 'tsc --noEmit', lint: 'eslint src/', test: 'jest --coverage', coverageThreshold: 80, security: 'npm audit' },
    antiGoals: ['no_circular_deps', 'no_console_in_prod'],
    decisionsNeedingHuman: ['new_dependency', 'breaking_api_change', 'ambiguous_requirements'],
    ambiguousRequirementsStrategy: 'escalate',
    maxIterationsWithoutProgress: 5,
    maxTokenBudget: 1_000_000,
  };
}
