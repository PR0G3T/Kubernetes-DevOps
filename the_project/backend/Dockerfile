FROM node:20-alpine as deps
WORKDIR /app
COPY package.json ./
RUN npm ci --only=production --no-audit --no-fund

FROM node:20-alpine
WORKDIR /usr/src/app
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node index.js ./
USER node
ENV PORT=4000
EXPOSE 4000
CMD ["node", "index.js"]


