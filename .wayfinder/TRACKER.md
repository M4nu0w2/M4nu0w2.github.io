# Tracker Wayfinder locale

Non è stato fornito un tracker esterno. Questo archivio Markdown è il tracker
locale per la mappa [NutriPro — archivio personale e assistente del piano](../WAYFINDER.md).

## Wayfinding operations

- La mappa è un file con identità `WF-MAP-001` e label `wayfinder:map`.
- I ticket sono file in `issues/`, con identità stabile nel campo `id`, `parent`
  uguale alla mappa, titolo, label `wayfinder:<tipo>`, `status`, `assignee`,
  `assignment`, `assignment_mode` e `blocked_by`. Una decisione vive nel suo ticket, non duplicata nella mappa.
- I nomi sono i riferimenti leggibili; le identità servono per le relazioni.
- Questo tracker non ha relazioni native: `blocked_by` è la convenzione esplicita
  di dipendenza. Un ticket è sbloccato quando tutti i suoi bloccanti sono chiusi.
- La frontiera è l’insieme dei ticket `open`, con `assignee: null` e tutti i
  bloccanti chiusi, filtrati secondo le regole di assegnazione qui sotto. Si ricava leggendo i metadati dei figli della mappa; i ticket aperti non
  vanno elencati nel corpo della mappa.
- Prima di lavorare a un ticket, verificare `assignment` e `assignment_mode`,
  poi impostare `assignee` al responsabile della sessione. I ticket di conversazione
  richiedono risposte reali del PO; non
  sostituirle con ipotesi o raccomandazioni.
- La risposta si aggiunge come sezione `Resolution comment` nel ticket, con data
  e provenienza della decisione. Solo allora impostare `status: closed` e inserire
  nella mappa un link nominativo con sintesi di una riga.
- Al momento della chiusura aggiungere solo i nuovi ticket ormai formulabili;
  mantenere le aree ancora indistinte in `Not yet specified`.
- Nessun ticket di conversazione viene risolto durante la prima raccolta.
- Per passare a un tracker esterno configurarlo con `/setup-matt-pocock-skills`
  e migrare le identità e le dipendenze, mantenendo un solo archivio canonico.

## Assegnazione dei ticket

- `assignment: null | manu | claudio` indica a chi il PO richiede di lavorare
  il ticket. `null` significa nessuna preferenza.
- `assignment_mode: flexible | strict` distingue una preferenza da un vincolo.
  Il valore iniziale è `flexible`; con `assignment: null` il ticket è libero.
- In modalità `flexible` la persona indicata è preferita, ma un altro
  responsabile può lavorare il ticket registrandosi in `assignee`.
- In modalità `strict` soltanto la persona indicata può prendere in carico,
  lavorare e chiudere il ticket. Gli altri lasciano invariati `assignee` e stato
  e scelgono un altro ticket. Dipendenze e decisioni richieste al PO restano valide.
- `strict` richiede `assignment: manu` oppure `assignment: claudio`.
  Un ticket con `strict` e assegnazione mancante non può essere preso in carico
  finché il PO non specifica la persona o rimuove il vincolo.
- `assignee` resta il responsabile effettivo del lavoro, distinto dalla persona
  richiesta. Per una presa in carico vincolante deve coincidere con `assignment`.
  Il ticket conserva `assignment` e `assignment_mode` anche dopo la chiusura.
- Impostare, cambiare o rimuovere l'assegnazione richiesta e la modalità soltanto
  su indicazione esplicita del PO; annotare nel ticket data e provenienza in una
  sezione `Assignment comment`. Se il ticket è già in carico a un'altra persona,
  sospenderne il lavoro e concordare il passaggio con il PO prima di proseguire.
- I ticket precedenti senza questi campi si interpretano come `assignment: null`
  e `assignment_mode: flexible`; nessuna assegnazione viene dedotta dal contenuto.

Esempio di richiesta vincolante del PO «questo ticket lo lavora solo Claudio»:

```yaml
assignment: claudio
assignment_mode: strict
assignee: null
```

Al momento della presa in carico, Claudio imposta `assignee: claudio`.

## Protezione dei materiali

La cartella, `WAYFINDER.md` e `CONTEXT.md` sono esclusi localmente dal Git.
Non salvare qui documenti sanitari originali, nomi di pazienti o chiavi API.
Questo archivio non viene pubblicato nella preview Hermes.


Il 2026-10-04 il PO ha autorizzato la pubblicazione completa su dev, inclusi
mappa, glossario, ticket e handoff. Supera le precedenti esclusioni locali.
