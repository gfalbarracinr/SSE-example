FROM node:24-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY server ./server
COPY UI ./UI

USER node

EXPOSE 3000

CMD ["npm", "run", "start"]
