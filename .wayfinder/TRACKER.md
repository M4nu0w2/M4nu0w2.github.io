# Tracker Wayfinder locale

Non è stato fornito un tracker esterno. Questo archivio Markdown è il tracker
locale per la mappa [NutriPro — archivio personale e assistente del piano](../WAYFINDER.md).

## Wayfinding operations

- La mappa è un file con identità `WF-MAP-001` e label `wayfinder:map`.
- I ticket sono file in `issues/`, con identità stabile nel campo `id`, `parent`
  uguale alla mappa, titolo, label `wayfinder:<tipo>`, `status`, `assignee` e
  `blocked_by`. Una decisione vive nel suo ticket, non duplicata nella mappa.
- I nomi sono i riferimenti leggibili; le identità servono per le relazioni.
- Questo tracker non ha relazioni native: `blocked_by` è la convenzione esplicita
  di dipendenza. Un ticket è sbloccato quando tutti i suoi bloccanti sono chiusi.
- La frontiera è l’insieme dei ticket `open`, non assegnati, con tutti i bloccanti
  chiusi. Si ricava leggendo i metadati dei figli della mappa; i ticket aperti non
  vanno elencati nel corpo della mappa.
- Prima di lavorare a un ticket, impostare `assignee` al responsabile della
  sessione. I ticket di conversazione richiedono risposte reali del PO; non
  sostituirle con ipotesi o raccomandazioni.
- La risposta si aggiunge come sezione `Resolution comment` nel ticket, con data
  e provenienza della decisione. Solo allora impostare `status: closed` e inserire
  nella mappa un link nominativo con sintesi di una riga.
- Al momento della chiusura aggiungere solo i nuovi ticket ormai formulabili;
  mantenere le aree ancora indistinte in `Not yet specified`.
- Nessun ticket di conversazione viene risolto durante la prima raccolta.
- Per passare a un tracker esterno configurarlo con `/setup-matt-pocock-skills`
  e migrare le identità e le dipendenze, mantenendo un solo archivio canonico.

## Protezione dei materiali

La cartella, `WAYFINDER.md` e `CONTEXT.md` sono esclusi localmente dal Git.
Non salvare qui documenti sanitari originali, nomi di pazienti o chiavi API.
Questo archivio non viene pubblicato nella preview Hermes.


Il 2026-10-04 il PO ha autorizzato la pubblicazione completa su dev, inclusi
mappa, glossario, ticket e handoff. Supera le precedenti esclusioni locali.
