# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app

# No dependencies are needed for this simple app
COPY index.js ./

USER node

CMD ["node", "index.js"]


