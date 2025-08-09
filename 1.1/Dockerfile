# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /usr/src/app

# Only source is needed; no external dependencies
COPY src ./src

CMD ["node", "src/index.js"]


