---
id: WF-035
title: Decidere dove e come usare Rizzo-PII per anonimizzare i dati prima che escano dal dispositivo
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Decidere dove e come usare Rizzo-PII per anonimizzare i dati prima che escano dal dispositivo

## Requirement comment

2026-10-31 — proposta del PO: far girare in Docker **Rizzo-PII**, un modello che
anonimizza i dati personali, e passare da lì i PDF prima di qualunque uso, senza
conservare gli utenti. Obiettivo dichiarato: nessuno strumento a pagamento.

Il PO ha già scelto lo strumento. Questo ticket decide **dove** gira, **per quali
flussi** e **con quali garanzie**, perché la prova fatta oggi mostra che l'uso
ingenuo non basta.

## Evidenza (prova locale del 2026-10-31)

Documento completo, con metodo, numeri e limiti:
[docs/research/rizzo-pii-valutazione.md](../../docs/research/rizzo-pii-valutazione.md).

- Rizzo-PII è un classificatore di token da ≈0,3 miliardi di parametri, MIT, su CPU.
  Non ha una categoria per i dati sanitari. Valutazione dichiarata per frase, non per
  documento.
- Su due PDF reali, con tutte le categorie, **nessun identificativo reale è rimasto**
  (nome del paziente e del professionista, indirizzo, telefono, email, sito, studio).
- **Ma** con le impostazioni di default scambia i codici delle alternative per numeri
  civici e CAP: sopravvivono 17 codici su 65 e 30 su 63. Con sei categorie escluse
  sopravvivono tutti, e resta solo il CAP, da coprire con una regola nostra.
- Costo: immagine da **6,84 GB** su disco, ≈0,8 GB di RAM, ≈3 core e 6–20 secondi per
  documento. La prova ha coperto un solo paziente e un solo professionista.

## Dove serve davvero (e dove no)

- **Il lettore dei PDF non ne ha bisogno**: gira nel browser e il testo non esce dal
  dispositivo. Mettere Rizzo-PII in quel percorso lo renderebbe più lento e farebbe
  passare dal server dati che oggi non ci arrivano.
- Serve dove i dati **escono dal dispositivo**: (1) il ripiego con Gemini per i PDF che
  il motore non capisce, ticket
  [Comprendere i pasti di qualsiasi PDF con Gemini, a prescindere dal template](WF-021-comprensione-pdf-gemini.md);
  (2) la conservazione sul server, ticket
  [Definire la conservazione sul server dei dati dei pazienti](WF-030-conservazione-dati-lato-server.md);
  (3) i campioni di PDF che arrivano dai nutrizionisti, ticket
  [Raccogliere campioni di PDF e feedback dai nutrizionisti tester](WF-033-feedback-nutrizionisti-tester.md).

## Cose che l'anonimizzazione non risolve

- Per usarlo, il testo del PDF deve **prima arrivare al nostro server**: l'anonimizzazione
  riduce ciò che vede Google, non ciò che vediamo noi. Restano i ruoli GDPR e il
  consenso ([Ottenere una consulenza legale su dati sanitari e ruoli GDPR](WF-034-consulenza-legale-dati-sanitari.md)).
  Non gira nel browser: il modello pesa ≈1,2 GB in precisione piena.
- Un piano anonimizzato **collegato a un account resta dato personale**. «Non conserviamo
  gli utenti» non è vero finché il piano è legato all'accesso Google.
- Non cambia le condizioni di Google per l'API: il tier a pagamento per i clienti nello
  SEE resta una decisione di [Integrare Gemini con opzione gratuita e veloce](WF-010-integrazione-gemini.md).
  Lo strumento è gratuito; la macchina che lo ospita no.

## Decisioni aperte per il PO

Non sono decisioni prese.

1. **Flussi**: quali tra i tre sopra lo usano, e in quale ordine. Proposta: iniziare dal
   terzo (campioni dei nutrizionisti), che non richiede infrastruttura.
2. **Dove gira**: in locale sul PC di chi sviluppa (solo per i campioni); oppure un
   servizio su Hermes. Hermes è un PC condiviso con altri prodotti, con memoria e CPU da
   misurare: l'immagine da 6,84 GB e i 3 core per ogni documento vanno confrontati con la
   macchina reale prima di impegnarsi.
3. **Categorie**: confermare l'elenco escluso (`BUILDINGNUM`, `ZIPCODE`, `AGE`,
   `AMOUNT`, `DATE`, `TIME`) e la regola nostra per il CAP; aggiungere una regola per
   le righe che si ripetono su ogni pagina (nome nell'intestazione e nel piè di pagina).
4. **Reversibilità**: dizionario spento (consigliato: il piano non deve tornare con i
   nomi) o acceso.
5. **Garanzie**: solo rete interna, versione e revisione fissate, immagine costruita da
   noi, niente log del testo. Chi aggiorna il modello e quando.
6. **Se il modello sbaglia** (richiamo non misurato su altri nomi o studi): cosa succede
   a un nome che sfugge. Proposta: consenso esplicito prima di ogni invio e anteprima di
   ciò che parte.
7. **Licenza**: l'immagine contiene PyMuPDF (AGPL). Va bene per uso interno senza
   modifiche; da far confermare.

## Acceptance criteria del ticket

- Decisione su flussi, luogo di esecuzione e categorie, con la misura delle risorse sulla
  macchina scelta.
- Misura del richiamo su campioni di più professionisti, quando il ticket sui campioni dei nutrizionisti li avrà raccolti.
- Elenco delle garanzie e di chi le verifica.

## Out of scope

- Mettere il servizio in produzione (ticket di implementazione successivo).
- Cambiare il lettore dei PDF.

## Progress note - 2026-10-31 (implementation, on the PO's explicit request)

Il PO ha chiarito il flusso voluto: il PDF dell'utente passa **prima** da un nostro container
con Rizzo-PII e **poi** va a Google; il GDPR si sistema a parte. Implementato così, con una scelta
mia da confermare: il lettore locale resta il primo tentativo e l'assistente parte solo se il PDF
non si capisce o si legge in parte (o su scelta dell'utente), perché mandare tutto a Google, sempre,
invierebbe i dati anche quando non servono. In ogni caso **a Google non arriva nulla che non sia passato
da Rizzo-PII**, e se Rizzo non risponde non parte nessuna chiamata (due mutazioni del codice, provate, fanno
fallire i test).

Cosa c'è: `server/anonymizer.cjs` (servizio + filtro senza modello), `server/planImport.cjs` (consenso,
limiti, prompt, controllo rigido della risposta), `gemini.extract`, `POST /api/plan/import` e
`GET /api/plan/status`, lettura nel browser con pulizia di intestazione e piè di pagina, pulsante con
consenso, `docker/rizzo-pii/Dockerfile` con revisione fissata, servizio nei Compose (NutriPro e Orchestrator)
**spento di default** su rete interna. Misura su due piani reali: nessun identificativo a Google, tutti i
codici delle alternative e le quantità intatti (docs/research/rizzo-pii-valutazione.md).

Decisioni che restano al PO: dove far girare il servizio in produzione (misurare Hermes: 6,84 GB di disco,
≈0,8 GB di RAM, ≈3 core, 15–30 s per documento), il richiamo del modello su altri nomi e studi (provato su
un paziente e un professionista), i ruoli GDPR e il consenso (ticket legale), il tier di Google per i clienti nello
SEE. **Non provato dal vivo con Google**: manca una chiave API; il formato della risposta è controllato da noi.
