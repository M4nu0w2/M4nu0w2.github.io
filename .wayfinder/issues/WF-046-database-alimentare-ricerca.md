---
id: WF-046
title: Database alimentare per macro e micronutrienti
parent: WF-MAP-001
labels: [wayfinder:research]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Database alimentare per macro e micronutrienti

## Requirement comment

2026-11-14 — proposta emersa dall'analisi della dashboard nutrizionista, da
confermare dal PO.

Nota di contesto, fatto verificato il 2026-11-14: le voci del piano
([src/lib/dietEngine.mjs](../../src/lib/dietEngine.mjs)) non hanno oggi alcun
valore nutrizionale associato (nessun campo calorie, macro o micronutrienti
nella struttura dati). Le uniche stime nutrizionali esistenti nel prodotto
sono quelle di
[Definire equivalenza nutrizionale delle sostituzioni rapide](WF-006-sostituzioni.md),
generate da Gemini al momento, non lette da un database.

## Vincoli

- Nessuna decisione presa in questo ticket: solo raccolta di informazioni.
- Il documento di output non deve contenere dati di pazienti reali.

## Acceptance criteria

- Documento in `docs/research/` che valuta almeno le fonti italiane note
  (per esempio CREA/BDA e altre reperibili) su: licenza d'uso (inclusa quella
  commerciale), copertura degli alimenti, formato dei dati, frequenza di
  aggiornamento.
- Confronto esplicito con l'approccio attuale (stime generate da Gemini,
  WF-006): quando un database strutturato sarebbe più accurato o più
  economico, quando no.
- Nessuna decisione di adozione: il documento informa una decisione futura,
  non la prende.

## Out of scope

- Integrare un database alimentare nel prodotto.
- Cambiare il comportamento delle sostituzioni rapide (WF-006, WF-013).
