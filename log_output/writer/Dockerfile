FROM node:20-alpine

WORKDIR /usr/src/app

COPY --chown=node:node index.js ./

USER node

ENV LOG_INTERVAL_MS=5000
ENV LOG_FILE_PATH=/data/log.txt

CMD ["node", "index.js"]


