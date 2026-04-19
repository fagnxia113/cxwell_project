# 系统设计与开发指南 (V3 重构版)

本文档旨在为系统的重构、新功能设计及代码实现提供权威的架构指导，确保系统在高并发、长周期业务流下的稳定性与可持续性。

---

## 1. 核心架构模式：内核 + 插件式模块 (Kernel + Modules)

系统分为 **Kernel (核心)**、**Shared (共享库)** 和 **Modules (业务模块)** 三层。

### 1.1 内核 (Kernel)
- **职责**：提供基础设施、引擎能力（工作流、表单、监控、日志）。
- **底线原则**：**绝对禁止**直接引用业务模块。它是业务中立的基石。

### 1.2 业务模块 (Modules)
- **职责**：实现具体的业务领域逻辑。
- **设计思想**：遵循 **领域驱动设计 (DDD)** 的轻量化实践。
- **选型标准**：
  - **DDD 模式**：适用于复杂业务（如调拨、维修、库存分拆）。要求严格的四层模型。
  - **元数据 CRUD 模式**：适用于简单的基础配置表（如参数设置）。可直接使用 `data.ts` 动态接口。

---

## 2. 依赖管理与注入 (Dependency Injection)

系统采用 `tsyringe` 作为注入容器。

### 2.1 注入准则
- **单例模式**：核心 Service、Repository 和 TaskHandler 必须标注 `@singleton()`。
- **禁止手段**：严禁手动 `new` 任何带状态的服务实例。

---

## 3. 数据访问标准 (Data Access)

### 3.1 Repository 模式
- **全面屏蔽 SQL**：`Service` 不得直接调用 `db.query`。所有持久化逻辑必须封装在 `Repository` 中。
- **Prisma 优先**：简单的 CRUD 必须通过 `Prisma` 以获得类型安全。高性能聚合查询可在 Repository 内使用经过审计的 SQL。

### 3.2 数据完整性：软删除 (Soft Delete)
- **规范**：核心业务实体（项目、任务、设备、订单）**禁止物理删除**。
- **实现**：必须包含 `deleted_at` 字段。Repository 的默认 `find` 方法应过滤掉已删除数据。

---

## 4. 分布式一致性：Outbox 模式

当业务操作涉及数据库变更且需要通知外部（如：触发表单、发送通知、驱动流程引擎）时，必须确保原子性。

- **原则**：严禁在事务中直接调用外部 API 或异步发送通知。
- **模式**：
  1. 在同一事务中，更新业务表并向 `domain_events` 表写入一条待办消息。
  2. 由独立的 `EventPublisher` 扫描并确保消息至少被成功处理一次。

---

## 5. 模块内部架构：五层模型

每个模块必须遵守以下从内向外的深度解耦：

### 5.1 领域层 (Domain)
- **实体 (Entities)**：包含核心业务逻辑的“充血模型”。**严禁引用库或框架**。
- **领域服务**：处理跨实体的复杂业务（如：`InventorySplitService`）。

### 5.2 应用层 (Application)
- **Use Cases**：编排领域对象完成一项业务流程。负责事务边界控制。

### 5.3 基础设施层 (Infrastructure)
- **Repository 实现**：底层的存储细节。
- **API Adapters**：外部系统的反向适配。

---

## 6. 错误处理与可观测性

### 6.1 异常机制
- 使用自定义 `AppError` 类。
- **Trace ID**：所有日志必须关联请求 Trace ID，确保从 HTTP 入口到流程引擎深处的逻辑可追踪。

### 6.2 审计日志 (Audit Trail)
- 针对 `Equipment` 状态变更、`Project` 进度调整等敏感操作，必须记录详细的 `AuditLog`（谁、在什么时候、改了什么、旧值、新值）。

---

## 7. 目录结构

```text
src/backend/
  ├── core/             # 核心内核 (DI, Workflow Engine, Meta Registry)
  ├── modules/          # 深度垂直业务模块 (Equipment, Warehouse, Personnel)
  │   └── [name]/
  │       ├── domain/
  │       ├── application/
  │       ├── adapters/
  │       └── infrastructure/
  ├── repository/       # 通用数据层基础类
  └── shared/           # 类型定义与工具函数
```

---

## 8. 代码演进红线
1. **禁止** 在工作流核心 (Core) 中引用具体业务模块。所有业务逻辑必须通过 `TaskHandler` 或 `SideEffectRegistry` 注入。
2. **禁止** 在非 Repository 层直接编写 raw SQL 字符串。
3. **必须** 为所有 API 编写 DTO 校验 (推荐使用 `Zod`)。

---
> [!IMPORTANT]
> **本指南为 V3 阶段的最高设计规范。任何违反上述原则的代码提交，在 Code Review 阶段将具有一票否决权。**
