# syntax=docker/dockerfile:1.7

# ---------------------------------------------------------------------------
# Fase 1: build della PWA
# Il contesto e' la radice del monorepo, perche' il pacchetto @tempra/core
# viene consumato come sorgente condiviso.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# I manifest si copiano da soli per primi: finche' non cambiano,
# lo strato con le dipendenze resta in cache.
COPY package.json package-lock.json* ./
COPY packages/core/package.json packages/core/
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/

RUN npm ci --workspace=@tempra/web --workspace=@tempra/core --include-workspace-root

COPY packages/core packages/core
COPY apps/web apps/web

# L'indirizzo dell'API entra nel bundle in fase di build.
# Se resta vuoto, l'applicazione funziona senza sincronizzazione.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build --workspace=@tempra/web

# ---------------------------------------------------------------------------
# Fase 2: servizio statico
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

RUN rm /etc/nginx/conf.d/default.conf

# L'immagine nginx sostituisce le variabili nei file sotto /etc/nginx/templates
# all'avvio del container, e scrive il risultato in /etc/nginx/conf.d.
# Serve per iniettare l'origine dell'API nella Content-Security-Policy, che
# cambia da installazione a installazione.
COPY apps/web/templates/tempra.conf.template /etc/nginx/templates/tempra.conf.template

# Origine dell'API ammessa da connect-src. Vuota se non si usa la sincronizzazione.
ENV API_ORIGIN=""
ENV NGINX_ENVSUBST_TEMPLATE_SUFFIX=".template" 
# La proprieta' si imposta durante la copia: un chown ricorsivo successivo
# duplicherebbe in un secondo livello i 26 MB di immagini degli esercizi.
COPY --chown=nginx:nginx --from=build /app/apps/web/dist /usr/share/nginx/html

# Nginx gira come utente non privilegiato: la porta 8080 non richiede root.
RUN touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid \
    && chown -R nginx:nginx /var/cache/nginx /etc/nginx/conf.d

# Il processo gira come utente non privilegiato: il punto di ingresso
# dell'immagine scrive la configurazione generata in /etc/nginx/conf.d, che
# sopra viene reso scrivibile da nginx.
USER nginx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
