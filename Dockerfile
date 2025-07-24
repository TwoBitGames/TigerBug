FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY client/package.json ./client/
COPY server/package.json ./server/

RUN cd client && npm install --only=production
RUN cd server && npm install

FROM base AS builder
WORKDIR /app
COPY client ./client

RUN cd client && npm install

RUN cd client && npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=9840

COPY --from=deps /app/server/node_modules ./server/node_modules
COPY server ./server

RUN cd server && npm prune --production

COPY --from=builder /app/client/dist ./client/dist

RUN mkdir -p /app/server/data/attachments

VOLUME ["/app/server/data"]

EXPOSE 9840

ENV PORT=9840
ENV CLIENT_URL="http://localhost:9840"
ENV UPLOAD_PATH="/app/server/data/attachments"

CMD ["node", "server/src/app.js"]
