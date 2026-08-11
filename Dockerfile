FROM node:20-alpine AS base
WORKDIR /app

# Prisma's query engine needs OpenSSL, which node:20-alpine doesn't ship by default.
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/server.js"]
