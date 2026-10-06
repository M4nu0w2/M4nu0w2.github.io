# HANDOFF — NutriPro ("Piano Nutrizionale — Progeo Medical Converter")






## Gemini key verificata e chat locale attivata - 2026-10-06

PO "ok fatto" conferma completamento dei passaggi progetto/APIkey/billing.
GEMINI_API_KEY presente in .env ignorato, mai stampata. models.list ufficiale
conferma3.7Flash disponibile e una chiamata REST minima restituisce OK.
Configurati nel solo .env locale GEMINI_ENABLED=true, GEMINI_MODEL=gemini-3.7-flash,
GEMINI_ACCESS_MODE=paid-services; serverlocale8080 riavviato. StatusAPIautenticato
HTTP200 enabled/configuredtrue reasonnull. Loginutente locale da rifare.

Le successive chiamate moduloNode/APIapp ottengono503UNAVAILABLE. Messaggio
Google: modelhighdemandtemporaneo. Chiave non invalidata, non cambiare modello
ne aggiungere retryautomatici. Mappatura503unavailable corretta;12testmirati
passati. Una risposta reale attraverso chatApp non ancora confermata: PO puo
provare /chat quandoproviderdisponibile. WF-010 open finche verificata.

Key soltanto locale, NON trasferita suHermes; codiceGemini ancora noncommittato/
pushato/deployato. Produzione invariata2e360a9. Handoffpubblicatosolodocs skipci.
Nessun piano/PDF/identita mandato aGemini, solo prompt artificiale RispondiOK.


## Modello Gemini confermato: Flash - 2026-10-06

PO richiede "Usa flash": modello locale cambiato a `gemini-3.7-flash`,
non Flash-Lite. 12 test backend/API mirati passati. Codice non pushato.
Chiarito: il requisito Paid Services riguarda la fatturazione API del progetto
Google, non un abbonamento per gli utenti NutriPro. Nessun paywall introdotto.
Chiave API, autorizzazione costi/budget e attivazione restano pendenti;
GEMINI_ENABLED resta false, zero chiamate reali o addebiti avviati.


## WF-010 Gemini - base locale preparata, decisioni pendenti - 2026-10-06

PO revoca rinvio e chiede continuare qui con altro ticket: preso WF-010.
Implementazione locale (NON committata/pushata/deployata): /chat React per
sole domande generali, status e POST autenticati + Origin/CSRF, keyserver,
modulo server/gemini.cjs REST generateContent. Default disattivato.
Modello verificato ufficialmente gemini-3.5-flash-lite (pricing Google attuale).
Termini Google ai.google.dev/gemini-api/terms richiedono Paid Services per
API clients disponibili a utenti SEE. Non attivare in pubblico free-tier.

Opzioni config .env.example: GEMINI_API_KEY, GEMINI_ENABLED=false, GEMINI_MODEL,
GEMINI_ACCESS_MODE. local-dev accettato sololocalhost; paid-services richiede
una decisione/configurazione esplicita. Non abilitato billing; nessuna keyGemini
fornita, nessuna chiamata API reale. Non copiare le credenziali OAuth come key.

Frontend src/components/ChatPage.jsx +src/chat.css; cronologia solo memoria,
20 messaggi ebudget24000char con coppievecchie rimosse; niente piani/PDF/account
nel payloadGoogle. Renderingtesto, textarea2000char, timeout30s/manualretry.
Backend5/min30/day/account120/dayglobal4concurrent, timer20s noretries,
128KBbodyJSON10sread; counterprocessmemory resetrestart. Errorisanificati.
API GET/api/chat/status -> {enabled,configured,model,reason}; POST/api/chat
{message,history:[{role:user|model,text}]} -> {text,model}.

Build e56test PASS:44unit/integration +12browser, inclusi8backendGemini,
4routing/chatAPI e4Reactchat; regressioni auth/parser/archive/spesa passate.
Provider simulato, qualita/availability reale non verificate. Reviewsecurity
nessunleak/bypass; bug longreplyhistory corretto. BodyproviderJSON non ha hard
bytecap, endpointGooglefisso emaxOutputTokens1024; futuro hardeningse necessario.
Serverlocale8080 riavviato con questa build, Gemini disattivato. Prodresta2e360a9.

PENDENTI domande PO inviate async: pianoattivooptin vs generalonly; keyprogetto
vsBYOK; disattivato vs alternativafree vspaidbudget. Non sono decisioni approvate.
Preparata solo parte indipendente: generalchatdisattivata. WF-010 open, assignee
codex; non chiudere finche attivazione/verifica reale decise e completate.
Non spacchettare ora evoluzioni non concordate. Changes tracker/docs locali
restano nonpushati; questoHANDOFF pubblicato solo docs [skip ci].


## Prossima sessione: Gemini gratuito e veloce - 2026-10-06

ULTIMA INDICAZIONE PO: "worka" conferma che NutriPro e login Google pubblica
funzionano. WF-008 chiuso nel tracker locale. Prossimo lavoro, nella PROSSIMA
sessione: integrazione Gemini con "versione gratuita turbo", poi divisione
in ulteriori ticket delle evoluzioni. Non implementare Gemini oggi.

Ticket locale creato: `.wayfinder/issues/WF-010-integrazione-gemini.md`, open,
assignee/assignment null, flexible. Prima verificare modello veloce con API
free tier effettivo, quote e condizioni ufficiali; "turbo" non e un ID modello.
Requisito aggiornato prevale sulla precedente indicazione non verificata di
Gemini 3.7 Flash. Non attivare billing o fallback a pagamento automaticamente.
Decisioni contesto piano/dati inviati/credenziale ancora in WF-002/003/004:
risolvere solo quanto necessario alla base, poi spacchettare i ticket successivi
con il PO. Credenziale sul backend, fuori da frontend/Git. WF-005 mantiene
chat nell'app per domande sul piano e nutrizionali generali.

Modifiche tracker WF-008/002/004/010 locali non ancora committate/pushate:
questa sezione HANDOFF conserva la richiesta anche per un nuovo clone.
Nessun codice Gemini, credenziale Gemini o chiamata API aggiunti.


