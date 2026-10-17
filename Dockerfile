FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev --ignore-scripts
COPY index.html vite.config.js ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM node:22-alpine AS landing
WORKDIR /landing
# Public origin used for canonical URL and SEO. Default is the temporary demo domain.
ARG SITE_URL=https://nutriprobasta.jirachibot.eu
ARG CONTACT_EMAIL=
ENV SITE_URL=$SITE_URL CONTACT_EMAIL=$CONTACT_EMAIL
COPY landing_page_nutripro/package.json landing_page_nutripro/package-lock.json ./
RUN npm ci --include=dev --ignore-scripts
COPY landing_page_nutripro/index.html landing_page_nutripro/vite.config.js ./
COPY landing_page_nutripro/privacy ./privacy
COPY landing_page_nutripro/public ./public
COPY landing_page_nutripro/scripts ./scripts
COPY landing_page_nutripro/src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080 WAITLIST_DB_PATH=/data/waitlist.sqlite
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --chown=node:node server ./server
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=landing --chown=node:node /landing/dist ./landing
# Persistent waitlist database. A named volume mounted here inherits this ownership.
RUN mkdir /data && chown node:node /data
VOLUME /data
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:8080/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/index.cjs"]
