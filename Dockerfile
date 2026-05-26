# syntax=docker/dockerfile:1.6
FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
COPY package.json pnpm-lock.yaml* ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile=false
COPY . .
RUN pnpm build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-lock.yaml* ./
COPY --from=build /app/patches ./patches
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
RUN pnpm install --prod --frozen-lockfile=false
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["pnpm", "start"]
