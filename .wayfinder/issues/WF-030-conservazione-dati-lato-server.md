---
id: WF-030
title: Definire la conservazione sul server dei dati dei pazienti
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Definire la conservazione sul server dei dati dei pazienti

## Requirement comment

2026-10-18 — cambio di direzione del PO: i dati non restano più solo sul
telefono dell'utente, **il sistema conserverà tutto**. Il ticket dice cosa
significa «tutto», dove e a quali condizioni, perché la scelta sposta il
prodotto da «il piano non lascia il browser» a «NutriPro custodisce dati sulla
salute».

La nuova direzione **supera** le premesse di
[Archivio e gestione dei piani](WF-001-archivio.md) (archivio locale) e la
raccomandazione iniziale di
[Definire persistenza e dati condivisi con l'assistente](WF-003-dati.md)
(contesto minimo, identità separata). Va riconciliata, non ignorata.

## Stato attuale (verificato)

- Piani, spunte, acqua, olio, settaggi e stime nutrizionali stanno nel
  `localStorage` del browser, una chiave per account Google.
- Il server conosce solo `sub`, email e nome dell'account; non vede mai il piano.
- Il PDF originale non viene conservato.
- Hosting: container sul PC di casa «Hermes» (mini-PC self-hosted, citato nei
  workflow dell'Orchestrator), un solo database SQLite per la waitlist, nessun
  backup.
- Il README afferma che il piano non lascia il browser. La pagina privacy della
  landing non lo promette (ha solo segnaposto), ma l'app e il README sì.

## Cosa significa per i dati

Dati di salute (GDPR, art. 9): dieta prescritta, abitudini alimentari, peso e
misure se si aggiungeranno, forse documenti. Richiedono base giuridica specifica,
misure di sicurezza adeguate, registro dei trattamenti e probabilmente una
valutazione d'impatto.

## Decisioni aperte per il PO

Non sono decisioni prese.

1. **Perimetro di «tutto»**: piano strutturato, PDF originale, spunte e acqua,
   peso e misure, foto, conversazioni con l'assistente, impostazioni, cronologia
   dei piani. Il PDF originale si conserva o si tiene solo il piano letto?
2. **Chi vede cosa**: il paziente; il suo nutrizionista (con quale legame e con
   quale consenso revocabile); nessun altro, compreso il personale di NutriPro
   (accesso tecnico e registro degli accessi).
3. **Ruoli GDPR**: titolare del trattamento il nutrizionista o NutriPro? Per il
   paziente individuale è NutriPro. Serve un accordo con i professionisti
   (responsabile del trattamento). Vedi
   [Ottenere una consulenza legale su dati sanitari e ruoli GDPR](WF-034-consulenza-legale-dati-sanitari.md).
4. **Dove vivono i dati**: il mini-PC di casa è accettabile per dati sanitari
   di clienti paganti? Alternative: un server europeo gestito, un database
   gestito, cifratura a livello di campo. Sede dei dati (UE) e backup cifrati.
5. **Cifratura**: a riposo, in transito, e se un amministratore del sistema può
   leggere il piano (cifratura con chiave per utente o no).
6. **Conservazione e cancellazione**: per quanto tempo, cancellazione
   dell'account e dei dati su richiesta, esportazione dei propri dati
   (portabilità), cosa succede se il nutrizionista cessa l'abbonamento.
7. **Migrazione dai dati locali**: chi ha già i piani nel browser li carica sul
   server al primo accesso? Con consenso? Cosa si fa dei conflitti tra dispositivi.
8. **Offline**: l'app deve continuare a funzionare senza rete (copia locale +
   sincronizzazione) o richiede sempre il server?
9. **Gemini**: cosa cambia per l'assistente. Il piano già sul server può essere
   inviato a Google con il consenso per conversazione (decisione già presa) o
   serve di più? Il tier a pagamento diventa obbligatorio.
10. **Comunicazione**: README, informativa, landing e messaggi in app da
    riscrivere con la nuova promessa. Gli utenti che si sono fidati della
    versione «solo sul telefono» vanno avvisati.

## Acceptance criteria del ticket

- Elenco chiuso dei dati conservati, per ciascuno scopo, base giuridica,
  durata, chi può leggerlo.
- Decisione su dove vivono i dati e su cifratura e backup, con motivazione.
- Elenco dei documenti legali e delle revisioni di testo da produrre.

## Dependencies

- Blocca [Definire persistenza server, migrazioni e backup](WF-026-persistenza-migrazioni-backup.md)
  e ridefinisce [Definire persistenza e dati condivisi con l'assistente](WF-003-dati.md).
- Condiziona [Definire l'architettura di un backend leggero e robusto](WF-024-architettura-backend.md)
  e [Definire osservabilità e stato condiviso del backend](WF-027-osservabilita-stato.md).

## Out of scope

- Implementazione e scelta del fornitore (ticket successivi).
- Il modello di prezzo (ticket a parte).
