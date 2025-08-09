# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app

COPY index.js ./

USER node

EXPOSE 3000

CMD ["node", "index.js"]