## Stato attuale per la prossima sessione ? 2026-10-06

Questa sezione prevale sulle note storiche successive.

- NutriPro online su https://nutriprobasta.jirachibot.eu/: frontend React 19,
  Vite e React Router, backend Node per login Google. Home e piani protetti.
- SHA codice in produzione: `2e360a99d98faa504a3a6d8b5bd6e097ca7bcf3a`
  (`rework in React`), branch `dev`. Infrastruttura Orchestrator su `main`.
- CI prodotto riuscita: https://github.com/M4nu0w2/M4nu0w2.github.io/actions/runs/37465041973
  Primo deploy fallito per auth.env assente; corretto via SSH autorizzato.
  Deploy finale riuscito: https://github.com/Thegoldendice/JirachiBotOrchestrator/actions/runs/37465867055
- Credenziali sul server in `/home/hermes/.config/nutripro/auth.env`, permessi
  600, proprietario hermes; file fuori dai repository. Non stampare o copiare
  nei log. `.env` locale escluso da Git. Nessun PDF privato committato.
- PO ha aggiunto callback Google pubblico. Verifica HTTP raggiunge la pagina
  Google di accesso: `redirect_uri_mismatch` risolto. **Da confermare dal PO:
  login completa con account reale sul dominio pubblico e uso dei piani.**
  Login reale locale era gi? stata confermata funzionante.
- `/plans`: pagina moderna con ricerca, filtri, schede e stato; `/plans/:id`:
  consultazione in sola lettura, senza cambiare activeId o tracking. WF-009 chiuso.
- Nuovo PDF conserva i precedenti; sostituzione del solo piano attivo con due
  conferme, azzera il suo tracking. Al massimo un piano attivo, anche nessuno.
- Archivio locale `diet_plan_archive:<Google sub>`, dati separati per account e
  tracking per piano. Nessuna sincronizzazione dispositivi o archivio remoto;
  PDF sorgente non conservato. Migrazione delle vecchie chiavi per account
  con backup; chiavi senza account non importate automaticamente.
- Parser/calcoli: `src/lib/dietEngine.mjs`; store: `src/lib/planStore.mjs`;
  UI: `src/App.jsx`, `src/styles.css`. PDF.js e worker inclusi, niente CDN.
- Verifiche: build, 32 unit/integration + 8 browser, smoke HTTP locale e in
  produzione; container healthy, SHA corretto, sessione assente 401,
  pagine private 303 login, documentazione privata 404. Audit zero vulnerabilit?.
- Sviluppo locale: Node >=22.14, `npm ci --ignore-scripts`, `npm start`.
  Browser test: `PLAYWRIGHT_MODULE` punta all'installazione Playwright esistente
  oppure installarlo; `npm test`, `npm run test:browser`. Server locale 8080
  avviato durante questa sessione, durata del processo da verificare al ritorno.
- WF-008 login: mantenere aperto finch? login reale pubblica non ? confermata;
  gli altri ticket Wayfinder e relative assegnazioni restano come nel tracker.
- Regole: italiano Caveman Ultra; commit/push codice solo con richiesta PO;
  HANDOFF sempre commit/push separato `[skip ci]`. Deploy host serializzati con
  lock condiviso e gap 150s, niente interventi di sistema/domotica da questo repo.


## Callback Google pubblico verificato - 2026-10-06

PO conferma aggiunta URI autorizzato. Verifica HTTP dal dominio: OAuth raggiunge
la pagina Google sign-in, redirect_uri_mismatch risolto; auth/statusconfiguredtrue,
deployedSHA2e360a9. Il controllo non completa una login utente reale: il PO puo
ora accedere dal sito e verificarla. Nessun ulteriore deploy necessario.

## Produzione React - 2026-10-06

PO autorizza SSH e configurazione OAuth in produzione. Credenziali locali
trasferite via stdin SSH, mai stampate o committate, nel file esterno
`/home/hermes/.config/nutripro/auth.env` con mode600 ownerhermes.
Deploy rieseguito tramite workflow per SHA2e360a99d98faa504a3a6d8b5bd6e097ca7bcf3a:
https://github.com/Thegoldendice/JirachiBotOrchestrator/actions/runs/37465867055
SUCCESS. Containerhealthy, Reactlogin200, home/plans303login, api/session401,
fileprivati404; healthloginConfiguredtrue, deploy-version SHAcorretto.
Controllo pubblico con User-Agentbrowser; Pythondefault riceve403 dal filtro.
Google effettivamente risponde redirect_uri_mismatch: il PO deve aggiungere al
client OAuth il redirect autorizzato esatto
`https://nutriprobasta.jirachibot.eu/auth/google/callback` nella Google Cloud
Console, mantenendo anche localhost. Nessuna sessione browserconsole accessibile
a Codex. Login Google reale sul dominio ancora da verificare dopo quella modifica.
Non serve altro deploy per aggiungere il redirect nella console.

## Release React - 2026-10-06

PO autorizza commit e push con messaggio `rework in React`.
NutriPro: codice `2e360a99d98faa504a3a6d8b5bd6e097ca7bcf3a`, push riuscito su
`origin/dev`. Orchestrator: supporto runtime/build/proxy
`e8732d1132dfe5edcb4642ee0929d62c1afc8dd1`, push riuscito su `origin/main`
prima del prodotto; gate preserva il proxy legacy finche il backend e pronto.
Verifiche raccolte: 32 test unit/integration, 8 browser, smoke HTTP PASS;
nessuna modifica ai sorgenti dopo i controlli. Segreti/PDF privati/dist esclusi.
CI prodotto avviata, stato iniziale `in_progress`:
https://github.com/M4nu0w2/M4nu0w2.github.io/actions/runs/37465041973
Deploy automatico previsto solo dopo CI verde; esito produzione non ancora
verificato. Nessun deploy manuale. Stato Actions infrastruttura non disponibile
via API da questo ambiente; nessun fallimento osservato.
Questo aggiornamento HANDOFF e pubblicato separatamente con `[skip ci]`.

## Frontend React e pagina piani - 2026-10-06

Richiesta PO: refactor completo in React e pagina moderna per i precedenti.
Implementato localmente su dev, nessun commit/push del codice o deploy:

