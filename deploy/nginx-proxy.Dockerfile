FROM nginx:1.30-alpine

COPY deploy/nginx-proxy.conf /etc/nginx/conf.d/default.conf
