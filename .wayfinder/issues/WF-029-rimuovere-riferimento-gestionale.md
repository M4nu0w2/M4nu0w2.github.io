---
id: WF-029
title: Rimuovere il riferimento al gestionale d'origine da prodotto, codice e documenti
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: closed
assignee: claude
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Rimuovere il riferimento al gestionale d'origine da prodotto, codice e documenti

## Requirement comment

2026-10-18 — richiesta del PO in sessione: il nome del gestionale da cui
provengono i PDF è **totalmente da togliere come riferimento**. 2026-10-19 —
conferma: «togli tutto, ovunque esista».

Obiettivo: nessun nome, marchio o riferimento a quel gestionale nell'interfaccia,
nel codice, nei test, nella CI e nei documenti del repository.

## Decisioni prese (assunzioni di Claude, da correggere se sbagliate)

1. Il formato dei PDF oggi letto **resta supportato**, con nomi neutri: senza
   parser l'app non importerebbe nulla. Funzioni `parseDietPdf` e `getSampleDiet`.
2. Il filtro che scartava intestazioni e piè di pagina per nome è sostituito da una
   regola generica: righe con indirizzi web (`www.`, `http(s):`) o il simbolo `©`.
3. Nei documenti storici (HANDOFF, ticket) il nome è sostituito da
   «il gestionale d'origine». La **cronologia di git non è riscritta**: i messaggi
   dei commit passati possono ancora contenerlo. Riscriverla richiede una
   decisione esplicita del PO.
4. Variabile del test sul PDF reale: `REFERENCE_PDF`; file
   `tests/reference-pdf.e2e.cjs`.

## Resolution comment

2026-10-19 — Claude.

- Interfaccia: pulsante «Carica Piano di Prova», sorgente «Piano di prova»,
  metadati «Piano Alimentare (Demo)» e «File PDF».
- Codice: funzioni rinominate, commenti neutri; regola sulle intestazioni sostituita.
- Test: file e variabile rinominati, selettori aggiornati.
- CI, README, HANDOFF e ticket aggiornati. Ricerca senza distinzione tra
  maiuscole e minuscole nei file tracciati: nessun risultato, salvo cronologia git.
- Verifiche: test del server e del browser (vedi sotto nel commit).

**Rischio residuo, non verificabile da me**: il vecchio filtro riconosceva anche la
riga con il nome del gestionale nei PDF reali. Il PDF di riferimento è privato e
non è nel repository, quindi non ho potuto provare che la nuova regola generica
scarti la stessa riga. Prima del prossimo rilascio del parser va eseguito a mano
`tests/reference-pdf.e2e.cjs` con `REFERENCE_PDF` sul PDF reale.

## Out of scope

- Riscrivere la cronologia di git.
- Cambiare il comportamento del parser o supportare altri template (vedi
  [Comprendere i pasti di qualsiasi PDF con Gemini, a prescindere dal template](WF-021-comprensione-pdf-gemini.md)).
