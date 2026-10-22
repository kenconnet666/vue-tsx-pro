#!/usr/bin/env bash
# 推送前看 master 上最近一次跑完的 CI（取消的不算）：失败了就停下先修；这次推送本身就是修复时加 --fix。
# CI 设了 cancel-in-progress：一轮里的几个提交攒到最后一起推。
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1
last=$(gh run list --branch master --limit 8 --json conclusion,status,headSha,displayTitle \
  --jq '[.[] | select(.status == "completed" and .conclusion != "cancelled")][0] | "\(.conclusion) \(.headSha[0:7]) \(.displayTitle)"')
if [[ "$last" == failure* && "${1:-}" != "--fix" ]]; then
  echo "LAST CI FAILED, not pushing: $last"
  exit 1
fi
git push -q origin master && echo "pushed $(git rev-parse --short HEAD); last finished CI: $last"
