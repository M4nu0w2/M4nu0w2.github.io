---
id: WF-028
title: Eseguire il backup del volume della waitlist su Hermes
parent: WF-MAP-001
labels: [wayfinder:task]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Eseguire il backup del volume della waitlist su Hermes

## Question

Il volume Docker `nutripro-data` (file `waitlist.sqlite`: nome, email, ruolo e
numero di pazienti dei nutrizionisti candidati) è incluso in un backup
verificato, con ripristino provato?

È un compito operativo che sblocca la pubblicazione della landing: oggi, se il
disco o il volume si perdono, le candidature sono perse. Non decide nulla di
nuovo; la politica di lungo periodo è in
[Definire persistenza server, migrazioni e backup](WF-026-persistenza-migrazioni-backup.md).

## Stato

- Il volume esiste dal deploy del 2026-10-17 (compose in
  `JirachiBotOrchestrator/services/nutripro/docker-compose.yml`).
- Nessun backup configurato. Non so se Hermes ha già un meccanismo di backup per
  gli altri prodotti: va verificato con chi gestisce l'host.

## Checklist (HITL: richiede accesso a Hermes)

1. Verificare se esiste un backup dell'host o degli altri volumi e dove finisce.
2. Includere `nutripro-data`, oppure aggiungere un job che esegua un backup
   **consistente** del file SQLite (comando di backup online o `VACUUM INTO`,
   non una semplice copia mentre è in scrittura) in una cartella fuori dal
   volume e dall'host.
3. Cifrare la copia se esce dall'host (contiene dati personali).
4. Provare il ripristino su un container di prova e contare le righe.
5. Annotare nel ticket frequenza, destinazione, conservazione e data della prova.

## Acceptance criteria

- Backup automatico con frequenza dichiarata.
- Un ripristino provato con esito scritto nel ticket.
- Nessun dato personale in chiaro fuori da Hermes.

## Out of scope

- Cambiare database o schema.
- Politica di conservazione e cancellazione (WF-026).
