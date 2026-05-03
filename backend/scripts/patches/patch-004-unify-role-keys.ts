import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始执行补丁脚本 patch-004...');

  // ==================== 1. 更新 sys_role 表中的 roleKey ====================
  console.log('\n--- 统一角色 key（与前端对齐） ---');

  const roleKeyUpdates = [
    { oldKey: 'hr', newKey: 'hr_manager', newName: '人事主管' },
    { oldKey: 'pm', newKey: 'project_manager', newName: '项目经理' },
    { oldKey: 'epy', newKey: 'user', newName: '员工' },
  ];

  for (const { oldKey, newKey, newName } of roleKeyUpdates) {
    const result = await prisma.sysRole.updateMany({
      where: { roleKey: oldKey },
      data: { roleKey: newKey, roleName: newName },
    });
    console.log(`  ✅ sys_role: "${oldKey}" → "${newKey}" (${result.count} 条)`);
  }

  // ==================== 2. 新增 equipment_manager 角色 ====================
  console.log('\n--- 新增设备管理员角色 ---');

  const existingEquip = await prisma.sysRole.findFirst({
    where: { roleKey: 'equipment_manager' },
  });
  if (!existingEquip) {
    await prisma.sysRole.create({
      data: {
        roleId: 8n,
        roleName: '设备管理员',
        roleKey: 'equipment_manager',
        roleSort: 8,
        dataScope: '1',
        status: '0',
        createBy: 'system',
      },
    });
    console.log('  ✅ sys_role: 新增 "equipment_manager" 角色');
  } else {
    console.log('  ℹ️ sys_role: "equipment_manager" 已存在，跳过');
  }

  // ==================== 3. 更新 Casbin 规则中的角色 key ====================
  console.log('\n--- 更新 Casbin 规则中的角色 key ---');

  const casbinKeyUpdates = [
    { oldPrefix: 'role:hr', newPrefix: 'role:hr_manager' },
    { oldPrefix: 'role:pm', newPrefix: 'role:project_manager' },
    { oldPrefix: 'role:epy', newPrefix: 'role:user' },
  ];

  for (const { oldPrefix, newPrefix } of casbinKeyUpdates) {
    const rules = await prisma.casbinRule.findMany({
      where: { v0: oldPrefix },
    });
    for (const rule of rules) {
      const existing = await prisma.casbinRule.findFirst({
        where: { ptype: rule.ptype, v0: newPrefix, v1: rule.v1, v2: rule.v2 },
      });
      if (!existing) {
        await prisma.casbinRule.create({
          data: {
            ptype: rule.ptype,
            v0: newPrefix,
            v1: rule.v1,
            v2: rule.v2,
          },
        });
      }
      await prisma.casbinRule.delete({ where: { id: rule.id } });
    }
    console.log(`  ✅ casbin_rule: "${oldPrefix}" → "${newPrefix}" (${rules.length} 条)`);
  }

  // ==================== 4. 补充 hr_manager 的 menu:admin 权限 ====================
  console.log('\n--- 补充 hr_manager 系统管理菜单权限 ---');

  const hrAdminPerm = await prisma.casbinRule.findFirst({
    where: { ptype: 'p', v0: 'role:hr_manager', v1: 'menu:admin', v2: 'allow' },
  });
  if (!hrAdminPerm) {
    await prisma.casbinRule.create({
      data: { ptype: 'p', v0: 'role:hr_manager', v1: 'menu:admin', v2: 'allow' },
    });
    console.log('  ✅ casbin_rule: 新增 "role:hr_manager" → "menu:admin"');
  }

  // ==================== 5. 补充 general_manager 的 menu:admin 权限 ====================
  console.log('\n--- 补充 general_manager 系统管理菜单权限 ---');

  const gmAdminPerm = await prisma.casbinRule.findFirst({
    where: { ptype: 'p', v0: 'role:general_manager', v1: 'menu:admin', v2: 'allow' },
  });
  if (!gmAdminPerm) {
    await prisma.casbinRule.create({
      data: { ptype: 'p', v0: 'role:general_manager', v1: 'menu:admin', v2: 'allow' },
    });
    console.log('  ✅ casbin_rule: 新增 "role:general_manager" → "menu:admin"');
  }

  // ==================== 6. 新增 equipment_manager Casbin 规则 ====================
  console.log('\n--- 新增 equipment_manager Casbin 权限 ---');

  const equipPerms = [
    { ptype: 'p', v0: 'role:equipment_manager', v1: 'menu:dashboard', v2: 'allow' },
    { ptype: 'p', v0: 'role:equipment_manager', v1: 'menu:project', v2: 'allow' },
    { ptype: 'p', v0: 'role:equipment_manager', v1: 'menu:workflow', v2: 'allow' },
    { ptype: 'p', v0: 'role:equipment_manager', v1: 'menu:personnel', v2: 'allow' },
    { ptype: 'p', v0: 'role:equipment_manager', v1: 'menu:knowledge', v2: 'allow' },
    { ptype: 'p', v0: 'role:equipment_manager', v1: 'menu:admin', v2: 'allow' },
    { ptype: 'p', v0: 'role:equipment_manager', v1: 'workflow:create', v2: 'allow' },
    { ptype: 'p', v0: 'role:equipment_manager', v1: 'equipment:*', v2: 'allow' },
  ];
  let newEquipCount = 0;
  for (const perm of equipPerms) {
    const existing = await prisma.casbinRule.findFirst({
      where: { ptype: perm.ptype, v0: perm.v0, v1: perm.v1, v2: perm.v2 },
    });
    if (!existing) {
      await prisma.casbinRule.create({ data: perm });
      newEquipCount++;
    }
  }
  console.log(`  ✅ casbin_rule: 新增 "role:equipment_manager" 权限 (${newEquipCount} 条)`);

  console.log('\n✅ 补丁脚本 patch-004 执行完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
