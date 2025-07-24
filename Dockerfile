FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files for both client and server
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN cd client && npm ci --only=production
RUN cd server && npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/client/node_modules ./client/node_modules
COPY client ./client

RUN cd client && npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 user

COPY --from=deps /app/server/node_modules ./server/node_modules
COPY server ./server

COPY --from=builder /app/client/dist ./client/dist

RUN mkdir -p /app/server/attachments
RUN chown user:nodejs /app/server/attachments

RUN mkdir -p /app/server/data
RUN touch /app/server/data/database.sqlite
RUN chown -R user:nodejs /app/server/data

USER user

EXPOSE 3000

ENV PORT=3000
ENV CLIENT_URL="http://localhost:3000"

CMD ["node", "server/src/app.js"]
