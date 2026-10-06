# NutriPro

Termini del prodotto condivisi per la gestione dei piani alimentari e della
lista della spesa. Le definizioni descrivono il dominio, non l’implementazione.

## Language

**Piano attivo**:
Piano mostrato dalla home e utilizzato per pasti, spunte, acqua ed esportazione.
Ogni account può avere un solo piano attivo alla volta, oppure nessuno.

**Piano inattivo**:
Piano conservato nell'archivio, con contenuto e tracking propri, che non guida
la home. Può essere riattivato senza cancellare il precedente piano attivo.
_Avoid_: Inattivo come sinonimo di eliminato.

**Sostituzione del piano**:
Reimportazione distruttiva del PDF nel piano attivo, protetta da due conferme.
Sovrascrive contenuto e tracking di quel piano; non archivia la versione sostituita.
_Avoid_: Caricamento di un nuovo piano, che conserva invece il precedente.

**Account Google**:
Identità verificata da Google per accedere a NutriPro, riconosciuta tramite
l'identificativo stabile `sub`. L'email è un attributo, non la chiave dei piani.
_Avoid_: Token API Gemini come credenziale per la login.

**Sessione NutriPro**:
Accesso temporaneo creato dal server dopo la verifica Google; termina alla
scadenza, al logout o al riavvio del servizio.
_Avoid_: Login come sinonimo di archivio remoto o sincronizzazione dei piani.

**Piano alimentare**:
Entità personale corrispondente al contenuto di un singolo PDF del piano
nutrizionale, distinguibile dagli altri piani dello stesso utente nel tempo.
_Avoid_: Dieta corrente come sinonimo dell’intero archivio.

**PDF sorgente**:
Documento originale da cui proviene un piano alimentare.
_Avoid_: Piano come sinonimo del file originale.

**Alternativa alimentare**:
Alimento o ricetta indicato nel piano come scelta sostitutiva, con le proprie
quantità; una ricetta comprende il gruppo dei suoi ingredienti.
_Avoid_: Alimento aggiuntivo.

**Voce della lista della spesa**:
Acquisto richiesto per i giorni scelti; può contenere più alternative fra cui
scegliere, mantenute insieme con le rispettive quantità.
_Avoid_: Somma di tutte le alternative.

**Chatbot nutrizionale**:
Assistente conversazionale disponibile dentro NutriPro per domande sul proprio
piano alimentare e sulla nutrizione in generale.
_Avoid_: Bot Telegram come sinonimo.

**Piano di riferimento**:
Piano alimentare che il chatbot nutrizionale usa come contesto di una conversazione:
di default il piano attivo, oppure un altro piano dell'archivio, oppure nessuno.
_Avoid_: Piano selezionato.

**Sostituzione rapida**:
Proposta occasionale, solo consultiva, di un altro alimento dello stesso piano
con lo stesso ruolo nel pasto e peso adattato, con calorie e macronutrienti
quasi equivalenti alla porzione originale. Non modifica piano, tracking o lista
della spesa.
_Avoid_: Alternativa prescritta nel PDF come sinonimo di proposta generata.

**Ruolo nel pasto**:
Funzione nutrizionale prevalente di un alimento nel pasto: fonte di carboidrati,
proteica, di grassi, verdura o frutta.
_Avoid_: Categoria merceologica come sinonimo.

**Settaggi account**:
Preferenze dell'utente valide per tutti i suoi piani; cambiare piano attivo non
le modifica.
_Avoid_: Impostazioni del piano.

**Tracking opzionale**:
Registrazione di consumi attivabile dai settaggi account, come acqua e olio.
Disattivarlo lo nasconde senza cancellarne lo storico.
_Avoid_: Disattivazione come sinonimo di cancellazione.

**Quantità effettiva**:
Quantità realmente consumata registrata su una voce del pasto; di default
coincide con la quantità prevista dal piano.
_Avoid_: Quantità prevista come sinonimo.

**Valori stimati**:
Calorie e macronutrienti per 100 g di un alimento stimati dal modello, non
presenti nel PDF sorgente né verificati da un professionista.
_Avoid_: Valori del piano o valori prescritti.
