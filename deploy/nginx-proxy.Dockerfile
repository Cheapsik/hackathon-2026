FROM nginx:1.30-alpine

COPY deploy/nginx-proxy.conf /etc/nginx/templates/default.conf.template
