---
id: WF-023
title: Definire l'enum dei tipi di pasto e coprirne tutti gli scenari
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Definire l'enum dei tipi di pasto e coprirne tutti gli scenari

## Question

Quali sono i **tipi di pasto** ammessi nel dominio, come vengono rappresentati
(un enum con valori stabili) e come si comporta il sistema per ogni scenario in
cui un pasto di un PDF non coincide con uno di essi?

Richiesta del PO (2026-10-18): aggiungere i tipi di pasto in un enum e cercare
di coprire tutti gli scenari. Il ticket decide il modello; l'implementazione
verrà dopo, in un ticket a parte.

## Stato attuale (verificato sul codice)

- Il parser Progeo (`src/lib/dietEngine.mjs`, `mealKeywords`) conosce sette id
  testuali: `colazione`, `meta_mattina`, `pranzo`, `merenda`, `cena`,
  `spuntino_serale`, `arco_giornata`. Sono costanti sparse, non un tipo.
- I pasti aggiuntivi diventano `pasto_aggiuntivo_N` (N dal PDF), con nome e icona
  scritti nel codice.
- Il piano di prova usa altri id (`m_col`, ...): due vocabolari diversi per lo
  stesso concetto.
- **L'id del pasto è dentro l'id di ogni voce** (`item_<giorno>_<idPasto>_<n>`),
  e quell'id è la chiave delle spunte e del tracking salvati nel browser.
  Rinominare gli id esistenti azzera le spunte dei piani già salvati.
- Nome e icona vivono nel dato del piano salvato, non solo nel codice.
- Il PO ha indicato (2026-10-17, ticket
  [Comprendere i pasti di qualsiasi PDF con Gemini, a prescindere dal template](WF-021-comprensione-pdf-gemini.md))
  sei slot: colazione, merenda o spuntino (mattina), pranzo, merenda o spuntino
  (pomeriggio), cena, spuntini extra. Il codice ne ha sette.

## Scenari da coprire

Ogni scenario va chiuso con una regola esplicita, non lasciato al caso.

1. **Template diversi, stesso pasto**: «Prima colazione», «Colazione», «Breakfast»,
   «Spuntino metà mattina», «Spuntino 1», «Break», «Pausa pranzo».
2. **Spuntino ambiguo**: «Spuntino» senza orario. Mattina o pomeriggio? Decide
   la posizione nella giornata o il nome?
3. **Più di due spuntini al giorno** o un solo spuntino.
4. **Spuntino serale / dopocena / notturno**: slot a sé o dentro «spuntini extra»?
5. **«Arco della giornata»**: condimenti, acqua, sale. È un pasto o un elenco di
   voci libere? Va dentro «spuntini extra»?
6. **Pasti aggiuntivi numerati** (`Pasto aggiuntivo 1, 2, ...`): uno slot con
   ripetizioni o più valori?
7. **Piano con pochi pasti** (solo colazione, pranzo e cena) e **con pasti
   mancanti in alcuni giorni**: l'enum non obbliga ad averli tutti.
8. **Pasto assente da un giorno e presente in un altro**; giorni vuoti.
9. **Stesso tipo ripetuto nello stesso giorno** (due «merenda»).
10. **Nome sconosciuto**: «Pre-allenamento», «Brunch», «Pasto libero», «Cena
    leggera», nome in un'altra lingua. Si scarta, si accorpa o diventa un tipo
    «altro» che conserva il nome originale?
11. **Pasto senza intestazione**: voci che compaiono prima di qualunque
    intestazione di pasto.
12. **Intestazione che coincide con un alimento** (caso già visto: «Olio extra
    vergine» scambiato per «extra»).
13. **Piano alternato** (settimana A/B, giorni feriali contro weekend) con tipi
    di pasto diversi.
14. **Ordine di visualizzazione**: ordine dell'enum o ordine del PDF? Con un
    «altro» in mezzo?
15. **Nome da mostrare**: etichetta canonica o testo originale del PDF? Icona
    per tipo e per «altro».
16. **Piani già salvati** con i vecchi id: migrazione, convivenza dei due
    vocabolari, effetto sulle spunte (vedi sopra).
17. **Lista della spesa, tracking, sostituzioni, chat e archivio**: chi
    raggruppa o filtra per tipo di pasto, e cosa succede con «altro»?
18. **Gemini che interpreta il PDF** (WF-021): l'enum è anche lo schema di
    risposta obbligatorio? Un valore fuori enum viene rifiutato o ripiegato su
    «altro»?
19. **Più lingue**: nomi canonici in italiano, ma etichette e sinonimi per altre
    lingue?
20. **Futuro**: aggiungere un tipo (es. «pre-allenamento») senza rompere i piani
    salvati.

## Decisioni aperte per il PO

Non sono decisioni prese.

1. **Insieme dei valori**: i sei slot del PO (colazione, spuntino mattina,
   pranzo, spuntino pomeriggio, cena, spuntini extra) più un valore di ripiego
   («altro»)? Dove vanno `spuntino_serale` e `arco_giornata`?
2. **Rappresentazione**: valori stabili (testo in inglese tecnico o italiano
   come oggi?) separati dall'etichetta mostrata; l'etichetta originale del PDF
   si conserva a parte?
3. **Regola per i nomi sconosciuti**: ripiego su «altro» con il nome originale,
   o scarto con avviso all'utente?
4. **Regola per lo spuntino ambiguo**: per posizione nella giornata, per
   orario, oppure chiedere all'utente in fase di revisione?
5. **Compatibilità con i piani salvati**: migrare gli id (con conversione delle
   spunte) oppure mantenere gli id esistenti come alias dei nuovi valori?
6. **Dove vive la definizione**: un solo modulo condiviso tra parser, interfaccia,
   spesa, tracking e (in futuro) schema Gemini?

## Dependencies

- Blocca [Comprendere i pasti di qualsiasi PDF con Gemini, a prescindere dal template](WF-021-comprensione-pdf-gemini.md):
  quel ticket usa l'enum come schema di risposta.
- Va tenuto coerente con la tassonomia già richiesta dal PO nello stesso ticket.

## Out of scope

- Implementare l'enum o migrare i piani (ticket di implementazione successivo).
- Interpretare il PDF con Gemini (WF-021).
- Classificare gli alimenti o i macronutrienti.
