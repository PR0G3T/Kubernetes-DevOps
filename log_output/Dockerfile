FROM node:20-alpine

WORKDIR /usr/src/app

# Only index.js is needed; no dependencies
COPY --chown=node:node index.js ./

USER node

ENV LOG_INTERVAL_MS=5000

CMD ["node", "index.js"]

