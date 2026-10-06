---
id: WF-009
title: Consultare lo storico dei piani senza cambiare il piano attivo
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: closed
assignee: codex
assignment: null
assignment_mode: flexible
blocked_by: []
resolved: 2026-10-06
---

# Consultare lo storico dei piani senza cambiare il piano attivo

## Requirement comment

2026-10-06 — il PO richiede un ticket dedicato allo storico consultabile.
Un nuovo piano archivia il precedente senza cancellarlo. Ogni piano può essere
attivo o inattivo e soltanto uno può essere attivo in un dato momento.
WF-001 introduce il salvataggio dei piani e i comandi di attivazione.

## Destination

Una schermata Storico accessibile dalla home permette di aprire un piano vecchio
per confrontare pasti e quantità, mantenendo il piano attualmente attivo.
Esempio: consulto settembre mentre ottobre resta il piano della home.

## Acceptance criteria

- Elenco dei piani ordinato dal caricamento più recente, con nome, date e stato
  testuale Attivo/Inattivo. Le sostituzioni mostrano anche la data di aggiornamento.
- Consultazione dei giorni, pasti e quantità del piano selezionato in sola
  lettura; nessuna modifica implicita al piano attivo o ai suoi tracking.
- Azione esplicita Rendi attivo, distinta da Apri: l'attivazione disattiva il
  precedente senza cancellarlo. Possibile disattivare il piano attivo.
- Ritorno alla home del piano attivo; se nessuno è attivo, invito a sceglierne
  uno o caricarne uno nuovo. Stato vuoto e errori leggibili.
- I dati appartengono all'account autenticato; nessun piano di altri account
  viene mostrato. Eventuale sincronizzazione è separata da questa schermata.
- La sostituzione distruttiva non crea una versione storica del contenuto
  sostituito, come indicato dalle due conferme di WF-001.

## Scope

Il menu Gestisci piani già consente di scegliere quale piano è attivo.
Questo ticket aggiunge la consultazione degli inattivi senza riattivarli.
Ricerca, confronti affiancati, esportazione del PDF sorgente, eliminazione e
versionamento delle sostituzioni non sono richiesti e vanno concordati a parte.

## Development checks

- Aprire un inattivo non cambia activeId né spunte/acqua.
- Attivare un vecchio piano ripristina i suoi dati e rende inattivo il precedente.
- Nessun piano attivo, archivio vuoto, titolo lungo, schermo mobile e navigazione
  da tastiera mantengono comandi accessibili e un'uscita chiara.

## Implementation - 2026-10-06

Frontend React completo con Vite e React Router. `/plans` elenca i piani dal
piu recente e offre ricerca e filtri. `/plans/:id` mostra giorni, pasti e
alternative senza mutare il tracking o activeId. Attivazione/disattivazione
esplicite; nuovo PDF e sostituzione con due conferme restano disponibili.
La richiesta successiva del PO autorizza la nuova pagina e il refactor.
Verifiche locali unitari e browser; nessun deploy.
