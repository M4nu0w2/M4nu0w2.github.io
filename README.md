# 🌱 NutriPro Basta — Piano Nutrizionale PWA (Progeo Medical Converter)

[![PWA Ready](https://img.shields.io/badge/PWA-Mobile--First-10b981?style=for-the-badge&logo=pwa)](./index.html)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)](./src/App.jsx)
[![Client Side PDF Engine](https://img.shields.io/badge/PDF.js-Client--Side-ff6b6b?style=for-the-badge&logo=mozilla)](https://mozilla.github.io/pdf.js/)

Una **Single Page Web Application (PWA / Mobile-First)** per l'analisi locale dei piani alimentari generati dal software gestionale **Progeo Medical**, con servizio Node per autenticazione Google e protezione della home.

L'applicazione converte automaticamente le dosi espresse in cucchiai, bicchieri e legumi secchi nelle corrispondenti grammature esatte (o peso del cotto in scatola sgocciolato) e le memorizza nel browser per consultarle ed aggiornarle ogni giorno dalla schermata Home dello smartphone.

---

## 🌐 Link Applicazione Live / Web App

> 🔗 **Accedi all'App Nutrizionale**:  
> **[NutriPro su Hermes](https://nutriprobasta.jirachibot.eu)**

La login è preparata nel codice ma non ancora attivata in produzione. GitHub
Pages non esegue il servizio Node; nel rollout la vecchia app su Pages deve
essere disabilitata o sostituita da un redirect al dominio protetto.

---

## ✨ Caratteristiche Principali

### 🔒 PDF locale e login Google
- **Login sul server**: identità verificata da Google; home disponibile soltanto con sessione NutriPro valida. Google riceve i dati necessari all'autenticazione; non riceve il PDF o il piano.
- **Mozilla `pdf.js` Integrato**: Il PDF viene analizzato localmente direttamente nel browser.
- **Persistenza Locale**: piani e tracking sono salvati in `localStorage` in un archivio distinto per account (`diet_plan_archive:<Google sub>`). Questo non è un archivio remoto e non sincronizza dispositivi. Chi ha accesso al profilo del browser può leggere lo storage locale.
- **Piani precedenti**: le chiavi senza account sono conservate ma non importate automaticamente. Al primo accesso autenticato ricaricare il PDF; nessun piano precedente viene cancellato.
- **Sessione**: cookie HttpOnly, Secure in produzione, durata iniziale 12 ore, logout revocato sul server. I riavvii del servizio terminano le sessioni. Login e verifica della sessione richiedono connessione; nessuna cache offline della home.
- **Risorse locali**: React, CSS, font di sistema e PDF.js/worker sono serviti dal backend, senza CDN.
- **I miei piani** (`/plans`): pagina React con schede, ricerca e filtri.
  Consulta un piano precedente senza attivarlo (`/plans/:id`). Importare un nuovo
  PDF conserva il precedente. Sostituire il piano attivo richiede due conferme
  e azzera solamente le sue spunte e acqua.
- **Attivazione**: un piano attivo alla volta oppure nessuno. Rendi attivo
  ripristina anche spunte e acqua di quel piano; Disattiva conserva tutti i dati.
- **Archivio locale**: chiave `diet_plan_archive:<Google sub>`, indipendente per
  account, con migrazione automatica del precedente piano dell'account e backup
  delle vecchie chiavi. Rimane nel browser; PDF originali e sincronizzazione
  fra dispositivi non sono inclusi. La consultazione dello storico e implementata
  nel ticket WF-009.


---

### ⚖️ Motore di Conversione Rigido per Grammature Progeo Medical

Durante l'analisi del PDF, l'applicazione applica le seguenti regole automatiche di normalizzazione:

| Alimento / Categoria | Formato Originale PDF | Conversione Automatica App | Note & Dettagli |
| :--- | :--- | :--- | :--- |
| **Cereali e derivati** *(Riso, Farro, Orzo, Cereali)* | `X cucchiai` | **1 cucchiaio da minestra = 20 g** | Es. `5 cucchiai` $\rightarrow$ **100 g** |
| **Couscous** | `X cucchiai` | **1 cucchiaio = 10 g** | Es. `8 cucchiai` $\rightarrow$ **80 g** |
| **Olio extra vergine d'oliva** | `X cucchiaini` | **1 cucchiaino = 4 g** | Es. `2 cucchiaini` = **8 g**, `3 cucchiaini` = **12 g**, `4 cucchiaini` = **16 g** |
| **Legumi Secchi in Cucchiai** *(Ceci, Lenticchie, Fagioli, Cicerchie)* | `X cucchiai secchi` | **Peso secco (20g/cucchiaio) $\times 2.5$** | Convertiti in **Legumi cotti in scatola sgocciolati** (es. Ceci secchi 2 cucchiai e 1/2 $\rightarrow$ **Ceci cotti in scatola 125 g** - *pari a 50g secchi*) |
| **Piselli freschi** | `X cucchiai` | **1 cucchiaio = 20 g** | Es. `5 cucchiai` $\rightarrow$ **100 g** |
| **Latte** | `1 bicchiere` | **200 g / ml** | Quantità standard per bicchiere da latte |
| **Fiocchi di frumento/avena** | `1 bicchiere` | **40 g** | Peso per bicchiere di cereali in fiocchi |
| **Acqua** | `1 bicchiere` | **200 ml** | Quantità standard per idratazione |

---

### 📱 Interfaccia Mobile-First & PWA

- **Selettore Orario Settimanale**: Top bar con bottoni per i 7 giorni (`LUN`, `MAR`, `MER`, `GIO`, `VEN`, `SAB`, `DOM`). All'avvio seleziona in automatico il giorno corrente della settimana (`new Date().getDay()`).
- **Card dei Pasti**: Visualizzazione divisa per pasti (*Colazione 🌅*, *Metà mattina 🍎*, *Pranzo 🥗*, *Merenda 🍇*, *Cena 🍲*, *Spuntino serale 🌙*, *Arco della giornata 💧*).
- **Checkbox Interattive**: Permettono di barrare gli alimenti mangiati salvando lo stato delle spunte giorno per giorno.
- **Badge Grammatura ad Alto Contrasto**: Pillola colorata ad alto contrasto per leggere le grammature a colpo d'occhio.
- **Water Tracker Integrato**: Monitoraggio fino a 12 bicchieri d'acqua al giorno (2.4 L) con griglia interattiva e tasti rapidi `+` e `-`.
- **Calcolatore Veloce (Drawer)**: Drawer scorrevole dal basso per calcolare conversioni tra crudo e cotto (riso x2.5, legumi x2.5, pasta x2.2, carne/pesce x0.8) o calcolare il peso da cucchiai e bicchieri.

---

## Lista della spesa

Il pulsante **Esporta lista della spesa** apre un’anteprima con giorni selezionabili
(inizialmente tutta la settimana). Gli alimenti con lo stesso nome e unità compatibili
vengono sommati; i titoli delle ricette con sottoingredienti vengono esclusi.
Le quantità non sommabili restano esplicite, con il numero di ripetizioni quando necessario.

Le alternative esplicite restano su una sola riga, con la quantità di ciascuna scelta:
`Vitello — 150 g oppure Pollo — 180 g`. Non vengono suggerite sostituzioni assenti dal piano.
Il parser riconosce alternative sulla stessa riga o introdotte da «oppure», «o»,
«in alternativa» e «Alt:», e collega i codici della colonna **Alt.** alle tabelle
**Alternative alimentari** in appendice. Le alternative di ricette includono tutti
gli ingredienti nella stessa voce; non vengono sommate agli ingredienti obbligatori.
Quando presente, la tabella **Unità di misura** del PDF prevale sui coefficienti
generici per cucchiai, cucchiaini, bicchieri e porzioni. Le equivalenze restano
indicative; per i legumi l’app mantiene la conversione esistente in peso cotto
sgocciolato (fattore 2,5), indicandola nel nome e nelle note del piano.
Il risultato va confrontato con il PDF originale:
altri impaginati possono richiedere adattamenti. Per piani importati prima di questa
funzione, ricaricare il PDF se le alternative sono state perse.

La lista si può **copiare**, **condividere** sui dispositivi che lo consentono, o
**scaricare come `.txt`**. L’esportazione contiene una voce per riga, senza caselle
Unicode: per ottenere caselle interattive occorre attivarle nell’app di destinazione.

- **Note di Apple:** incollare la lista, selezionare le righe e applicare Checklist.
- **Google Keep:** incollare in una nota e scegliere «Mostra caselle di controllo».

La disponibilità di Note/Keep nel menu Condividi dipende dal dispositivo.
L’export non modifica il piano o le spunte e non invia automaticamente dati a servizi esterni.
Le quantità seguono il piano e le conversioni esistenti: non si ricavano automaticamente
ingredienti da ricette prive di sottoingredienti né pesi di acquisto da descrizioni di piatti cotti.

### Test della funzione

Test del motore e del parser, senza dipendenze aggiuntive (Node.js >=22.14):

```powershell
node --test tests/shopping-list.test.cjs
```

Test browser con Playwright installato e Chromium disponibile:

```powershell
node --test tests/shopping-export.e2e.cjs
```

Se Playwright è installato in un’altra cartella, impostare prima
`$env:PLAYWRIGHT_MODULE` al percorso assoluto del modulo. Il test browser verifica
anteprima mobile, selezione giorni, copia e fallback, download, persistenza e
condivisione simulata, con la CSP prevista per NutriPro. Il test
`tests/pdf-import.e2e.cjs` verifica il worker incluso usando un PDF di test reale.
Non vengono testate le app native Note/Keep.

`tests/progeo-pdf.e2e.cjs` e un controllo facoltativo sul documento privato di
riferimento: impostare `REAL_PROGEO_PDF` ed eseguire il file. Nessun PDF privato
viene incluso nel repository.

## 🛠️ Struttura Tecnologica

```
NutriPro/
  src/App.jsx             # Componenti React, login, Home, Piani e Dettaglio
  src/styles.css          # Interfaccia responsive
  src/lib/dietEngine.mjs  # Parser e calcoli
  src/lib/planStore.mjs   # Archivio locale per account
  public/                 # Icona e manifest
  server/                 # OAuth Google e sessioni Node
  tests/                  # Test unitari e browser
  dist/                   # Build Vite generata, esclusa da Git
```

Frontend React 19 con React Router e Vite. `npm start` compila e avvia il
backend su 8080; durante lo sviluppo `npm run dev` aggiorna la build in watch
(ricaricare il browser; riavviare il backend se cambiano i nomi degli asset).
Docker usa una build multistadio e serve soltanto dist e backend.

---

## 📲 Come Installare come PWA (App Smartphone)

### Su iPhone / iPad (iOS Safari)
1. Apri il link dell'applicazione su **Safari**.
2. Tocca l'icona di **Condivisione** (il quadrato con la freccia verso l'alto).
3. Scorri verso il basso e seleziona **"Aggiungi alla schermata Home"**.

### Su Android (Google Chrome)
1. Apri il link dell'applicazione su **Chrome**.
2. Tocca i tre pallini del menu in alto a destra.
3. Seleziona **"Aggiungi a schermata Home"** o **"Installa app"**.

---

## 👨‍💻 Sviluppo Locale

Per eseguire ed esplorare l'applicazione in locale:

1. Clona o scarica il repository.
2. Installa le dipendenze (Node.js >=22.14):
   ```powershell
   npm ci --ignore-scripts
   Copy-Item .env.example .env
   ```
3. Configura `.env` con Client ID e Client Secret di un client Google OAuth
   di tipo **Web application**, registrando anche il redirect
   `http://localhost:8080/auth/google/callback` per lo sviluppo locale.
4. Esegui `npm start` e apri `http://localhost:8080`.

Senza credenziali appare la pagina di login non disponibile e la home resta
bloccata. Un server statico non è sufficiente per la login.

Configurazione OAuth ufficiale: [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect).
Non serve una API key Google o un token Gemini: servono Client ID e Client Secret;
il token d'identità viene emesso durante ciascun accesso e verificato dal backend.

`ALLOWED_EMAILS` limita facoltativamente gli accessi a email Google verificate,
separate da virgole. Se vuoto, sono ammessi tutti gli account Google verificati.
In Testing aggiungere gli account nella schermata Audience del progetto Google.

Verifiche senza credenziali reali:

```powershell
npm test
npm run test:browser
```

I test di flusso simulano il provider Google, mantenendo il server e i cookie
reali; un test separato verifica firme RSA con la libreria Google. La verifica
con un progetto Google reale è necessaria prima dell'attivazione.

Docker standalone: `docker compose -f compose.auth.yml up --build -d`.
In produzione impostare `APP_ORIGIN=https://nutriprobasta.jirachibot.eu` e
redirect `https://nutriprobasta.jirachibot.eu/auth/google/callback`.
Su Hermes l'Orchestrator usa un file credenziali esterno:
`/home/hermes/.config/nutripro/auth.env`, fuori dal clone ripulito dal deploy.
Il rollout richiede il nuovo container Node e il proxy sulla porta 8080;
il precedente container nginx sulla porta 80 non è compatibile.

---

## 📄 Licenza

Distribuito con licenza MIT. Libero da utilizzare e personalizzare.
