---
id: WF-032
title: Definire il modello di ricavo e i due piani a pagamento
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Definire il modello di ricavo e i due piani a pagamento

## Question

Che cosa compra il nutrizionista, che cosa compra il paziente individuale, a quale
prezzo e con quali limiti, e come si evita che le due offerte si facciano
concorrenza?

Richiesta del PO (2026-10-18): il prodotto deve essere pagato **sia dal
nutrizionista con un piano ad hoc, sia dal paziente individuale con un piano ad
hoc**. I dettagli sono da decidere.

## Contesto

- Oggi tutto è gratuito e senza piani; la landing raccoglie candidati tester.
- Dall'analisi dei concorrenti: i gestionali per professionisti (ad esempio
  Nutrium) vendono per professionista al mese, i tracker consumer per
  abbonamento annuale al paziente. I prezzi trovati sono di terze parti e non
  verificati: vanno controllati sui siti ufficiali prima di decidere.
- Il costo per noi cresce con l'uso dell'assistente Gemini, con i dati sul server
  e con il supporto.

## Decisioni aperte per il PO

Non sono decisioni prese.

1. **Piano nutrizionista**: unità di prezzo (a studio, a professionista, a
   paziente attivo), soglie, cosa include (pazienti collegati, report, marchio
   dello studio, assistente), prova gratuita.
2. **Piano paziente individuale**: gratuito con limiti o solo a pagamento; cosa
   include (piani multipli, assistente, sincronizzazione, esportazioni).
3. **Paziente che arriva da un nutrizionista**: paga lui, paga lo studio o è
   incluso nel piano dello studio? E se il nutrizionista smette di pagare?
4. **Coerenza**: chi ha il piano individuale e poi si collega a un nutrizionista.
5. **Pagamenti**: fornitore, fatturazione elettronica, IVA, gestione di rimborsi
   e disdette. Serve un commercialista.
6. **Fase beta**: gratuito per i tester con una data di fine dichiarata?
7. **Limiti d'uso** dell'assistente per piano, coerenti con i costi di Gemini.

## Acceptance criteria del ticket

- Tabella dei due piani con prezzo ipotizzato, contenuto e limiti.
- Regole sul collegamento nutrizionista-paziente e sulla cessazione.
- Elenco delle verifiche di prezzo da fare sui concorrenti.

## Dependencies

- Dipende in parte da [Definire la conservazione sul server dei dati dei pazienti](WF-030-conservazione-dati-lato-server.md)
  (cosa il nutrizionista può vedere) e da
  [Scegliere il nome del prodotto](WF-031-nome-del-prodotto.md) per la pagina prezzi.
- I numeri veri arrivano da
  [Raccogliere campioni di PDF e feedback dai nutrizionisti tester](WF-033-feedback-nutrizionisti-tester.md).

## Out of scope

- Implementare i pagamenti.
