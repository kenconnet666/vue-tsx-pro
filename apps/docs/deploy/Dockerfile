# 文档站镜像：构建出静态页面，由 nginx 提供。构建上下文是仓库根目录：
#   docker build -f apps/docs/deploy/Dockerfile -t vue-tsx-pro-docs .
# 日常用 deploy.sh，不必手敲。
ARG IMAGE_REGISTRY=docker.m.daocloud.io/library

FROM ${IMAGE_REGISTRY}/node:24-slim AS build
# 依赖从这个源下载；pnpm-lock.yaml 里只有校验值，换成镜像源（例如 https://registry.npmmirror.com/）不影响结果
ARG NPM_REGISTRY=https://registry.npmjs.org/
ENV npm_config_registry=${NPM_REGISTRY} \
    CI=true
WORKDIR /repo
# 版本与根 package.json 的 packageManager 一致
RUN npm install -g pnpm@12.14.0

# 先只按锁文件取依赖：源码改了，这一层仍然命中缓存
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch

COPY . .
RUN pnpm install --offline --frozen-lockfile --filter @vue-tsx-pro/docs...
RUN pnpm --filter @vue-tsx-pro/docs build

FROM ${IMAGE_REGISTRY}/nginx:1.27-alpine
COPY apps/docs/deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/docs/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
