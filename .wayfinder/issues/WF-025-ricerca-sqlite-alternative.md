---
id: WF-025
title: Verificare lo stato di node:sqlite e le alternative leggere
parent: WF-MAP-001
labels: [wayfinder:research]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Verificare lo stato di node:sqlite e le alternative leggere

## Question

`node:sqlite` è sufficientemente stabile per tenere dati reali (oggi la lista
dei nutrizionisti candidati), e quali sono le alternative leggere da confrontare?
Il ticket raccoglie fatti verificati su fonti primarie; non decide.

## Perché serve

Il backend usa `node:sqlite` (modulo incluso in Node 22) per `waitlist.sqlite`.
L'ho provato nel container e funziona, ma stampa un avviso di funzione
sperimentale. Il PO vuole un backend leggerissimo e robusto: serve sapere se la
base regge o se conviene un'altra scelta prima di costruirci sopra.

## Fatti da accertare (fonti: documentazione ufficiale di Node, SQLite e dei progetti)

1. Stato di stabilità di `node:sqlite` nelle versioni di Node 22 (LTS in uso,
   minimo `>=22.14`) e 24: sperimentale o stabile, cosa è cambiato, cosa è
   previsto, politica di compatibilità.
2. Differenze funzionali rilevanti: transazioni, WAL, backup online, estensioni,
   migrazioni, gestione degli errori e dei lock con accessi concorrenti.
3. Alternative da confrontare per peso e maturità: `better-sqlite3` (modulo
   nativo: build nell'immagine Alpine), driver per Postgres, altro.
4. Costi operativi: dimensione dell'immagine, RAM, necessità di compilare
   moduli nativi nel Dockerfile, aggiornamenti di sicurezza.
5. Strumenti di migrazione dello schema compatibili con ciascuna scelta.
6. Strategie di backup consistente di un file SQLite in uso (comando di backup
   online, copia a freddo, snapshot del volume).

## Acceptance criteria

- Tabella di confronto con fonte e data di verifica per ogni cella.
- Raccomandazione motivata per il caso d'uso attuale (waitlist) e per quello
  futuro (dati utente sul server), tenuti distinti.
- Elenco dei rischi che restano aperti.

## Output

Documento Markdown in `docs/research/` su un ramo `research/sqlite-alternative`,
con rimando dal ticket. Nessuna modifica al codice.

## Dependencies

Alimenta [Definire persistenza server, migrazioni e backup](WF-026-persistenza-migrazioni-backup.md)
e [Definire l'architettura di un backend leggero e robusto](WF-024-architettura-backend.md).
