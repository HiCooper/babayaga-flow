#!/usr/bin/env bash
# ============================================================================
# init.sh — 为新项目初始化 AI 治理配置
# ============================================================================
# 用法:
#   bash .claude/init.sh                    # 当前目录，交互式选择技术栈
#   bash .claude/init.sh --stack node       # 指定技术栈
#   bash .claude/init.sh --stack python     #
#   bash .claude/init.sh --stack go         #
#   bash .claude/init.sh --stack rust       #
#   bash .claude/init.sh --stack java       #
#   bash .claude/init.sh --stack generic    # 通用模板，手动填 check
# ============================================================================

set -euo pipefail

TARGET_DIR="${1:-$(pwd)}"
STACK="${2:-}"

# --- 技术栈预设 ---
declare -A PRESETS

PRESETS[node]='
coverage.check = npx jest --coverage --coverageThreshold={"global":{"lines":80,"branches":80,"functions":80,"statements":80}}
types.check    = npx tsc --noEmit
lint.check     = npx eslint src/ --max-warnings 0
security.check = npx audit-ci --critical --high
duplication.check = npx jscpd src/ --max-lines 5 --threshold 5
circular.check = npx madge --circular --extensions ts,tsx src/
layer.check    = npx dependency-cruiser --validate .dependency-cruiser.js
perf_api.check = npx autocannon -d 10 -c 100 http://localhost:3000/api
perf_startup.check = timeout 5 node dist/main.js --health-check 2>&1 | grep -q ready
'

PRESETS[python]='
coverage.check = pytest --cov=src --cov-report=term --cov-fail-under=80
types.check    = mypy src/ --strict
lint.check     = ruff check src/ && ruff format --check src/
security.check = bandit -r src/ -ll && pip-audit
duplication.check = jscpd src/ --max-lines 5 --threshold 5
circular.check = import-linter check
layer.check    = import-linter check .importlinter
perf_api.check = echo "TODO: use locust or k6 for API perf test"
perf_startup.check = timeout 5 python -c "from src.main import app; print(\"ready\")"
'

PRESETS[go]='
coverage.check = go test ./... -coverprofile=coverage.out && go tool cover -func=coverage.out | grep total | awk "{if (\$3+0 < 80) exit 1}"
types.check    = go vet ./...
lint.check     = golangci-lint run ./...
security.check = govulncheck ./... && gosec ./...
duplication.check = jscpd src/ --max-lines 5 --threshold 5
circular.check = goda depgraph ./... 2>/dev/null | grep -q cycle && exit 1 || exit 0
layer.check    = golangci-lint run --enable=depguard ./...
perf_api.check = echo "TODO: use k6 or vegeta for API perf test"
perf_startup.check = timeout 3 go run main.go --health-check 2>&1 | grep -q ready
'

PRESETS[rust]='
coverage.check = cargo tarpaulin --out Html --fail-under 80
types.check    = cargo check
lint.check     = cargo clippy -- -D warnings
security.check = cargo audit && cargo deny check
duplication.check = jscpd src/ --max-lines 5 --threshold 5
circular.check = cargo udeps 2>/dev/null; echo "manual: review module graph for cycles"
layer.check    = cargo modules structure --lib 2>/dev/null || echo "manual"
perf_api.check = echo "TODO: use k6 or criterion for perf test"
perf_startup.check = timeout 3 cargo run -- --health-check 2>&1 | grep -q ready
'

PRESETS[java]='
coverage.check = ./gradlew jacocoTestCoverageVerification
types.check    = ./gradlew compileJava
lint.check     = ./gradlew checkstyleMain spotbugsMain
security.check = ./gradlew dependencyCheckAnalyze
duplication.check = jscpd src/main --max-lines 5 --threshold 5
circular.check = ./gradlew checkCircularDependencies 2>/dev/null || echo "TODO: add ArchUnit cycle test"
layer.check    = ./gradlew archUnitTest 2>/dev/null || echo "TODO: add ArchUnit layer test"
perf_api.check = echo "TODO: use k6 or gatling for API perf test"
perf_startup.check = timeout 10 java -jar build/libs/app.jar --health-check 2>&1 | grep -q ready
'

