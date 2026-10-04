# 🌱 NutriPro Basta — Piano Nutrizionale PWA (Progeo Medical Converter)

[![PWA Ready](https://img.shields.io/badge/PWA-Mobile--First-10b981?style=for-the-badge&logo=pwa)](./index.html)
[![JavaScript](https://img.shields.io/badge/Vanilla_JS-ES6+-f7df1e?style=for-the-badge&logo=javascript)](./index.html)
[![Client Side PDF Engine](https://img.shields.io/badge/PDF.js-Client--Side-ff6b6b?style=for-the-badge&logo=mozilla)](https://mozilla.github.io/pdf.js/)
[![Privacy 100%](https://img.shields.io/badge/Privacy-100%25_Offline-06b6d4?style=for-the-badge)](#-privacy--zero-backend)

Una **Single Page Web Application (PWA / Mobile-First)** in un unico file per l'analisi locale dei piani alimentari generati dal software gestionale **Progeo Medical**. 

L'applicazione converte automaticamente le dosi espresse in cucchiai, bicchieri e legumi secchi nelle corrispondenti grammature esatte (o peso del cotto in scatola sgocciolato) e le memorizza nel browser per consultarle ed aggiornarle ogni giorno dalla schermata Home dello smartphone.

---

## 🌐 Link Applicazione Live / Web App

> 🔗 **Accedi all'App Nutrizionale**:  
> **[INSERISCI QUI IL LINK PER L'APP]** *(es. https://tuousername.github.io/DietaDrBasta/)*

---

## ✨ Caratteristiche Principali

### 🔒 Privacy & Zero Backend
- **100% Client-Side**: Nessun server backend, nessuna API esterna, nessun dato inviato online.
- **Mozilla `pdf.js` Integrato**: Il PDF viene analizzato localmente direttamente nel browser.
- **Persistenza Locale**: Memorizza il piano alimentazione parsato in `localStorage` (`diet_plan_data`). Ai successivi accessi l'app si apre istantaneamente senza dover ricaricare il file.
- **Cambio Dieta Rapido**: Nella navbar è presente il pulsante **"Aggiorna PDF"** per caricare un nuovo file in qualsiasi momento sovrascrivendo i dati precedenti.

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

## 🛠️ Struttura Tecnologica

```
DietaDrBasta/
├── index.html       # Single Page Application completa (HTML5 + CSS3 Glassmorphism + Vanilla JS)
└── README.md        # Documentazione del progetto
```

- **CSS Moderno**: Palette Dark Smeraldo / Slate (`#0f172a`, `#1e293b`, `#10b981`), glassmorphism con `backdrop-filter`, font Google 'Outfit', transizioni fluide ed elementi touch-friendly.
- **Zero Dipendenze Pesanti**: Unicamente la libreria leggera `pdf.js` di Mozilla.

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
2. Avvia un qualsiasi server HTTP locale (es. con Python):
   ```bash
   python -m http.server 8080
   ```
3. Apri il browser all'indirizzo `http://localhost:8080/index.html`.

---

## 📄 Licenza

Distribuito con licenza MIT. Libero da utilizzare e personalizzare.
