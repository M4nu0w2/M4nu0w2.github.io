---
id: WF-010
title: Integrare Gemini con opzione gratuita e veloce
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: open
assignee: codex
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Integrare Gemini con opzione gratuita e veloce

## Requirement comment

2026-10-06 - il PO conferma NutriPro funzionante in produzione e indica questo
come prossimo ticket per la prossima sessione: integrare Gemini con una
"versione gratuita turbo". Dopo la prima integrazione si divideranno ulteriori
evoluzioni in ticket separati. Non iniziare l'implementazione in questa sessione.

"Turbo" esprime la preferenza per risposte veloci; non identifica un modello
ufficiale. Il requisito aggiornato prevale sulla vecchia indicazione non
verificata di Gemini 3.7 Flash in WF-002/WF-004.

## Destination

Prima integrazione Gemini nella chat NutriPro, usando un modello veloce con
accesso gratuito effettivamente disponibile al momento dell'implementazione.
Canale e ambito restano quelli concordati in WF-005. Non attivare fatturazione
o alternative a pagamento automaticamente.

## Next session

- Verificare nella documentazione ufficiale Google modello disponibile,
  accesso API gratuito, quote e condizioni del trattamento dati.
- Definire con il PO le decisioni ancora aperte in WF-002, WF-003 e WF-004
  necessarie alla prima integrazione: contesto piano, dati inviati e credenziale.
- Preparare integrazione backend autenticata; credenziale fuori dal frontend
  e dai repository. Richiedere solo i dati/configurazioni realmente mancanti.
- Concordare la prima esperienza essenziale e verificare errori/limiti quota.
- Dopo la base, creare ticket separati per ulteriori funzioni emerse; non
  anticipare ora una lista di evoluzioni non concordata.

## Status

Priorita della prossima sessione; nessuna integrazione Gemini avviata.

## Start - 2026-10-06

Il PO decide di continuare qui e autorizza lavorare il prossimo ticket.
Ricerca ufficiale: gemini-3.5-flash-lite disponibile; termini richiedono
Paid Services per client distribuiti a utenti SEE. Integrazione preparata
disattivata, decisione attivazione/costi richiesta al PO. Nessuna API reale.

## Implementation progress - 2026-10-06

Prima base implementata localmente: chat React /chat e backend Gemini REST,
autenticazione/CSRF, limiti quota e timeout, renderingtesto. Solo domande
generali, nessun piano o PDF inviato; memoria della pagina senza persistenza.
Modello gemini-3.5-flash-lite verificato nella documentazione ufficiale.
56 test passati (44 unit/integration e12browser) con trasporto simulato.
Nessuna API key, API reale, attivazione billing, commit/push codice o deploy.

Termini ufficiali https://ai.google.dev/gemini-api/terms richiedono Paid Services
per clienti resi disponibili a utenti SEE. Modalita free local-dev limitata a
localhost; pubblica disattivata. Domande al PO ancora pendenti: contesto/dati,
chiaveprogetto vsutente e scelta disattivato/alternativafree/budgetpaid.
Il ticket resta open: attivazione e verifica reale non completate.

## Model decision - 2026-10-06

PO richiede "Usa flash": impostato gemini-3.7-flash al posto del precedente
Flash-Lite. NutriPro non deve diventare a pagamento per gli utenti; eventuali
costi API sono a carico del progetto. Modello scelto, billing/key e budget non
ancora autorizzati/configurati. Integrazione resta disattivata.

## Credential and local activation - 2026-10-06

PO conferma completamento configurazione progetto/APIkey/billing e chiave nel
file .env ignorato. Key validata senza stamparla: models.list include3.7Flash,
una chiamata REST minima risponde OK. Attivazione locale configurata con
GEMINI_ENABLED=true, GEMINI_ACCESS_MODE=paid-services eMODEL3.7Flash.
Status autenticato enabled/configuredtrue, reasonnull; server8080 riavviato.
Chiamate tramite modulo Node eAPIchat ricevono503UNAVAILABLE: Google dichiara
high demand temporaneo. Nessun fallback o retryautomatico; caso503 mappato
correttamente e12test backend/API mirati passati. Key non trasferita a Hermes,
codice non pushato eprodnonmodificata. Verifica chat reale app ancora pendente
finche provider disponibile; ticket resta open. Nessun contenuto piano inviato.

## Chat failure diagnosed - 2026-10-06

APIreale conferma503UNAVAILABLE per overloadGoogle anche con promptminimo.
UI ora distingueprovider_unavailable ealtreclassierrori, preservadraft.
Build13testbackend+5browserpass. NessunautoRetry/fallback, prodinvariata;
verifica di risposta reale inchat resta pendente.

## PO release decision - 2026-10-06

Il PO richiede commit e push, poi stop per ora. WF-010 resta esplicitamente
OPEN: la chat reale non funziona ancora, Google risponde 503 UNAVAILABLE.
Pubblicare la base e la gestione errori non completa il ticket. Nessun ulteriore
intervento, trasferimento credenziali o deploy manuale in questa sessione.