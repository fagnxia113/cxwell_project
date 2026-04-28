import { Controller, Get, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview(@Req() req: any) {
    const stats = await this.dashboardService.getOverviewStats(req.user);
    const trend = await this.dashboardService.getTrendData();
    const distribution = await this.dashboardService.getProjectDistribution(req.user);
    
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
