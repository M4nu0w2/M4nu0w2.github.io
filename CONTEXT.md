# NutriPro

Termini del prodotto condivisi per la gestione dei piani alimentari e della
lista della spesa. Le definizioni descrivono il dominio, non l’implementazione.

## Language

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

**Sostituzione rapida**:
Proposta occasionale di un ingrediente alternativo con peso adattato, cercando
calorie e macronutrienti quasi equivalenti alla porzione originale del pasto.
_Avoid_: Alternativa prescritta nel PDF come sinonimo di proposta generata.
