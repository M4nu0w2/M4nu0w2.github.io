---
id: WF-037
title: Giorno "oggi" del server nel fuso corretto
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: closed
assignee: claude
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Giorno "oggi" del server nel fuso corretto

## Requirement comment

2026-11-14 — proposta emersa dall'analisi della dashboard nutrizionista, da
confermare dal PO.

Ipotesi (da verificare): `dayKeyFor` in
[server/store.cjs](../../server/store.cjs) (riga 16) calcola il giorno con
`new Date(now).getDay()`, che dipende dal fuso orario del processo Node, non
da quello del paziente o del nutrizionista. Fatto verificato il 2026-11-14: il
[Dockerfile](../../Dockerfile) (riga 27) non imposta `TZ`; senza quella
variabile un container Node tipicamente gira in UTC. Tra la mezzanotte e l'una
di notte in Italia (CET/CEST), il server potrebbe quindi considerare "oggi"
ancora il giorno precedente rispetto a chi guarda l'app dal browser.

Questo giorno è usato da `GET /api/nutritionist/patients` e
`GET /api/nutritionist/patients/:id` per calcolare la compliance "di oggi"
mostrata al nutrizionista.

## Vincoli

- Primo criterio di accettazione: riprodurre il disallineamento con un test
  che inietta `now()` a un orario nella finestra sospetta (es. 00:30 ora
  italiana), prima di proporre qualunque correzione.
- Soluzione provvisoria proposta: `TZ=Europe/Rome` nel Dockerfile — da
  confermare, non da applicare come decisione già presa.
- Soluzione definitiva (fuso del paziente, gestione del cambio di mezzanotte)
  va raccordata con
  [Definire come conservare le date reali del tracking](WF-014-date-tracking.md),
  che tratta lo stesso tema lato client: non duplicare la decisione, allinearla.

## Acceptance criteria

- Test che riproduce il problema con `now()` iniettato, prima della modifica.
- Correzione che rende coerente il giorno "di oggi" lato server con quello
  percepito in Italia, oppure nota esplicita se si rimanda la soluzione
  definitiva a WF-014.
- `npm test` verde.

## Out of scope

- Gestire fusi orari diversi dall'Italia: il prodotto è oggi solo in italiano,
  per un pubblico italiano.
- Il formato della data per il tracking storico (WF-014, WF-042).

## Resolution comment

2026-11-16 — implementato. Confermato il disallineamento: `TZ=UTC node -e
"new Date(Date.UTC(2026,10,8,23,30)).getDay()"` restituisce `0` (domenica)
per un istante che in Italia è già lunedì 00:30. `dayKeyFor` in
[server/store.cjs](../../server/store.cjs) ora calcola il giorno con
`Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Rome', weekday: 'short' })`,
indipendente dal fuso del processo: niente da impostare nel Dockerfile, la
soluzione provvisoria `TZ=Europe/Rome` non serve più. Test di regressione in
[tests/store.test.cjs](../../tests/store.test.cjs) che esegue `dayKeyFor` in
processi figli con `TZ` rispettivamente `UTC`, `Europe/Rome` e
`America/New_York`, sempre con lo stesso risultato corretto. `npm test`
99/99 verde. Non toccato [WF-014](WF-014-date-tracking.md) (fuso del
paziente, cambio di mezzanotte lato client): resta un ticket distinto,
assegnato a Claudio.
