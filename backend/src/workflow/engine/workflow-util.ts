import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const logger = new Logger('WorkflowUtil');

export async function resolveApprovers(prisma: PrismaService, flag: string): Promise<any[]> {
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
