FROM node:20-alpine

WORKDIR /usr/src/app

COPY --chown=node:node index.js ./

USER node

ENV PORT=3000

EXPOSE 3000

CMD ["node", "index.js"]


