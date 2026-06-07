# Babayaga Flow — AI 工程治理框架

当 AI coding 规模化之后，瓶颈从「写代码」转移到了「管项目」。这个项目提供一套从配置到平台的完整治理方案，帮助人类掌控多项目、多 Agent 的并行研发节奏。

## 核心理念

**把「人盯着看」变成「机器自动检查」、把「模糊描述」变成「可验证约束」、把「每阶段审批」变成「完成时验收」。**

## 项目结构

```
├── CLAUDE.md                   # Agent 工作流入口（复制到目标项目根目录）
├── .claude/
│   ├── dod.yaml                # 完成标准模板（机器可执行）
│   ├── constraints.yaml        # 架构约束模板（机器可检查）
│   ├── init.sh                 # 一键初始化脚本（5 种技术栈预设）
│   └── decisions/              # 决策记录模板 + 示例
├── docs/
│   ├── control-tower-mockup.html  # 控制塔交互原型
└── README.md
```

## 快速开始

### 1. 在现有项目中部署治理配置

```bash
# 交互式选择技术栈
bash .claude/init.sh /path/to/your-project

# 或直接指定
bash .claude/init.sh /path/to/your-project --stack python
```

支持 `node` / `python` / `go` / `rust` / `java` / `generic` 六种预设。

### 2. 修改配置适配你的项目

- 编辑 `.claude/dod.yaml` — 确认 check 命令可执行，调整升级条件
- 编辑 `.claude/constraints.yaml` — 填写 `anti_goals`（告诉 AI 不要做什么）
- 将 `CLAUDE.md` 的内容合并到目标项目的 CLAUDE.md 中

### 3. Agent 就会自动按 DoD + constraints 运行

Agent 工作循环：**理解目标 → 实现 → 自检 → 通过就完成 / 失败就修复 / 卡住就升级人工** — 不再每个阶段停下来等人审批。

## 查看控制塔原型

在浏览器中打开 `docs/control-tower-mockup.html`，包含：

- **项目总览** — 所有项目健康状态一目了然
- **项目详情** — 服务拓扑 + 约束合规 + Agent 时间线 + 决策记录
- **Live Inspection** — 查看 Agent 运行时状态（云 Agent / 本地 Agent）
- **升级收件箱** — Agent 需要人类决策时，提供完整上下文的面板
- **Agent Console** — 异步人机对话通道

## License

MIT
