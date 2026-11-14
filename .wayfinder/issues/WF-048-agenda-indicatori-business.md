---
id: WF-048
title: Agenda e indicatori di business del nutrizionista
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: open
assignee: null
assignment: claudio
assignment_mode: flexible
blocked_by: [WF-042]
---

# Agenda e indicatori di business del nutrizionista

## Assignment comment

2026-11-15 — il PO (Manu) ha chiesto di assegnare a Claudio tutte le
decisioni aperte (ticket `grilling`) del tracker, da sbrigare quando ha
tempo. Modalità `flexible`: chiunque può comunque lavorarci.

## Requirement comment

2026-11-14 — proposta emersa dall'analisi della dashboard nutrizionista, da
confermare dal PO.

Bloccato da [Tracking per data reale anche sul server](WF-042-tracking-data-reale-server.md):
indicatori come retention o tempo medio richiedono una serie temporale che
oggi non esiste sul server (il tracking è per giorno della settimana, non
per data).

## Decisioni aperte per il PO

Non sono decisioni prese.

1. **Quali indicatori**: retention a 30/90 giorni, appuntamenti saltati,
   fatturato per mese e per paziente, tempo medio di creazione di un piano —
   tutti, o un sottoinsieme prioritario?
2. **Da quale fonte**: fatto verificato il 2026-11-14, oggi non esiste
   un'agenda appuntamenti né alcun dato di fatturazione nel prodotto. Se gli
   indicatori scelti dipendono da questi dati, servono prima quelle feature
   (fuori dal perimetro di questo ticket) o si misura solo ciò che è già
   disponibile (accessi, compliance)?
3. **Rapporto con il modello di ricavo**: [Definire il modello di ricavo e i
   due piani a pagamento](WF-032-modello-di-ricavo.md) non è ancora deciso;
   indicatori come "fatturato per paziente" presuppongono quella decisione.
4. **Rapporto con la conservazione dati**: [Definire la conservazione sul
   server dei dati dei pazienti](WF-030-conservazione-dati-lato-server.md)
   decide cosa si può conservare e per quanto tempo; gli indicatori storici
   non possono eccedere quel perimetro.

## Acceptance criteria del ticket

- Risposte annotate alle quattro domande sopra.
- Elenco chiuso degli indicatori da costruire in una prima versione.

## Out of scope

- Implementazione: ticket successivo, dopo le risposte.
- Creare un'agenda appuntamenti o un modulo di fatturazione: se servono,
  sono ticket propri, non parte di questo.
