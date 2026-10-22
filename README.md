# NutriPro

Monorepo di due prodotti distinti che condividono solo il repository:

| Componente | Cartella | Cos'è | Stack | Dove gira |
| :--- | :--- | :--- | :--- | :--- |
| **Landing "Nutrà"** | `landing_page_nutripro/` | Sito pubblico, leggero e ottimizzato per i motori di ricerca; raccoglie la waitlist dei nutrizionisti tester | Vite 6 vanilla + GSAP/Lenis, HTML statico | **Radice** del dominio (`/`), servita dal backend Node |
| **App NutriPro** | `/` (root del repo) | Web app autenticata per il paziente: importa il PDF del piano alimentare, mostra pasti, acqua, spesa, assistente | React 19 + Vite 8, backend Node 22 senza framework | **`/app`** dello stesso dominio, container Docker su Hermes |

Oggi il dominio è `nutriprobasta.jirachibot.eu`, **temporaneo e solo per demo interne**. L'impostazione è pensata per reggere anche con un dominio definitivo: landing pubblica e SEO da una parte, web app autenticata dall'altra, senza codice in comune. Il dominio non è scritto nel codice: vedi [Configurazione](#configurazione-variabili-dambiente).

I due componenti **non condividono codice, dipendenze né build**: vivono nello stesso repo e nello stesso container solo perché oggi il deploy è uno (vedi [Convivenza](#convivenza-app-e-landing)).

---

## Indice

1. [Architettura](#architettura)
2. [Convivenza app e landing](#convivenza-app-e-landing)
3. [Struttura del repository](#struttura-del-repository)
4. [App NutriPro](#app-nutripro)
5. [Landing page](#landing-page-landing_page_nutripro)
6. [Configurazione (variabili d'ambiente)](#configurazione-variabili-dambiente)
7. [Sviluppo locale](#sviluppo-locale)
8. [Test](#test)
9. [CI/CD e deploy](#cicd-e-deploy)
10. [Sicurezza](#sicurezza)
11. [Documentazione di progetto](#documentazione-di-progetto)
12. [Stato e punti aperti](#stato-e-punti-aperti)

---

## Architettura

```mermaid
flowchart LR
  subgraph Browser
    PWA[App React / PWA<br/>pdf.js + localStorage]
    LP[Landing Nutrà<br/>HTML statico]
  end
  subgraph Hermes["Hermes (self-hosted)"]
    Proxy[Reverse proxy] --> Node["Container Node :8080<br/>server/app.cjs"]
    Node --- Vol[("Volume /data<br/>waitlist.sqlite")]
  end
  LP -- "GET /, /privacy/, POST /api/waitlist" --> Proxy
  PWA -- "GET /app/*, /auth/*, /api/*" --> Proxy
  Node -- "OIDC (PKCE)" --> Google[Google Identity]
  Node -- "generateContent (opzionale)" --> Gemini[Gemini API]
```

Un solo processo Node serve entrambi i prodotti, ma con regole diverse:

| Percorso | Contenuto | Auth | CSP |
| :--- | :--- | :--- | :--- |
| `/`, `/privacy/`, `/assets/*`, `/robots.txt`, `/favicon.svg` | Landing (file della sua build, allowlist all'avvio) | no | Landing: solo Google Fonts come origine esterna |
| `POST /api/waitlist` | Candidatura tester | no (Origin + rate limit + honeypot) | - |
| `/app/*` | Shell della web app React | sì (altrimenti `/app/login`) | App: nessuna origine esterna |
| `/auth/*`, `/api/session`, `/api/chat*` | Login Google, sessione, assistente | vedi tabella route | - |
| `/healthz`, `/deploy-version.txt` | Operatività | no | - |

Le vecchie URL dell'app (`/login`, `/plans`, `/chat`, `/settings`, `/index.html`) rispondono con redirect verso `/app/...`.

Principi di progetto dell'app:

- **Il piano alimentare non lascia il browser.** Il PDF è analizzato lato client con `pdf.js`; piani, spunte e acqua stanno in `localStorage`, una chiave per account (`diet_plan_archive:<Google sub>`). Il server conosce solo l'identità, mai il piano.
- **Il backend è minimale e stateful solo in memoria**: autenticazione Google, sessioni, un proxy verso Gemini, file statici. Nessun database.
- **Zero CDN**: JS, CSS, font e worker di pdf.js sono serviti dal backend (la CSP vieta origini esterne).
- **Login obbligatoria**: ogni route dell'app senza sessione valida reindirizza a `/app/login`.

## Convivenza app e landing

**Convivono senza problemi** e restano separabili. Verificato sul codice e sui test:

| Aspetto | Landing | App (root del repo) |
| :--- | :--- | :--- |
| `package.json` / lockfile | `landing_page_nutripro/` | root |
| Build | `vite build` → `landing_page_nutripro/dist/` (base `/`) | `vite build` → `dist/` (base `/app/`) |
| Dove gira | file statici serviti dal backend | stesso backend, route autenticate |
| Brand | Nutrà | NutriPro |
| Target | Nutrizionista (e motori di ricerca) | Paziente |
| JavaScript | pochi KB, nessun framework | React + pdf.js |
| Stato | nessuno lato client; waitlist su SQLite | `localStorage` per account |

Cosa tiene separate le due parti:

- **Asset senza collisioni**: la landing usa `/assets/*`, l'app `/app/assets/*`.
- **CSP diverse**: la landing può chiamare Google Fonts, l'app no. Gli script restano `'self'` in entrambe.
- **Cookie di sessione** `__Host-` con `Path=/`: valgono anche sulla landing ma non vengono mai letti lì. `/auth/*` e `/api/*` sono rimasti alla radice, quindi il redirect OAuth registrato su Google **non cambia**.
- **Nessun import incrociato**: la landing non importa nulla da `src/` e viceversa.
- **Dominio configurabile**: `APP_ORIGIN` (backend) e `SITE_URL` (build della landing) sono parametri, non costanti.

**Ruolo della landing**: acquisizione e SEO. Raccoglie le candidature dei professionisti per la fase di test (nome, email, ruolo, n. pazienti, consenso privacy). Non ha login e non carica nulla dell'app; l'unico legame è il link "Accedi" verso `/app/`.

**Con un dominio definitivo** si può tenere questa impostazione (stesso host, `/` e `/app`) oppure spostare la landing su hosting statico/CDN e lasciare l'app su un sottodominio (`app.dominio.it`). Il codice lo permette: basta servire `landing_page_nutripro/dist` da altrove e impostare `APP_ORIGIN` sull'host dell'app. In quel caso la waitlist va esposta dal backend dell'app o spostata su un servizio dedicato.

## Struttura del repository

```
NutriPro/
├── index.html                 # Shell Vite dell'app (monta #root)
├── vite.config.js             # Vite + plugin React → dist/
├── package.json               # Dipendenze app (React, router, pdfjs, google-auth-library)
├── Dockerfile                 # Build multistadio (build Vite → runtime node:26-alpine)
├── compose.auth.yml           # Esecuzione standalone hardened
├── .env.example               # Modello configurazione (mai committare .env)
├── src/                       # Frontend React
│   ├── main.jsx               # Entry point
│   ├── App.jsx                # Router, Login, Protected (sessione), Home, Piani, Dettaglio
│   ├── components/ChatPage.jsx# Assistente Gemini (/chat)
│   ├── lib/dietEngine.mjs     # Parser PDF, conversioni, lista della spesa
│   ├── lib/planStore.mjs      # Archivio piani per account in localStorage
│   ├── lib/tracking.mjs       # Olio, quantità, step tracking
│   └── *.css
├── public/                    # manifest.webmanifest, icon-512.png (PWA)
├── server/
│   ├── index.cjs              # Bootstrap + graceful shutdown (SIGINT/SIGTERM)
│   ├── app.cjs                # HTTP server: config, auth OIDC, sessioni, CSP, routing, statici
│   ├── gemini.cjs             # Servizio chat Gemini (validazione, rate limit, timeout)
│   └── waitlist.cjs           # Validazione e archivio SQLite della waitlist
├── tests/                     # Unit/integration (*.test.cjs) e browser (*.e2e.cjs)
├── .github/workflows/nutripro-ci-deploy.yml
├── landing_page_nutripro/     # Landing pubblica (vedi sezione dedicata); la build entra nell'immagine Docker
├── .wayfinder/ + WAYFINDER.md # Mappa decisionale e ticket WF-001…WF-020
├── CONTEXT.md                 # Glossario di dominio
└── HANDOFF.md                 # Diario operativo di sessione (storico, 800+ righe)
```

---

## App NutriPro

### Frontend

- **Routing** (React Router 7, `basename="/app"`, Vite `base: '/app/'`): `/app/login`, `/app/` (Home), `/app/plans`, `/app/plans/:id`, `/app/chat`, `/app/settings`.
- **`Protected`** verifica `/api/session` ogni 60 s e a ogni ritorno in primo piano; blocca la UI quando la pagina è nascosta; espelle l'utente su scadenza o cambio account.
- **PDF**: `parseDietPdf` (pdf.js) → struttura per giorno/pasto/alimento, con alternative esplicite, ricette e tabella "Unità di misura" del PDF che prevale sui coefficienti generici.
- **Archivio** (`planStore`): un piano attivo alla volta (o nessuno), piani inattivi consultabili, "sostituzione" distruttiva con doppia conferma. Nessuna sincronizzazione fra dispositivi, nessun PDF originale conservato.
- **Interfaccia**: selettore giorni, card pasti con spunte, water tracker (obiettivo configurabile), calcolatore crudo/cotto, lista della spesa (copia, condividi, `.txt`), layout mobile con tab bar.
- **PWA**: `manifest.webmanifest` + icona. Nessuna cache offline: login e verifica sessione richiedono rete.

### Motore di conversione (dettaglio)

Regole principali applicate al parsing (le quantità restano indicative: confrontare sempre col PDF):

| Alimento | Formato PDF | Conversione |
| :--- | :--- | :--- |
| Cereali (riso, farro, orzo) | cucchiai | 1 cucchiaio = 20 g |
| Couscous | cucchiai | 1 cucchiaio = 10 g |
| Olio EVO | cucchiaini | 1 cucchiaino = 4 g |
| Legumi secchi | cucchiai | 20 g/cucchiaio × 2,5 → peso cotto sgocciolato |
| Piselli freschi | cucchiai | 20 g/cucchiaio |
| Latte | bicchiere | 200 g/ml |
| Fiocchi | bicchiere | 40 g |
| Acqua | bicchiere | 200 ml |

I glifi `½` sono normalizzati; le intestazioni di pasto sono riconosciute solo a riga intera (così "Olio extra vergine" non diventa il pasto "extra"). Test dedicati in `tests/shopping-list.test.cjs`.

### Backend (`server/`)

Server `http` di Node senza framework. Route:

| Route | Metodo | Auth | Scopo |
| :--- | :--- | :--- | :--- |
| `/healthz` | GET | no | Health check (usato dal `HEALTHCHECK` Docker) |
| `/deploy-version.txt` | GET/HEAD | no | SHA del deploy (`NUTRIPRO_SHA`) |
| `/auth/status` | GET | no | Login configurato? |
| `/auth/google` | GET | no | Avvia OIDC (state, nonce, PKCE S256), rate limit |
| `/auth/google/callback` | GET | flusso | Scambio codice, verifica ID token, crea sessione |
| `/api/session` | GET | sì | Identità, token CSRF, scadenza |
| `/auth/logout` | POST | sì + CSRF | Revoca sessione, `Clear-Site-Data: "cache"` |
| `/api/chat/status` | GET | sì | Stato assistente |
| `/api/chat` | POST | sì + CSRF + Origin | Messaggio a Gemini |
| `/app/`, `/app/plans`, `/app/chat`, `/app/settings`, `/app/plans/:id` | GET | sì | Shell SPA (senza sessione → `/app/login`) |
| `/app/assets/*`, `/app/icon-512.png`, `/app/manifest.webmanifest` | GET | no | Statici dell'app da allowlist |
| `/api/waitlist` | POST | no | Candidatura tester (vedi landing) |

**Sessioni**: cookie firmato HMAC-SHA256 (`__Host-nutripro_session` in HTTPS), HttpOnly, durata di default 90 giorni con rinnovo all'uso (max 180). Con `SESSION_SECRET` sopravvivono ai riavvii; senza, ogni restart disconnette tutti (warning a log). La revoca al logout è tenuta in memoria.

**Assistente Gemini** (`gemini.cjs`): modello unico ammesso `gemini-3.5-flash-lite`, **spento di default**. Per attivarlo servono insieme `GEMINI_ENABLED=true`, `GEMINI_API_KEY` e `GEMINI_ACCESS_MODE` (`local-dev` solo su localhost; `paid-services` è la decisione esplicita richiesta per client pubblici in SEE). Nessun piano né dato dell'account viene inviato a Google. Limiti: 5 richieste/min e 30/giorno per account, 120/giorno globali, 4 concorrenti, timeout 20 s, nessun retry; input ≤ 2000 caratteri, cronologia ≤ 20 messaggi / 24000 caratteri. Contatori in memoria (reset al riavvio). Stato: WF-010 aperto, mai verificato con provider reale.

### Container

`Dockerfile` multistadio: stadio `build` (app) + stadio `landing` (landing, con `ARG SITE_URL`) → stadio runtime `node:26-alpine`, solo dipendenze di produzione, utente `node`, porta 8080, `VOLUME /data`, `HEALTHCHECK` su `/healthz`. `compose.auth.yml` (riferimento standalone) aggiunge: bind su `127.0.0.1`, filesystem read-only, `cap_drop: ALL`, `no-new-privileges`, tmpfs su `/tmp`, 128 MB RAM, 0.25 CPU.

---

## Landing page (`landing_page_nutripro/`)

Sito pubblico "Nutrà" per reclutare nutrizionisti tester. Obiettivo: pagina leggera, indicizzabile, indipendente dall'app.

- **Frontend**: Vite 6, JavaScript vanilla a componenti (`src/components/`), GSAP + Lenis per animazioni e scroll, storytelling in `src/story/`, stili CSS per sezione (`src/styles/`). Due pagine: `index.html` e `privacy/index.html`. Lo script di intro è un file (`public/intro-boot.js`), non inline, per rispettare la CSP.
- **Config unica**: `src/config.js` (brand, endpoint, contatti, SEO). `SITE_URL` si imposta alla build (`SITE_URL=https://dominio npm run build`); il default è il dominio demo. Il plugin `brand-html` sostituisce `%BRAND%`, `%SEO_TITLE%`, `%SITE_URL%`… già nell'HTML statico (SEO e no-JS ok).
- **Waitlist**: `POST /api/waitlist` è gestita dal backend Node (`server/waitlist.cjs`). Accetta JSON o form classico (senza JS risponde con redirect a `/?waitlist=ok#tester`), controlla `Origin`, honeypot `website`, rate limit (5/min per IP, 60/min globali), limite di 8 KB. Salva in SQLite (`node:sqlite`, nessuna dipendenza aggiunta); un'email già presente non produce errore e non rivela chi è iscritto.
- **Dati**: file `WAITLIST_DB_PATH` (in Docker `/data/waitlist.sqlite`, **volume persistente**). Se il volume manca, l'app parte lo stesso e solo la waitlist risponde 500.
- **Cloudflare**: la vecchia versione (Pages Functions + D1) è stata rimossa. Il DNS del dominio resta su Cloudflare, ma non serve altro lì.
- **PWA già installate**: la landing le reindirizza a `/app/` se aperte in modalità standalone (`public/intro-boot.js`).

```powershell
cd landing_page_nutripro
npm install
npm run dev      # sviluppo con Vite (solo grafica: /api/waitlist non esiste qui)
npm run build    # → dist/ (usata dal backend in locale e dal Dockerfile)
```

Per vederla **con la waitlist funzionante** in locale: `npm run build` nella landing, poi `npm start` dalla root e apri http://localhost:8080 (landing alla radice, app su `/app/`).

> **Parametri di build**: `SITE_URL` (dominio pubblico) e `CONTACT_EMAIL` (contatto mostrato nel footer e nella privacy; se vuoto non viene mostrato nulla).
>
> **Da fare prima di una pubblicazione definitiva**: completare «Titolare del trattamento» in `privacy/index.html` (ragione sociale, indirizzo: oggi è un segnaposto), impostare `CONTACT_EMAIL` e `SITE_URL` reali, prevedere un backup del volume `/data`.

---

## Configurazione (variabili d'ambiente)

Solo backend (per la landing, `SITE_URL` è un parametro di build). Copiare `.env.example` in `.env` (ignorato da git). Mai committare valori reali.

| Variabile | Obbligatoria | Default | Note |
| :--- | :--- | :--- | :--- |
| `APP_ORIGIN` | sì in prod | `http://localhost:8080` | Origine assoluta senza path; HTTPS obbligatorio fuori da localhost. Base del redirect OAuth e dei controlli Origin. |
| `PORT` | no | `8080` | |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | sì per il login | vuoto | Vanno impostate **entrambe**; client OAuth "Web application". Senza: accesso chiuso. |
| `ALLOWED_EMAILS` | no | vuoto (tutti) | Allowlist di email Google verificate, separate da virgola. |
| `SESSION_TTL_SECONDS` | no | `7776000` (90 gg) | 60 s … 180 gg, rinnovata all'uso. |
| `SESSION_SECRET` | consigliata | casuale a ogni avvio | ≥ 32 caratteri. Senza, i restart disconnettono tutti. Cambiarla disconnette tutti. |
| `TRUST_PROXY` | no | `false` | `true` solo dietro il proxy privato che sovrascrive `X-Real-IP`. |
| `NUTRIPRO_SHA` | no | `unknown` | SHA a 40 hex esposto da `/deploy-version.txt`; impostato dal deploy. |
| `WAITLIST_DB_PATH` | consigliata | `./data/waitlist.sqlite` (Docker: `/data/waitlist.sqlite`) | File SQLite della waitlist. In produzione deve stare su un volume persistente. |
| `LANDING_DIR` | no | `./landing`, poi `landing_page_nutripro/dist` | Cartella con la build della landing. Se assente, `/` risponde 404 e l'app funziona lo stesso. |
| `GEMINI_ENABLED` | no | `false` | |
| `GEMINI_API_KEY` | se attivo | vuoto | Solo server, mai nel client. |
| `GEMINI_MODEL` | no | `gemini-3.5-flash-lite` | Qualsiasi altro valore → `unsupported_model`. |
| `GEMINI_ACCESS_MODE` | se attivo | vuoto | `local-dev` o `paid-services`. |

OAuth: registrare il redirect `{APP_ORIGIN}/auth/google/callback`. In produzione `https://nutriprobasta.jirachibot.eu/auth/google/callback`. Con il progetto Google in *Testing*, aggiungere gli account di test nella schermata Audience.

## Sviluppo locale

Requisiti: Node ≥ 22.14.

```powershell
npm ci --ignore-scripts
Copy-Item .env.example .env      # poi compilare le credenziali Google
npm start                        # build app + server su http://localhost:8080 (app su /app/)
npm run dev                      # (altro terminale) rebuild in watch; ricaricare il browser
```

Per vedere anche la landing: `npm run build --prefix landing_page_nutripro` una volta. Un server statico non basta: la login richiede il backend. Senza credenziali la pagina di login segnala "accesso non disponibile" e la home resta chiusa.

Docker standalone: `docker compose -f compose.auth.yml up --build -d` (monta il volume `waitlist-data` su `/data`). Per un dominio diverso dal demo: `docker build --build-arg SITE_URL=https://dominio --build-arg CONTACT_EMAIL=info@dominio .`

## Test

```powershell
npm test               # build + unit/integration (58 test: spesa, auth, piani, gemini, chat, settings, landing/waitlist)
npm run test:browser   # E2E Playwright (login, spesa, piani, import PDF, chat, mobile, settings)
```

- I test di login simulano il provider Google ma usano server e cookie reali; un test a parte verifica firme RSA con la libreria Google. La verifica con un progetto Google reale resta necessaria prima dell'attivazione.
- I test browser leggono `PLAYWRIGHT_MODULE` (percorso del modulo Playwright, installato fuori dal repo; la CI usa `playwright@1.61.1`).
- `tests/reference-pdf.e2e.cjs` richiede un PDF privato (`REFERENCE_PDF`), **non** è in CI: da eseguire a mano prima di toccare il parser.
- La landing è coperta lato server (`tests/landing.test.cjs`: file serviti, CSP, redirect, waitlist). Il suo front-end non ha test.

## CI/CD e deploy

Workflow `.github/workflows/nutripro-ci-deploy.yml`, su **push a `dev`**:

1. **test**: `npm ci` → build della landing → `npm test` → installa Playwright/Chromium → `npm run test:browser`. Azioni fissate per SHA.
2. **deploy** (solo se i test passano, solo su `dev` del repo ufficiale, environment `nutripro-deploy`): verifica che lo SHA appartenga a `dev`, poi lancia `deploy-nutripro.yml` nel repo `Thegoldendice/JirachiBotOrchestrator`, che gira sul runner self-hosted di Hermes, prende un lock host-wide e rifiuta di sostituire un commit più recente.

Requisiti: secret `ORCHESTRATOR_DISPATCH_TOKEN` (PAT fine-grained limitato al repo Orchestrator, solo *Actions: read and write*). Credenziali di produzione fuori dal clone: `/home/hermes/.config/nutripro/auth.env`. Il proxy deve puntare al container Node sulla porta 8080 (il vecchio nginx sulla 80 non è compatibile).

**Flusso di branch**: si lavora su `dev` (che deploya); `main` riceve `dev` con fast-forward quando si vuole fissare una release. Il push su `main` **non** deploya.

La landing **non ha un deploy separato**: la sua build entra nell'immagine Docker (stadio `landing` del `Dockerfile`) e va online con l'app. **Deploy su Hermes**: il Dockerfile e il Compose usati davvero stanno nel repo `JirachiBotOrchestrator` (`services/nutripro/`), con il volume `nutripro-data` su `/data` (va incluso nei backup). Il proxy non aggiunge una CSP propria: la emette il backend per percorso. Ordine di rilascio: prima l'Orchestrator, poi il push su `dev` di NutriPro.

## Sicurezza

- **OIDC hardened**: state, nonce, PKCE S256, flusso monouso, verifica di firma/aud/iss/exp/`email_verified`, `sub` come chiave identità, rate limit per tentativi di login e callback concorrenti.
- **Cookie** `__Host-` (Secure, HttpOnly, Path=/) in HTTPS; CSRF token per le POST + controllo `Origin`.
- **CSP stretta**: `default-src 'self'`, niente script/stili inline né origini esterne, `object-src 'none'`, `frame-ancestors 'self'`. Header aggiuntivi: `nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy` che nega camera/microfono/geolocalizzazione, `Cache-Control: no-store`.
- **Privacy dati**: il piano non viene mai inviato al server né a Google; `localStorage` è leggibile da chiunque usi il profilo del browser (limite noto, documentato).
- **Segreti**: solo via env, mai nel client né nel repo; log senza token/codici/dati personali.
- **Container** non-root, read-only, senza capability.

## Documentazione di progetto

| File | Contenuto |
| :--- | :--- |
| [CONTEXT.md](CONTEXT.md) | Glossario di dominio (Piano attivo/inattivo, Sostituzione, Account Google, Sessione, …) |
| [WAYFINDER.md](WAYFINDER.md) + [.wayfinder/](.wayfinder/TRACKER.md) | Mappa decisionale e 20 ticket (WF-001…WF-020): login, archivio, Gemini, settaggi, tracking, PWA |
| [HANDOFF.md](HANDOFF.md) | Diario cronologico delle sessioni e dei rilasci; fonte storica, le sezioni più recenti prevalgono |

## Stato e punti aperti

- **Dominio**: `nutriprobasta.jirachibot.eu` è temporaneo (demo interne). Con il dominio vero impostare `APP_ORIGIN`, `SITE_URL` (build arg) e il redirect OAuth.
- **Landing**: «Titolare del trattamento» nella privacy è un segnaposto, `CONTACT_EMAIL` non impostato (nessun contatto mostrato), nessun backup del volume `/data`, nessun test del front-end. Decisione brand Nutrà vs NutriPro da prendere.
- **PWA già installate**: avevano `start_url` `/`; la landing le reindirizza a `/app/`, ma conviene reinstallarle da `/app/`.
- **Rollback**: gli SHA precedenti alla landing non si costruiscono con il Dockerfile attuale dell'Orchestrator (richiede `landing_page_nutripro/`).
- **Gemini (WF-010)**: aperto. Ultimo run CI: test ok ma richiesta di deploy fallita (causa non diagnosticata, vedi HANDOFF). Nessuna verifica con provider reale; attivazione pubblica richiede decisione sul tier a pagamento.
- **CI**: la condizione del job deploy è vincolata a `M4nu0w2/M4nu0w2.github.io`; il PDF reale non è coperto.
- **Dati**: nessun backup/sincronizzazione; perdere il browser significa perdere i piani.
- **Sessioni**: revoca e rate limit in memoria, non scalano oltre una singola istanza.

## Licenza

MIT.
