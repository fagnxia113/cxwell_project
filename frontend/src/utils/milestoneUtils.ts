import { Milestone } from '../types/project';

export interface FlattenedMilestone extends Milestone {
  level: number;
  isLeaf: boolean;
  displayName: string;
}

/**
 * 递归平铺里程碑树，并添加层级和叶子节点标记
 */
export function flattenMilestones(
  milestones: Milestone[],
  level = 0,
  result: FlattenedMilestone[] = []
): FlattenedMilestone[] {
  milestones.forEach(m => {
    const isLeaf = !m.children || m.children.length === 0;
    result.push({
      ...m,
      level,
      isLeaf,
      displayName: '　'.repeat(level) + (level > 0 ? '└─ ' : '') + m.name
    });
    if (m.children && m.children.length > 0) {
      flattenMilestones(m.children, level + 1, result);
    }
  });
  return result;
}

/**
 * 获取某个里程碑及其所有后代节点的 ID 列表
 */
export function getDescendantIds(milestone: Milestone): string[] {
  let ids: string[] = [milestone.id];
  if (milestone.children && milestone.children.length > 0) {
    milestone.children.forEach(child => {
      ids = [...ids, ...getDescendantIds(child)];
    });
  }
  return ids;
}
