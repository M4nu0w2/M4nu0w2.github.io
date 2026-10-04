# HANDOFF — NutriPro ("Piano Nutrizionale — Progeo Medical Converter")

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
3. **Il deploy NON parte da solo al push.** Va lanciato a comando:
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
- Il Dockerfile copia tutto il clone nell'immagine: se un `.md` o altro file di
  lavoro finisse nel repo upstream verrebbe **servito pubblicamente**. Il
  Dockerfile ora toglie `.git` e ogni `.md` in radice (modifica pushata, ma
  **non ancora in produzione**: serve il redeploy, vedi Next Steps): finché non
  è applicata, **non pushare mai file di lavoro in questo repo**.

## Next Steps

1. **Chiedi al PO cosa vuole cambiare nell'app.** Le evolutive non sono ancora
   state specificate: non iniziare a modificare `index.html` di tua iniziativa.
2. **Verifica i permessi di scrittura** sul repo prima di promettere un push
   (comando sopra). Se non ci sono, le strade sono un fork + PR oppure chiedere
   l'accesso a `M4nu0w2`.
3. **Rilancia il deploy per applicare il Dockerfile blindato.** Le modifiche
   nell'Orchestrator sono già committate e pushate (`3e23a20`: `../NutriPro`
   tra le directory autorizzate + rimozione di ogni `.md` dall'immagine), ma
   il container in produzione gira ancora sull'immagine vecchia. Comando di
   deploy sopra; poi verifica con `ssh hermes docker exec nutripro-frontend-1
   ls /usr/share/nginx/html` (devono restare solo `50x.html icon-512.png
   index.html`). Il build col nuovo `rm -f …/*.md` non è mai stato provato: se
   fallisce, il container vecchio resta su e non c'è disservizio.
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
