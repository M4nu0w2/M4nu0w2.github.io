---
id: WF-022
title: Landing alla radice del dominio, web app autenticata sotto /app
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: open
assignee: claude
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Landing alla radice del dominio, web app autenticata sotto /app

## Requirement comment

2026-10-17 — richiesta in sessione (PO). La landing page "Nutrà" deve stare
sul dominio base e la web app NutriPro sotto `/app`. Il dominio
`nutriprobasta.jirachibot.eu` è **temporaneo, solo per demo interne**, ma
l'impostazione deve valere anche con un dominio definitivo: una web app
autenticata per la parte applicativa e, a parte, un front-end pubblico molto
leggero e ottimizzato per i motori di ricerca.

Risposte del PO alle domande di fattibilità: il DNS di `jirachibot.eu` è su
Cloudflare; un volume persistente sul container va bene.

## Decisioni prese

- Un solo backend Node serve entrambi: landing statica alla radice, app React
  sotto `/app` (Vite `base: '/app/'`, router `basename="/app"`).
- `/auth/*`, `/api/*`, `/healthz` restano alla radice: il redirect OAuth
  registrato su Google non cambia.
- Waitlist riscritta in Node con SQLite (`node:sqlite`) su volume `/data`;
  sostituisce Cloudflare Pages Functions + D1 (file legacy ancora nel repo).
- CSP separate: landing con solo Google Fonts come origine esterna, app senza.
- Dominio come parametro: `APP_ORIGIN` (runtime) e `SITE_URL` (build arg della
  landing), non costanti nel codice.

## Acceptance criteria

- `/` serve la landing senza sessione; `/app/*` richiede la sessione e
  altrimenti rimanda a `/app/login`.
- Le vecchie URL (`/login`, `/plans`, `/chat`, `/settings`) rimandano a `/app/...`.
- `POST /api/waitlist` valida, controlla Origin, honeypot e rate limit, salva
  una sola volta per email e non rivela i duplicati; senza volume fallisce solo
  la waitlist.
- Landing senza violazioni CSP in Chromium.
- `npm test` e `npm run test:browser` verdi.

## Implementation comment

2026-10-17 — implementazione locale (Claude), non pushata.

- Verifiche: `npm test` 58/58, `npm run test:browser` 16/16, smoke con Chromium
  sulla landing reale (nessuna violazione CSP, waitlist 200, `/app/` → `/app/login`).
- **Non verificato**: la build `docker build` con lo stadio `landing` (daemon
  Docker non attivo sul PC di sviluppo).

## Da fare per chiudere

- Il deploy su Hermes è nel repo `JirachiBotOrchestrator`: va aggiunto il
  **volume persistente su `/data`** al container, altrimenti la waitlist
  risponde 500 (l'app funziona).
- Provare l'immagine Docker (CI/deploy) e la landing sul dominio pubblico.
- Le PWA già installate puntano a `/`: vanno reinstallate da `/app/`.
- `CONTACT_EMAIL` della landing è ancora un segnaposto.
- Decidere se rimuovere `landing_page_nutripro/functions`, `migrations` e
  `wrangler.toml` (legacy Cloudflare).
