import { MemoryStore } from './db/memory.store';
import { Project, Agent, Iteration, Decision, TechDebt, CrossDep, OrgStandard, HistoryIteration } from './types';

export function seed(store: MemoryStore): void {
  const now = new Date().toISOString();

  // ================================================================
  // STANDARDS (org-level patterns for all projects)
  // ================================================================
  store.setStandards([
    { id: 'std-1', name: 'API 设计规范', latestVersion: 'v2.1', projects: { 'auto-sentinel': 'v2.0', 'gate-flow': 'v2.1', 'star-river': 'v1.8', 'tracker-system': 'v2.1' } },
    { id: 'std-2', name: '数据库访问规范', latestVersion: 'v2.0', projects: { 'auto-sentinel': 'v2.0', 'gate-flow': 'v2.0', 'star-river': 'v1.5', 'tracker-system': 'v2.0' } },
    { id: 'std-3', name: '日志规范', latestVersion: 'v1.3', projects: { 'auto-sentinel': 'v1.3', 'gate-flow': 'v1.3', 'star-river': 'v1.0', 'tracker-system': 'v1.3' } },
    { id: 'std-4', name: '错误处理规范', latestVersion: 'v1.2', projects: { 'auto-sentinel': 'v1.2', 'gate-flow': 'v1.2', 'star-river': 'v1.0', 'tracker-system': 'v1.2' } },
    { id: 'std-5', name: '认证授权规范', latestVersion: 'v2.0', projects: { 'auto-sentinel': 'v2.0', 'gate-flow': 'v2.0', 'star-river': 'v1.5', 'tracker-system': 'v2.0' } },
  ]);

  // ================================================================
  // CROSS-PROJECT DEPENDENCIES
  // ================================================================
  store.setCrossDeps([
    { id: 'dep-1', fromService: 'gate-flow-api', fromProject: 'gate-flow', toService: 'tracker-collector', toProject: 'tracker-system', depType: '数据消费', risk: 'medium', impactDesc: 'gate-flow 消费 tracker-system 采集的用户行为数据用于 A/B 实验分析。tracker 的数据格式变更会影响 gate-flow 的实验数据管道。' },
    { id: 'dep-2', fromService: 'sentinel-detector', fromProject: 'auto-sentinel', toService: 'gate-flow-api', toProject: 'gate-flow', depType: '监控集成', risk: 'low', impactDesc: 'auto-sentinel 监控 gate-flow 的实验 API 健康状态与异常告警。' },
    { id: 'dep-3', fromService: 'sentinel-detector', fromProject: 'auto-sentinel', toService: 'tracker-collector', toProject: 'tracker-system', depType: '监控集成', risk: 'low', impactDesc: 'auto-sentinel 监控 tracker-system 的数据采集管道延迟与错误率。' },
    { id: 'dep-4', fromService: 'star-river-api', fromProject: 'star-river', toService: 'gate-flow-api', toProject: 'gate-flow', depType: '支付回调', risk: 'high', impactDesc: 'star-river 处理支付后回调 gate-flow 的实验转化事件。支付链路变更直接影响 A/B 实验的转化归因。' },
    { id: 'dep-5', fromService: 'star-river-api', fromProject: 'star-river', toService: 'sentinel-detector', toProject: 'auto-sentinel', depType: '监控集成', risk: 'high', impactDesc: 'auto-sentinel 实时监控 star-river 支付接口的可用性。支付异常需 30s 内告警。' },
  ]);

  // ================================================================
  // PROJECTS — real projects from /home/hicooper/projects
  // ================================================================
  const projects: Project[] = [
    {
      id: 'auto-sentinel', name: 'auto-sentinel',
      repoUrl: 'file:///home/hicooper/projects/auto-sentinel',
      description: 'AI 驱动的可观测性与自动修复平台。实时监控多项目健康状态，智能检测异常并自动触发修复流程。',
      domain: '可观测性',
      techTags: ['Go', 'Python', 'TypeScript', 'React'],
      status: 'active', health: 'green',
      dodConfig: {} as any, constraints: [],
      createdAt: '2026-01-15T10:00:00Z',
    },
    {
      id: 'gate-flow', name: 'gate-flow',
      repoUrl: 'file:///home/hicooper/projects/gate-flow',
      description: 'A/B 测试实验平台。支持流量分割、多变量实验、实时数据采集与统计显著性分析，为产品决策提供数据支撑。',
      domain: 'A/B 实验',
      techTags: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      status: 'active', health: 'green',
      dodConfig: {} as any, constraints: [],
      createdAt: '2026-02-20T10:00:00Z',
    },
    {
      id: 'star-river', name: 'star-river',
      repoUrl: 'file:///home/hicooper/projects/star-river',
      description: 'AI 时代的支付基础设施。提供统一的支付网关、多渠道路由、智能风控与资金清结算能力。',
      domain: '支付基础设施',
      techTags: ['Go', 'TypeScript', 'PostgreSQL', 'Redis'],
      status: 'active', health: 'yellow',
      dodConfig: {} as any, constraints: [],
      createdAt: '2026-03-10T10:00:00Z',
    },
    {
      id: 'tracker-system', name: 'tracker-system',
      repoUrl: 'file:///home/hicooper/projects/tracker-system',
      description: '埋点采集与流量分析系统。全维度采集用户行为数据，高性能事件管道，为 A/B 实验与数据分析提供可靠数据基础。',
      domain: '数据采集',
      techTags: ['TypeScript', 'Node.js', 'ClickHouse', 'Redis'],
      status: 'active', health: 'green',
      dodConfig: {} as any, constraints: [],
      createdAt: '2026-04-05T10:00:00Z',
    },
  ];
  projects.forEach(p => store.seedProject(p));

  // ================================================================
  // AGENTS
  // ================================================================
  const agents: Agent[] = [
    { id: 'agent-1', projectId: 'auto-sentinel', service: 'sentinel-detector', status: 'running', mode: 'cloud', currentIteration: 2, currentPhase: '实现中', currentAction: '正在实现异常检测阈值自适应算法', heartbeatAt: now, startedAt: '2026-06-07T09:00:00Z' },
    { id: 'agent-2', projectId: 'auto-sentinel', service: 'dashboard', status: 'running', mode: 'local', currentIteration: 1, currentPhase: '实现中', currentAction: '正在搭建告警事件时间线组件', heartbeatAt: now, startedAt: '2026-06-08T10:00:00Z' },
    { id: 'agent-3', projectId: 'gate-flow', service: 'gate-flow-api', status: 'running', mode: 'cloud', currentIteration: 3, currentPhase: '自检中', currentAction: '正在实现多变量实验分流逻辑', heartbeatAt: now, startedAt: '2026-06-06T14:00:00Z' },
    { id: 'agent-4', projectId: 'gate-flow', service: 'dashboard', status: 'running', mode: 'local', currentIteration: 2, currentPhase: '实现中', currentAction: '正在实现实验结果可视化图表', heartbeatAt: now, startedAt: '2026-06-07T11:00:00Z' },
    { id: 'agent-5', projectId: 'star-river', service: 'star-river-api', status: 'running', mode: 'cloud', currentIteration: 5, currentPhase: '自检中', currentAction: '正在实现多渠道支付路由与 failover 逻辑', heartbeatAt: now, startedAt: '2026-06-05T08:00:00Z' },
    { id: 'agent-6', projectId: 'star-river', service: 'hydra-pay', status: 'blocked', mode: 'cloud', currentIteration: 3, currentPhase: '等待人工决策', currentAction: '等待决定：支付风控模型使用规则引擎还是 ML', heartbeatAt: now, startedAt: '2026-06-06T16:00:00Z' },
    { id: 'agent-7', projectId: 'tracker-system', service: 'tracker-collector', status: 'running', mode: 'cloud', currentIteration: 4, currentPhase: '实现中', currentAction: '正在优化批量写入 ClickHouse 的背压控制', heartbeatAt: now, startedAt: '2026-06-07T10:00:00Z' },
    { id: 'agent-8', projectId: 'tracker-system', service: 'tracker-sdk', status: 'running', mode: 'local', currentIteration: 2, currentPhase: '实现中', currentAction: '正在实现 Web SDK 的自动埋点插件', heartbeatAt: now, startedAt: '2026-06-08T09:00:00Z' },
  ];
  agents.forEach(a => store.seedAgent(a));

  // ================================================================
  // ACTIVE ITERATIONS
  // ================================================================
  const iterations: Iteration[] = [
    // auto-sentinel
    { id: 'iter-as-1', agentId: 'agent-1', projectId: 'auto-sentinel', taskId: 'T-AS-001', goal: '实现异常检测引擎：阈值自适应、多指标关联分析、告警收敛，减少误报率至 5% 以下。', currentAction: '正在实现异常检测阈值自适应算法', num: 2, total: 5, status: 'running', services: ['sentinel-detector', 'ai-engine'], meta: '已消耗 85k Token · 误报率已降至 12%', costTokens: 85000, tasks: [{ name: '多指标采集管道', service: 'sentinel-detector', status: 'done' }, { name: '阈值自适应算法', service: 'ai-engine', status: 'in-progress' }, { name: '告警收敛与去重', service: 'sentinel-detector', status: 'pending' }], startedAt: now },
    { id: 'iter-as-2', agentId: 'agent-2', projectId: 'auto-sentinel', taskId: 'T-AS-002', goal: '告警事件时间线 Dashboard：实时事件流、历史回溯、一键触发修复。', currentAction: '正在搭建告警事件时间线组件', num: 1, total: 4, status: 'running', services: ['dashboard'], meta: '已消耗 32k Token · 刚启动', costTokens: 32000, tasks: [{ name: '事件时间线 UI 组件', service: 'dashboard', status: 'in-progress' }, { name: '实时事件 WebSocket 接入', service: 'dashboard', status: 'pending' }], startedAt: now },
    // gate-flow
    { id: 'iter-gf-1', agentId: 'agent-3', projectId: 'gate-flow', taskId: 'T-GF-001', goal: '实现多变量实验引擎：支持正交/互斥流量分割、实验配置热更新、统计显著性计算。', currentAction: '正在实现多变量实验分流逻辑', num: 3, total: 6, status: 'running', services: ['gate-flow-api', 'backend'], meta: '已消耗 120k Token · 单变量实验已通过', costTokens: 120000, tasks: [{ name: '流量分割引擎', service: 'gate-flow-api', status: 'done' }, { name: '实验配置管理', service: 'backend', status: 'done' }, { name: '多变量正交分流', service: 'gate-flow-api', status: 'in-progress' }, { name: '统计显著性检验', service: 'backend', status: 'pending' }], startedAt: now },
    { id: 'iter-gf-2', agentId: 'agent-4', projectId: 'gate-flow', taskId: 'T-GF-002', goal: '实验结果可视化：指标对比图表、置信区间展示、实验报告自动生成。', currentAction: '正在实现实验结果可视化图表', num: 2, total: 4, status: 'running', services: ['dashboard'], meta: '已消耗 56k Token', costTokens: 56000, tasks: [{ name: '指标对比图表组件', service: 'dashboard', status: 'done' }, { name: '置信区间可视化', service: 'dashboard', status: 'in-progress' }, { name: '报告自动生成', service: 'dashboard', status: 'pending' }], startedAt: now },
    // star-river
    { id: 'iter-sr-1', agentId: 'agent-5', projectId: 'star-river', taskId: 'T-SR-001', goal: '多渠道支付路由：主备切换、费率择优、超时 failover，实现 99.99% 支付可用性。', currentAction: '正在实现多渠道支付路由与 failover 逻辑', num: 5, total: 7, status: 'running', services: ['star-river-api', 'hydra-pay'], meta: '已消耗 210k Token · 双渠道已接入', costTokens: 210000, tasks: [{ name: '支付宝渠道接入', service: 'hydra-pay', status: 'done' }, { name: '微信支付渠道接入', service: 'hydra-pay', status: 'done' }, { name: '路由与 failover 引擎', service: 'star-river-api', status: 'in-progress' }, { name: '99.99% 可用性压测', service: 'star-river-api', status: 'pending' }], startedAt: now },
    { id: 'iter-sr-2', agentId: 'agent-6', projectId: 'star-river', taskId: 'T-SR-002', goal: '智能风控引擎：交易风险评估、异常交易识别、实时拦截。', currentAction: '等待决定：风控模型使用规则引擎还是 ML', num: 3, total: 6, status: 'blocked', services: ['hydra-pay', 'hydra-wall'], meta: '已消耗 95k Token · 🔴 升级事件阻塞', costTokens: 95000, tasks: [{ name: '交易数据采集', service: 'hydra-wall', status: 'done' }, { name: '基础规则引擎', service: 'hydra-pay', status: 'done' }, { name: '风控模型选型', service: 'hydra-pay', status: 'blocked' }, { name: '实时拦截集成', service: 'hydra-wall', status: 'pending' }], startedAt: now },
    // tracker-system
    { id: 'iter-ts-1', agentId: 'agent-7', projectId: 'tracker-system', taskId: 'T-TS-001', goal: '优化 ClickHouse 写入性能：批量写入、背压控制、物化视图预聚合。', currentAction: '正在优化批量写入 ClickHouse 的背压控制', num: 4, total: 6, status: 'running', services: ['tracker-collector', 'backend'], meta: '已消耗 78k Token · 写入延迟降低 40%', costTokens: 78000, tasks: [{ name: '批量写入优化', service: 'tracker-collector', status: 'done' }, { name: '背压控制', service: 'tracker-collector', status: 'in-progress' }, { name: '物化视图预聚合', service: 'backend', status: 'pending' }], startedAt: now },
    { id: 'iter-ts-2', agentId: 'agent-8', projectId: 'tracker-system', taskId: 'T-TS-002', goal: 'Web SDK 自动埋点：页面浏览、点击、曝光事件自动采集，支持自定义事件。', currentAction: '正在实现 Web SDK 的自动埋点插件', num: 2, total: 5, status: 'running', services: ['tracker-sdk'], meta: '已消耗 42k Token · 基础 SDK 已完成', costTokens: 42000, tasks: [{ name: 'SDK 核心初始化', service: 'tracker-sdk', status: 'done' }, { name: '自动埋点插件', service: 'tracker-sdk', status: 'in-progress' }, { name: '自定义事件 API', service: 'tracker-sdk', status: 'pending' }], startedAt: now },
  ];
  iterations.forEach(it => store.seedIteration(it));

  // ================================================================
  // DECISIONS
  // ================================================================
  const decisions: Decision[] = [
    { id: 'esc-1', projectId: 'star-river', type: 'escalation', urgency: 'urgent', topic: '风控模型选择：规则引擎 vs 机器学习', context: 'hydra-pay 风控模块需要在规则引擎（确定性高、可解释）和 ML 模型（自适应、但需要训练数据）之间选择。支付业务对误拦截敏感度极高。', options: [{ name: '规则引擎（Drools/自研）', recommended: true, pros: ['规则可解释、可审计', '无冷启动问题', '风控团队可直接维护规则'], cons: ['无法识别未知欺诈模式', '规则膨胀后维护成本高'] }, { name: 'ML 模型（XGBoost + 特征工程）', recommended: false, pros: ['可自适应新欺诈模式', '长期准确率更高'], cons: ['初期缺乏标注数据', '误拦截需人工审核'] }], status: 'pending', impact: { constraints: ['no_new_deps_without_adr'], services: ['hydra-pay', 'hydra-wall'], costEstimate: '规则引擎: +0.5 人周维护/月；ML: 初期 +2 人周训练数据标注' }, createdAt: '2026-06-08T08:00:00Z' },
    { id: 'D-20260608-001', projectId: 'auto-sentinel', type: 'adr', urgency: 'normal', topic: '告警收敛策略选择滑动窗口 + 指纹去重', context: '', options: [], chosen: '滑动窗口 + 指纹去重', status: 'resolved', impact: { constraints: [], services: [], costEstimate: '' }, createdAt: '2026-06-08T09:00:00Z', resolvedAt: '2026-06-08T10:00:00Z' },
    { id: 'D-20260607-001', projectId: 'gate-flow', type: 'adr', urgency: 'normal', topic: '实验分流使用一致性哈希而非随机分配', context: '', options: [], chosen: '一致性哈希', status: 'resolved', impact: { constraints: [], services: [], costEstimate: '' }, createdAt: '2026-06-07T14:00:00Z', resolvedAt: '2026-06-07T15:00:00Z' },
    { id: 'D-20260606-001', projectId: 'tracker-system', type: 'adr', urgency: 'normal', topic: '埋点数据写入选择 ClickHouse 而非 Elasticsearch', context: '', options: [], chosen: 'ClickHouse', status: 'resolved', impact: { constraints: [], services: [], costEstimate: '' }, createdAt: '2026-06-06T10:00:00Z', resolvedAt: '2026-06-06T11:00:00Z' },
    { id: 'D-20260605-001', projectId: 'star-river', type: 'adr', urgency: 'normal', topic: '支付幂等性使用 Redis 分布式锁 + DB 唯一约束双重保障', context: '', options: [], chosen: 'Redis + DB 双重保障', status: 'resolved', impact: { constraints: [], services: [], costEstimate: '' }, createdAt: '2026-06-05T09:00:00Z', resolvedAt: '2026-06-05T10:00:00Z' },
  ];
  decisions.forEach(d => store.seedDecision(d));

  // ================================================================
  // TECH DEBT
  // ================================================================
  const techDebts: TechDebt[] = [
    { id: 'TD-01', projectId: 'auto-sentinel', description: 'ai-engine 的异常检测模型未版本化，更新模型可能破坏已有规则', severity: 'medium', cause: '初期快速迭代未建立模型管理流程', plan: '下个迭代引入 MLflow', overdue: false, status: 'open', createdAt: '2026-06-01T00:00:00Z' },
    { id: 'TD-02', projectId: 'auto-sentinel', description: 'dashboard 的 WebSocket 连接未做心跳保活，偶发断连不重连', severity: 'low', cause: '原型阶段未考虑长连接稳定性', plan: '本周内', overdue: false, status: 'open', createdAt: '2026-06-03T00:00:00Z' },
    { id: 'TD-03', projectId: 'gate-flow', description: '实验配置热更新未做版本控制，回滚依赖手动操作', severity: 'high', cause: 'MVP 阶段未考虑配置管理', plan: '本月内引入配置版本化', overdue: false, status: 'open', createdAt: '2026-05-28T00:00:00Z' },
    { id: 'TD-04', projectId: 'gate-flow', description: '统计显著性计算使用简化公式，大样本量下有精度损失', severity: 'medium', cause: '初期用 t-test 近似，实际应用需要 bootstrap', plan: '下个迭代', overdue: false, status: 'open', createdAt: '2026-06-02T00:00:00Z' },
    { id: 'TD-05', projectId: 'star-river', description: 'hydra-pay 的支付回调处理无重试机制，偶发丢单', severity: 'high', cause: '初期简化了回调处理链路', plan: '紧急修复，本周内', overdue: true, status: 'open', createdAt: '2026-05-25T00:00:00Z' },
    { id: 'TD-06', projectId: 'star-river', description: '支付路由的费率比较逻辑硬编码在代码中，新增渠道需改代码', severity: 'medium', cause: '初期只有两个渠道，未抽象', plan: '本月内重构为配置驱动', overdue: false, status: 'open', createdAt: '2026-06-01T00:00:00Z' },
    { id: 'TD-07', projectId: 'tracker-system', description: 'tracker-collector 的事件去重使用内存 Set，重启丢失', severity: 'high', cause: '快速原型阶段', plan: '迁移到 Redis Bloom Filter', overdue: true, status: 'open', createdAt: '2026-05-20T00:00:00Z' },
    { id: 'TD-08', projectId: 'tracker-system', description: 'tracker-sdk 的 gzip 压缩在移动端未启用，流量消耗偏高', severity: 'medium', cause: '移动端适配遗漏', plan: '本周内', overdue: false, status: 'open', createdAt: '2026-06-04T00:00:00Z' },
  ];
  techDebts.forEach(td => store.seedTechDebt(td));

  // ================================================================
  // HISTORY
  // ================================================================
  store.seedHistory('auto-sentinel', [
    { id: 'T-AS-010', goal: '搭建 Sentinel 项目骨架：Go 平台服务 + Python AI 引擎 + React Dashboard。', agent: 'agent-1', services: ['platform', 'ai-engine', 'dashboard'], completed: '5 天前', tasksDone: 6, cost: '180k' },
    { id: 'T-AS-011', goal: '实现基础监控采集：指标接入、日志聚合、基础告警规则。', agent: 'agent-1', services: ['sentinel-detector', 'platform'], completed: '3 天前', tasksDone: 5, cost: '145k' },
  ]);
  store.seedHistory('gate-flow', [
    { id: 'T-GF-010', goal: '搭建 GateFlow 项目骨架：TypeScript monorepo，实验配置管理与流量分割 MVP。', agent: 'agent-3', services: ['gate-flow-api', 'backend', 'dashboard'], completed: '4 天前', tasksDone: 7, cost: '210k' },
    { id: 'T-GF-011', goal: '实现单变量 A/B 实验：流量分割、数据采集、基础统计报告。', agent: 'agent-3', services: ['gate-flow-api', 'backend'], completed: '2 天前', tasksDone: 5, cost: '168k' },
  ]);
  store.seedHistory('star-river', [
    { id: 'T-SR-010', goal: '搭建星河支付骨架：Go 支付核心 + 渠道适配层 + 基础风控。', agent: 'agent-5', services: ['star-river-api', 'hydra-pay', 'hydra-wall'], completed: '6 天前', tasksDone: 8, cost: '320k' },
    { id: 'T-SR-011', goal: '支付宝渠道接入：支付/退款/查询/对账全流程。', agent: 'agent-5', services: ['hydra-pay', 'star-river-api'], completed: '4 天前', tasksDone: 6, cost: '195k' },
    { id: 'T-SR-012', goal: '微信支付渠道接入：支付/退款/查询/对账全流程。', agent: 'agent-5', services: ['hydra-pay', 'star-river-api'], completed: '昨天', tasksDone: 6, cost: '180k' },
  ]);
  store.seedHistory('tracker-system', [
    { id: 'T-TS-010', goal: '搭建 Tracker 项目骨架：事件采集管道、ClickHouse schema、SDK 基础框架。', agent: 'agent-7', services: ['tracker-collector', 'backend', 'tracker-sdk'], completed: '5 天前', tasksDone: 7, cost: '230k' },
    { id: 'T-TS-011', goal: '实现 Web SDK v0.1：页面浏览、点击事件自动采集、自定义事件接口。', agent: 'agent-8', services: ['tracker-sdk'], completed: '2 天前', tasksDone: 5, cost: '128k' },
  ]);

  console.log('Seed: 4 projects (auto-sentinel, gate-flow, star-river, tracker-system) | 8 agents | 8 iterations | 5 decisions | 8 tech debts');
}
