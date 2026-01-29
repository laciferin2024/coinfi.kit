# Stage 1: Build
FROM node:25-alpine as builder

RUN apk add --no-cache git bash 

# Install Bun (git is already present in buildpack-deps for version tagging)

RUN npm i -g bun

WORKDIR /app

COPY . .

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source files

# Build the project
# Force adapter-auto to emit adapter-node output in Docker builds
ENV GCP_BUILDPACKS=1
RUN bun run build

# Stage 2: Production (lightweight)
FROM oven/bun:alpine AS production

WORKDIR /app

# Enable production mode
ENV NODE_ENV=production
ENV ADAPTER_MODE=node

# Copy built assets and production-ready node_modules from builder stage
# We use the built output from adapter-node
# COPY --from=builder /app/package.json /app/bun.lock ./
COPY --from=builder /app/build ./build
# COPY --from=builder /app/node_modules ./node_modules/

# Run SvelteKit build server
EXPOSE 80
ENV PORT=80

CMD ["bun", "run", "build/index.js"]

LABEL maintainer="Hiro <laciferin@gmail.com>"
