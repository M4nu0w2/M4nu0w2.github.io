---
id: WF-026
title: Definire persistenza server, migrazioni e backup
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: closed
assignee: claude
assignment: claudio
assignment_mode: flexible
blocked_by: [WF-003, WF-025, WF-030]
---

# Definire persistenza server, migrazioni e backup

## Assignment comment

2026-11-15 — il PO (Manu) ha chiesto di assegnare a Claudio tutte le
decisioni aperte (ticket `grilling`) del tracker, da sbrigare quando ha
tempo. Modalità `flexible`: chiunque può comunque lavorarci.

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

## Update from the PO's change of direction - 2026-10-18

La decisione 1 («i piani rimangono nel browser») è **superata**: il PO ha deciso
che il sistema conserva tutto sul server. Cosa si conserva, dove e con quali
garanzie si decide in
[Definire la conservazione sul server dei dati dei pazienti](WF-030-conservazione-dati-lato-server.md),
che ora blocca questo ticket. Di conseguenza anche database, migrazioni e
backup diventano un requisito di prodotto e non solo operativo.

## Resolution comment

2026-11-16 — risposte reali del PO (Manu/Claudio) in sessione di grilling,
dopo la chiusura di [WF-030](WF-030-conservazione-dati-lato-server.md) e
[WF-003](WF-003-dati.md).

1. **Cosa resta fuori dal server:** superata da WF-030 (piani, storico, spunte,
   acqua, olio sul server; PDF originale no).
2. **Database:** resta SQLite (`node:sqlite`, un file su volume `/data`) anche
   con i dati dei pazienti. PostgreSQL solo se serviranno più istanze o carico alto.
3. **Migrazioni:** file numerati in transazione con registro delle versioni
   (già in `server/store.cjs`). Se una migrazione fallisce: rollback e **il
   server non parte** (deploy visibilmente rosso, DB intatto). Per modifiche
   irreversibili: copia del file prima di migrare.
4. **Backup:** già fatto in [WF-028](WF-028-backup-volume-waitlist.md) (restic
   giornaliero 02:00 su SSD esterno, cifrato, tutti gli snapshot). Copia fuori
   host non richiesta (dati non sanitari, WF-030).
5. **Conservazione waitlist:** 12 mesi, poi eliminazione; cancellazione di una
   persona su richiesta, manuale.
6. **Lettura/esportazione della waitlist:** ogni iscrizione arriva per **email
   SMTP** all'indirizzo del progetto (implementato, commit `8646b28`,
   `WAITLIST_NOTIFY_TO`/`SMTP_*` in `.env.example`); si gestisce da lì. Nessuna
   pagina né script. In seguito: candidatura del nutrizionista gestita da una
   dashboard amministrativa, vedi [WF-050](WF-050-candidatura-nutrizionista-dashboard-admin.md).

**Da fare, non decisioni:** testo di conservazione a 12 mesi nella privacy
(`landing_page_nutripro/privacy/`); procedura di cancellazione su richiesta
scritta; configurare `SMTP_*` e `WAITLIST_NOTIFY_TO` su Hermes e provare l'invio
reale (non verificato, solo trasporto simulato nei test).

