import { PrismaClient, Prisma, equipment_images } from '@prisma/client'
import { BasePrismaRepository } from './BaseRepository.js'

export type EquipmentImage = Prisma.equipment_imagesGetPayload<{}>

export class EquipmentImageRepository extends BasePrismaRepository<equipment_images> {
  protected model = this.prisma.equipment_images;

  async findByEquipmentId(equipmentId: string): Promise<equipment_images[]> {
    return await this.model.findMany({
      where: { equipment_id: equipmentId },
      orderBy: { created_at: 'asc' }
    });
  }

  async deleteByBusiness(businessType: string, businessId: string): Promise<void> {
    await this.model.deleteMany({
      where: { business_type: businessType as any, business_id: businessId }
    })
  }
}

export const equipmentImageRepository = new EquipmentImageRepository()
