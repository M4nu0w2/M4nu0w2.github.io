---
id: WF-014
title: Definire come conservare le date reali del tracking
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: open
assignee: null
assignment: manu
assignment_mode: flexible
blocked_by: []
---

# Definire come conservare le date reali del tracking

## Question

Come registrare spunte, acqua e quantità effettive per data di calendario,
invece che per giorno della settimana del piano, restando solo in locale?

Fatto verificato il 2026-10-10: oggi il tracking del **piano attivo** è salvato
per chiave del giorno del piano (`lun`, `mar`, …) in `checked[day]` e
`water[day]` dentro `diet_plan_archive:<sub>`. Non esiste una data reale: il
lunedì successivo riusa le spunte del lunedì precedente e non si può ricostruire
uno storico per data. Il calendario aderenza ne dipende.

Da concordare:

- Formato della data (giorno locale del dispositivo) e fuso orario; cosa accade
  a cavallo della mezzanotte e cambiando dispositivo o fuso.
- Relazione fra data reale e giorno del piano: il menu resta per giorno della
  settimana.
- Destino dello storico esistente senza date: conservarlo come non datato,
  assegnarlo all'ultima settimana o escluderlo dalla vista calendario.
- **Piano attivo** e **piano inattivo**: il tracking datato resta legato al
  piano su cui è stato registrato.
- Limite di conservazione e dimensione in localStorage.
- Effetto sui **tracking opzionali** di
  [Implementare pagina settaggi e tracking opzionali](WF-011-settaggi-implementazione.md)
  e [Rendere configurabile l'obiettivo dell'acqua](WF-012-obiettivo-acqua.md),
  se implementati prima.

Vincoli: solo localStorage per `sub`, revisione dell'archivio rispettata,
nessuna nuova chiamata di rete; migrazione senza perdita dei dati esistenti.
