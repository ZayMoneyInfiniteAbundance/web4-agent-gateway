# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output and scripts
COPY --from=builder /app/dist ./dist
COPY scripts/ ./scripts/

# Create persistent data directory and public asset directory
RUN mkdir -p /app/data /app/logs /app/public

# Security: Run as non-root user
RUN addgroup -S gateway && adduser -S gateway -G gateway
RUN chown -R gateway:gateway /app
USER gateway

# Railway injects PORT automatically
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/index.js"]