- React 19, React Router, Vite; login, home, `/plans`, `/plans/:id`.
- Piani: schede responsive, ricerca, filtri, dettaglio readonly, attivazione e
  disattivazione esplicite. WF-009 completato; consultare non muta activeId.
- Parser e calcoli estratti in `src/lib/dietEngine.mjs`, archivio stesso schema
  e chiavi in `src/lib/planStore.mjs`. Migrazione/backups preservati.
- PDF.js e worker inclusi nella build, zero CDN. Server serve solo dist con
  CSP self; tutte le pagine dei piani protette da sessione. Login React.
- Rimossi login.html e assets legacy. Docker multistadio, Node >=22.14.
- Acqua conservata a 200ml/bicchiere, 12=2.4L; shopping tutti giorni iniziali,
  fallback selezione testo e focus ripristinato chiudendo dialogo.
- Build e 32 test unitari/integration + 8 browser passati (40 totali), incluso
  PDF sintetico reale tramite worker, conflitti schede, doppia conferma,
  account separati, mobile/login/logout, esportazione e CSP.
- npm audit: zero vulnerabilita. Docker daemon spento: container non costruito;
  test PDF privato facoltativo non eseguito in questa evolutiva.
- Server locale su http://localhost:8080, richiede nuova login dopo riavvio;
  piani del browser conservati. Script dev: build watch + backend da riavviare
  al cambio dei nomi degli asset.
- Orchestrator aggiornato localmente per build React, preflight asset moderni,
  smoke route protette/hashed assets e CSP senza CDN. Produzione invariata.

Smoke HTTP finale React con OAuth fittizio e SHA controllato: PASS. Home,
piani e dettaglio protetti (303 login), sessione assente 401, asset React200,
file privati404, health configurato e SHA corretto. Nessun deploy.


## Gestione dei piani — 2026-10-06

Il PO conferma login Google reale locale funzionante e richiede di implementare
primo PDF, nuovo piano che archivia senza cancellare il precedente, sostituzione
del piano attivo con doppia conferma, stati attivo/inattivo (uno attivo al massimo)
e ticket separato per consultare lo storico.

Preparato su `dev`, codice non committato o pubblicato:

- `assets/plans.js`: archivio atomico in localStorage per account, identificativi
  stabili, date, activeId, contenuto e tracking distinti per piano. Migrazione una
  volta del precedente piano autenticato, mantenendo le chiavi legacy come backup.
- Menu Gestisci piani: nuovo piano, sostituzione, rendi attivo e disattiva.
  Il PDF viene validato prima della conferma finale; annullamento, quota, PDF
  invalido e revisione cambiata in altra scheda non sovrascrivono il piano.
- Due conferme: prima dell'import e dopo la lettura, con checkbox esplicita.
  La sostituzione mantiene l'identità del piano e azzera il suo tracking dopo avviso.
- WF-001 risolto per questo flusso; WF-009 aperto per consultazione dello storico
  senza riattivazione. Sincronizzazione, PDF sorgenti e modifica dei pasti non
  sono inclusi: conservazione nel browser, senza trasferimento al server.
- 32 test Node e 7 browser passati. Test caricamento simulano il parser PDF;
  parser reale invariato. Screenshot mobili verificati, nessun overflow.
- Aggiunta route pubblica esplicita del modulo; whitelist Docker/preflight
  Orchestrator includono il nuovo asset. Nessun cambiamento di produzione.

Server locale riavviato su `http://localhost:8080` con codice aggiornato:
il riavvio termina la sessione e richiede una nuova login Google.
WF-008 resta aperto per verifica finale in produzione; il PO ha validato locale.

## Login Google e home protetta — 2026-10-06

Il PO richiede una login reale e home accessibile soltanto dopo autenticazione;
preparare tutto il necessario e poi chiedere la configurazione mancante.
Ticket operativo [WF-008](.wayfinder/issues/WF-008-login-google.md), aperto e
in carico a Codex. WF-001 rimane aperto per archivio remoto e CRUD.

Preparato localmente su `dev`, senza commit/push del codice o deploy:

- Node 22 con `google-auth-library` 11.1.0; OAuth authorization code, PKCE,
  state/nonce, verifica firma e identità. Solo scope openid/email/profile.
- `/` e `/index.html` protetti sul server; pagina login pubblica, logout con
  CSRF e revoca, cookie HttpOnly e Secure su HTTPS, sessioni opache in memoria
  per 12 ore. Riavvio = nuove login. Verifica sessione al ritorno nelle schede.
- Storage browser distinto per `sub` Google. Le vecchie chiavi non vengono
  eliminate o importate: al primo accesso autenticato ricaricare il PDF.
- Nessun token nel frontend; nessun trasferimento dei piani o archivio remoto.
  Rimosso il vecchio tentativo di service worker cache-first: la home richiede rete.
- Limiti login, callback concorrenti e timeout Google; file pubblici in whitelist.
- Docker/Compose di riferimento e CI aggiornati. README e glossario aggiornati.
- 28 test Node + 4 browser passati; flusso Google simulato, verificatore reale
  provato con firme RSA. Audit npm: zero vulnerabilità. Parser invariato.
  Test con PDF privato non eseguito perché documento/asset non disponibili;
  build Docker non eseguita perché il daemon locale non è attivo.

Infrastruttura preparata nel clone locale
`C:/Users/thego/Desktop/NUTRIPRO/JirachiBotOrchestrator`, `main`:
Node 8080, memoria 128 MB, segreti in
`/home/hermes/.config/nutripro/auth.env`, proxy aggiornato, callback senza log,
preflight credenziali e smoke autenticazione sotto lock. Primo rollout coordinato:
il deploy Orchestrator rinvia il nuovo proxy finché il vecchio container è statico;
il deploy NutriPro ricrea il solo proxy dopo health Node. Breve riconnessione delle
rotte condivise durante la ricreazione; nessun altro prodotto riavviato.
Validazioni infra e guard/smoke locali passati; Docker/nginx runtime non verificati.

