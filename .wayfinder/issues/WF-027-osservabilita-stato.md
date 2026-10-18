---
id: WF-027
title: Definire osservabilità e stato condiviso del backend
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: open
assignee: null
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
