---
id: WF-026
title: Definire persistenza server, migrazioni e backup
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: [WF-003, WF-025]
---

# Definire persistenza server, migrazioni e backup

## Question

Quali dati vivono lato server, in quale database, come cambia lo schema nel
tempo e come si fa il backup e il ripristino?

Oggi esiste una sola tabella (`waitlist`, SQLite su volume `/data`). Lo schema
viene creato con `CREATE TABLE IF NOT EXISTS` all'apertura: non esiste una
storia delle modifiche né un modo ordinato per cambiare una colonna.

## Stato attuale (verificato)

- File `waitlist.sqlite` sul volume Docker `nutripro-data`; il container gira
  come utente `node`. Nessun backup, nessuna verifica di ripristino.
- I piani dei pazienti NON sono sul server: stanno nel browser.
- Sessioni: cookie firmati, nessuna tabella.

## Decisioni aperte per il PO

Non sono decisioni prese.

1. **Cosa resta fuori dal server**: confermare che i piani rimangono nel browser
   finché [Definire persistenza e dati condivisi con l'assistente](WF-003-dati.md)
   non decide altrimenti. Questo ticket parte da quella risposta.
2. **Database**: restare su SQLite (con quale driver, dopo la ricerca in
   [Verificare lo stato di node:sqlite e le alternative leggere](WF-025-ricerca-sqlite-alternative.md))
   o passare a un database separato quando i dati utente arriveranno.
3. **Migrazioni**: file numerati applicati all'avvio, in transazione, con
   registro delle versioni; cosa succede se una migrazione fallisce.
4. **Backup**: frequenza, destinazione fuori dall'host, conservazione, cifratura,
   e prova di ripristino periodica. La waitlist contiene nomi ed email: sono
   dati personali.
5. **Conservazione e cancellazione**: per quanto tempo si tengono le candidature
   dopo la fase di test e come si cancella una persona su richiesta (diritto
   all'oblio). Va coerente con l'informativa privacy.
6. **Esportazione**: come il PO legge la lista oggi che non esiste un'area
   amministrativa (`/admin` non c'è più).

## Acceptance criteria del ticket

- Schema delle migrazioni deciso, con regola per le modifiche non reversibili.
- Procedura di backup e di ripristino scritta e provata una volta.
- Politica di conservazione dichiarata e riportata nella privacy.

## Out of scope

- Implementazione (ticket successivo).
- Compito operativo di backup del volume esistente, già tracciato in
  [Eseguire il backup del volume della waitlist su Hermes](WF-028-backup-volume-waitlist.md).
