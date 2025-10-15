FROM node:alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build


FROM nginx:alpine
LABEL authors="Nils Witt"
LABEL description="Nginx with a custom configuration for serving static files"

COPY --from=builder /app/dist  /usr/share/nginx/html

