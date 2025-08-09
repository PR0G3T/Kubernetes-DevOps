FROM node:20-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm i --only=prod
COPY src ./src
ENV PORT=3000
EXPOSE 3000
CMD ["npm","start"]


