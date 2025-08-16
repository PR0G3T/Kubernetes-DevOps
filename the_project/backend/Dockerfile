FROM node:20-alpine

WORKDIR /usr/src/app

COPY --chown=node:node index.js ./

USER node

ENV PORT=4000

EXPOSE 4000

CMD ["node", "index.js"]


