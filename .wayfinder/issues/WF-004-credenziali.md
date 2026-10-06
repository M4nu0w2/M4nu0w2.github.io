---
id: WF-004
title: Definire gestione della credenziale Gemini e limiti d’uso
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: [WF-002, WF-003]
---

# Definire gestione della credenziale Gemini e limiti d’uso

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
