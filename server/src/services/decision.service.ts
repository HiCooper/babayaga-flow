import { Repository } from '../db/repository';
import { Decision } from '../types';

export class DecisionService {
  constructor(private repo: Repository) {}

  getPendingDecisions(): Decision[] {
    return this.repo.listDecisions().filter(d => d.status === 'pending');
  }

  resolveDecision(id: string, chosen: string): Decision {
    const d = this.repo.getDecision(id);
    if (!d) throw new Error(`Decision ${id} not found`);
    this.repo.resolveDecision(id, chosen);
    return this.repo.getDecision(id)!;
  }

  listDecisions(projectId?: string): Decision[] {
    return this.repo.listDecisions(projectId);
  }
}