# --- 交互式选择 ---
if [ -z "$STACK" ]; then
  echo "选择项目技术栈:"
  echo "  1) TypeScript/Node.js"
  echo "  2) Python"
  echo "  3) Go"
  echo "  4) Rust"
  echo "  5) Java"
  echo "  6) 通用（手动填写 check 命令）"
  read -rp "输入数字 (1-6): " choice
  case "$choice" in
    1) STACK="node" ;;
    2) STACK="python" ;;
    3) STACK="go" ;;
    4) STACK="rust" ;;
    5) STACK="java" ;;
    6) STACK="generic" ;;
    *) echo "无效选择"; exit 1 ;;
  esac
fi

# --- 复制模板 ---
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR"

mkdir -p "$TARGET_DIR/.claude/decisions"

cp "$TEMPLATE_DIR/dod.yaml"           "$TARGET_DIR/.claude/dod.yaml"
cp "$TEMPLATE_DIR/constraints.yaml"   "$TARGET_DIR/.claude/constraints.yaml"
cp "$TEMPLATE_DIR/decisions/_TEMPLATE.yaml" "$TARGET_DIR/.claude/decisions/_TEMPLATE.yaml"
touch "$TARGET_DIR/.claude/decisions/.gitkeep"

# --- 替换 project name ---
PROJECT_NAME=$(basename "$(cd "$TARGET_DIR" && pwd)")
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/project: babayaga-flow/project: $PROJECT_NAME/" "$TARGET_DIR/.claude/dod.yaml"
else
  sed -i "s/project: babayaga-flow/project: $PROJECT_NAME/" "$TARGET_DIR/.claude/dod.yaml"
fi

# --- 应用预设 (Python 做字符串替换, 避免 sed 转义地狱) ---
if [ "$STACK" != "generic" ] && [ -n "${PRESETS[$STACK]:-}" ]; then
  echo ""
  echo "=== 应用预设: $STACK ==="
  python3 -c "
import sys, re

presets_raw = '''${PRESETS[$STACK]}'''
presets = {}
for line in presets_raw.strip().split('\n'):
    line = line.strip()
    if '=' not in line:
        continue
    key, _, val = line.partition('=')
    presets[key.strip()] = val.strip()

# 读 dod.yaml
with open('$TARGET_DIR/.claude/dod.yaml') as f:
    dod = f.read()

# 读 constraints.yaml
with open('$TARGET_DIR/.claude/constraints.yaml') as f:
    constraints = f.read()

# dod.yaml 中的替换映射: 字段名 → 旧值 → 新值
# 使用行级匹配替换，匹配 check: 行后面的内容
import re

def replace_check(content, marker, new_val):
    '''替换 YAML 中 check: 行'''
    # 匹配 marker 所在区域的 check: 行
    lines = content.split('\n')
    result = []
    found_marker = False
    for line in lines:
        if marker in line:
            found_marker = True
        if found_marker and line.strip().startswith('check:'):
            indent = line[:len(line) - len(line.lstrip())]
            result.append(f'{indent}check: \"{new_val}\"')
            found_marker = False
        else:
            result.append(line)
    return '\n'.join(result)

dod = replace_check(dod, 'coverage:', presets.get('coverage.check', ''))
dod = replace_check(dod, 'types:', presets.get('types.check', ''))
dod = replace_check(dod, 'lint:', presets.get('lint.check', ''))
dod = replace_check(dod, 'security:', presets.get('security.check', ''))
dod = replace_check(dod, 'duplication:', presets.get('duplication.check', ''))
dod = replace_check(dod, 'API 响应时间', presets.get('perf_api.check', ''))
dod = replace_check(dod, '启动时间', presets.get('perf_startup.check', ''))

constraints = replace_check(constraints, 'no_circular_deps', presets.get('circular.check', ''))
constraints = replace_check(constraints, 'layer_dependency_direction', presets.get('layer.check', ''))

with open('$TARGET_DIR/.claude/dod.yaml', 'w') as f:
    f.write(dod)

with open('$TARGET_DIR/.claude/constraints.yaml', 'w') as f:
    f.write(constraints)

print('dod.yaml + constraints.yaml 已适配')
"
fi

echo ""
echo "=== 初始化完成 ==="
echo "  项目: $PROJECT_NAME"
echo "  技术栈: $STACK"
echo ""
echo "已在 $TARGET_DIR 下生成:"
echo "  .claude/dod.yaml"
echo "  .claude/constraints.yaml"
echo "  .claude/decisions/"
echo ""
echo "下一步:"
echo "  1. 检查 .claude/dod.yaml 中的 check 命令是否可执行"
echo "  2. 编辑 .claude/constraints.yaml 填写 anti_goals"
echo "  3. 将 CLAUDE.md 复制到项目根目录"
echo "  4. 跑一次迭代验证流程"
