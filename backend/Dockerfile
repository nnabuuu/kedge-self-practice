FROM --platform=linux/amd64 node:20.18.3

RUN apt-get update && apt-get install -y supervisor

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 8718
WORKDIR /
COPY .env /

WORKDIR /
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

WORKDIR /dist/packages/
COPY ./dist/packages/ .

WORKDIR /dist/packages/apps/api-server

CMD ["node", "/dist/packages/apps/api-server/main.js"]


# CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]




