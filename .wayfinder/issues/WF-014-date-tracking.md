---
id: WF-014
title: Definire come conservare le date reali del tracking
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: closed
assignee: null
assignment: claudio
assignment_mode: flexible
blocked_by: []
---

# Definire come conservare le date reali del tracking

## Assignment comment

2026-11-15 — riassegnato da `manu` a `claudio`: il PO ha chiesto di
assegnare a Claudio tutte le decisioni aperte (ticket `grilling`) del
tracker, da sbrigare quando ha tempo. Modalità `flexible`: chiunque può
comunque lavorarci.

## Question

Come registrare spunte, acqua e quantità effettive per data di calendario,
invece che per giorno della settimana del piano, restando solo in locale?

Fatto verificato il 2026-10-10: oggi il tracking del **piano attivo** è salvato
per chiave del giorno del piano (`lun`, `mar`, …) in `checked[day]` e
`water[day]` dentro `diet_plan_archive:<sub>`. Non esiste una data reale: il
lunedì successivo riusa le spunte del lunedì precedente e non si può ricostruire
uno storico per data. Il calendario aderenza ne dipende.

Da concordare:

- Formato della data (giorno locale del dispositivo) e fuso orario; cosa accade
  a cavallo della mezzanotte e cambiando dispositivo o fuso.
- Relazione fra data reale e giorno del piano: il menu resta per giorno della
  settimana.
- Destino dello storico esistente senza date: conservarlo come non datato,
  assegnarlo all'ultima settimana o escluderlo dalla vista calendario.
- **Piano attivo** e **piano inattivo**: il tracking datato resta legato al
  piano su cui è stato registrato.
- Limite di conservazione e dimensione in localStorage.
- Effetto sui **tracking opzionali** di
  [Implementare pagina settaggi e tracking opzionali](WF-011-settaggi-implementazione.md)
  e [Rendere configurabile l'obiettivo dell'acqua](WF-012-obiettivo-acqua.md),
  se implementati prima.

Vincoli: solo localStorage per `sub`, revisione dell'archivio rispettata,
nessuna nuova chiamata di rete; migrazione senza perdita dei dati esistenti.

## Progress note - 2026-11-14

Fatto verificato il 2026-11-14: con la dashboard nutrizionista
([HANDOFF.md](../../HANDOFF.md), sezione «Dashboard nutrizionista multi-tenant»),
esiste ora anche un tracking per data sul server (`plan_tracking` in
[server/store.cjs](../../server/store.cjs)), con lo stesso problema qui
descritto ma lato server: chiave per giorno della settimana, non per data
reale. La formulazione di questo ticket ("restando solo in locale") precede
quella persistenza e non copre più l'intero perimetro del problema.

Non ho deciso nulla al posto del PO: ho aperto
[Tracking per data reale anche sul server](WF-042-tracking-data-reale-server.md),
bloccato da questo ticket, che aspetta la decisione qui annotata prima di
procedere. Il perimetro di questo ticket (solo locale, o anche server) resta
una decisione del PO da aggiornare in questo stesso ticket.

## Progress note - 2026-11-27

Il PO ha chiarito che ogni data dell'anno ha spunte proprie, indipendenti
anche da altre date con lo stesso giorno della settimana. Ha confermato
che acqua e olio seguono la stessa regola, con contatori separati per data.
Restano da decidere fuso orario, dati esistenti senza data, conservazione e
perimetro locale/server. Il ticket rimane aperto.

2026-11-27 — Il PO conferma la data italiana anche all’estero. Le vecchie
spunte senza data restano conservate senza attribuzione a una data.

## Resolution comment

2026-11-27 — Il PO conferma tracking per data reale sia locale sia server.
Spunte, acqua e olio sono distinti per ogni data italiana, anche all’estero.
Le vecchie spunte senza data restano conservate senza attribuzione a date.
Lo storico si conserva fino a richiesta di cancellazione; il limite tecnico
della copia locale va verificato in implementazione. Il tracking resta
associato al piano su cui è stato registrato.
