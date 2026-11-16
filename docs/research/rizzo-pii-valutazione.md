# Valutazione di Rizzo-PII su due piani alimentari reali

Data: 2026-10-31. Misure fatte in locale, su un container isolato (porta solo su
`127.0.0.1`), con il testo di due PDF reali. Nessun dato personale è scritto in questo
documento né nel repository: i PDF originali e gli script di prova restano fuori.

## Che cos'è (fonti ufficiali)

- Repository: <https://github.com/Rizzo-AI-Academy/rizzo-pii> (esistono copie con lo
  stesso nome sotto altri account: usare solo questa). Modello:
  <https://huggingface.co/rizzoaiacademy/rizzo-pii-0.3B>. App 2.0.0 (8 agosto 2026),
  modello 1.5.0.
- Licenza: codice e modello MIT. I binari desktop sono AGPL-3.0 perché includono
  PyMuPDF (che è anche nell'immagine Docker: usarla senza modifiche e solo per rete
  interna; da far vedere a chi verifica la parte legale).
- **Non è un modello generativo**: è un classificatore di token da ≈0,3 miliardi di
  parametri (mmBERT-base). Gira su CPU.
- 22 categorie (nomi, indirizzo, CAP, città, provincia, telefono, email, codice
  fiscale, partita IVA, IBAN, carta, targa, documento, organizzazione, età, data, ora,
  importo…) più `URL` trovato con una regola. **Nessuna categoria per i dati sanitari.**
- Dichiara F1 0,989 su 7.000 frasi italiane reali. Gli autori precisano che la
  valutazione è per frase, non per documento, e che solo l'italiano è validato.
- Di default sostituisce con segnaposto e tiene un dizionario per ripristinare i
  valori: è **pseudonimizzazione**. Con `mapping_enabled: false` non si costruisce
  alcun dizionario.

## Come è stata provata

Immagine costruita dal Dockerfile del repository (revisione `9057eef`), eseguita con
`docker run -p 127.0.0.1:5005:5005`. Testo estratto con pdf.js dai due PDF (stesso
piano in due impaginazioni: uno con copertina e dati dello studio, uno senza), inviato a
`POST /analyze` con `include_mapping`. Verificato quali identificativi noti restano e
se le quantità e i codici delle alternative sopravvivono.

## Risultati

| Misura | Valore |
| :--- | :--- |
| Costruzione dell'immagine | 5 minuti |
| Peso dell'immagine su disco | **6,84 GB** (il repository dichiara 2,65 GB) |
| RAM a riposo / sotto carico | 795 MiB / 840 MiB |
| CPU durante l'analisi | ≈ 3 core |
| Tempo per documento (9.000–19.000 caratteri) | 6–20 secondi |
| Identificativi reali rimasti, con tutte le categorie | nessuno (nome del paziente e del professionista, indirizzo, telefono, email, sito, studio) |

### Il problema: con tutte le categorie rovina il piano

Usata con le impostazioni di default, la rete scambia i **codici delle alternative**
(numeri di 2–4 cifre nella colonna Alt.) per numeri civici e CAP, e alcuni valori di
unità di misura per età.

| | Codici delle alternative rimasti (impostazioni di default) | Con le categorie `BUILDINGNUM`, `ZIPCODE`, `AGE`, `AMOUNT`, `DATE`, `TIME` escluse |
| :--- | :--- | :--- |
| Piano a due colonne | 17 su 65 | 65 su 65 |
| Piano un giorno per pagina | 30 su 63 | 63 su 63 |

Senza i codici, le alternative non si collegano più agli alimenti: il testo anonimizzato
sarebbe inutile per capire il piano. Le quantità («40 g», «2 cucchiaini») non sono
state toccate in nessuna delle due prove.

### Con le sei categorie escluse

- Piano a due colonne: nessun identificativo reale rimasto.
- Piano con copertina: resta il **CAP** (la categoria `ZIPCODE` è esclusa). Va coperto con
  una regola nostra (numero di 5 cifre che non sia un codice alternativa).

## Limiti di questa prova

- **Due documenti dello stesso paziente e dello stesso professionista.** Non dimostra il
  richiamo su altri nomi, altri studi o altri gestionali.
- Sono solo testi estratti correttamente: un PDF con testo rovinato darebbe risultati
  diversi.
- Non misurato: il carico con più documenti contemporanei (il server ha un solo
  processo con 4 thread), né l'uso su una macchina con meno core di quella di prova.
- Non verificato: se esistano versioni dell'immagine con la stessa etichetta ma
  contenuto diverso (si può fissare la revisione del modello e quella del repository).

## Impostazioni consigliate se lo si usa

1. Escludere `BUILDINGNUM`, `ZIPCODE`, `AGE`, `AMOUNT`, `DATE`, `TIME` (parametro
   `exclude_tags`, o `PII_EXCLUDE_TAGS` all'avvio) e coprire il CAP con una regola nostra.
2. `mapping_enabled: false`: nessun dizionario, nessun ripristino (non serve: il piano
   anonimizzato non deve tornare all'utente con i nomi).
3. Solo su rete interna (il servizio non ha autenticazione); mai dietro il proxy pubblico.
4. Fissare revisione del repository, del modello e delle dipendenze; costruire noi
   l'immagine.
5. Un livello deterministico davanti: le righe che si ripetono su ogni pagina
   (intestazione con il nome del paziente, piè di pagina con il nome del professionista)
   e la copertina si possono togliere senza modello.
6. Misurare il tempo e la RAM sulla macchina di produzione prima di decidere.

## Prova di punta a punta (2026-10-31)

Dopo l'implementazione del percorso «testo → nostro server → Rizzo-PII → filtro senza modello → Google»,
provato con i due PDF reali: estrazione del testo con il codice di produzione (`extractPdfText`), nostro
server vero, **container Rizzo-PII vero**, Gemini **simulato** che registra ciò che riceverebbe.

| | Piano a due colonne | Piano con copertina |
| :--- | :--- | :--- |
| Risposta del server | 200 in 28,7 s (prima richiesta, a freddo) | 200 in 15,0 s |
| Testo dal PDF → inviato a Google | 8.950 → 9.074 caratteri | 18.594 → 18.904 caratteri |
| Identificativi reali che Google riceverebbe | nessuno | nessuno |
| Codici delle alternative | 65 → 65 | 63 → 63 |
| Quantità inviate | 200 | 164 |
| Segnaposto inviati | nomi | nomi, via, CAP, città, provincia, telefono, email, sito |

Note: nel secondo piano resta un carattere `@` isolato, il prefisso del profilo social dello studio, il cui
nome è stato sostituito. Il CAP è coperto dal filtro senza modello (era escluso dal modello).
La prova non cambia i limiti già elencati: due documenti, un solo paziente, un solo professionista.
