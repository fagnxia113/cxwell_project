import { Injectable, Logger } from '@nestjs/common';
import { DingtalkAuthService } from './dingtalk-auth.service';
import axios from 'axios';

@Injectable()
export class DingtalkTodoService {
  private readonly logger = new Logger(DingtalkTodoService.name);

  constructor(private authService: DingtalkAuthService) {}

  async createTodo(data: {
    unionId: string;
    subject: string;
    description?: string;
    dueTime?: number;
    executorIds?: string[];
    participantIds?: string[];
    appUrl?: string;
    pcUrl?: string;
    sourceId?: string;
  }): Promise<{ success: boolean; taskId?: string; createdTime?: number; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();

      const response = await axios.post(
        `https://api.dingtalk.com/v1.0/todo/users/${data.unionId}/tasks?operatorId=${data.unionId}`,
        {
          subject: data.subject,
          description: data.description,
          dueTime: data.dueTime,
          executorIds: data.executorIds || [data.unionId],
          participantIds: data.participantIds,
          isOnlyShowExecutor: true,
          sourceId: data.sourceId,
          appUrl: data.appUrl,
          pcUrl: data.pcUrl,
        },
        {
          headers: {
            'x-acs-dingtalk-access-token': token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data?.taskId) {
        return {
          success: true,
          taskId: response.data.taskId,
          createdTime: response.data.createdTime,
        };
      }

      return { success: false, error: 'No taskId returned' };
    } catch (error) {
      console.error('[DingtalkTodo] Failed to create todo:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.message || error.message,
      };
    }
  }

  async updateTodoStatus(unionId: string, taskId: string, isDone: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();

      const response = await axios.put(
        `https://api.dingtalk.com/v1.0/todo/users/${unionId}/tasks/${taskId}/status?operatorId=${unionId}`,
        { isDone },
        {
          headers: {
            'x-acs-dingtalk-access-token': token,
            'Content-Type': 'application/json',
          },
        }
      );

      return { success: true };
    } catch (error) {
      console.error('[DingtalkTodo] Failed to update todo status:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.message || error.message,
      };
    }
  }

  async deleteTodo(unionId: string, taskId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();

      await axios.delete(
        `https://api.dingtalk.com/v1.0/todo/users/${unionId}/tasks/${taskId}?operatorId=${unionId}`,
        {
          headers: {
            'x-acs-dingtalk-access-token': token,
          },
        }
      );

      return { success: true };
    } catch (error) {
      console.error('[DingtalkTodo] Failed to delete todo:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.message || error.message,
      };
    }
  }

  async getTodoList(unionId: string, isDone?: boolean, nextToken?: string, maxResults?: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();

      let url = `https://api.dingtalk.com/v1.0/todo/users/${unionId}/tasks?`;
      if (isDone !== undefined) url += `isDone=${isDone}&`;
      if (nextToken) url += `nextToken=${nextToken}&`;
      if (maxResults) url += `maxResults=${maxResults}&`;

      const response = await axios.get(url, {
        headers: {
          'x-acs-dingtalk-access-token': token,
        },
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('[DingtalkTodo] Failed to get todo list:', error?.response?.data || error.message);
      return {
        success: false,
        error: error?.response?.data?.message || error.message,
      };
    }
  }
}
