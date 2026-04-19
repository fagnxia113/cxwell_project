import { WorkTimeRepository, workTimeRepository, TimesheetEntry as RepoTimesheetEntry } from '../repository/WorkTimeRepository.js'

export interface TimesheetEntry {
  id: string
  report_id: string
  project_id: string
  task_id?: string
  duration: number
  work_content?: string
  created_at?: string
}

export class WorkTimeServiceV2 {
  private repo: WorkTimeRepository

  constructor(repo: WorkTimeRepository = workTimeRepository) {
    this.repo = repo
  }

  async getTimesheetEntries(filters?: {
    reportId?: string
    projectId?: string
    page?: number
    pageSize?: number
  }): Promise<{ data: TimesheetEntry[]; total: number }> {
    const where: any = {}
    if (filters?.reportId) where.report_id = filters.reportId
    if (filters?.projectId) where.project_id = filters.projectId

    const result = await this.repo.findAll({
      where,
      skip: ((filters?.page || 1) - 1) * (filters?.pageSize || 50),
      take: filters?.pageSize || 50
    })

    return {
      data: result.data.map(e => ({
        ...e,
        duration: Number(e.duration),
        report_id: e.report_id,
        work_content: e.work_content || undefined,
        created_at: e.created_at ? e.created_at.toString() : undefined
      } as TimesheetEntry)),
      total: result.total
    }
  }

  async submitTimesheetEntry(data: any): Promise<TimesheetEntry> {
    const entry = await this.repo.create(data)
    return {
      ...entry,
      duration: Number(entry.duration)
    } as any
  }

  async updateTimesheetEntry(id: string, data: any): Promise<TimesheetEntry> {
    const entry = await this.repo.update(id, data)
    return {
      ...entry,
      duration: Number(entry.duration)
    } as any
  }

  async deleteTimesheetEntry(id: string): Promise<void> {
    await this.repo.delete(id)
  }

  async getReportWorkEntries(reportId: string): Promise<TimesheetEntry[]> {
    const entries = await this.repo.findByReport(reportId)
    return entries.map(e => ({
      ...e,
      duration: Number(e.duration)
    } as any))
  }

  async getProjectLaborCost(projectId: string): Promise<{ total_hours: number; estimated_cost: number }> {
    const entries = await this.repo.findByProject(projectId)
    const total_hours = entries.reduce((sum, e) => sum + Number(e.duration || 0), 0)
    return { total_hours, estimated_cost: total_hours * 100 }
  }

  async submitDailyReport(report: any, entries: any[]): Promise<string> {
    const reportId = report.id || 'report-' + Date.now();
    for (const entry of entries) {
      await this.repo.create({ ...entry, report_id: reportId });
    }
    return reportId;
  }

  async getReportWithEntries(reportId: string): Promise<any | null> {
    const entries = await this.repo.findByReport(reportId);
    return {
      id: reportId,
      entries: entries.map(e => ({
        ...e,
        duration: Number(e.duration)
      }))
    };
  }

  async getEmployeeWorkHistory(employeeId: string): Promise<TimesheetEntry[]> {
    const result = await this.repo.findAll({
      where: { report_id: employeeId } // Simplification: assuming report_id links to employee in some logic
    });
    return result.data.map(e => ({
      ...e,
      duration: Number(e.duration)
    } as any));
  }
}

export const workTimeServiceV2 = new WorkTimeServiceV2()
