#!/bin/sh
# nginx 镜像启动前执行（/docker-entrypoint.d/）：挂进了证书（/etc/nginx/certs 下的 fullchain.pem、privkey.pem）就再开 443。
# 没挂证书时什么都不做，镜像照旧只在 80 上提供（本机试跑、前面有网关时）。
set -eu

certs=/etc/nginx/certs
if [ ! -f "$certs/fullchain.pem" ] || [ ! -f "$certs/privkey.pem" ]; then
    echo "docs-tls: 没有证书，只开 80"
    exit 0
fi

cat > /etc/nginx/conf.d/tls.conf <<'CONF'
server {
    listen 443 ssl;
    http2 on;
    server_name _;
    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    # 用 http:// 访问了这个端口：转到 https 的同一个地址（$http_host 带着对外的端口）
    error_page 497 =301 https://$http_host$request_uri;
    include /etc/nginx/docs-site.conf;
}
CONF
echo "docs-tls: 有证书，开 443"
