import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const logger = new Logger('WorkflowUtil');

export async function resolveApprovers(prisma: PrismaService, flag: string, initiatorUserId?: string): Promise<any[]> {
  if (!flag) return [];
  const parts = flag.split(',').filter(Boolean).map(p => p.trim());
  const users: any[] = [];

  for (const part of parts) {
    if (part.startsWith('role:')) {
      const roleKey = part.replace('role:', '');
      const matchingRoles = await prisma.sysRole.findMany({
        where: { roleKey, delFlag: '0' },
        select: { roleId: true }
      });
      const roleIds = matchingRoles.map(r => r.roleId);
      if (roleIds.length === 0) continue;
      const roleUsers = await prisma.sysUser.findMany({
        where: {
          delFlag: '0',
          status: '0',
          userId: {
            in: (await prisma.sysUserRole.findMany({
              where: { roleId: { in: roleIds } },
              select: { userId: true }
            })).map(ur => ur.userId)
          }
        }
      });
      users.push(...roleUsers);
    } else if (part.startsWith('dept:')) {
      const deptId = BigInt(part.replace('dept:', ''));
      const deptUsers = await prisma.sysUser.findMany({
        where: { deptId, delFlag: '0', status: '0' }
      });
      users.push(...deptUsers);
    } else if (part.startsWith('reportTo:') || part.startsWith('initiator:')) {
      if (!initiatorUserId) {
        logger.warn(`动态审批人标识 ${part} 需要发起人信息，但未提供 initiatorUserId`);
        continue;
      }
      const dynamicUsers = await resolveDynamicApprovers(prisma, part, initiatorUserId);
      users.push(...dynamicUsers);
    } else {
      const user = await prisma.sysUser.findFirst({
        where: {
          OR: [
            { loginName: part },
            { userId: isNaN(Number(part)) ? undefined : BigInt(part) }
          ],
          delFlag: '0'
        }
      });
      if (user) users.push(user);
    }
  }

  const uniqueMap = new Map();
  users.forEach(u => uniqueMap.set(u.userId.toString(), u));
  return Array.from(uniqueMap.values());
}

async function resolveDynamicApprovers(prisma: PrismaService, flag: string, initiatorUserId: string): Promise<any[]> {
  const flagType = flag.startsWith('reportTo:') ? flag.replace('reportTo:', '') : flag.replace('initiator:', '');

  const initiatorEmployee = await prisma.sysEmployee.findFirst({
    where: { userId: BigInt(initiatorUserId), status: '0' },
  });
  if (!initiatorEmployee) {
    logger.warn(`未找到发起人对应的员工记录, userId: ${initiatorUserId}`);
    return [];
  }

  switch (flagType) {
    case 'manager': {
      if (!initiatorEmployee.reportToId) {
        logger.warn(`发起人 ${initiatorEmployee.name} 未设置直属上级`);
        return [];
      }
      const manager = await prisma.sysEmployee.findUnique({
        where: { employeeId: initiatorEmployee.reportToId },
      });
      if (!manager?.userId) {
        logger.warn(`直属上级 ${manager?.name || initiatorEmployee.reportToId} 未关联系统用户`);
        return [];
      }
      const managerUser = await prisma.sysUser.findUnique({
        where: { userId: manager.userId }
      });
      return managerUser ? [managerUser] : [];
    }

    case 'deptLeader': {
      if (!initiatorEmployee.deptId) {
        logger.warn(`发起人 ${initiatorEmployee.name} 未分配部门`);
        return [];
      }
      const dept = await prisma.sysDept.findUnique({
        where: { deptId: initiatorEmployee.deptId },
      });
      if (!dept?.leaderId) {
        logger.warn(`部门 ${dept?.deptName || initiatorEmployee.deptId} 未设置负责人`);
        return [];
      }
      const leader = await prisma.sysEmployee.findUnique({
        where: { employeeId: dept.leaderId },
      });
      if (!leader?.userId) {
        logger.warn(`部门负责人 ${leader?.name || dept.leaderId} 未关联系统用户`);
        return [];
      }
      const leaderUser = await prisma.sysUser.findUnique({
        where: { userId: leader.userId }
      });
      return leaderUser ? [leaderUser] : [];
    }

    default: {
      const levelMatch = flagType.match(/^n(\d+)$/);
      if (levelMatch) {
        const level = parseInt(levelMatch[1]);
        let currentEmp = initiatorEmployee;
        for (let i = 0; i < level; i++) {
          if (!currentEmp.reportToId) {
            logger.warn(`发起人 ${initiatorEmployee.name} 的第 ${i + 1} 级上级不存在`);
            return [];
          }
          const superior = await prisma.sysEmployee.findUnique({
            where: { employeeId: currentEmp.reportToId }
          });
          if (!superior) {
            logger.warn(`上级记录不存在, employeeId: ${currentEmp.reportToId}`);
            return [];
          }
          currentEmp = superior;
        }
        if (!currentEmp.userId) {
          logger.warn(`第 ${level} 级上级 ${currentEmp.name} 未关联系统用户`);
          return [];
        }
        const user = await prisma.sysUser.findUnique({
          where: { userId: currentEmp.userId }
        });
        return user ? [user] : [];
      }
      logger.warn(`未知的动态审批人标识: ${flag}`);
      return [];
    }
  }
}

export async function resolveToLoginNames(prisma: PrismaService, identifiers: string[]): Promise<string[]> {
  if (!identifiers || identifiers.length === 0) return [];

  const results: string[] = [];
  for (const id of identifiers) {
    const trimmedId = String(id).trim();
    if (/^\d+$/.test(trimmedId)) {
      const user = await prisma.sysUser.findUnique({ where: { userId: BigInt(trimmedId) } });
      if (user) {
        results.push(user.loginName);
        continue;
      }
    }
    results.push(trimmedId);
  }
  return results;
}

export function evaluateCondition(condition: string | null, variables: Record<string, any>): boolean {
  if (!condition) return false;
  const safePattern = /^[a-zA-Z0-9_\s.><=!&|()'"-]+$/;
  if (!safePattern.test(condition)) {
    logger.warn(`条件表达式包含不安全字符，已拒绝执行: ${condition}`);
    return false;
  }
  const blocked = ['require', 'import', 'process', 'global', 'eval', 'Function', 'exec', 'spawn', 'child_process', '__proto__', 'constructor', 'prototype'];
  for (const kw of blocked) {
    if (condition.includes(kw)) {
      logger.warn(`条件表达式包含禁止关键字 "${kw}"，已拒绝执行: ${condition}`);
      return false;
    }
  }
  try {
    const keys = Object.keys(variables);
    const values = Object.values(variables);
    return new Function(...keys, `"use strict"; return (${condition});`)(...values);
  } catch (e) {
    return false;
  }
}
