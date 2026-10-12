---
id: WF-019
title: Rendere NutriPro installabile come app
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: open
assignee: null
assignment: manu
assignment_mode: flexible
blocked_by: []
---

# Rendere NutriPro installabile come app

## Requirement comment

2026-10-10 — richiesta in sessione (Manu): manifest, icone, nome, colore tema,
avvio a schermo intero, funzionante su Safari iOS e Android. Fuori da questo
ticket: service worker offline e notifiche.

Stato verificato il 2026-10-10: esistono già `public/manifest.webmanifest`
(`display: standalone`, tema `#0f172a`, una sola icona 512 px) e i link in
`index.html` a manifest, `theme-color` e `apple-touch-icon`. Mancano almeno
icone 192 px e maskable, meta specifici per iOS e una verifica reale di
installazione.

## Dipendenza esterna

CSP, header e proxy vivono nel repo JirachiBotOrchestrator, non in questo repo.
Verificare lì `manifest-src`, il `Content-Type` del manifest e la cache delle
icone. Ogni modifica in quel repo va fatta e pubblicata separatamente, prima o
insieme al deploy di questo ticket.

## Open questions for PO

- Nome sotto l'icona: "NutriPro" o "NutriPro Basta"?
- Icona: riuso di `icon-512.png` (558 KB) ridimensionata o nuova grafica?

## Vincoli

- L'app installata resta dietro login Google: `start_url` non deve aggirare la
  protezione né memorizzare pagine autenticate.
- Nessun service worker in questo ticket.

## Acceptance criteria

- Installazione riuscita da Chrome Android e da "Aggiungi a Home" su Safari iOS,
  con avvio a schermo intero e icona corretta, verificata sul dominio reale.
- Login e logout funzionano dall'app installata.
- Nessun errore CSP in console dopo il deploy.
- `npm test` e `npm run test:browser` verdi.
- Ogni push su `dev` fa deploy automatico: l'ultimo commit di un push che
  contiene codice non deve avere `[skip ci]`.
