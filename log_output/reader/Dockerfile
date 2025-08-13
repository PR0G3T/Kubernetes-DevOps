FROM node:20-alpine

WORKDIR /usr/src/app

COPY --chown=node:node index.js ./

USER node

ENV PORT=8080
ENV LOG_FILE_PATH=/data/log.txt

EXPOSE 8080

CMD ["node", "index.js"]


