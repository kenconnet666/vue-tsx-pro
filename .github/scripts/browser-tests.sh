# 用法：bash .github/scripts/browser-tests.sh <应用目录> <分片，如 1/3>
# 跑一个应用的浏览器测试；浏览器会话没连上（整个浏览器实例没跑、页面连不上测试服务器）时整步重跑一次，用例失败照常算失败。
# 测试文件比分片少时有的分片分不到文件，不算失败
set -o pipefail
dir=$1
shard=$2
pnpm -C "$dir" test:browser --shard="$shard" --passWithNoTests 2>&1 | tee browser.log && exit 0
# 两种说法都是整个浏览器实例没连上：会话没建起来，或者页面一分钟都没连上测试服务器（Windows 上偶尔有）
grep -q -E "Failed to connect to the browser session|Cannot connect to the server in [0-9]+ seconds" browser.log || exit 1
echo "::warning::浏览器会话没连上，整步重跑一次"
pnpm -C "$dir" test:browser --shard="$shard" --passWithNoTests
