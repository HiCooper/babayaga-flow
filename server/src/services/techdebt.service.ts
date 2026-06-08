import { Repository } from '../db/repository';
import { TechDebt } from '../types';

export class TechDebtService {
  constructor(private repo: Repository) {}

  listAll(): TechDebt[] {
    return this.repo.listTechDebts();
  }

  listByProject(projectId: string): TechDebt[] {
    return this.repo.listTechDebts(projectId);
  }
}
