---
id: WF-042
title: Tracking per data reale, locale e server
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: [WF-014]
---

# Tracking per data reale, locale e server

## Requirement comment

2026-11-14 — proposta emersa dall'analisi della dashboard nutrizionista, da
confermare dal PO.

Fatto verificato il 2026-11-14: la tabella `plan_tracking` in
[server/store.cjs](../../server/store.cjs) ha chiave primaria
`(patient_sub, plan_id, day, field)`, con `day` un giorno della settimana
(`lun` … `dom`, le stesse chiavi di `DAY_KEYS`). Il lunedì successivo
sovrascrive le spunte del lunedì precedente: non esiste uno storico per data
di calendario, né un trend di compliance nel tempo, né una base per
retention/cancellazione per periodo.

[Definire come conservare le date reali del tracking](WF-014-date-tracking.md)
discute lo stesso problema ma lo inquadra "restando solo in locale" (vedi la
sua `## Question`): quella formulazione precede la dashboard nutrizionista e
la persistenza server introdotta con questa, quindi non copre più l'intero
perimetro del problema. Non è compito di questo ticket cambiare la decisione
di WF-014 — lo segnalo come commento in quel ticket (vedi `Progress note`),
la decisione sul perimetro resta al PO.

## Vincoli

- Bloccato da WF-014: il formato della data e il fuso orario vanno decisi lì
  (o nella sua versione aggiornata), non reinventati qui per il solo lato
  server.
- Migrazione versionata (coerente con `MIGRATIONS` in
  [server/store.cjs](../../server/store.cjs)), retrocompatibile con le righe
  esistenti che hanno solo il giorno della settimana.
- Le API `GET /api/nutritionist/patients/:id/compliance`, `GET /api/plan` e
  `POST /api/tracking` vanno aggiornate in modo coerente con la stessa scelta
  di formato.

## Acceptance criteria

- Migrazione versionata che aggiunge la colonna data, con test di migrazione
  che copre i dati esistenti (solo giorno della settimana, senza data).
- API paziente e nutrizionista aggiornate per leggere/scrivere con data reale.
- `npm test` verde.

## Out of scope

- Il formato della data e il fuso orario (WF-014).
- Vista di calendario, streak o badge (WF-015, WF-016, WF-043): questo ticket
  prepara solo i dati.

## Scope update - 2026-11-27

[WF-014](WF-014-date-tracking.md) chiuso dal PO: perimetro **locale + server**,
spunte/acqua/olio distinti per data italiana (Europe/Rome, anche all'estero),
tracking legato al piano su cui è registrato, storico conservato fino a
richiesta di cancellazione. Questo ticket copre ora anche la migrazione del
localStorage (`checked[day]`/`water[day]` in `diet_plan_archive:<sub>`).
Le spunte esistenti senza data **restano conservate senza attribuzione a una
data** (né in locale né in `plan_tracking`), fuori dal calendario. Nessun
limite alla modifica dei giorni passati (confermato dal PO il 2026-11-27).
Limite tecnico della copia locale da verificare qui. Le voci «formato della
data e fuso» in `Out of scope` sono ora decise in WF-014.
