FROM node:20-alpine

WORKDIR /usr/src/app

COPY --chown=node:node index.js ./

USER node

ENV PORT=8080

EXPOSE 8080

CMD ["node", "index.js"]


