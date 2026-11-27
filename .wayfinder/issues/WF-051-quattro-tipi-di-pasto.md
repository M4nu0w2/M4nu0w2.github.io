---
id: WF-051
title: Implementare i quattro tipi di pasto
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: [WF-023]
---

# Implementare i quattro tipi di pasto

## Requirement comment

2026-11-27 — conseguenza delle decisioni del PO in
[Definire l'enum dei tipi di pasto](WF-023-tipi-di-pasto-enum.md) (vedi il suo
`Resolution comment`, che prevale su questo testo in caso di dubbio).

Oggi `MEAL_TYPES` in [src/lib/dietEngine.mjs](../../src/lib/dietEngine.mjs)
ha sette id con nome e icona propri, più `pasto_aggiuntivo_N`. Va ricondotto a
**quattro tipi** (Colazione, Spuntino, Pranzo, Cena) senza toccare gli id dei
pasti già salvati.

## Vincoli

- Un solo modulo condiviso con l'elenco dei tipi, usato da parser,
  interfaccia, lista della spesa, tracking e (in futuro) schema Gemini.
- **Id dei pasti invariati**: l'id è dentro la chiave delle voci e delle
  spunte (`item_<giorno>_<idPasto>_<n>`), locale e `plan_tracking`. Si
  aggiunge solo il tipo; `meta_mattina`, `merenda`, `spuntino_serale`,
  `pasto_aggiuntivo_N` → Spuntino.
- «Arco della giornata» non diventa un tipo di pasto: resta il blocco di
  indicazioni giornaliere che alimenta acqua e olio.
- Nome e ordine mostrati sono quelli del PDF.
- Pasto con nome non riconosciuto: scartato dall'import, con avviso
  nell'anteprima che dice quale pasto e quante voci non sono state importate.

## Acceptance criteria

- Elenco dei quattro tipi in un modulo unico, importato dove serve.
- Piani già salvati (locale e server) letti senza perdita di spunte; test
  che lo copre con un piano salvato con gli id attuali.
- Più spuntini nello stesso giorno restano pasti separati di tipo Spuntino.
- Nome sconosciuto scartato con avviso; test con almeno «Brunch».
- Elenco dei sinonimi riconosciuti per tipo mostrato al PO nella review.
- `npm test` e `npm run test:browser` verdi.

## Out of scope

- Interpretazione del PDF con Gemini (WF-021).
- Scenari 11, 12, 13, 19, 20 di WF-023, salvo che l'implementazione li tocchi:
  in quel caso segnalarli al PO, non decidere.

## Requirement update - 2026-11-27

Vedi `Resolution update` di WF-023: nome degli spuntini **calcolato** dalla
posizione (mattutino prima del pranzo, pomeridiano tra pranzo e cena, serale
dopo cena; numerati se più di uno nella stessa fascia; giorno senza pranzo
riferito a colazione e cena). Il nome originale del PDF resta nel dato, non
mostrato. Colazione, Pranzo e Cena con il nome del PDF.

Criteri aggiuntivi:
- test sui nomi calcolati: un solo spuntino per fascia, due nella stessa
  fascia, spuntino dopo cena, giorno senza pranzo;
- piani già salvati mostrano i nomi calcolati senza migrazione degli id.
