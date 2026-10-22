#!/usr/bin/env bash
# 提交前：先自动修（文字、格式、导出入口），再跑与 CI 一样的 pnpm check；任何一步失败就打印它的输出并以 1 退出。
# 用法：bash scripts/dev/check.sh && git commit …（别接管道，管道会吞掉退出码）
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1

step() {
  local name=$1
  shift
  local out
  if ! out=$("$@" 2>&1); then
    echo "FAILED: $name"
    echo "$out" | tail -30
    exit 1
  fi
}

# 新文件先登记（intent-to-add）：docs:check 等按 git ls-files 取文件，没登记的新文件会被漏掉
untracked=$(git ls-files -o --exclude-standard)
[ -n "$untracked" ] && git add -N $untracked
step text node scripts/text/check.mjs --fix
changed=$(git ls-files -m -o --exclude-standard | grep -E '\.(tsx?|mjs|md|json)$' | while read -r file; do [ -f "$file" ] && echo "$file"; done)
[ -n "$changed" ] && step prettier npx prettier --write $changed
step exports pnpm -s exports
step check pnpm -s check
echo "CHECKS OK"
