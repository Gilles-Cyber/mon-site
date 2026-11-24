# --- Ã‰tape 1 : construire l'application mÃ©tÃ©o (React + Vite) ---
FROM node:20-alpine AS build
WORKDIR /meteo
COPY meteo/package.json ./
RUN npm install
COPY meteo/ ./
RUN npm run build

# --- Ã‰tape 2 : serveur final (Node, sans dÃ©pendance) ---
FROM node:20-alpine

LABEL maintainer="Gilles Parfait"
LABEL org.opencontainers.image.authors="Gilles Parfait"
LABEL org.opencontainers.image.title="MÃ©tÃ©o vivante + site de Gilles Parfait"

WORKDIR /app
COPY package.json server.js ./
COPY public ./public
# L'application mÃ©tÃ©o construite devient la page d'accueil
COPY --from=build /meteo/dist ./public

ENV PORT=3000
EXPOSE 3000
USER node
HEALTHCHECK CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "server.js"]
