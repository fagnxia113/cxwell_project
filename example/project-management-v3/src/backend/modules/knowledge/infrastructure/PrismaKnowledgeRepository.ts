import { singleton } from 'tsyringe';
import { prisma } from '../../../database/prisma.js';
import { v4 as uuidv4 } from 'uuid';
import { CreateKnowledgeDTO, UpdateKnowledgeDTO } from '../domain/KnowledgeDTO.js';

interface UserContext {
  userId: string;
  departmentId?: string;
  positionId?: string;
  role?: string;
}

@singleton()
export class PrismaKnowledgeRepository {
  private prisma = prisma;

  async findAll(filters: { type?: string; search?: string; parent_id?: string | null } = {}, userContext?: UserContext) {
    const isAdmin = userContext?.role === 'admin' || userContext?.role === 'super_admin';

    const baseWhere: any = {
      AND: [
        filters.type ? { type: filters.type } : {},
        filters.parent_id !== undefined ? { parent_id: filters.parent_id === 'root' ? null : filters.parent_id } : {},
        filters.search ? {
          OR: [
            { title: { contains: filters.search } },
            { author: { contains: filters.search } }
          ]
        } : {}
      ]
    };

    // Apply visibility filter if not admin
    if (!isAdmin && userContext) {
      const { userId, departmentId, positionId } = userContext;
      
      // Inheritance logic: If we are looking for items in a specific parent_id,
      // and the user has access to that parent, they should see everything inside it.
      // However, for the initial list (parent_id === null / root) or global search, 
      // we must check the item's own permission.
      
      let parentAccessConfirmed = false;
      if (filters.parent_id && filters.parent_id !== 'root') {
        const parent = await this.prisma.knowledge_base_items.findUnique({
          where: { id: filters.parent_id },
          include: { permissions: true }
        });
        
        if (parent) {
          parentAccessConfirmed = (parent.creator_id === userId) || 
                                  (parent.visibility_type === 'everyone') ||
                                  parent.permissions.some(p => 
                                    (p.target_type === 'user' && p.target_id === userId) ||
                                    (departmentId && p.target_type === 'department' && p.target_id === departmentId) ||
                                    (positionId && p.target_type === 'position' && p.target_id === positionId)
                                  );
        }
      }

      if (!parentAccessConfirmed) {
        baseWhere.AND.push({
          OR: [
            { visibility_type: 'everyone' },
            { creator_id: userId },
            {
              permissions: {
                some: {
                  OR: [
                    { target_type: 'user', target_id: userId },
                    departmentId ? { target_type: 'department', target_id: departmentId } : {},
                    positionId ? { target_type: 'position', target_id: positionId } : {}
                  ].filter(o => Object.keys(o).length > 0)
                }
              }
            }
          ]
        });
      }
    }

    return this.prisma.knowledge_base_items.findMany({
      where: baseWhere,
      include: {
        permissions: true
      },
      orderBy: [
        { is_folder: 'desc' },
        { created_at: 'desc' }
      ]
    });
  }

  async findAllFolders(userContext?: UserContext) {
    return this.findAll({ type: 'Folder', parent_id: undefined }, userContext);
  }

  async findById(id: string) {
    return this.prisma.knowledge_base_items.findUnique({
      where: { id },
      include: {
        permissions: true
      }
    });
  }

  async existsAny(parentId: string) {
    const count = await this.prisma.knowledge_base_items.count({
      where: { parent_id: parentId }
    });
    return count > 0;
  }

  async create(data: CreateKnowledgeDTO & { creator_id?: string }) {
    const { permissions, date, ...rest } = data;
    return this.prisma.knowledge_base_items.create({
      data: {
        id: uuidv4(),
        ...(rest as any),
        date: date ? new Date(date) : new Date(),
        permissions: permissions ? {
          create: permissions.map(p => ({
            id: uuidv4(),
            target_type: p.target_type,
            target_id: p.target_id
          }))
        } : undefined
      },
      include: {
        permissions: true
      }
    });
  }

  async update(id: string, data: UpdateKnowledgeDTO) {
    const { permissions, date, ...rest } = data;
    
    // Update basic fields
    const updated = await this.prisma.knowledge_base_items.update({
      where: { id },
      data: {
        ...(rest as any),
        date: date ? new Date(date) : undefined
      }
    });

    // Update permissions if provided (replace all)
    if (permissions) {
      await this.prisma.knowledge_item_permissions.deleteMany({
        where: { item_id: id }
      });
      
      await this.prisma.knowledge_item_permissions.createMany({
        data: permissions.map(p => ({
          id: uuidv4(),
          item_id: id,
          target_type: p.target_type,
          target_id: p.target_id
        }))
      });
    }

    return this.findById(id);
  }

  async delete(id: string) {
    return this.prisma.knowledge_base_items.delete({
      where: { id }
    });
  }
}
