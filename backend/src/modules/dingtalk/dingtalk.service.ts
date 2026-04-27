import { Injectable } from '@nestjs/common';
import { DingtalkAuthService } from './services/dingtalk-auth.service';
import { DingtalkUserService } from './services/dingtalk-user.service';
import { DingtalkDeptService } from './services/dingtalk-dept.service';
import { DingtalkMessageService } from './services/dingtalk-message.service';
import { DingtalkAttendanceService } from './services/dingtalk-attendance.service';
import { DingtalkTodoService } from './services/dingtalk-todo.service';

@Injectable()
export class DingtalkService {
  readonly user: DingtalkUserService;
  readonly dept: DingtalkDeptService;
  readonly message: DingtalkMessageService;
  readonly attendance: DingtalkAttendanceService;
  readonly todo: DingtalkTodoService;

  constructor(
    private authService: DingtalkAuthService,
    userService: DingtalkUserService,
    deptService: DingtalkDeptService,
    messageService: DingtalkMessageService,
    attendanceService: DingtalkAttendanceService,
    todoService: DingtalkTodoService,
  ) {
    this.user = userService;
    this.dept = deptService;
    this.message = messageService;
    this.attendance = attendanceService;
    this.todo = todoService;
  }

  async getAccessToken(): Promise<string> {
    return this.authService.getAccessToken();
  }

  async createUser(userData: Parameters<DingtalkUserService['createUser']>[0]) {
    return this.user.createUser(userData);
  }

  async updateUser(userId: string, userData: Parameters<DingtalkUserService['updateUser']>[1]) {
    return this.user.updateUser(userId, userData);
  }

  async deleteUser(userId: string) {
    return this.user.deleteUser(userId);
  }

  async sendActiveInvite(userId: string) {
    return this.user.sendActiveInvite(userId);
  }

  async syncAllUnboundUsers() {
    return this.user.syncAllUnboundUsers();
  }

  async sendMessage(userId: string, content: string) {
    return this.message.sendWorkNotification(userId, content);
  }

  async createDepartment(name: string, parentDeptId?: number, nameEn?: string) {
    return this.dept.createDepartment(name, parentDeptId, nameEn);
  }

  async deleteDepartment(deptId: string) {
    return this.dept.deleteDepartment(deptId);
  }

  async updateDepartment(deptId: string, name: string, nameEn?: string) {
    return this.dept.updateDepartment(deptId, name, nameEn);
  }
}
