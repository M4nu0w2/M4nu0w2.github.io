---
id: WF-002
title: Definire contesto delle risposte del chatbot
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: closed
assignee: manu
assignment: null
assignment_mode: flexible
blocked_by: [WF-005]
---

# Definire contesto delle risposte del chatbot

## Question

Come il chatbot identifica il piano su cui l’utente sta facendo una domanda,
e distingue una domanda sul piano da una domanda nutrizionale generale?

Requisito acquisito: chatbot dentro NutriPro mediante Gemini 3.7 Flash, per domande
sul proprio piano e sulla nutrizione generale. Canale e ambito sono risolti nel
ticket [Definire canale e ambito del chatbot](WF-005-canale-ambito.md).

Raccomandazione iniziale: contesto del piano selezionato,
con risposte che distinguono i contenuti del piano da ciò che non vi compare.
Non è una decisione approvata; il canale in-app è invece richiesto dal PO.

Caso concreto da discutere: con due piani salvati, «cosa posso mangiare stasera?»
si riferisce al piano selezionato, a quello attivo o a un piano scelto nella chat?
Conservazione delle conversazioni da definire in seguito.

## Updated model requirement - 2026-10-06

Il PO richiede ora una opzione Gemini gratuita e veloce ("turbo").
La vecchia indicazione 3.7 Flash non e una scelta tecnica confermata.
Verificare modello e quote ufficiali nella prossima sessione, tramite WF-010.

## Resolution comment

2026-10-06, decisioni del PO (Manu) in sessione di grilling. Contesto tecnico
verificato: i piani restano nel browser e la chat oggi invia a Gemini solo
messaggio e cronologia; usare un piano significa inviarne il contenuto a Google.

1. **Piano di riferimento**: di default il piano attivo; nella chat un selettore
   consente di scegliere un altro piano dell'archivio oppure nessun piano.
2. **Consenso**: interruttore «Usa il mio piano» per conversazione, con avviso
   sull'invio a Google. Spento, la chat accetta solo domande generali come oggi.
3. **Distinzione delle domande**: nessuna classificazione separata. Con il piano
   incluso il modello risponde e indica se l'informazione proviene dal piano o è
   un'indicazione generale.
4. **Limiti**: il chatbot riporta ciò che il piano prevede; può fornire informazioni
   generali dichiarate come tali, ma non modifica né sostituisce le prescrizioni e
   rimanda al nutrizionista. Le sostituzioni restano alla funzione dedicata
   ([Definire equivalenza nutrizionale delle sostituzioni rapide](WF-006-sostituzioni.md)).
5. **Riferimenti temporali**: con il piano incluso si inviano giorno della settimana
   e ora locale del dispositivo; «stasera» indica la cena del giorno corrente.
   Nessuna posizione.
6. **Cambio a metà conversazione**: cambiare il piano di riferimento o spegnere
   l'interruttore richiede conferma e avvia una nuova conversazione, svuotando la
   cronologia per non mescolare o reinviare dati del piano precedente.
7. **Stato iniziale**: l'interruttore parte spento in ogni nuova conversazione.

Restano fuori da questo ticket: quali campi del piano vengono inviati, nel ticket
[Definire persistenza e dati condivisi con l’assistente](WF-003-dati.md), e la
credenziale, nel ticket [Definire gestione della credenziale Gemini e limiti d’uso](WF-004-credenziali.md).
