import { MemoryStore } from './db/memory.store';
import { Project, Agent, Iteration, Decision, TechDebt, CrossDep, OrgStandard, HistoryIteration } from './types';

export function seed(store: MemoryStore): void {
  // ================================================================
  // Org Standards
  // ================================================================
  store.setStandards([
    { id: 'std-1', name: 'API 设计规范', latestVersion: 'v2.1', projects: { 'tracker-system': 'v2.1', 'payment-gateway': 'v1.8', 'user-mobile': 'v2.1', 'data-pipeline': 'v1.5' } },
    { id: 'std-2', name: '数据库访问规范', latestVersion: 'v2.0', projects: { 'tracker-system': 'v2.0', 'payment-gateway': 'v2.0', 'user-mobile': 'v2.0', 'data-pipeline': 'v1.0' } },
    { id: 'std-3', name: '日志规范', latestVersion: 'v1.3', projects: { 'tracker-system': 'v1.3', 'payment-gateway': 'v1.3', 'user-mobile': 'v1.3', 'data-pipeline': 'v0.5' } },
    { id: 'std-4', name: '错误处理规范', latestVersion: 'v1.2', projects: { 'tracker-system': 'v1.2', 'payment-gateway': 'v1.2', 'user-mobile': 'v1.2', 'data-pipeline': 'v1.0' } },
    { id: 'std-5', name: '认证授权规范', latestVersion: 'v2.0', projects: { 'tracker-system': 'v2.0', 'payment-gateway': 'v1.5', 'user-mobile': 'v2.0', 'data-pipeline': '—' } },
  ]);

  // ================================================================
  // Cross Project Dependencies
  // ================================================================
  store.setCrossDeps([
    { id: 'dep-1', fromService: 'tracker-service', fromProject: 'tracker-system', toService: 'user-api', toProject: 'user-mobile', depType: 'API 调用', risk: 'medium', impactDesc: 'tracker 的用户认证依赖 user-api 的 JWT 校验。若 user-api 变更认证方式，tracker 需同步适配。' },
    { id: 'dep-2', fromService: 'tracker-service', fromProject: 'tracker-system', toService: 'redis', toProject: 'shared', depType: '共享资源', risk: 'low', impactDesc: '与 payment 共享 Redis，需注意 key 命名空间隔离。' },
    { id: 'dep-3', fromService: 'gateway-api', fromProject: 'payment-gateway', toService: 'redis', toProject: 'shared', depType: '共享资源', risk: 'medium', impactDesc: 'payment 的幂等性 key 需与 tracker 缓存 key 隔离。' },
    { id: 'dep-4', fromService: 'billing-worker', fromProject: 'payment-gateway', toService: 'gateway-api', toProject: 'payment-gateway', depType: '反向依赖', risk: 'high', impactDesc: 'billing-worker 直接依赖 gateway-api model 包，违反分层。修改 gateway-api 会破坏 billing-worker。' },
    { id: 'dep-5', fromService: 'stream-processor', fromProject: 'data-pipeline', toService: 'clickhouse', toProject: 'shared', depType: '共享资源', risk: 'medium', impactDesc: 'stream-processor 和 etl-worker 共享 ClickHouse 连接池，高峰期可能互相影响。' },
    { id: 'dep-6', fromService: 'mobile-app', fromProject: 'user-mobile', toService: 'user-api', toProject: 'user-mobile', depType: 'API 调用', risk: 'low', impactDesc: 'mobile-app 操作通过 user-api，架构合理。' },
    { id: 'dep-7', fromService: 'etl-worker', fromProject: 'data-pipeline', toService: 'clickhouse', toProject: 'shared', depType: '共享资源', risk: 'medium', impactDesc: '参见 stream-processor 依赖。' },
    { id: 'dep-8', fromService: 'admin-web', fromProject: 'tracker-system', toService: 'tracker-service', toProject: 'tracker-system', depType: 'API 调用', risk: 'low', impactDesc: '项目内依赖，无跨项目风险。' },
  ]);

  // ================================================================
  // Projects
  // ================================================================
  const projects: Project[] = [
    { id: 'tracker-system', name: 'tracker-system', repoUrl: 'https://github.com/org/tracker-system', description: '全栈资产追踪系统，支持 Web 管理后台与移动端扫码录入。', domain: '企业资产', techTags: ['Express', 'React Native', 'PostgreSQL', 'Redis'], status: 'active', health: 'green', dodConfig: {} as any, constraints: [], createdAt: '2026-06-01T10:00:00Z' },
    { id: 'payment-gateway', name: 'payment-gateway', repoUrl: 'https://github.com/org/payment-gateway', description: '支付网关服务，负责对接 Stripe 支付渠道、账单处理与交易幂等性保障。', domain: '金融支付', techTags: ['Go/Chi', 'MySQL', 'Redis', 'Stripe'], status: 'active', health: 'yellow', dodConfig: {} as any, constraints: [], createdAt: '2026-06-02T10:00:00Z' },
    { id: 'user-mobile', name: 'user-mobile', repoUrl: 'https://github.com/org/user-mobile', description: '移动端用户应用，覆盖 iOS 与 Android 双平台。', domain: '移动应用', techTags: ['React Native', 'Express', 'PostgreSQL', 'Zustand'], status: 'active', health: 'green', dodConfig: {} as any, constraints: [], createdAt: '2026-06-03T10:00:00Z' },
    { id: 'data-pipeline', name: 'data-pipeline', repoUrl: 'https://github.com/org/data-pipeline', description: '实时数据处理管道，基于 Python/Airflow 进行 ETL 调度。', domain: '数据处理', techTags: ['Python', 'Airflow', 'ClickHouse', 'Kafka/Redis Streams'], status: 'active', health: 'red', dodConfig: {} as any, constraints: [], createdAt: '2026-06-04T10:00:00Z' },
  ];
  projects.forEach(p => store.seedProject(p));

  // ================================================================
  // Agents
  // ================================================================
  const agents: Agent[] = [
    { id: 'agent-2', projectId: 'tracker-system', service: 'tracker-service', status: 'running', mode: 'cloud', currentIteration: 4, currentPhase: '自检中', currentAction: '正在编写认证中间件集成测试', heartbeatAt: new Date().toISOString(), startedAt: '2026-06-07T15:00:00Z' },
    { id: 'agent-1', projectId: 'tracker-system', service: 'mobile-app', status: 'running', mode: 'local', currentIteration: 3, currentPhase: '实现中', currentAction: '正在适配 Android 扫码页面布局', heartbeatAt: new Date().toISOString(), startedAt: '2026-06-07T16:00:00Z' },
    { id: 'agent-3', projectId: 'tracker-system', service: 'admin-web', status: 'running', mode: 'cloud', currentIteration: 2, currentPhase: '实现中', currentAction: '正在实现推送消息队列接口', heartbeatAt: new Date().toISOString(), startedAt: '2026-06-07T16:30:00Z' },
    { id: 'agent-4', projectId: 'payment-gateway', service: 'gateway-api', status: 'running', mode: 'cloud', currentIteration: 3, currentPhase: '自检中', currentAction: '正在编写 API 向后兼容性测试', heartbeatAt: new Date().toISOString(), startedAt: '2026-06-07T14:00:00Z' },
    { id: 'agent-5', projectId: 'payment-gateway', service: 'billing-worker', status: 'running', mode: 'local', currentIteration: 4, currentPhase: '实现中', currentAction: '等待人工决策：billing 层架构调整方案', heartbeatAt: new Date().toISOString(), startedAt: '2026-06-07T14:30:00Z' },
    { id: 'agent-6', projectId: 'user-mobile', service: 'mobile-app', status: 'running', mode: 'local', currentIteration: 4, currentPhase: '实现中', currentAction: '正在实现 iOS Tab Bar 导航动画', heartbeatAt: new Date().toISOString(), startedAt: '2026-06-07T15:30:00Z' },
    { id: 'agent-7', projectId: 'user-mobile', service: 'user-api', status: 'running', mode: 'cloud', currentIteration: 2, currentPhase: '实现中', currentAction: '正在编写用户搜索与分页接口', heartbeatAt: new Date().toISOString(), startedAt: '2026-06-07T16:00:00Z' },
    { id: 'agent-8', projectId: 'data-pipeline', service: 'stream-processor', status: 'blocked', mode: 'cloud', currentIteration: 3, currentPhase: '等待人工决策', currentAction: '等待人工决策：Kafka vs Redis Streams 选型', heartbeatAt: new Date().toISOString(), startedAt: '2026-06-07T10:00:00Z' },
  ];
  agents.forEach(a => store.seedAgent(a));

  // ================================================================
  // Active Iterations (task-centric)
  // ================================================================
  const now = new Date().toISOString();
  const iterations: Iteration[] = [
    { id: 'iter-ts-1', agentId: 'agent-2', projectId: 'tracker-system', taskId: 'T-TS-001', goal: '实现用户认证与授权中间件，包括 JWT 签发/验证、session 管理、角色权限控制。', currentAction: '正在编写认证中间件集成测试', num: 4, total: 7, status: 'running', services: ['tracker-service', 'admin-web'], meta: '已消耗 45k Token · 约束全部通过', costTokens: 45000, tasks: [{ name: 'JWT 签发与验证逻辑', service: 'tracker-service', status: 'done' }, { name: '认证中间件集成测试', service: 'tracker-service', status: 'in-progress' }, { name: '管理后台登录页适配', service: 'admin-web', status: 'pending' }, { name: '覆盖率提升至 85%', service: 'tracker-service', status: 'pending' }], startedAt: now },
    { id: 'iter-ts-2', agentId: 'agent-1', projectId: 'tracker-system', taskId: 'T-TS-002', goal: '移动端扫码录入页面与生物识别认证集成，保持覆盖率 90% 以上。', currentAction: '正在适配 Android 扫码页面布局', num: 3, total: 6, status: 'running', services: ['mobile-app', 'user-api'], meta: '已消耗 38k Token · 覆盖率 92%', costTokens: 38000, tasks: [{ name: 'iOS 扫码录入页面', service: 'mobile-app', status: 'done' }, { name: '生物识别凭证校验 API', service: 'user-api', status: 'done' }, { name: 'Android 扫码适配', service: 'mobile-app', status: 'in-progress' }], startedAt: now },
    { id: 'iter-ts-3', agentId: 'agent-3', projectId: 'tracker-system', taskId: 'T-TS-003', goal: '为管理后台添加推送通知模块，包括模板管理和批量推送功能。', currentAction: '正在实现推送消息队列接口', num: 2, total: 5, status: 'running', services: ['admin-web', 'tracker-service'], meta: '已消耗 28k Token · lint 警告 1 个', costTokens: 28000, tasks: [{ name: '通知模板管理页面', service: 'admin-web', status: 'done' }, { name: '推送消息队列接口', service: 'tracker-service', status: 'in-progress' }, { name: '安全审计 (audit-ci)', service: 'admin-web', status: 'pending' }], startedAt: now },
    { id: 'iter-ts-4', agentId: 'agent-2', projectId: 'tracker-system', taskId: 'T-TS-004', goal: '为 PostgreSQL 添加读写分离与连接池优化。', currentAction: '正在配置 PgBouncer 连接池参数', num: 1, total: 3, status: 'running', services: ['postgres', 'tracker-service'], meta: '已消耗 18k Token · 刚刚启动', costTokens: 18000, tasks: [{ name: 'PgBouncer 部署与配置', service: 'postgres', status: 'in-progress' }, { name: 'tracker-service 读写分离适配', service: 'tracker-service', status: 'pending' }], startedAt: now },
    { id: 'iter-ts-5', agentId: 'agent-3', projectId: 'tracker-system', taskId: 'T-TS-005', goal: '实现 Redis 缓存层：为高频查询 API 添加缓存策略。', currentAction: '正在设计缓存键命名规范', num: 1, total: 3, status: 'running', services: ['redis', 'tracker-service'], meta: '已消耗 12k Token · 刚刚启动', costTokens: 12000, tasks: [{ name: '缓存键设计与命名规范', service: 'redis', status: 'in-progress' }, { name: 'tracker-service 缓存中间件', service: 'tracker-service', status: 'pending' }], startedAt: now },
    { id: 'iter-pg-1', agentId: 'agent-4', projectId: 'payment-gateway', taskId: 'T-PG-001', goal: '完成 Stripe 支付渠道对接，实现 webhook 处理器与支付幂等性 Redis 锁。', currentAction: '正在编写 API 向后兼容性测试', num: 3, total: 5, status: 'running', services: ['gateway-api', 'billing-worker', 'redis'], meta: '已消耗 85k Token', costTokens: 85000, tasks: [{ name: 'Stripe webhook 处理器', service: 'gateway-api', status: 'done' }, { name: '支付幂等性 Redis 锁', service: 'gateway-api', status: 'done' }, { name: 'API 向后兼容性测试', service: 'gateway-api', status: 'in-progress' }], startedAt: now },
    { id: 'iter-pg-2', agentId: 'agent-5', projectId: 'payment-gateway', taskId: 'T-PG-002', goal: '修复 billing-worker 层依赖违规，实现账单聚合批处理。', currentAction: '等待人工决策：billing 层架构调整方案', num: 4, total: 6, status: 'blocked', services: ['billing-worker'], meta: '已消耗 65k Token · ⚠ 1 个约束警告', costTokens: 65000, tasks: [{ name: '账单聚合批处理逻辑', service: 'billing-worker', status: 'done' }, { name: '修复 billing 层依赖违规', service: 'billing-worker', status: 'blocked' }, { name: '单元测试覆盖率至 80%', service: 'billing-worker', status: 'pending' }], startedAt: now },
    { id: 'iter-um-1', agentId: 'agent-6', projectId: 'user-mobile', taskId: 'T-UM-001', goal: '为 iOS 和 Android 实现平台独立导航，集成生物识别认证。', currentAction: '正在实现 iOS Tab Bar 导航动画', num: 4, total: 7, status: 'running', services: ['mobile-app', 'user-api'], meta: '已消耗 44k Token · 覆盖率 92%', costTokens: 44000, tasks: [{ name: '生物识别认证页面', service: 'mobile-app', status: 'done' }, { name: 'iOS Tab Bar 导航', service: 'mobile-app', status: 'in-progress' }, { name: '用户搜索与分页 API', service: 'user-api', status: 'in-progress' }], startedAt: now },
    { id: 'iter-um-2', agentId: 'agent-7', projectId: 'user-mobile', taskId: 'T-UM-002', goal: '用户微服务 API 扩展：生物识别凭证校验、用户搜索与分页。', currentAction: '正在编写用户搜索与分页接口', num: 2, total: 4, status: 'running', services: ['user-api'], meta: '已消耗 35k Token', costTokens: 35000, tasks: [{ name: '生物识别凭证校验 API', service: 'user-api', status: 'done' }, { name: '用户搜索与分页接口', service: 'user-api', status: 'in-progress' }], startedAt: now },
    { id: 'iter-dp-1', agentId: 'agent-8', projectId: 'data-pipeline', taskId: 'T-DP-001', goal: '实现实时流处理管道：消息队列集成、流数据消费与 ClickHouse 入库。', currentAction: '等待人工决策：Kafka vs Redis Streams 选型', num: 3, total: 6, status: 'blocked', services: ['stream-processor', 'clickhouse', 'MQ 待定'], meta: '已消耗 200k Token · 🔴 升级事件阻塞', costTokens: 200000, tasks: [{ name: 'stream-processor 骨架', service: 'stream-processor', status: 'done' }, { name: 'ClickHouse 表结构与迁移', service: 'clickhouse', status: 'done' }, { name: '消息队列选型', service: 'MQ 待定', status: 'blocked' }], startedAt: now },
    { id: 'iter-dp-2', agentId: 'agent-8', projectId: 'data-pipeline', taskId: 'T-DP-002', goal: '实现 Airflow DAG ETL 调度、ClickHouse 批量写入与数据质量校验。', currentAction: '正在编写数据质量校验规则', num: 1, total: 4, status: 'running', services: ['etl-worker', 'clickhouse'], meta: '已消耗 58k Token', costTokens: 58000, tasks: [{ name: 'Airflow DAG 编排', service: 'etl-worker', status: 'done' }, { name: 'ClickHouse 批量写入', service: 'clickhouse', status: 'done' }, { name: '数据质量校验规则', service: 'etl-worker', status: 'in-progress' }], startedAt: now },
  ];
  iterations.forEach(it => store.seedIteration(it));

  // ================================================================
  // Decisions
  // ================================================================
  const decisions: Decision[] = [
    { id: 'esc-1', projectId: 'data-pipeline', type: 'escalation', urgency: 'urgent', topic: '选择消息队列方案：Kafka vs Redis Streams', context: 'stream-processor 需要实现实时事件流的缓冲和分发。当前数据量预估为 50k msg/s。', options: [{ name: 'Apache Kafka', recommended: true, pros: ['吞吐量 1M+ msg/s', '持久化原生支持', 'ClickHouse Kafka Engine 直连'], cons: ['需部署 KRaft 集群', '运维复杂度高'] }, { name: 'Redis Streams', recommended: false, pros: ['复用已有 Redis', '零运维增量'], cons: ['接近性能上限', '消息持久化弱于 Kafka'] }], status: 'pending', impact: { constraints: ['no_new_deps_without_adr'], services: ['stream-processor', 'clickhouse'], costEstimate: 'Kafka +2GB 内存 / +4 vCPU' }, createdAt: '2026-06-07T10:00:00Z' },
    { id: 'esc-3', projectId: 'user-mobile', type: 'escalation', urgency: 'normal', topic: 'iOS 和 Android 是否共享导航组件？', context: 'iOS 期望底部 Tab Bar，Android 期望 Navigation Rail。涉及 UI 一致性 vs 平台原生体验。', options: [{ name: '平台各自实现导航，共享业务逻辑', recommended: true, pros: ['完全遵循平台规范', '用户感知更原生'], cons: ['导航代码无法复用'] }, { name: '统一导航组件，平台自适应', recommended: false, pros: ['一次编写两处运行', '维护成本低'], cons: ['iOS 用户可能觉得不够 iOS'] }], status: 'pending', impact: { constraints: [], services: ['iOS-app', 'Android-app'], costEstimate: '约 +2 天开发时间' }, createdAt: '2026-06-07T14:00:00Z' },
    { id: 'D-20260607-001', projectId: 'tracker-system', type: 'adr', urgency: 'normal', topic: '选择 Repository 模式而非 TypeORM 直连', context: '', options: [], chosen: 'Repository 模式', status: 'resolved', impact: { constraints: [], services: [], costEstimate: '' }, createdAt: '2026-06-07T09:00:00Z', resolvedAt: '2026-06-07T09:30:00Z' },
    { id: 'D-20260606-003', projectId: 'payment-gateway', type: 'adr', urgency: 'normal', topic: 'Go 并发模型选择 goroutine pool', context: '', options: [], chosen: 'goroutine pool', status: 'resolved', impact: { constraints: [], services: [], costEstimate: '' }, createdAt: '2026-06-06T10:00:00Z', resolvedAt: '2026-06-06T11:00:00Z' },
    { id: 'D-20260606-004', projectId: 'data-pipeline', type: 'adr', urgency: 'normal', topic: 'ETL 调度选择 Airflow 而非 Prefect', context: '', options: [], chosen: 'Airflow', status: 'resolved', impact: { constraints: [], services: [], costEstimate: '' }, createdAt: '2026-06-06T08:00:00Z', resolvedAt: '2026-06-06T09:00:00Z' },
    { id: 'D-20260606-001', projectId: 'user-mobile', type: 'adr', urgency: 'normal', topic: '移动端状态管理选择 Zustand 而非 Redux', context: '', options: [], chosen: 'Zustand', status: 'resolved', impact: { constraints: [], services: [], costEstimate: '' }, createdAt: '2026-06-06T07:00:00Z', resolvedAt: '2026-06-06T08:00:00Z' },
    { id: 'D-20260604-001', projectId: 'payment-gateway', type: 'adr', urgency: 'normal', topic: '支付幂等性使用 Redis 锁而非 DB 唯一约束', context: '', options: [], chosen: 'Redis 锁', status: 'resolved', impact: { constraints: [], services: [], costEstimate: '' }, createdAt: '2026-06-04T10:00:00Z', resolvedAt: '2026-06-04T11:00:00Z' },
  ];
  decisions.forEach(d => store.seedDecision(d));

  // ================================================================
  // Tech Debt
  // ================================================================
  const techDebts: TechDebt[] = [
    { id: 'TD-01', projectId: 'tracker-system', description: 'tracker-admin 未使用 Repository 模式，Service 层直接调用 Prisma', severity: 'low', cause: '早期快速原型未重构', plan: '下个迭代', overdue: false, status: 'open', createdAt: '2026-06-05T00:00:00Z' },
    { id: 'TD-02', projectId: 'tracker-system', description: 'mobile-app API 客户端未统一错误处理，各页面自行 catch', severity: 'medium', cause: '多 Agent 并行缺乏协调', plan: '2 周内', overdue: false, status: 'open', createdAt: '2026-06-06T00:00:00Z' },
    { id: 'TD-05', projectId: 'payment-gateway', description: 'billing-worker 违反分层依赖：直接 import gateway-api 的 model 包', severity: 'high', cause: '赶进度绕过分层约束', plan: '本周内修复', overdue: true, status: 'open', createdAt: '2026-06-03T00:00:00Z' },
    { id: 'TD-06', projectId: 'payment-gateway', description: 'gateway-api 限流器使用固定窗口算法，高并发下不准确', severity: 'medium', cause: '初期简化实现', plan: '下月迁移到 token bucket', overdue: false, status: 'open', createdAt: '2026-06-04T00:00:00Z' },
    { id: 'TD-07', projectId: 'payment-gateway', description: 'MySQL 连接池未配置健康检查，偶发断连未自动恢复', severity: 'medium', cause: '默认配置未调优', plan: '本周内', overdue: false, status: 'open', createdAt: '2026-06-05T00:00:00Z' },
    { id: 'TD-08', projectId: 'payment-gateway', description: 'Stripe webhook 签名验证使用旧版 API，Stripe Q3 废弃', severity: 'high', cause: 'API 版本滞后', plan: '本月内迁移', overdue: true, status: 'open', createdAt: '2026-06-01T00:00:00Z' },
    { id: 'TD-09', projectId: 'payment-gateway', description: 'billing worker 无优雅关闭，kill 信号可能导致重复计费', severity: 'high', cause: '初期未考虑生产环境', plan: '紧急修复', overdue: false, status: 'open', createdAt: '2026-06-06T00:00:00Z' },
    { id: 'TD-10', projectId: 'data-pipeline', description: 'stream-processor 绕过 Repository 直连 ClickHouse', severity: 'high', cause: '等待 MQ 选型期间未遵循模式', plan: '选型完成后重构', overdue: true, status: 'open', createdAt: '2026-06-02T00:00:00Z' },
    { id: 'TD-11', projectId: 'data-pipeline', description: 'etl-worker 使用 print() 而非结构化日志', severity: 'high', cause: '快速原型阶段', plan: '本周内', overdue: false, status: 'open', createdAt: '2026-06-03T00:00:00Z' },
    { id: 'TD-12', projectId: 'data-pipeline', description: 'Airflow DAG 无重试和告警机制，任务失败静默丢失', severity: 'high', cause: '初期未配置', plan: '本周内修复', overdue: true, status: 'open', createdAt: '2026-06-02T00:00:00Z' },
    { id: 'TD-13', projectId: 'data-pipeline', description: 'ClickHouse 连接使用默认用户+无密码', severity: 'high', cause: '开发环境配置带入', plan: '紧急修复', overdue: false, status: 'open', createdAt: '2026-06-06T00:00:00Z' },
    { id: 'TD-14', projectId: 'data-pipeline', description: '批量写入未使用 ClickHouse 物化视图，查询性能退化', severity: 'medium', cause: '初期不了解 ClickHouse 特性', plan: '下个迭代', overdue: false, status: 'open', createdAt: '2026-06-04T00:00:00Z' },
  ];
  techDebts.forEach(td => store.seedTechDebt(td));

  // ================================================================
  // History
  // ================================================================
  store.seedHistory('tracker-system', [
    { id: 'T-TS-010', goal: '搭建项目骨架，配置 DoD、约束检查与 CI 流水线，初始化前后端服务与数据库。', agent: 'agent-2', services: ['tracker-service', 'admin-web', 'postgres'], completed: '3 天前', tasksDone: 6, cost: '128k' },
    { id: 'T-TS-011', goal: '实现核心 CRUD 与数据模型：资产登记、分类、查询 API，前端管理表格与筛选。', agent: 'agent-2', services: ['tracker-service', 'admin-web', 'postgres'], completed: '2 天前', tasksDone: 8, cost: '210k' },
    { id: 'T-TS-012', goal: '重构错误处理逻辑，统一 API 错误格式，添加全局异常过滤器与前端 toast 提示。', agent: 'agent-2', services: ['tracker-service', 'admin-web', 'mobile-app'], completed: '1 天前', tasksDone: 5, cost: '95k' },
  ]);
  store.seedHistory('payment-gateway', [
    { id: 'T-PG-010', goal: '搭建支付网关骨架：Go/Chi 路由、MySQL schema 设计与 Redis 缓存层。', agent: 'agent-4', services: ['gateway-api', 'mysql', 'redis'], completed: '3 天前', tasksDone: 6, cost: '145k' },
    { id: 'T-PG-011', goal: '实现支付幂等性机制，使用 Redis 分布式锁防止重复扣款，编写并发测试。', agent: 'agent-4', services: ['gateway-api', 'redis'], completed: '昨天', tasksDone: 4, cost: '98k' },
  ]);
  store.seedHistory('user-mobile', [
    { id: 'T-UM-010', goal: 'React Native 项目初始化，配置 Zustand 状态管理、API 客户端与导航框架。', agent: 'agent-6', services: ['mobile-app', 'user-api'], completed: '3 天前', tasksDone: 5, cost: '98k' },
    { id: 'T-UM-011', goal: '用户注册与登录流程：手机号验证、OAuth 第三方登录、session 持久化。', agent: 'agent-6', services: ['mobile-app', 'user-api', 'postgres'], completed: '2 天前', tasksDone: 7, cost: '176k' },
  ]);
  store.seedHistory('data-pipeline', [
    { id: 'T-DP-010', goal: '搭建数据管道骨架：Airflow 部署、ClickHouse 集群初始化与 Python ETL 框架。', agent: 'agent-8', services: ['etl-worker', 'clickhouse'], completed: '4 天前', tasksDone: 6, cost: '185k' },
    { id: 'T-DP-011', goal: 'ETL 数据摄取：从多个数据源批量导入 ClickHouse，编写数据校验脚本。', agent: 'agent-8', services: ['etl-worker', 'clickhouse'], completed: '2 天前', tasksDone: 5, cost: '220k' },
  ]);

  console.log('Seed complete: 4 projects, 8 agents, 11 active iterations, 7 decisions, 12 tech debts, history');
}
