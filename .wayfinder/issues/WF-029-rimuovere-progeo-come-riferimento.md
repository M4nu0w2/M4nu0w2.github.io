---
id: WF-029
title: Rimuovere Progeo come riferimento da prodotto, codice e documenti
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Rimuovere Progeo come riferimento da prodotto, codice e documenti

## Requirement comment

2026-10-18 — richiesta in sessione (PO): Progeo è **totalmente da togliere come
riferimento**. Il prodotto non deve più presentarsi, nominarsi o descriversi
come legato a Progeo Medical né ai suoi PDF.

Obiettivo: nessun nome, marchio o riferimento a Progeo in ciò che vede
l'utente, il nutrizionista o un visitatore della landing, e nessun riferimento
nel codice e nei documenti che non sia strettamente necessario.

## Dove compare oggi (verificato)

- **Interfaccia**: voce «Carica Piano di Prova Progeo» nell'importazione e testi
  collegati in `src/App.jsx`; funzioni `parseProgeoPdf` e `getSampleProgeoDiet`.
- **Motore** (`src/lib/dietEngine.mjs`, 9 occorrenze): nomi delle funzioni,
  commenti, e soprattutto un'espressione che **scarta le righe di intestazione
  e piè di pagina del PDF** contenenti «progeo medical» (tra le parole
  filtrate come metadati). Rimuoverla alla cieca farebbe finire quel testo tra
  gli alimenti.
- **Test**: un file dedicato (`tests/progeo-pdf.e2e.cjs`, variabile
  `REAL_PROGEO_PDF`) e riferimenti in altri 5 file di test.
- **CI**: `.github/workflows/nutripro-ci-deploy.yml` (commento sul PDF di riferimento).
- **Documenti**: `README.md` (titolo, tabella di conversione, descrizione),
  `HANDOFF.md` (storico), i ticket Wayfinder.
- **Landing**: nessuna occorrenza nei file pubblici (verificato: `index.html`
  e `privacy/index.html`).

## Decisioni aperte per il PO

Non sono decisioni prese.

1. **Cosa significa «togliere» per il parser**: il formato dei PDF che oggi
   leggiamo resta supportato, ma con un nome neutro («formato A», «tabella con
   colonne ...»), oppure il supporto va rimosso? Assumo il primo: senza, l'app
   non importerebbe più nessun piano. Da confermare.
2. **Intestazioni da ignorare**: l'espressione che scarta «progeo medical» va
   sostituita da una regola che riconosca intestazioni e piè di pagina in modo
   generico (ripetizione fra pagine, posizione), oppure si mantiene la parola
   come filtro tecnico non visibile?
3. **Storia di git e HANDOFF**: i documenti storici si lasciano intatti
   (sono cronaca) o si riscrivono? Riscrivere la storia di git è fuori
   questione senza decisione esplicita.
4. **Piano di prova**: rinominarlo (es. «Piano di prova») e verificare che il
   contenuto non riproduca il layout o testi di un documento di terzi.
5. **Test sul PDF reale**: la variabile `REAL_PROGEO_PDF` cambia nome; il PDF
   privato resta fuori dal repository.
6. **Motivo**: se la ragione è legale (marchio, uso del nome) o commerciale,
   conviene annotarla nel ticket per decidere quanto in profondità andare.

## Acceptance criteria

- Una ricerca di «progeo» (senza distinzione tra maiuscole e minuscole) nei
  file pubblici e nell'interfaccia non trova nulla.
- Nel codice restano solo nomi neutri; nessuna regressione dei 58 test del
  server e dei 16 test del browser.
- Un PDF del formato attualmente supportato continua a essere importato con lo
  stesso risultato di prima (stesse voci, stessi pasti, stesse quantità), e le
  intestazioni non finiscono tra gli alimenti.
- README e documenti attivi aggiornati; cosa si lascia nei documenti storici è
  dichiarato.

## Dependencies

- Strettamente legato a
  [Definire l'enum dei tipi di pasto e coprirne tutti gli scenari](WF-023-tipi-di-pasto-enum.md)
  e a
  [Comprendere i pasti di qualsiasi PDF con Gemini, a prescindere dal template](WF-021-comprensione-pdf-gemini.md):
  entrambi riscrivono il parser e conviene fare questo rinominamento nello
  stesso intervento o subito prima.

## Out of scope

- Cambiare il comportamento del parser o supportare altri template (WF-021).
- Riscrivere la cronologia di git.
