

FROM alpine:3.20 AS builder

WORKDIR /app

COPY . .

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/run /run /var/log/nginx /etc/nginx/conf.d

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1:8080/pages/login.html >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
