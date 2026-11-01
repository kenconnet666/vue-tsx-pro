#!/usr/bin/env bash
# 本仓库开发数据库的 docker compose 包装：首次运行时在 .local/ 生成密码、连接说明与实库测试的环境变量，之后原样转发参数。
# 在 WSL 里从仓库任意位置执行：bash infra/dev/db.sh up -d
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../.." && pwd)
local_dir="$root/.local"
env_file="$local_dir/db.env"

if [[ ! -f $env_file ]]; then
  mkdir -p "$local_dir"
  random() { od -An -N9 -tx1 /dev/urandom | tr -d ' \n'; }
  mysql_password="vtp$(random)"
  pg_password="vtp$(random)"
  cat >"$env_file" <<EOF
VTP_MYSQL_PASSWORD=$mysql_password
VTP_PG_PASSWORD=$pg_password
# 实库测试读这几个变量（流程引擎）：本地只跑 MySQL 8.4；要加 8.0.18（polardb profile）时逗号分隔追加 23318
EQTS_MYSQL_URLS=mysql://root:$mysql_password@127.0.0.1:23306/eqts
EQTS_PG_URLS=postgres://postgres:$pg_password@127.0.0.1:25432/eqts
EOF
  cat >"$local_dir/connections.md" <<EOF
# 本仓库的开发数据库连接（仅本机，勿提交）

| 库 | 地址 | 库名 | 用户 | 密码 |
|---|---|---|---|---|
| MySQL 8.0.18（PolarDB 基线，polardb profile） | 127.0.0.1:23318 | eqts | root | $mysql_password |
| MySQL 8.4 | 127.0.0.1:23306 | eqts | root | $mysql_password |
| PostgreSQL 17 | 127.0.0.1:25432 | eqts | postgres | $pg_password |

实库测试的环境变量在 .local/db.env（EQTS_*）。
启停：bash infra/dev/db.sh up -d ｜ bash infra/dev/db.sh stop
EOF
  echo "created $env_file and $local_dir/connections.md"
fi

exec docker compose -f "$here/compose.yaml" --env-file "$env_file" "$@"
