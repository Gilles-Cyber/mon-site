FROM node:20-alpine

LABEL maintainer="Gilles Parfait"
LABEL org.opencontainers.image.authors="Gilles Parfait"
LABEL org.opencontainers.image.title="Site de Gilles Parfait"

WORKDIR /app
COPY package.json server.js ./
COPY public ./public

ENV PORT=3000
EXPOSE 3000
USER node
HEALTHCHECK CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "server.js"]
