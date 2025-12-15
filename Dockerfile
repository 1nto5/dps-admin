# Bun-based build (using bun:sqlite)
FROM oven/bun:1 AS builder

WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bun run build

# Production stage - also Bun
FROM oven/bun:1-slim

WORKDIR /app

# Copy package files and install production deps
COPY package.json bun.lock* ./
RUN bun install --production --frozen-lockfile

# Copy built app from builder
COPY --from=builder /app/build ./build

# Copy migrations for auto-migration on startup
COPY --from=builder /app/drizzle ./drizzle

# Create data directory for SQLite
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "build/index.js"]
