---
id: WF-004
title: Definire gestione della credenziale Gemini e limiti d’uso
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: closed
assignee: claude
assignment: claudio
assignment_mode: flexible
blocked_by: [WF-002, WF-003]
---

# Definire gestione della credenziale Gemini e limiti d’uso

## Assignment comment

2026-11-15 — il PO (Manu) ha chiesto di assegnare a Claudio tutte le
decisioni aperte (ticket `grilling`) del tracker, da sbrigare quando ha
tempo. Modalità `flexible`: chiunque può comunque lavorarci.

## Question

La credenziale Gemini appartiene al progetto o viene fornita da ogni utente?
Chi gestisce costi e quote, e quali limiti di utilizzo vuole il PO?

Requisito acquisito: Gemini 3.7 Flash e necessità di un token/credenziale.
Non è stata fornita alcuna chiave. Il login Google richiesto per NutriPro non
specifica automaticamente come ottenere accesso all’API Gemini.

Raccomandazione iniziale: credenziale di progetto gestita in un componente
server, con limiti d’uso concordati. Nessun segreto nel codice pubblico,
nei ticket o nei log. Questa è una proposta da discutere dopo canale e dati.

Una successiva ricerca dovrà verificare configurazione del progetto API,
abilitazione effettiva di `gemini-3.7-flash`, quote, costi e condizioni di
trattamento dei dati. La raccolta iniziale non effettua provisioning o chiamate.

## Updated model requirement - 2026-10-06

Il PO richiede ora una opzione Gemini gratuita e veloce ("turbo").
La vecchia indicazione 3.7 Flash non e una scelta tecnica confermata.
Verificare modello e quote ufficiali nella prossima sessione, tramite WF-010.

## Credential progress - 2026-10-06

PO ha creato/importato progetto Google, configurato APIkey e fatturazione come
richiesto e conferma "fatto". Chiave progetto nel .env locale ignorato, backend
soltanto. UsoFlash3.7 autorizzato; prima chiamata minima di verifica reale
riuscita, attivazione locale avvenuta. I limiti gia implementati sono5/min,
30/day/account e120/dayglobal; niente budgetfinanziario aggiuntivo concordato.
ProduzioneGemini ancora non configurata. Non esporre key nelle chat/documenti.

## Resolution comment

2026-11-16 — risposte reali del PO (Manu/Claudio) in sessione di grilling,
dopo la chiusura di [WF-003](WF-003-dati.md).

- **Credenziale:** di progetto, solo backend (`auth.env` su Hermes, mai nel
  frontend, in Git o nei log). Niente chiavi per utente.
- **Limiti d'uso:** invariati: 5/min, 30/giorno per account, 120/giorno globali,
  4 richieste concorrenti. Da rivedere con il modello di ricavo (WF-032).
- **Spesa:** il PO non ammette spese. Bisogna **prevenire il raggiungimento del
  tetto massimo di chiamate gratuite** di Gemini; non è stato fissato un budget.
- **Produzione:** Gemini resta disattivato finché WF-010 non è verificato con
  provider reale (oggi: 503 UNAVAILABLE di Google).

**Punti aperti emersi, non decisioni.**
1. I limiti del server (120/giorno globali) vanno confrontati con le quote
   gratuite ufficiali del modello in uso (`gemini-3.5-flash-lite`): non verificate
   in sessione. Se la quota gratuita è inferiore, i limiti vanno abbassati.
2. Conflitto con i termini Google: per client API disponibili a
   utenti SEE servono i Paid Services (nota 2026-10-06, WF-010). Il progetto ha già
   fatturazione attiva. «Nessuna spesa» e «utenti in Italia» potrebbero non essere
   compatibili con il solo tier gratuito. Da verificare in WF-010 prima
   dell'attivazione pubblica.
3. Prevenire il tetto implica un contatore che blocchi le chiamate prima della
   quota gratuita (oggi il contatore è in memoria e si azzera al riavvio).

