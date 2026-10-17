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

- NutriPro: `npm test` 58/58, `npm run test:browser` 16/16. Smoke con Chromium
  sulla landing reale: nessuna violazione CSP, waitlist 200, `/app/` → `/app/login`.
- Immagine Docker costruita e avviata: gira come utente `node`, il volume `/data`
  è scrivibile e la candidatura sopravvive al riavvio del container.
- Repo `JirachiBotOrchestrator` (commit locale `6692071`, non pushato): Dockerfile
  con stadio `landing` e `/data`, Compose con volume `nutripro-data`, proxy senza
  CSP propria (le CSP si intersecano e bloccherebbero i font della landing),
  `smoke-auth.sh` aggiornato, README. Immagine costruita con quel Dockerfile e
  smoke passato in un container Linux; `test-deploy-guard.sh` 26/26.
- Rimossi i file Cloudflare (Functions, D1, wrangler). `CONTACT_EMAIL` è ora un
  parametro di build (vuoto = nessun contatto mostrato). Una PWA installata che
  apre la radice viene portata a `/app/`.

## Da fare per chiudere

- **Ordine di rilascio**: push dell'Orchestrator su `main` (aggiorna il proxy),
  poi push di NutriPro su `dev` (CI → deploy con il nuovo Dockerfile).
- Il volume `nutripro-data` va incluso nei backup di Hermes.
- Completare «Titolare del trattamento» in `privacy/index.html` e impostare
  `CONTACT_EMAIL` e `SITE_URL` reali con il dominio definitivo.
- Rollback: gli SHA precedenti alla landing non si costruiscono con il nuovo Dockerfile.
- Verificare sul dominio pubblico dopo il deploy; l'accesso Google resta una
  verifica manuale.
