---
id: WF-006
title: Definire equivalenza nutrizionale delle sostituzioni rapide
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: closed
assignee: manu
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Definire equivalenza nutrizionale delle sostituzioni rapide

## Question

Quali tolleranze su calorie, proteine, carboidrati e grassi rendono accettabile
un sostituto, e come comportarsi quando non esistono 2-3 alternative adeguate?

Requisito acquisito dal PO il 2026-10-04: un tasto tipo bacchetta magica accanto
ad ogni elemento del pasto propone due o tre alternative, con relativo peso
adattato e calorie e macro quasi identici. Uso occasionale, in extremis, per
sostituire un ingrediente mantenendo il risultato nutrizionale del piano.
Mostrare quantità, calorie e macronutrienti permette di confrontare le proposte.

Da concordare: scostamento accettabile per ciascun valore, riferimento del peso
(crudo/cotto e parte edibile), fonte dei dati nutrizionali e gestione dei valori
mancanti. Distinguere le proposte dalle alternative già prescritte nel PDF.
L'equivalenza di calorie e macro è l'obiettivo richiesto, non una garanzia già
verificata di equivalenza complessiva del piano.

Raccomandazione da valutare: calcolare e verificare i valori usando dati
nutrizionali strutturati, mostrando gli scostamenti; non inventare quantità
per raggiungere il numero richiesto di proposte quando i vincoli non lo consentono.
Non è una decisione approvata. Non è ancora deciso se questa funzione usi Gemini.

## Resolution comment

2026-10-06, decisioni del PO in sessione di grilling (Manu con Claude).

1. Fonte dei numeri: nessuna banca dati esterna per ora. Calorie e macro, assenti
   nel PDF, sono stimati da Gemini e mostrati come **valori stimati**.
2. Tolleranze: calorie entro ±5%; ogni macronutriente entro il più largo tra
   ±5 g e ±15% rispetto alla porzione originale.
3. Candidati: solo alimenti presenti nel piano, con lo stesso **ruolo nel pasto**
   (carboidrati, proteica, grassi, verdura, frutta).
4. Il ruolo nel pasto è assegnato da Gemini nella stessa richiesta della stima.
5. Gemini restituisce valori per 100 g; l'app calcola il peso adattato e verifica
   le tolleranze in modo deterministico.
6. Il peso proposto segue lo stato indicato nel PDF per quell'alimento (crudo o
   cotto; legumi in peso cotto sgocciolato come oggi).
7. Con meno di due sostituti validi si mostrano quelli trovati, anche nessuno,
   con un avviso; mai quantità forzate per raggiungere il numero.
8. Interfaccia: sezione "Alternative del piano" con le alternative prescritte,
   separata da "Proposte stimate"; le prescritte non compaiono fra le proposte.
9. Sola consultazione: piano, tracking e lista della spesa restano invariati.
10. Il tocco sulla bacchetta vale come consenso all'invio; si inviano solo nomi
    degli alimenti e grammature, nessun dato identificativo; avviso al primo uso.
11. Gemini non disponibile (offline, quota, errore): solo alternative del piano
    e avviso.
12. Le stime per alimento sono salvate con il piano: stessi numeri a ogni
    consultazione.

Implementazione dipendente da [Integrare Gemini con opzione gratuita e veloce](WF-010-integrazione-gemini.md);
persistenza delle stime da includere in [Definire persistenza e dati condivisi con l’assistente](WF-003-dati.md).
