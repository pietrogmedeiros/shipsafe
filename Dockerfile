# --- deps ---
FROM node:22-alpine AS deps
# libc6-compat helps native prebuilt binaries (swc, tailwind oxide) on musl.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
# Prefer reproducible ci; fall back to install if the lockfile drifts so the
# build never hard-fails on a lockfile sync mismatch.
RUN npm ci --no-audit --no-fund || (echo "npm ci failed, falling back to npm install" && npm install --no-audit --no-fund)

# --- build ---
FROM node:22-alpine AS build
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- run (standalone) ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
