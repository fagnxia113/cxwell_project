import { singleton, inject } from 'tsyringe';
import { PrismaKnowledgeRepository } from '../infrastructure/PrismaKnowledgeRepository.js';
import { CreateKnowledgeDTO, UpdateKnowledgeDTO } from '../domain/KnowledgeDTO.js';

interface UserContext {
  userId: string;
  departmentId?: string;
  positionId?: string;
  role?: string;
}

@singleton()
export class KnowledgeUseCase {
  constructor(
    @inject('PrismaKnowledgeRepository') private knowledgeRepository: PrismaKnowledgeRepository
  ) {}

  async getAllKnowledge(filters: { type?: string; search?: string; parent_id?: string | null } = {}, userContext?: UserContext) {
    return this.knowledgeRepository.findAll(filters, userContext);
  }

  async getAllFolders(userContext?: UserContext) {
    return this.knowledgeRepository.findAllFolders(userContext);
  }

  async getKnowledgeById(id: string) {
    return this.knowledgeRepository.findById(id);
  }

  async isFolderEmpty(id: string) {
    return !(await this.knowledgeRepository.existsAny(id));
  }

  async createKnowledge(data: CreateKnowledgeDTO & { creator_id?: string }) {
    return this.knowledgeRepository.create(data);
  }

  async updateKnowledge(id: string, data: UpdateKnowledgeDTO) {
    return this.knowledgeRepository.update(id, data);
  }

  async deleteKnowledge(id: string) {
    return this.knowledgeRepository.delete(id);
  }
}
