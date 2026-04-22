import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview() {
    const stats = await this.dashboardService.getOverviewStats();
    const trend = await this.dashboardService.getTrendData();
    const distribution = await this.dashboardService.getProjectDistribution();
    
    return {
      success: true,
      data: {
        stats,
        trend,
        distribution
      }
    };
  }
}
