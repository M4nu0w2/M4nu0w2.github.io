---
id: WF-030
title: Definire la conservazione sul server dei dati dei pazienti
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: closed
assignee: claude
assignment: claudio
assignment_mode: flexible
blocked_by: []
---

# Definire la conservazione sul server dei dati dei pazienti

## Assignment comment

2026-11-15 — il PO (Manu) ha chiesto di assegnare a Claudio tutte le
decisioni aperte (ticket `grilling`) del tracker, da sbrigare quando ha
tempo. Modalità `flexible`: chiunque può comunque lavorarci.

Nota per chi riprende il ticket: una sessione di grilling era stata avviata
in chat il 2026-11-14 su un primo giro di 5 domande (perimetro dati, dove
vivono i dati, ruoli GDPR, chi vede cosa, offline) con raccomandazioni
proposte, mai risposte né annotate qui. Non è uno stato del ticket: va
ripresa da zero o ignorata, a scelta di chi la lavora.

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

## Resolution comment

2026-11-16 — risposte reali del PO (Manu/Claudio) in sessione di grilling.

| # | Decisione | Risposta |
| :-- | :-- | :-- |
| 1 | Natura dei dati | **Non sanitari** (scelta del PO; rischio annotato sotto) |
| 1 | Perimetro «tutto» | Piano strutturato + storico dei piani + spunte, acqua, olio. **Esclusi**: PDF originale (resta nel browser), peso/misure/foto/conversazioni (non esistono ancora) |
| 2 | Chi vede cosa | Paziente + suo nutrizionista. Staff NutriPro solo accesso tecnico eccezionale |
| 3 | Ruoli GDPR | Nutrizionista titolare, NutriPro responsabile (accordo coi professionisti). Paziente individuale: NutriPro titolare |
| 4 | Dove vivono i dati | Hermes (mini-PC di casa) + backup restic su SSD (WF-028) |
| 5 | Cifratura | Solo HTTPS + backup restic cifrati. Niente disco cifrato né cifratura per campo |
| 6 | Cancellazione/export | Cancellazione su richiesta + export JSON del proprio piano |
| 7 | Migrazione dal locale | Nessuna: gli utenti con dati solo nel browser sono test |
| 8 | Offline | Copia locale + sincronizzazione al ritorno online |
| 9 | Gemini | Invariato (WF-002): invio del piano solo con consenso per conversazione. Non ridiscusso in sessione |
| 10 | Comunicazione | Conseguenza, non scelta: README e informativa vanno riscritti («il piano non lascia il browser» è falso per i pazienti con nutrizionista) |

**Rischio annotato.** Il PO considera i dati non sanitari. Un piano dietetico
prescritto da un professionista rientra di norma nell'art. 9 GDPR. Se
[WF-034](WF-034-consulenza-legale-dati-sanitari.md) lo qualifica sanitario,
cadono: cifratura (punto 5), hosting casalingo senza offsite (punto 4), base
giuridica e DPA. Decisioni da rivedere in quel caso.

**Da fare, non decisioni.** README e informativa riscritti; titolare del
trattamento e «Conservazione e diritti» in `landing_page_nutripro/privacy/`;
endpoint di cancellazione ed export JSON; sincronizzazione offline del tracking
(oggi POST fire-and-forget senza coda); copia offsite rimandata a WF-026.

