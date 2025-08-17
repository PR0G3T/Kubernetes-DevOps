FROM node:20-alpine as deps
WORKDIR /app
COPY package.json ./
RUN npm ci --only=production --no-audit --no-fund

FROM node:20-alpine
WORKDIR /usr/src/app
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node index.js ./
USER node
ENV NATS_URL=
ENV BROADCAST_URL=
CMD ["node", "index.js"]


