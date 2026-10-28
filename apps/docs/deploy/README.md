# 文档站部署

文档站是纯静态页面（路由用 history 模式），镜像里由 nginx 提供，没有后端。

| 文件                      | 作用                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Dockerfile`              | 两阶段构建：node 里构建静态页面，nginx 提供。构建上下文是仓库根目录                                                                              |
| `Dockerfile.dockerignore` | 构建上下文里排除 `node_modules`、`dist` 等                                                                                                       |
| `nginx.conf`              | 80 端口的 server：容器里的健康检查、本机试跑、前面有反向代理时用                                                                                 |
| `site.conf`               | 站点本身（80、443 共用）：`/assets/` 长期缓存；入口页不缓存；没有对应文件的地址回到 `index.html`（`/frame/...` 等路由靠它）；`/healthz` 健康检查 |
| `tls.sh`                  | 容器启动时执行：挂进了证书就生成 443 的 server（用 http 访问这个端口时转到 https），没挂就只开 80                                                |
| `deploy.sh`               | `build` 构建、`pack` 打包成可上传的文件夹、`run` 本机试跑                                                                                        |
| `compose.yaml`            | 服务器上运行用（`pack` 会固定镜像标签后放进上传文件夹）                                                                                          |

## 在本机（WSL）构建并打包

在仓库根目录执行：

```bash
bash apps/docs/deploy/deploy.sh build
bash apps/docs/deploy/deploy.sh pack
```

`pack` 生成文件夹 `apps/docs/deploy/dist/vue-tsx-pro-docs/`（该目录已被 git 忽略），里面是：

| 文件           | 作用                                                                           |
| -------------- | ------------------------------------------------------------------------------ |
| `image.tar.gz` | 镜像（标签是当前提交的短哈希，WSL 里没装 git 时用构建时间，如 `202610261615`） |
| `compose.yaml` | 固定到这个标签的运行配置                                                       |
| `README.txt`   | 服务器上要执行的命令                                                           |

标签想用提交哈希，在 Windows 里取了传进去：`TAG=$(git rev-parse --short HEAD)`。工作区有未提交的改动时，镜像里是**带着这些改动**构建的，发布前先提交，或者用 `TAG=xxx` 自己指定标签。

本机试跑：`bash apps/docs/deploy/deploy.sh run`，浏览器打开 http://localhost:8080。

在 Windows 里调用 WSL：

```powershell
wsl -d Debian --exec bash -c "cd /mnt/c/Users/Administrator/IdeaProjects/vue-tsx-pro && bash apps/docs/deploy/deploy.sh build && bash apps/docs/deploy/deploy.sh pack"
```

网络相关的两个环境变量（构建在国内网络时）：

- `IMAGE_REGISTRY`：node、nginx 基础镜像的来源，默认 `docker.m.daocloud.io/library`。能直连 Docker Hub 时设成 `docker.io/library`。
- `NPM_REGISTRY`：依赖下载源，默认 `https://registry.npmjs.org/`。`pnpm-lock.yaml` 里只有校验值，换成 `https://registry.npmmirror.com/` 不影响结果。

## 发布到云服务器

1. 把整个 `vue-tsx-pro-docs` 文件夹上传到服务器。
2. 在服务器上：

   ```bash
   cd vue-tsx-pro-docs
   docker load -i image.tar.gz && docker compose up -d
   ```

3. 验证：`docker compose ps` 显示 healthy；`docker compose logs docs | grep docs-tls` 是"有证书，开 443"；浏览器打开 `https://<域名>:8443`。

对外只开 HTTPS：端口 `8443`，证书从 `/root/cert/america.zerodep.dpdns.org/` 读 `fullchain.pem`、`privkey.pem`（与流程引擎的示例站点共用同一张证书，示例站点占着 443）。要改的话在上传的目录里建 `.env`：`DOCS_HTTPS_PORT=8443`、`DOCS_CERT_DIR=/root/cert/<域名>`。容器内存限制 64MB。换了证书后 `docker compose restart`。

更新：重新 `build`、`pack`，上传覆盖，再执行同样的命令（`docker compose up -d` 会用新镜像重建容器）。
