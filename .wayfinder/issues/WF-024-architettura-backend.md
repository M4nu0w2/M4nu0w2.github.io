---
id: WF-024
title: Definire l'architettura di un backend leggero e robusto
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: closed
assignee: claude
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Definire l'architettura di un backend leggero e robusto

## Question

Come deve essere fatto il backend perché resti **leggero** (pochi MB di RAM,
poche dipendenze, avvio rapido) ma diventi **robusto** e mantenibile al crescere
delle funzioni? Tenere il server HTTP scritto a mano o adottare un framework
minimo? Con quale struttura di moduli, validazione, gestione errori e test?

Richiesta del PO (2026-10-18): integrare un backend leggerissimo e robusto.

## Stato attuale (verificato sul codice)

- Node 22, modulo `http` senza framework. `server/app.cjs` (375 righe) contiene
  configurazione, sessioni, OIDC, CSP, routing, statici e gestione della
  waitlist in un'unica funzione `createAuthServer`. Altri file: `gemini.cjs`
  (78), `waitlist.cjs` (57), `index.cjs` (13).
- Il routing è una catena di `if (route === ...)`. Ogni nuova route allunga la
  catena e il rischio di dimenticare un controllo di autenticazione o CSRF.
- Validazione fatta a mano in ogni punto (chat, waitlist, configurazione).
- CommonJS, JavaScript senza tipi. Container con 128 MB di RAM e 0,25 CPU.
- Test di integrazione che avviano il server vero (58 test): buon punto di
  partenza da conservare qualunque cosa si scelga.
- Punti di forza da **non perdere**: OIDC con PKCE, CSRF + Origin, CSP per
  percorso, cookie `__Host-`, rate limit, container senza privilegi.

## Decisioni aperte per il PO

Non sono decisioni prese.

1. **Framework o no**: restare su `http` con un piccolo router interno, oppure un
   framework minimo (candidati da valutare: Fastify, Hono). Criteri: peso,
   manutenzione, supporto a schemi di validazione, plugin per cookie/CSRF/rate
   limit, facilità di test senza aprire porte.
2. **Struttura**: separazione in moduli (auth, sessione, landing, waitlist,
   chat, statici) con un punto unico dove si dichiara «questa route richiede
   sessione / CSRF». Una route nuova non deve poter saltare i controlli.
3. **Validazione degli input**: schema dichiarativo per ogni route (corpo,
   query, intestazioni) al posto dei controlli manuali.
4. **Linguaggio**: restare in JavaScript CommonJS, passare a ESM, adottare
   TypeScript (o JSDoc con controllo dei tipi).
5. **Errori**: formato unico delle risposte di errore, nessun dettaglio interno
   verso l'esterno, nessun crash per un input malformato.
6. **Migrazione**: a piccoli passi mantenendo verdi i 58 test, oppure riscrittura
   di un modulo alla volta dietro la stessa interfaccia HTTP.

## Acceptance criteria del ticket

- Scelta motivata con numeri (RAM a riposo, tempo di avvio, dipendenze
  transitive) e con l'elenco di cosa si perde e di cosa si guadagna.
- Ogni controllo di sicurezza attuale ha una corrispondenza nella nuova struttura.
- Piano di migrazione per passi, ciascuno con test verdi.

## Dependencies

- Il confronto tecnico sul database è in
  [Verificare lo stato di node:sqlite e le alternative leggere](WF-025-ricerca-sqlite-alternative.md).
- L'osservabilità e lo stato condiviso dipendono da questa scelta:
  [Definire osservabilità e stato condiviso del backend](WF-027-osservabilita-stato.md).

## Out of scope

- Spostare i piani dei pazienti sul server (decisione di
  [Definire persistenza e dati condivisi con l'assistente](WF-003-dati.md)).
- Cambiare il frontend React.

## Resolution comment

2026-10-31 — decisioni **delegate dal PO** a Claude («prendi pure decisioni»),
prese con le skill `codebase-design` (vocabolario: modulo profondo, seam) e
`ponytail` (soluzione più piccola che funziona). Il PO può annullarle.

Misure fatte oggi sul server attuale: avvio e ascolto 198 ms; 77 MB di RSS dopo
300 richieste (limite del container: 128 MB); 5 dipendenze di produzione.
Fastify 5 aggiungerebbe 41 pacchetti (13 MB su disco) e altra RAM, in un
container che ha già 77 su 128 MB.

1. **Framework: no.** Restano `http` e il router a catena. Il server ha una
   dozzina di route e 375 righe: il router non è il problema. Un framework
   costerebbe dipendenze, RAM e la riscrittura di controlli di sicurezza già
   provati da 64 test. **Soglia per riconsiderarlo**: più di ~25 route, oppure
   un secondo sviluppatore che aggiunge route senza conoscere i controlli.
2. **Struttura**: moduli profondi solo dove c'è un seam vero (due adattatori).
   Fatto: `server/log.cjs` (interfaccia: `info/warn/error(evento, campi)`;
   adattatori: stdout e un contenitore di prova). `waitlist.cjs` e `gemini.cjs`
   erano già moduli profondi. **Non** spezzare `app.cjs` ora: un solo
   adattatore per ciascuna parte sarebbe un seam ipotetico.
3. **Validazione**: a mano nei due moduli che ricevono input libero
   (`waitlist.cjs`, `gemini.cjs`), niente libreria di schemi per ~2 funzioni.
   Da riconsiderare con la soglia del punto 1.
4. **Linguaggio**: JavaScript CommonJS. TypeScript non porta nulla di
   verificabile oggi; costa una fase di build nel container.
5. **Errori**: già un formato unico (`{ error }`) e nessun dettaglio interno
   all'esterno; ora l'errore inatteso lascia traccia nel log (nome e prima riga
   dello stack, mai il messaggio).
6. **Migrazione**: nessuna, per i punti precedenti.

Punto che resta aperto e va deciso con il PO: la guardia CSRF+Origin è scritta
in due route (logout, chat). Un helper unico è sensato **alla terza**.
