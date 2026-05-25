# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

COPY . .

FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

USER appuser

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD node -e "require('http').get('http://127.0.0.1:5001/api/student', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
