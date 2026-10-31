---
id: WF-027
title: Definire osservabilità e stato condiviso del backend
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: closed
assignee: claude
assignment: null
assignment_mode: flexible
blocked_by: [WF-024]
---

# Definire osservabilità e stato condiviso del backend

## Question

Come si capisce cosa sta facendo il backend in produzione (log, metriche,
allarmi) e dove vive lo stato che oggi sta in memoria, in modo che un riavvio o
una seconda istanza non cambino il comportamento?

## Stato attuale (verificato sul codice)

- **Log**: due soli `console` in tutto il server (avvio e avviso del segreto di
  sessione). Nessun log delle richieste, degli errori o dei rifiuti (401, 403,
  429). Gli errori inattesi vengono inghiottiti e diventano `server_error`.
  Il proxy registra le richieste senza query string, per scelta di sicurezza.
- **Metriche**: nessuna. Esiste solo `/healthz` (`status`, `loginConfigured`).
- **Stato in memoria** che si azzera a ogni riavvio e non è condiviso fra
  istanze: revoche dei logout (`revoked`), flussi OAuth in corso (`flows`),
  rate limit del login e della waitlist, contatori e limiti di Gemini
  (per account, giornalieri e globali).
- Conseguenza: dopo un riavvio una sessione revocata con il logout torna valida
  fino alla scadenza (già annotato in
  [Mantenere l'accesso fra aperture dell'app e deploy](WF-020-sessione-persistente.md)).
  Con due istanze, i limiti si dimezzerebbero di fatto.

## Decisioni aperte per il PO

Non sono decisioni prese.

1. **Log**: formato strutturato (JSON), livelli, cosa si registra e **cosa mai**
   (token, codici OAuth, testo dei messaggi, dati dei piani, email). Correlazione
   per richiesta.
2. **Dove vanno i log** e per quanto tempo restano; ruotazione sul container.
3. **Metriche e allarmi**: quali (richieste, errori, latenza, login falliti,
   limiti raggiunti, quota Gemini, spazio del volume) e chi viene avvisato.
4. **Stato condiviso**: quali pezzi devono sopravvivere al riavvio (revoche,
   contatori Gemini) e dove li si mette: tabella nel database, file, oppure si
   accetta la perdita dichiarandola.
5. **Una sola istanza**: dichiararlo come vincolo di progetto per ora, oppure
   rendere lo stato condivisibile in vista di più istanze.
6. **Health check**: separare «vivo» da «pronto» (database raggiungibile, volume
   scrivibile) senza esporre dettagli.

## Acceptance criteria del ticket

- Elenco dei campi che i log possono contenere e di quelli vietati.
- Per ogni stato in memoria: resta in memoria, persiste o viene condiviso, con motivo.
- Set minimo di metriche e soglie di allarme.

## Dependencies

Dipende dalla scelta di struttura in
[Definire l'architettura di un backend leggero e robusto](WF-024-architettura-backend.md):
framework e plugin cambiano il modo di registrare log e metriche.

## Resolution comment

2026-10-31 — decisioni **delegate dal PO** a Claude, con `codebase-design` e
`ponytail`. Implementato in `server/log.cjs` e `server/app.cjs`; test in
`tests/logging.test.cjs` (6 test, nel `npm test`).

1. **Log**: una riga JSON per evento su stdout (`ts`, `level`, `event` più campi).
   Livello con `LOG_LEVEL` (`info` di default, `warn`, `error`, `silent`; valore
   non valido ferma l'avvio). Eventi: `request` (metodo, **solo il percorso**,
   stato, durata), `login_ok`, `login_failed` (solo il motivo), `waitlist_saved`,
   `waitlist_db_error` (solo il codice), `chat_error` (stato e codice),
   `server_error` (nome e prima riga dello stack), `session_secret_missing`,
   `listening`.
   **Vietato nei log**, e coperto da test: query string (contiene i codici
   OAuth), corpi delle richieste, token, email, nome e `sub` dell'account,
   testo dei messaggi e dei piani, messaggi di errore dei fornitori.
   Nessun indirizzo IP: il proxy ha già il suo log.
2. **Dove vanno e quanto restano**: stdout del container; la rotazione c'è già
   (`json-file`, 5 MB per 2 file nel Compose dell'Orchestrator).
3. **Metriche e allarmi**: nessun sistema di metriche, e non ne aggiungo uno solo
   per questo. Le metriche si ricavano dalle righe `request` e dagli eventi.
   Soglie proposte da usare quando esisterà una destinazione per gli avvisi:
   `server_error` ≥ 1 in 5 minuti; `login_failed` ≥ 20 in 5 minuti; `waitlist_db_error`
   ≥ 1; `chat_error` con stato 429 ripetuto; spazio del volume `/data` sopra 80%.
   **Gli allarmi non sono implementati**: serve scegliere dove arrivano (attività
   umana su Hermes, vedi il ticket sul backup).
4. **Stato in memoria**: revoche del logout, flussi OAuth in corso, rate limit e
   contatori di Gemini **restano in memoria**. Conseguenza dichiarata: dopo un
   riavvio una sessione revocata torna valida fino alla scadenza (cookie firmato),
   e i limiti si azzerano.
5. **Una sola istanza**: dichiarato come **vincolo di progetto**. Con più istanze
   limiti e revoche non sarebbero condivisi. Se serve scalare, lo stato va nel
   database scelto dal ticket sulla conservazione dei dati.
6. **Health**: `/healthz` resta com'è. «Pronto» (volume scrivibile, database
   aperto) non aggiunto: l'app parte anche senza volume per scelta, e la waitlist
   segnala da sola l'errore con `waitlist_db_error`.
