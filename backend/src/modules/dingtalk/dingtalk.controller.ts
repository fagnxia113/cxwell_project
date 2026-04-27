import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { DingtalkService } from './dingtalk.service';
import { DingtalkUserService } from './services/dingtalk-user.service';
import { DingtalkDeptService } from './services/dingtalk-dept.service';
import { DingtalkAttendanceService } from './services/dingtalk-attendance.service';
import { DingtalkTodoService } from './services/dingtalk-todo.service';

@Controller('dingtalk')
export class DingtalkController {
  constructor(
    private readonly dingtalkService: DingtalkService,
    private readonly userService: DingtalkUserService,
    private readonly deptService: DingtalkDeptService,
    private readonly attendanceService: DingtalkAttendanceService,
    private readonly todoService: DingtalkTodoService,
  ) {}

  @Get('test')
  async test() {
    return { success: true, message: 'Dingtalk service is working' };
  }

  @Post('user/create')
  async createUser(@Body() body: {
    name: string;
    mobile: string;
    countryCode?: string;
    deptIds?: number[];
    jobTitle?: string;
    email?: string;
    jobNumber?: string;
    hiredDate?: Date;
  }) {
    return this.userService.createUser(body);
  }

  @Post('user/update')
  async updateUser(
    @Body() body: {
      userId: string;
      name?: string;
      deptIds?: number[];
      jobTitle?: string;
      email?: string;
    }
  ) {
    return this.userService.updateUser(body.userId, body);
  }

  @Post('user/delete')
  async deleteUser(@Body() body: { userId: string }) {
    return this.userService.deleteUser(body.userId);
  }

  @Post('user/getByMobile')
  async getUserByMobile(@Body() body: { mobile: string }) {
    return this.userService.getUserByMobile(body.mobile);
  }

  @Post('user/getDetail')
  async getUserDetail(@Body() body: { userId: string }) {
    return this.userService.getUserDetail(body.userId);
  }

  @Post('user/sendInvite')
  async sendActiveInvite(@Body() body: { userId: string }) {
    return this.userService.sendActiveInvite(body.userId);
  }

  @Post('user/syncUnbound')
  async syncUnbound() {
    // 这里可以直接调用任务里的逻辑，或者在 service 里实现
    // 为了简单，我直接在 controller 里调用 service 循环
    return this.dingtalkService.syncAllUnboundUsers();
  }

  @Post('message/send')
  async sendMessage(@Body() body: { userId: string; content: string }) {
    return this.dingtalkService.sendMessage(body.userId, body.content);
  }

  @Post('message/sendOa')
  async sendOaNotification(@Body() body: {
    userId: string;
    title: string;
    text: string;
    messageUrl: string;
    pcMessageUrl?: string;
  }) {
    return this.dingtalkService.message.sendOaNotification(body.userId, body);
  }

  @Post('dept/create')
  async createDepartment(@Body() body: { name: string; parentDeptId?: number; nameEn?: string }) {
    return this.deptService.createDepartment(body.name, body.parentDeptId, body.nameEn);
  }

  @Post('dept/update')
  async updateDepartment(@Body() body: { deptId: string; name: string; nameEn?: string }) {
    return this.deptService.updateDepartment(body.deptId, body.name, body.nameEn);
  }

  @Post('dept/delete')
  async deleteDepartment(@Body() body: { deptId: string }) {
    return this.deptService.deleteDepartment(body.deptId);
  }

  @Post('dept/list')
  async getDepartmentList(@Body() body: { parentDeptId?: number }) {
    return this.deptService.getDepartmentList(body.parentDeptId);
  }

  @Post('attendance/list')
  async getAttendanceList(@Body() body: {
    userIds: string[];
    workDateFrom: string;
    workDateTo: string;
    offset?: number;
    limit?: number;
  }) {
    return this.attendanceService.getAttendanceList(
      body.userIds, body.workDateFrom, body.workDateTo, body.offset, body.limit
    );
  }

  @Post('attendance/record')
  async getAttendanceRecord(@Body() body: {
    userIds: string[];
    checkDateFrom: string;
    checkDateTo: string;
  }) {
    return this.attendanceService.getAttendanceRecord(
      body.userIds, body.checkDateFrom, body.checkDateTo
    );
  }

  @Post('attendance/userData')
  async getUserAttendanceData(@Body() body: { userId: string; workDate: string }) {
    return this.attendanceService.getUserAttendanceData(body.userId, body.workDate);
  }

  @Post('todo/create')
  async createTodo(@Body() body: {
    unionId: string;
    subject: string;
    description?: string;
    dueTime?: number;
    executorIds?: string[];
    participantIds?: string[];
    appUrl?: string;
    pcUrl?: string;
    sourceId?: string;
  }) {
    return this.todoService.createTodo(body);
  }

  @Post('todo/updateStatus')
  async updateTodoStatus(@Body() body: { unionId: string; taskId: string; isDone: boolean }) {
    return this.todoService.updateTodoStatus(body.unionId, body.taskId, body.isDone);
  }

  @Post('todo/delete')
  async deleteTodo(@Body() body: { unionId: string; taskId: string }) {
    return this.todoService.deleteTodo(body.unionId, body.taskId);
  }

  @Get('todo/list')
  async getTodoList(@Query() query: { unionId: string; isDone?: string; nextToken?: string; maxResults?: string }) {
    return this.todoService.getTodoList(
      query.unionId,
      query.isDone === 'true' ? true : query.isDone === 'false' ? false : undefined,
      query.nextToken,
      query.maxResults ? parseInt(query.maxResults) : undefined,
    );
  }
}
