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
