---
id: WF-050
title: Candidatura del nutrizionista e dashboard amministrativa per approvazione e gestione utenze
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Candidatura del nutrizionista e dashboard amministrativa per approvazione e gestione utenze

## Requirement comment

2026-11-16 — richiesta del PO (Manu/Claudio) durante la chiusura di
[WF-026](WF-026-persistenza-migrazioni-backup.md). Oggi il modulo della landing
manda solo una mail riepilogativa al progetto (`WAITLIST_NOTIFY_TO`) e salva la
riga in `waitlist.sqlite`. **In seguito** un nutrizionista potrà candidarsi, e
la candidatura sarà gestita da una **dashboard amministrativa** per approvarlo
e poi gestirne e monitorarne l'utenza. Non va fatto ora.

## Stato attuale (verificato)

- Modulo landing → `POST /api/waitlist`: nome, email, ruolo, numero pazienti,
  consenso. Tabella `waitlist` separata da `roles`; nessuno stato di
  approvazione.
- Ruoli (`roles`, `role_grants`) e `POST /api/admin/roles` esistono; «admin» è
  l'email in `ALLOWED_EMAILS` (lista vuota = tutti admin). Nessuna interfaccia:
  il primo nutrizionista si abilita a mano con una POST.
- Nessun elenco utenze né indicatori per l'amministratore.

## Decisioni aperte per il PO

Non sono decisioni prese.

1. **Ciclo della candidatura**: stati (in attesa, approvata, rifiutata,
   sospesa) e se approvare crea da sola il ruolo `nutritionist` e manda un
   invito per email.
2. **Chi è amministratore**: chi, come si definisce (oggi `ALLOWED_EMAILS`),
   accesso separato dall'app del nutrizionista.
3. **Gestione utenza**: cosa vede l'admin (nutrizionisti, numero di pazienti,
   ultimo accesso, compliance aggregata) e cosa può fare (sospendere, riattivare,
   cancellare un account e i suoi dati, WF-030).
4. **Monitoraggio**: quali indicatori, in relazione a
   [WF-048](WF-048-agenda-indicatori-business.md).
5. **Dati dei pazienti**: se l'admin vede i pazienti di un nutrizionista oppure
   solo conteggi (WF-030: i dati sono visibili a paziente e suo nutrizionista).
6. **Migrazione delle iscrizioni**: le righe già in `waitlist` diventano
   candidature o restano un elenco a parte.

## Acceptance criteria

- Da definire dopo le risposte del PO.

## Out of scope

- Pagamenti e piani a pagamento ([WF-032](WF-032-modello-di-ricavo.md)).
