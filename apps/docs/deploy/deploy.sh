#!/usr/bin/env bash
# 文档站镜像的构建、导出与本机试跑。在 Linux 或 WSL 里执行：
#   bash apps/docs/deploy/deploy.sh build   构建镜像（标签是当前提交的短哈希，机器上没有 git 时用时间；同时打 latest）
#   bash apps/docs/deploy/deploy.sh pack    打包成可上传的文件夹 apps/docs/deploy/dist/vue-tsx-pro-docs/（镜像、compose.yaml、说明）
#   bash apps/docs/deploy/deploy.sh run     本机用 8080 端口试跑，Ctrl+C 退出
# 可用环境变量：
#   TAG             镜像标签，默认当前提交的短哈希（没有 git 时是 yyyyMMddHHmm）；pack、run 默认用最近一次 build 的标签
#   IMAGE_REGISTRY  node、nginx 基础镜像的来源，默认 docker.m.daocloud.io/library（Docker Hub 的国内镜像）
#   NPM_REGISTRY    npm 依赖的来源，默认 https://registry.npmjs.org/
set -euo pipefail

cd "$(dirname "$0")/../../.."

IMAGE=vue-tsx-pro-docs
DIST=apps/docs/deploy/dist
PACK=${DIST}/${IMAGE}
LAST_TAG=${DIST}/.last-tag

build_args=()
[[ -n "${IMAGE_REGISTRY:-}" ]] && build_args+=(--build-arg "IMAGE_REGISTRY=${IMAGE_REGISTRY}")
[[ -n "${NPM_REGISTRY:-}" ]] && build_args+=(--build-arg "NPM_REGISTRY=${NPM_REGISTRY}")

new_tag() {
  git -c safe.directory='*' rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M
}

case "${1:-}" in
  build)
    TAG=${TAG:-$(new_tag)}
    docker build "${build_args[@]}" -f apps/docs/deploy/Dockerfile -t "${IMAGE}:${TAG}" -t "${IMAGE}:latest" .
    mkdir -p "${DIST}"
    echo "${TAG}" > "${LAST_TAG}"
    echo "已构建 ${IMAGE}:${TAG}"
    ;;
  pack)
    TAG=${TAG:-$(cat "${LAST_TAG}" 2>/dev/null || new_tag)}
    docker image inspect "${IMAGE}:${TAG}" > /dev/null
    rm -rf "${PACK}"
    mkdir -p "${PACK}"
    docker save "${IMAGE}:${TAG}" | gzip > "${PACK}/image.tar.gz"
    # 服务器上的 compose 固定到这个标签，回滚时换回旧标签即可
    sed "s|${IMAGE}:latest|${IMAGE}:${TAG}|" apps/docs/deploy/compose.yaml > "${PACK}/compose.yaml"
    cat > "${PACK}/README.txt" <<TXT
文档站 ${IMAGE}:${TAG}

部署（在这个目录里执行）：
  docker load -i image.tar.gz && docker compose up -d

验证：
  curl -i http://localhost:8080/healthz      返回 200 ok
  docker compose ps                          状态是 healthy

停止：docker compose down
回滚：把 compose.yaml 里的 image 改成旧标签（docker images 能看到加载过的标签），再 docker compose up -d
端口：compose.yaml 里的 8080:80，改左边的数字
TXT
    ls -lh "${PACK}"
    ;;
  run)
    TAG=${TAG:-$(cat "${LAST_TAG}" 2>/dev/null || new_tag)}
    docker run --rm -p 8080:80 --name "${IMAGE}-try" "${IMAGE}:${TAG}"
    ;;
  *)
    echo "用法：$0 <build|pack|run>" >&2
    exit 1
    ;;
esac
