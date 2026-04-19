import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '../database/prisma.js'

export interface TimesheetEntry {
  id: string
  report_id: string
  project_id: string
  task_id?: string | null
  duration: Decimal | number
  work_content?: string | null
  created_at?: Date | string | null
}

export class WorkTimeRepository {
  async findById(id: string): Promise<TimesheetEntry | null> {
    return await prisma.timesheet_entries.findUnique({ where: { id } }) as any
  }

  async findAll(params?: {
    where?: any
    skip?: number
    take?: number
  }): Promise<{ data: TimesheetEntry[]; total: number }> {
    const { where, skip = 0, take = 50 } = params || {}
    const [data, total] = await Promise.all([
      prisma.timesheet_entries.findMany({ where, skip, take }),
      prisma.timesheet_entries.count({ where })
    ])
    return { data: data as any, total }
  }

  async findByReport(reportId: string): Promise<TimesheetEntry[]> {
    return await prisma.timesheet_entries.findMany({
      where: { report_id: reportId }
    }) as any
  }

  async findByProject(projectId: string): Promise<TimesheetEntry[]> {
    return await prisma.timesheet_entries.findMany({
      where: { project_id: projectId }
    }) as any
  }

  async create(data: any): Promise<TimesheetEntry> {
    return await prisma.timesheet_entries.create({ data }) as any
  }

  async update(id: string, data: any): Promise<TimesheetEntry> {
    return await prisma.timesheet_entries.update({ where: { id }, data }) as any
  }

  async delete(id: string): Promise<void> {
    await prisma.timesheet_entries.delete({ where: { id } })
  }
}

export const workTimeRepository = new WorkTimeRepository()
