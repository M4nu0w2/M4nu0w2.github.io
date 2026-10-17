---
id: WF-021
title: Comprendere i pasti di qualsiasi PDF con Gemini, a prescindere dal template
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: [WF-010]
---

# Comprendere i pasti di qualsiasi PDF con Gemini, a prescindere dal template

## Requirement comment

2026-10-17 — richiesta in sessione (PO). Oggi il parser (`parseProgeoPdf` in
`src/lib/dietEngine.mjs`) riconosce solo il template Progeo Medical: intestazioni
di pasto cercate per parola chiave a riga intera, tabelle e appendice attese in
una forma precisa. Un PDF di un altro gestionale o con altro impaginato non
viene capito.

Obiettivo: rendere la comprensione dei pasti **indipendente dal template**
usato da qualsiasi utente, usando il Gemini integrato (WF-010).

Perimetro dell'input, deciso dal PO: **solo PDF testuali**, senza foto né
bitmap. Quindi lettura del testo statico del PDF, **non** OCR su immagini.
I PDF scansionati o fotografati sono fuori ambito e vanno rifiutati con un
messaggio chiaro, non elaborati.

Requisito funzionale: distinguere sempre i pasti principali, con questa
tassonomia canonica a sei slot:

1. Colazione
2. Merenda o spuntino (mattina)
3. Pranzo
4. Merenda o spuntino (pomeriggio)
5. Cena
6. Spuntini extra

Il resto del piano (alimenti, quantità, alternative, giorni) deve continuare a
produrre la stessa struttura dati già consumata da Home, spesa, tracking e
archivio, così che il resto dell'app non cambi.

## Context

- Il testo si estrae già nel browser con `pdf.js`; i PDF di partenza hanno
  testo selezionabile, quindi l'estrazione non richiede OCR.
- Mappatura attuale degli id di pasto nel codice: `colazione`, `meta_mattina`,
  `pranzo`, `merenda`, `cena`, `spuntino_serale`, `arco_giornata`. Sette id
  contro i sei slot richiesti: va deciso dove confluiscono `spuntino_serale` e
  `arco_giornata` e se gli id esistenti nei piani già salvati vengono migrati
  o mantenuti.
- Il parser deterministico attuale è testato e preciso sul template Progeo;
  non va peggiorato. Il PDF reale di riferimento resta privato
  (`REAL_PROGEO_PDF`), non nel repository.

## Decisioni aperte per il PO

Non sono decisioni prese; vanno risolte prima dell'implementazione.

1. **Privacy: cosa viene inviato a Google.** Oggi, per WF-002 e per il codice
   di `/api/chat`, nessun piano o PDF viene mai inviato a Gemini, e il piano
   non lascia il browser. Questa funzione invierebbe a Google il **testo del
   PDF**, che contiene dati personali e di salute (nome del paziente, fabbisogni,
   indirizzo dello studio). Servono: consenso esplicito per import, minimizzazione
   (rimuovere intestazione/anagrafica prima dell'invio?), e conferma che
   l'attivazione pubblica richiede `GEMINI_ACCESS_MODE=paid-services` per
   client SEE (vedi WF-010).
2. **Architettura.** Gemini sostituisce il parser, oppure è un **fallback**
   quando il parser Progeo non riconosce abbastanza pasti? Raccomandazione da
   valutare: parser deterministico per primo, Gemini solo se la copertura è
   sotto soglia.
3. **Dove gira la chiamata.** Il browser non può avere la chiave: serve un
   endpoint backend autenticato (CSRF, Origin) con limiti propri, separato dal
   rate limit della chat (5/min, 30/giorno per account) che è troppo stretto.
4. **Tassonomia.** Dove vanno `spuntino_serale` e `arco_giornata` (condimenti,
   acqua): dentro «Spuntini extra» o restano slot a parte? Cosa succede a un
   piano con più di due spuntini al giorno o con pasti con nomi liberi?
5. **Affidabilità.** L'output di un LLM può sbagliare quantità o saltare
   alimenti. Serve uno schema di risposta rigido (JSON validato), un passaggio
   di **revisione da parte dell'utente** prima di salvare il piano e un
   confronto con il testo originale. Quanto dev'essere obbligatoria la revisione?
6. **Dimensioni e costi.** Limite di pagine/caratteri del PDF accettato,
   timeout (oggi 20 s, probabilmente insufficiente), gestione di quota
   esaurita senza retry automatici.
7. **Conversioni.** Le regole su cucchiai, bicchieri e legumi secchi restano
   nel codice deterministico applicate dopo l'estrazione, oppure le interpreta
   il modello? Raccomandazione da valutare: solo il codice, per risultati
   ripetibili.

## Acceptance criteria

- Un PDF testuale con template diverso da Progeo produce un piano con i pasti
  assegnati ai sei slot canonici, senza modifiche al resto dell'app.
- Un PDF Progeo continua a produrre lo stesso risultato di oggi (nessuna
  regressione sui test esistenti in `tests/shopping-list.test.cjs`).
- Un PDF privo di testo (scansione o immagine) viene rifiutato con messaggio
  chiaro; non si tenta OCR.
- La risposta del modello è validata contro uno schema; risposta malformata,
  timeout o quota esaurita non salvano un piano parziale e lasciano il piano
  attivo intatto.
- L'utente vede e può correggere il risultato prima del salvataggio.
- Nessun invio a Google senza consenso esplicito dell'utente per quell'import;
  nessun dato anagrafico nel payload se la minimizzazione viene approvata.
- Chiave solo sul server; endpoint autenticato con CSRF e Origin; limiti propri.
- Test con provider simulato (nessuna chiamata reale in CI), inclusi PDF di
  almeno due template diversi costruiti ad hoc **senza dati personali reali**.
- `npm test` e `npm run test:browser` verdi.

## Dependencies

- WF-010 aperto: integrazione Gemini non ancora verificata con provider reale.
  Questo ticket non parte finché il canale Gemini non è attivabile.
- Decisione sul tier a pagamento per client SEE.

## Out of scope

- OCR e PDF come immagini.
- Modifica delle conversioni nutrizionali o delle sostituzioni (WF-006).
- Conservare il PDF originale o inviarlo al server.
