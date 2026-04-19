import { Injectable, OnModuleInit } from '@nestjs/common';
import * as casbin from 'casbin';
import { PrismaAdapter } from 'casbin-prisma-adapter';
import * as path from 'path';

@Injectable()
export class CasbinService implements OnModuleInit {
  public enforcer: casbin.Enforcer;

  async onModuleInit() {
    // 使用内嵌模型字符串，避免 Windows 中文路径下的文件读取问题 (ENOENT)
    const modelString = `
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act || r.sub == "1" || r.sub == "admin"
    `;
    
    const model = casbin.newModel(modelString);
    
    // 初始化 Prisma 适配器连入统一的 MySQL
    const adapter = await PrismaAdapter.newAdapter();
    
    this.enforcer = await casbin.newEnforcer(model, adapter);
    
    // 加载全部策略
    await this.enforcer.loadPolicy();
  }

  // 简单的权限检查 (User -> Role -> Object -> Action)
  async checkPermission(user: string, obj: string, act: string): Promise<boolean> {
    return this.enforcer.enforce(user, obj, act);
  }
}
