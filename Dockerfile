FROM nginx:alpine
LABEL authors="Nils Witt"
LABEL description="Nginx with a custom configuration for serving static files"

COPY dist  /usr/share/nginx/html

