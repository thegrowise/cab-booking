# Nuxt SPA → Node (Nitro). NUXT_PUBLIC_* from docker compose env at runtime.
FROM node:20-alpine AS builder
WORKDIR /app

ENV NUXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=development

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=80
ENV NUXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/.output ./.output

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||80)).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

USER node
CMD ["node", ".output/server/index.mjs"]