Mancano Client ID e Client Secret di un client OAuth Web, consenso Google e
redirect esatto `https://nutriprobasta.jirachibot.eu/auth/google/callback`.
Confermare policy: tutti gli account Google (default) oppure ALLOWED_EMAILS.
La produzione resta quella precedente. Prima di chiudere il requisito, pubblicare
le modifiche coordinate, configurare segreti su Hermes, provare Google reale e
disabilitare o convertire in redirect la vecchia app pubblica su GitHub Pages.

> Contesto operativo per chi riprende il progetto. Il PO ha autorizzato
> esplicitamente commit e push su `dev`, incluso questo handoff, il 2026-10-04.
> Questa autorizzazione supera il precedente divieto di pubblicare il file.

## Regole di lavoro (valgono sempre)

- **Italiano**, modalità **Caveman Ultra** (skill `/caveman ultra`): sostanza
  tecnica intatta, zero fronzoli. Codice, commit e documenti restano in prosa
  normale.
- **Nessun commit/push senza richiesta esplicita del PO.** Qui in più il repo
  appartiene a un'altra persona (`M4nu0w2`): non sappiamo se il nostro account
  GitHub abbia i permessi di scrittura. Verificalo con `gh repo view
  M4nu0w2/M4nu0w2.github.io --json viewerPermission` prima di promettere un push.
- **Non fare deploy manuali via SSH.** Si pubblica solo col workflow (vedi sotto):
  passa dalla coda host-wide che protegge il mini-PC.
- L'infrastruttura (proxy, CSP, workflow, Dockerfile) **non vive in questa
  cartella**: sta nel repo `C:\Users\thego\Desktop\JIRACHI\JirachiBotOrchestrator`.
  Lì c'è un `HANDOFF.md` con le "Regole assolute" in cima: leggile se tocchi
  qualunque cosa di deploy.

## Autodeploy da `dev` — ATTIVO dal 2026-10-05 sera (secret configurato e provato)

> **⚠ AGGIORNAMENTO (22:56) — prevale su quanto scritto sotto. L'AUTODEPLOY È
> ARMATO.** Il secret `ORCHESTRATOR_DISPATCH_TOKEN` è configurato nell'Environment
> `nutripro-deploy` e **la catena è stata provata**: il dispatch arriva
> all'Orchestrator con lo SHA giusto. **Ogni push su `dev` che passa i test
> pubblica davvero su `nutriprobasta.jirachibot.eu`**, anche una modifica a
> `HANDOFF.md` o `WAYFINDER.md`. Il primo push reale **sostituisce la preview** con
> `dev`, **senza il fix dell'olio di Manu** (`7904f4a` su `main`/`NP-01`, in
> conflitto su `index.html`). **Prima di pushare su `dev` (o di far pushare altri)
> decidere cosa deve andare online.** Per lavorare senza pubblicare usa un branch
> diverso da `dev` (es. `NP-01`): i push su altri branch non fanno partire nulla.
> I frammenti sotto che dicono "manca solo il secret" o "il job di deploy è rosso"
> sono superati.

**Stato (16:40)**: il workflow è **già su `dev`** (commit `3a266f8`) e ha già girato
una volta: **test verdi su GitHub**, job di deploy **rosso come previsto** perché
il secret `ORCHESTRATOR_DISPATCH_TOKEN` non è ancora configurato (messaggio chiaro,
**nessun deploy partito**, Hermes intatto: la preview è ancora servita). Lato
Orchestrator è tutto pushato e provato con tre dry-run. **Manca solo il secret.**
Finché manca, ogni push su `dev` darà il job di deploy rosso (innocuo). **Quando
ci sarà, ogni push su `dev` distribuirà**, anche i commit di sola documentazione.

**Obiettivo**: un push di qualsiasi collaboratore su `dev` fa girare i test qui e,
**solo se passano**, distribuisce su `https://nutriprobasta.jirachibot.eu` lo
**SHA esatto** che li ha superati. Finché il secret non c'è, vale ancora il deploy a
comando descritto in "Come si pubblica una modifica".

**ATTENZIONE — `dev` e `main` sono divergenti e confliggono su `index.html`.**
Manu ha pushato `7904f4a` *"fix oil valorization"* su `main` e su `NP-01` (non è in
`dev`); `dev` ha la lista della spesa (non è in `main`). Una simulazione di merge dà
*CONFLICT (content) in index.html*. **Il primo autodeploy servirà `dev`, cioè la
stessa app della preview ma SENZA il fix dell'olio di Manu.** Prima di attivare il
secret conviene riunire le due linee (con Manu): non è automatizzabile.

