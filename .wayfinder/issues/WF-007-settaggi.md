---
id: WF-007
title: Definire pagina settaggi e tracking opzionali
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: closed
assignee: manu
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Definire pagina settaggi e tracking opzionali

## Question

Quali funzioni si possono attivare dalla pagina settaggi, con quali valori
iniziali, e cosa succede ai dati quando un tracking viene disattivato?

Requisito acquisito dal PO il 2026-10-05: pagina settaggi per abilitare o
disabilitare funzioni, tra cui tracking dell'acqua e tracking dell'olio.
Il tracking dell'acqua esiste già; quello dell'olio è una nuova evolutiva.

Da definire per l'olio: registrazione per pasto o giornaliera, unità
(grammi, ml, cucchiaini), totale consumato e confronto con la quantità
prevista dal piano, evitando di contare due volte lo stesso consumo.
Obiettivi e conversioni devono distinguere valori del piano e scelte personali.

Ulteriori opzioni proposte, non ancora approvate:
- Promemoria facoltativi per acqua e pasti, con orari e fascia silenziosa.
- Unità di visualizzazione preferite: grammi o misure domestiche, dove supportate.
- Mostrare o nascondere il riepilogo di calorie e macro quando disponibili.
- Preferenze alimentari e ingredienti da escludere dalle sostituzioni rapide.

Da concordare: settaggi globali dell'utente o specifici del piano; persistenza
locale o sincronizzazione fra dispositivi; comportamento senza login;
valori iniziali dei singoli interruttori. Disattivare una funzione e cancellarne
lo storico sono operazioni distinte da discutere. La disponibilità di valori
nutrizionali e notifiche non è assunta.

La scelta di dove salvare queste preferenze dipende dal ticket
[Definire persistenza e dati condivisi con l’assistente](WF-003-dati.md);
la definizione iniziale delle funzioni opzionali può procedere indipendentemente.

## Resolution comment

2026-10-06, decisioni del PO raccolte in grilling con Manu.

- Settaggi globali per account, validi per tutti i piani; cambiare piano attivo
  non li modifica.
- Perimetro: tracking acqua, tracking olio, unità preferite. Promemoria e
  riepilogo calorie e macro non approvati; preferenze alimentari restano legate
  alle sostituzioni rapide.
- Disattivare un tracking lo nasconde e ne conserva lo storico; riattivandolo
  lo storico ricompare.
- Valori iniziali: tracking acqua attivo, tracking olio disattivo.
- Olio: quantità effettiva registrata sulla voce olio del pasto. La spunta usa la
  quantità prevista, modificabile; il totale del giorno è la somma ed è
  confrontato con il previsto. Unica fonte, nessun doppio conteggio.
- Contano le voci olio spuntate, compresi gli ingredienti di una ricetta
  spuntata; le alternative non scelte restano escluse.
- Voci olio spuntate mentre il tracking era spento contano la quantità prevista
  quando il tracking viene attivato.
- Inserimento olio in cucchiaini a passi di ½ con equivalente in grammi
  (1 cucchiaino = 4 g); con preferenza grammi, passi da 2 g.
- Unità preferite: menu dei pasti e olio. Default unità del PDF con nota in
  grammi; opzione grammi dove la conversione è supportata. Lista della spesa
  invariata.
- Obiettivo acqua dal piano quando il PDF lo indica, altrimenti 2,4 L; nessun
  obiettivo personale.
- Cancellazione dello storico: azione nei settaggi, per singolo tracking, su
  tutti i piani, con doppia conferma.
- Pagina settaggi accessibile solo dopo login, come la home. Dove salvare i
  settaggi resta nel ticket
  [Definire persistenza e dati condivisi con l’assistente](WF-003-dati.md).
