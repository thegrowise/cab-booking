# Nuxt SPA (ssr:false) → static generate → nginx
FROM node:20-alpine AS builder
WORKDIR /app

ENV NUXT_TELEMETRY_DISABLED=1
# Build needs full install (devDependencies); final image is nginx-only
ENV NODE_ENV=development

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG NUXT_PUBLIC_GROWISE_ENV=qc
ARG NUXT_PUBLIC_GROWISE_API_KEY=
ARG NUXT_PUBLIC_DEV_PANEL=false

ENV NUXT_PUBLIC_GROWISE_ENV=$NUXT_PUBLIC_GROWISE_ENV
ENV NUXT_PUBLIC_GROWISE_API_KEY=$NUXT_PUBLIC_GROWISE_API_KEY
ENV NUXT_PUBLIC_DEV_PANEL=$NUXT_PUBLIC_DEV_PANEL

RUN npm run generate

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/.output/public /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=5s \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
