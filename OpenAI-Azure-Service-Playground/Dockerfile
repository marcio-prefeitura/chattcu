FROM nginx:1.23.3-alpine
EXPOSE 80
RUN apk add -U tzdata && cp /usr/share/zoneinfo/Brazil/East /etc/localtime
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY build /usr/share/nginx/html