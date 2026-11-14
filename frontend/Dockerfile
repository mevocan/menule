# Production imajı (Coolify). /qr/[slug] SSR olduğu için Node sunucusu çalışır.
# NUXT_PUBLIC_API_BASE ve NUXT_PUBLIC_SITE_URL çalışma anında okunur (build değişkeni gerekmez).

FROM node:22-slim AS build
WORKDIR /app

# postinstall (nuxt prepare) kaynak kod gelmeden çalışamaz; build zaten hazırlar.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY --from=build /app/.output ./.output
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