**Cartella condivisa tra sessioni**: due chat sullo stesso working tree si
committano a vicenda i file non tracciati (il commit `3a266f8` ha incluso questo
workflow, lasciato non tracciato da un'altra sessione). Per lavorare in parallelo usa
un worktree per sessione: `git worktree add ../NutriPro-<nome> -b <branch>`.

**Cosa c'è in questo repo**: `.github/workflows/nutripro-ci-deploy.yml`
(incluso nel commit richiesto dal PO il 2026-10-05). Due job: `test` (ubuntu-latest) e `deploy`, che
**non distribuisce direttamente**: chiede al workflow `deploy-nutripro.yml` del
repo `Thegoldendice/JirachiBotOrchestrator` di distribuire quello SHA su Hermes,
con un token limitato salvato come secret. Il deploy vero, il lock, il guard
sull'ordine dei commit e il rollback vivono nell'Orchestrator: **leggi la sezione
"2026-10-05, autodeploy NutriPro da dev" del suo `HANDOFF.md`** per funzionamento
completo, verifiche, rollback e rischi. Qui solo ciò che serve a chi sviluppa.

**Cosa testa la CI e cosa NO — importante per chi tocca il parser**:

| Test | In CI | Come lanciarlo |
|---|---|---|
| `tests/shopping-list.test.cjs` (20 test, motore e parser) | sì | `node --test tests/shopping-list.test.cjs` |
| `tests/shopping-export.e2e.cjs` (browser, CSP di produzione) | sì | `node --test tests/shopping-export.e2e.cjs` con `PLAYWRIGHT_MODULE` |
| `tests/progeo-pdf.e2e.cjs` (PDF di riferimento **privato**) | **NO** | solo in locale, con `REAL_PROGEO_PDF` e `PDFJS_ASSET_DIR` |

**La CI copre 21 test su 22. Il test sul PDF reale NON fa da cancello al deploy**:
richiede un documento che non sta nel repo e lancia un errore all'avvio se manca.
**Prima di pushare modifiche al parser PDF, lancialo in locale.**

**Cosa deve configurare il proprietario del repo (`M4nu0w2`, serve essere admin)**
— il PO ha solo permesso `push`:
1. Ricevere in modo sicuro (mai in chiaro in chat/issue/email) dal PO un
   fine-grained PAT limitato al repo `JirachiBotOrchestrator` con il solo permesso
   *Actions: Read and write* (creazione e scadenza descritte nell'HANDOFF
   dell'Orchestrator).
2. Settings → Environments → **New environment** `nutripro-deploy` → *Deployment
   branches*: **Selected branches → `dev`** → secret **`ORCHESTRATOR_DISPATCH_TOKEN`**
   con il valore del token.
3. Actions abilitate sul repo. Facoltativo: proteggere `dev` (PR/review).

**Senza il secret** i test passano e il job `deploy` **fallisce con un messaggio
che lo dice**, senza distribuire nulla: non rompe niente. Il token scade (consigliati
90 giorni): a scadenza il deploy si ferma con un errore esplicito e va rigenerato.

**Cosa viene servito (whitelist)**: solo asset web (`html css js webmanifest png
jpg jpeg gif svg ico webp woff2`). **`HANDOFF.md`, `WAYFINDER.md`, `CONTEXT.md`,
`.wayfinder/`, `tests/`, `.github/`, `package*.json`, ogni `.md/.cjs/.pdf/.txt` e
ogni dotfile NON vengono mai serviti**, anche se stanno nel repo. Un file nuovo di
tipo non in elenco (es. un `.json` di dati) **non** arriva online: se serve,
va aggiunta l'estensione al Dockerfile nell'Orchestrator (`services/nutripro/Dockerfile`).

**Dove vedere cosa gira**: `https://nutriprobasta.jirachibot.eu/deploy-version.txt`
contiene lo SHA in produzione (è lo stesso del commit su `dev`).

**Rollback** (dettagli e SHA completi nell'HANDOFF dell'Orchestrator):
`gh workflow run deploy-nutripro.yml --repo Thegoldendice/JirachiBotOrchestrator -f sha=<SHA completo> -f allow_older=true`.
Per fermare tutto subito il PO revoca il token (effetto immediato).

**La preview su Hermes** (sezione "Preview Hermes pre-commit") **verrà sostituita
dal primo autodeploy**. Nessuna regressione: l'`index.html` della preview è
identico a quello del commit `1252f93` a meno dei fine riga (CRLF nella copia di
lavoro su Windows, LF nel repo; normalizzati hanno lo stesso SHA256 `6c789d28…`).
Dopo il primo deploy lo script di rollback della preview rifiuta di girare: è atteso.

**Ordine di attivazione**: (1) ~~il PO committa e pusha i file dell'Orchestrator~~
**fatto** (`7da3ff1`); (2) ~~prova a secco sul runner vero~~ **fatta**, tre dry-run
con esito atteso; (3) **PAT consegnato a `M4nu0w2` e secret configurato — è l'UNICO
passo aperto**; (4) ~~push di questo workflow su `dev`~~ **fatto** (`3a266f8`, in
anticipo ma senza danni: senza secret non distribuisce nulla).

## Goal

Il PO vuole **lavorare sull'app NutriPro** (evolutive sue, non ancora
specificate) e vederla online su **https://nutriprobasta.jirachibot.eu**.
Servizio **temporaneo** ospitato sul network Jirachi, ma l'app è di un altro
progetto: è un prototipo/uso personale di `M4nu0w2`, non un prodotto Jirachi.

## Cos'è l'app

**Una Single Page Application in un solo `index.html`** (2443 righe, ~82 KB) più
`icon-512.png` (558 KB), 100% client-side:

1. L'utente carica il PDF del piano alimentare generato da **Progeo Medical**.
2. `pdf.js` (3.11.174, da cdnjs) lo legge **nel browser** e `parseProgeoPdf()`
   estrae pasti e dosi.
3. `convertQuantityEngine()` converte dosi in cucchiai/bicchieri/legumi secchi
   in grammi (o peso del cotto sgocciolato).
4. Il piano resta in `localStorage`; la schermata Home mostra giorni, pasti con
   spunte, barra di avanzamento, tracker dell'acqua e due calcolatrici
   (crudo/cotto, cucchiai).

Nessun backend, nessun dato lato server. Sono **dati sanitari dell'utente**, ma
restano nel suo browser: non introdurre mai una chiamata di rete che li invii
altrove senza chiederlo al PO.

### Mappa di `index.html` (righe indicative, controllale prima di fidarti)

| Righe | Contenuto |
|---|---|
| 1-28 | `<head>`: meta, manifest PWA come **data: URL**, icone, Google Fonts (Outfit), `<script src>` di pdf.js |
| 29-1050 | **`<style>`** unico, tutto il CSS |
| 1059-1300 | HTML: header, selettore giorni, `main` (pasti, acqua), overlay di upload (`#upload-overlay`, `#pdf-dropzone`), modale di caricamento, drawer con le calcolatrici (`#panel-crudocotto`, `#panel-cucchiai`) |
| 1303-2441 | **`<script>`** unico: logica |

Funzioni principali: `normalizeText`, `parseSpoonCount`, `convertQuantityEngine`
(conversioni, ~120 righe), `getSampleProgeoDiet` (piano di esempio incorporato),
`parseProgeoPdf` (~250 righe, il pezzo più delicato), `initAppState`,
`saveDietData`/`saveCheckedState`/`saveWaterState`, `renderDayTabs`,
`renderActiveDay`, `toggleItemCheck`, `renderWaterTracker`, `handlePdfFile`,
`setupCalculatorLogic`.

Chiavi `localStorage`: `diet_plan_data`, `diet_checked_items`,
`diet_water_tracker`. **Cambiare il formato di `diet_plan_data` rompe i piani già
salvati degli utenti**: se serve, scrivi una migrazione e non cambiare il
formato in silenzio.

## Lista della spesa — modifiche locali del 2026-10-04

È stata aggiunta in `index.html` la funzione **Esporta lista della spesa**:
giorni selezionabili (settimana intera come default), anteprima, copia, condivisione
testuale quando supportata dal dispositivo e download `.txt`.

`buildShoppingList()` somma alimenti con nome uguale e unità compatibili, esclude
titoli di ricette con sottoingredienti e mantiene le alternative su una sola riga
con le rispettive quantità. Non inventa sostituzioni o ingredienti mancanti.
`parseFoodChoices()` e il parser PDF conservano alternative esplicite inline o
introdotte da «oppure», «o», «in alternativa» e «Alt:».

Validato anche il PDF reale fornito dal PO: le alternative sono nelle appendici,
collegate ai pasti dai codici della colonna `Alt.`. Il parser ora conserva
`alternativeCode`, legge le tabelle **Alternative alimentari** e mantiene le
ricette come gruppi completi di ingredienti (`recipeIngredients`). Le equivalenze
della tabella **Unità di misura** sono conservate in `metadata.unitMeasures` e
prevalgono sui coefficienti generici. Rimane la conversione preesistente dei
legumi in peso cotto sgocciolato con fattore 2,5.

Corretti problemi emersi col PDF reale: l’olio «extra vergine» era scambiato per
un’intestazione di pasto; `½ bicchiere` era convertito come un bicchiere intero;
i pasti aggiuntivi finivano nella lista come alimenti; i grammi di legumi secchi
venivano trattati come un numero di cucchiai. Ora gli alimenti e le quantità sono
conservati, le intestazioni devono corrispondere all’intera riga e le frazioni
Unicode vengono riconosciute.

Il formato salvato è esteso con `items[].alternatives` (array di alimenti) e
`items[].isRecipe`; i piani precedenti restano leggibili. La proprietà legacy
`alt` viene letta e non viene più eliminata all’avvio. Le alternative cancellate
da importazioni precedenti non possono essere recuperate senza ricaricare il PDF.

L’export produce testo con una voce per riga. **Non crea automaticamente checkbox
native**: in Note occorre applicare Checklist alle righe; in Keep occorre attivare
le caselle nella nota. Integrazione con le app native non verificata su telefono.
Il test del PDF reale verifica il collegamento di tutti gli alimenti con codice
`Alt.`, il caso vitello 300 g / coscia di pollo 240 g, le ricette complete e
quantità settimanali quali olio 156 g, fiocchi d’avena 60 g e pane 550 g.

22 test passati: `tests/shopping-list.test.cjs`, `tests/shopping-export.e2e.cjs`
e `tests/progeo-pdf.e2e.cjs`; comandi nel README. Browser test con CSP; l’ultimo
usa il worker reale di pdf.js e il PDF privato esterno al repo, senza inviarlo
alle CDN. Il PDF e le estrazioni di lavoro non sono nel repository. Nessun commit, push o
deploy effettuato per questa funzione: la verifica online precedente non la include.

## Preview Hermes pre-commit — 2026-10-04

Su richiesta esplicita del PO è stato creato il branch locale `dev` e pubblicato
il working tree non committato su https://nutriprobasta.jirachibot.eu.
Nessun commit o push. L'eccezione al deploy via workflow è limitata a questa
preview: il workflow esistente legge solo `origin/main` e non può distribuire
modifiche locali senza commit.

È stato sostituito atomicamente solo `index.html` nel container esistente,
senza build/restart, sotto lo stesso `flock` host-wide e con marker dashboard
NutriPro. Clone upstream Hermes e immagine Docker sono rimasti intatti.
Il PDF privato, i test e i documenti non sono stati caricati. La preview persiste
al semplice restart; viene persa alla ricreazione del container o al normale
redeploy del workflow, che ripubblica la baseline di `main`.

- SHA256 index locale/remoto/pubblico: `29f9ffeca9c92c32b3f274721e39ce4229eba8a01ffa821495f731cd6fda197e`.
- Staging e backup: `/home/hermes/.jirachi-deploy/previews/NutriPro-29f9ffeca9c9-1791145966`.
- Backup originale: `before-index.html`; script di rollback: `rollback.sh`.
- Ripristino, solo su richiesta PO:
  `ssh hermes bash /home/hermes/.jirachi-deploy/previews/NutriPro-29f9ffeca9c9-1791145966/rollback.sh`.
  Lo script prende lock e marker e rifiuta il ripristino se container/hash sono cambiati.
- Smoke remoto: container healthy, proxy e URL pubblico, hash identico, CSP,
  icona e nessuna esposizione Git/README. Chromium pubblico: esempio, apertura
  export, alternative, nessun overflow mobile, zero errori JavaScript/CSP.
- Per testare le alternative con piani precedentemente salvati, ricaricare il PDF.

## Raccolta evolutive Wayfinder — 2026-10-04

Il PO ha chiesto di iniziare a segnare nuove evolutive, senza implementarle:
login Google e archivio personale persistente dei piani (un’entità per PDF,
catalogazione temporale, CRUD e menu); chatbot Gemini 3.7 Flash dentro l’app per
domande sul proprio piano e sulla nutrizione in generale.

Mappa canonica locale: [NutriPro — archivio personale e assistente del piano](WAYFINDER.md).
Ticket e dipendenze in `.wayfinder/issues/`, convenzioni in `.wayfinder/TRACKER.md`,
termini condivisi in `CONTEXT.md`. Tutti esclusi localmente dal Git upstream,
come questo HANDOFF. Nessuna issue esterna, codice, credenziale o deploy aggiunto.
Il PO ha chiarito canale in-app e ambito anche nutrizionale generale: ticket
risolto nella mappa. Restano aperti archivio, contesto delle risposte, persistenza,
dati condivisi e gestione della credenziale API.
Gemini 3.7 Flash risulta nel catalogo ufficiale, ma accesso API, costi, quote e
modalità di gestione dei dati vanno valutati prima dell’attivazione.

## Current Progress

- **Clonato** in questa cartella (`main`, albero pulito, ultimo commit
  `bc7d147` del 2026-10-04, 5 commit totali). Remote `origin` =
  `https://github.com/M4nu0w2/M4nu0w2.github.io.git` (repo **pubblico**).
- **Online e verificato da fuori** il 2026-10-04: `https://nutriprobasta.jirachibot.eu`
  risponde 200 con l'app (titolo, pdf.js, icona), CSP e HSTS presenti, `.git` e
  README non esposti.
- **Come gira in produzione**: su `hermes` (mini-PC con Docker) il container
  `nutripro-frontend-1` (nginx:alpine, 32 MB di RAM, 0.25 CPU) serve una copia
  del repo; il reverse proxy dell'Orchestrator lo espone sul sottodominio; il
  tunnel Cloudflare è configurato (DNS + ingress fatti dal PO a mano).
- **Il clone su hermes** è `/home/hermes/NutriPro`, aggiornato solo con
  `git merge --ff-only`, mai toccato a mano.
- Questa cartella è tra le directory autorizzate dell'Orchestrator
  (`.claude/settings.json`) e in `JirachiBot.code-workspace`: già committato e
  pushato (`3e23a20`).

## Come si pubblica una modifica

1. Modifichi qui e **provi in locale** (vedi sotto).
2. Il PO decide se/quando committare e pushare su `M4nu0w2/M4nu0w2.github.io`
   (serve il permesso di scrittura).
3. **Finché l'autodeploy non è attivo (sezione "Autodeploy da dev"), il deploy NON
   parte da solo al push.** Va lanciato a comando:
   ```
   gh workflow run deploy-nutripro.yml --repo Thegoldendice/JirachiBotOrchestrator
   ```
   Il workflow clona/aggiorna `/home/hermes/NutriPro`, ricostruisce l'immagine
   (una `COPY` di pochi file), aspetta il container `healthy`, poi verifica
   attraverso il proxy: 200 sulla home, `pdf.js` presente nel body, icona 200,
   `.git` e README **non** esposti, CSP presente. Se un check fallisce il run è
   rosso e il log dice quale.
4. Dopo un deploy verde, controlla comunque `https://nutriprobasta.jirachibot.eu`
   da fuori.

Lo stesso workflow si lancia anche dal bottone "Run workflow" nella tab Actions
del repo `Thegoldendice/JirachiBotOrchestrator`.

### Provare in locale

È un file statico: basta un server qualsiasi (`npx serve .`, oppure aprire
`index.html`). **Attenzione**: aprire il file da `file://` salta la CSP di
produzione, quindi *non* dimostra che funzioni online. Per provare con la CSP
vera vedi sotto.

## La CSP: il vincolo che ti morde

Il proxy applica una Content-Security-Policy dedicata
(`nginx/snippets/csp-nutripro.conf` nel repo Orchestrator). **Qualunque risorsa o
origine nuova che l'app carica da fuori va aggiunta lì**, altrimenti in
produzione si rompe in silenzio mentre in locale funziona. Oggi ammette:

- script: `'self'`, `'unsafe-inline'` (l'app ha ~700 righe di JS inline), `https://cdnjs.cloudflare.com`
- stili: `'self'`, `'unsafe-inline'`, `https://fonts.googleapis.com`
- font: `https://fonts.gstatic.com`
- worker: `blob:` e cdnjs (pdf.js avvolge il suo worker cross-origin in un `blob:`)
- connessioni: `'self'` e cdnjs
- immagini: `'self'`, `data:`, `blob:`; manifest: `data:`

Quindi: **un nuovo CDN, un nuovo font, una `fetch()` verso un'API, un iframe, un
`new Worker()` di altro tipo = tocca anche la CSP** (nell'Orchestrator, non qui).

### Come l'ho provata (ripetibile)

Playwright è installato nel repo ShinyList
(`C:\Users\thego\Desktop\JIRACHI\JirachiShinyList\jirachi-shinylist\node_modules\playwright`,
Chromium già scaricato). Ricetta: un piccolo server Node che serve questa cartella
aggiungendo l'header `Content-Security-Policy` copiato da `csp-nutripro.conf`;
`chromium.launch()`; ascolta `console` (messaggi con "content security policy"),
`pageerror` e `requestfailed`; apri la pagina con `waitUntil: "networkidle"`.
Per provare il **worker di pdf.js** — il pezzo che una CSP sbagliata rompe in
silenzio — passa a `pdfjsLib.getDocument({data})` un PDF minimo scritto a mano
(una pagina con "CIAO NUTRI") e controlla che il testo venga estratto.
**Fai sempre la controprova**: con una CSP stretta (`script-src 'self'`) l'app deve
rompersi; se non si rompe, il test non discrimina.
Il font Outfit risulta `unloaded` finché non serve: forza
`document.fonts.load("600 16px Outfit")` e conta i `loaded` (i sottoinsiemi
`unicode-range` cirillico ecc. restano `unloaded` per design).

## What Worked

- **Leggere prima l'app, poi scrivere la CSP**: l'app è un file unico con script,
  stile e handler inline e dipendenze da cdnjs e Google Fonts. Riusare la CSP
  stretta di PixelPets (l'altro servizio temporaneo) l'avrebbe fatta morire.
- **Provare la CSP in un browser reale con controprova** (vedi sopra).
- **Controllare il contenuto e non il codice HTTP** per `.git`/README: il
  fallback SPA risponde 200 con l'index a *qualsiasi* path, quindi un controllo
  sullo status passerebbe anche con `.git` esposto. Il workflow cerca `[core]` e
  il testo del README nel body.
- **Nessun auto-deploy dal repo upstream**: servirebbe un token con permessi
  sull'Orchestrator dentro un repo non nostro. Meglio un comando.

## What Didn't Work / Limiti noti (non risolti, non nostri)

- **Il service worker dell'app non funziona.** Viene registrato da un URL `blob:`
  (`navigator.serviceWorker.register(URL.createObjectURL(blob))`, righe ~2430-2440),
  che i browser rifiutano; il `.catch(() => {})` nasconde l'errore. Risultato:
  **nessuna cache offline reale**, nonostante il README prometta una PWA. Se il
  PO la vuole davvero offline, serve un `sw.js` come file separato servito dalla
  stessa origin (e `worker-src 'self'` nella CSP) — **è un'evolutiva da proporre
  al PO, non un fix da fare in silenzio**.
- **Privacy non coerente col README.** Il README dichiara "100% offline, nessun
  dato online", ma ogni visitatore contatta **Google** (font) e **cdnjs**
  (pdf.js): il suo IP arriva a terzi. Non è un leak del contenuto del PDF, ma
  per un'app di dati sanitari conta. Rimedio possibile: self-hosting di pdf.js e
  del font Outfit nella stessa origin (e CSP più stretta). Da proporre al PO,
  non da fare senza che lo chieda.
- **Il manifest PWA è un `data:` URL** dentro il `<link>`: funziona su Chrome ma è
  fragile (alcuni browser lo ignorano) e impedisce un'installazione "vera".
- **`script-src 'unsafe-inline'` è necessario** per come è fatta l'app: un hash
  non è praticabile perché cambia a ogni modifica di `index.html` e l'app si
  romperebbe in silenzio. Se si spezza il JS in file `.js` separati si può
  stringere la CSP (decisione del PO).
- Un primo tentativo di CSP (quella stretta di PixelPets) è stato scartato
  **prima** di andare in produzione perché l'app non partiva (niente pdf.js,
  niente script inline, niente font).
- Il Dockerfile copiava tutto il clone nell'immagine, togliendo solo `.git` e i
  `.md` **in radice**: con `.wayfinder/` e `tests/` ora nel repo, i file
  `.wayfinder/*.md` sarebbero stati **serviti pubblicamente**. **Sostituito il
  2026-10-05 da una whitelist** (vedi "Autodeploy da dev"), provata sull'host
  reale con un contesto ostile; **non ancora in produzione** (modifica
  dell'Orchestrator non committata). Finché non è applicata, il container in
  produzione serve ancora la copia di prima.

## Next Steps

1. **Chiedi al PO cosa vuole cambiare nell'app.** Le evolutive non sono ancora
   state specificate: non iniziare a modificare `index.html` di tua iniziativa.
2. **Verifica i permessi di scrittura** sul repo prima di promettere un push
   (comando sopra). Se non ci sono, le strade sono un fork + PR oppure chiedere
   l'accesso a `M4nu0w2`.
3. **Attivare l'autodeploy** (sezione "Autodeploy da dev"): serve l'ok del PO a
   committare/pushare, il token consegnato a `M4nu0w2` e il secret configurato.
   Il **primo deploy applicherà anche la whitelist del Dockerfile** (il container
   in produzione serve ancora la preview e l'immagine vecchia). Dopo, verifica
   con `ssh hermes docker exec nutripro-frontend-1 find /usr/share/nginx/html
   -type f` che non ci sia nessun `.md`, `tests/` o `.wayfinder/`.
   (Il Dockerfile precedente con `rm -f *.md`, commit `3e23a20`, è superato.)
4. Se la modifica introduce una nuova origine esterna: aggiorna prima
   `csp-nutripro.conf` (Orchestrator), provala nel browser con controprova, poi
   deploya.
5. Quando NutriPro non serve più: rimozione descritta nella sezione "NutriPro"
   dell'`HANDOFF.md` dell'Orchestrator (container, server block, CSP, workflow,
   clone su hermes, DNS e ingress).

## Riferimenti rapidi

| Cosa | Dove |
|---|---|
| App online | https://nutriprobasta.jirachibot.eu |
| Repo upstream | https://github.com/M4nu0w2/M4nu0w2.github.io (pubblico) |
| Infrastruttura | `C:\Users\thego\Desktop\JIRACHI\JirachiBotOrchestrator` → `services/nutripro/`, `nginx/snippets/csp-nutripro.conf`, `nginx/nginx.conf` (server block), `.github/workflows/deploy-nutripro.yml` |
| Contesto di rete e regole | `...\JirachiBotOrchestrator\HANDOFF.md` (sezione "Regole assolute" in cima) |
| Stato dei deploy in corso | https://dashboard.jirachibot.eu (compare "NutriPro" mentre deploya) |


### Raccolta evolutive: sostituzioni rapide è 2026-10-04

Aggiunto alla mappa locale WAYFINDER.md il requisito della bacchetta magica
accanto a ogni elemento del pasto: 2-3 alternative con peso adattato, calorie e
macro quasi identici, per sostituzioni occasionali in extremis. Ticket aperto:
[Definire equivalenza nutrizionale delle sostituzioni rapide](.wayfinder/issues/WF-006-sostituzioni.md).
Tolleranze, fonte nutrizionale, crudo/cotto e applicazione al piano/lista della
spesa ancora da concordare. Nessuna implementazione o modifica del deploy.


## Pubblicazione branch dev - 2026-10-04

Il PO ha richiesto il push completo su dev, handoff incluso. Il commit comprende
codice, test, README, mappa Wayfinder, glossario e ticket. I 22 test sono passati.
Alla verifica preliminare GitHub indica viewerPermission READ: il push potrebbe
essere negato. La preview Hermes resta quella gia distribuita; questo push non
autorizza un nuovo deploy. PDF personali e credenziali restano fuori dal repository.

### Raccolta evolutive: settaggi — 2026-10-05

Creato il ticket locale
[Definire pagina settaggi e tracking opzionali](.wayfinder/issues/WF-007-settaggi.md).
Richiesti interruttori per tracking acqua e olio. Proposti, senza approvazione,
promemoria, unità preferite, visibilità del riepilogo nutrizionale e preferenze
per le sostituzioni. Nessuna implementazione. Commit precedente `1252f93`
presente su `dev`; push negato con 403, il PO sta chiedendo accesso in scrittura.


### Commit e push richiesti dal PO - 2026-10-05

Verificato accesso WRITE. Inclusi workflow CI/deploy, ticket settaggi e aggiornamenti
della mappa e di questo handoff. I 21 test previsti in CI passano anche in locale.
Il workflow parte al push su dev; il deploy richiede ORCHESTRATOR_DISPATCH_TOKEN
nell'environment nutripro-deploy. La configurazione del secret non viene
verificata da questo commit.
