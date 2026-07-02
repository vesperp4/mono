# Build from the repo root so pnpm can resolve the workspace:
#   docker build -f apps/tv/engine/Dockerfile .
FROM node:20-alpine AS base
RUN corepack enable

FROM base AS build
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/tv/engine ./apps/tv/engine
RUN pnpm install --frozen-lockfile --filter tv-engine...
RUN pnpm --filter tv-engine build
# Standalone deployable bundle (prod deps + dist only). --legacy: pnpm v10
# requires inject-workspace-packages otherwise; tv-engine has no runtime
# workspace deps, so legacy copy-deploy is correct.
RUN pnpm --filter tv-engine --prod deploy --legacy /out

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /out ./
USER app
EXPOSE 8080
CMD ["node", "dist/index.js"]
