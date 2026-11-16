---
id: WF-028
title: Eseguire il backup del volume della waitlist su Hermes
parent: WF-MAP-001
labels: [wayfinder:task]
status: closed
assignee: claude
assignment: claudio
assignment_mode: flexible
blocked_by: []
---

# Eseguire il backup del volume della waitlist su Hermes

## Assignment comment

2026-11-15 — il PO (Manu) ha chiesto di assegnare a Claudio tutte le
decisioni e i compiti aperti del tracker, da sbrigare quando ha tempo.
Modalità `flexible`: chiunque può comunque lavorarci. Il ticket resta
`HITL: richiede accesso a Hermes` — è un compito operativo, non una
decisione: va fatto, non deciso.

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

## Resolution comment

2026-11-16 — eseguito su richiesta del PO (Manu/Claudio) via `ssh hermes`.

- **Meccanismo:** Hermes aveva già un backup notturno restic
  (`JirachiBotOrchestrator/backup/backup.sh`, cron 02:00, repo cifrato e
  staging su SSD esterno `/mnt/ssd/backups`, nessuna cancellazione automatica).
  Aggiunto il blocco NutriPro: dal container `nutripro-frontend-1`,
  `VACUUM INTO` su ogni `/data/*.sqlite` (waitlist e `nutra.sqlite`), copia in
  staging, poi snapshot. Non fatale: un errore è nel log, gli altri prodotti
  proseguono. Commit `3189b07` su `main` di Orchestrator.
- **Frequenza:** giornaliera, 02:00. **Destinazione:** SSD esterno, repo restic
  cifrato. **Conservazione:** tutti gli snapshot (deduplicati).
- **Prova:** backup + ripristino su DB di test (3 righe) in container con la
  stessa immagine: 3 righe, `integrity_check` ok. Esecuzione reale dello script:
  esito 0, snapshot `4f012672` con cartella `nutripro`, **vuota** perché il
  volume non contiene ancora DB. Ripristino da restic di un DB NutriPro reale
  da rifare quando ci saranno dati.
- **Fuori ambito:** copia offsite fuori dall'host. Il PO precisa che non ci
  saranno dati sanitari: se ne parla nei ticket di persistenza (WF-026, WF-030).

