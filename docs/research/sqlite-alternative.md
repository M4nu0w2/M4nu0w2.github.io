# WF-025: `node:sqlite` per dati reali e alternative leggere

Data di verifica di tutte le fonti: **2026-10-31**. Solo fonti primarie (nodejs.org e repository nodejs/node, sqlite.org, repository/documentazione ufficiali dei singoli strumenti, postgresql.org, registro npm per i metadati dei pacchetti, Docker Hub e docker-library per le immagini). I codici `[Sn]` rimandano all'elenco fonti in fondo; `[L1]`-`[L3]` sono file del repo letti in sola lettura. Dove una fonte primaria non dice una cosa e' scritto "non verificato". Le **inferenze** (deduzioni mie, non scritte nelle fonti) sono marcate come tali.

## Sintesi

1. `node:sqlite` non ha lo stesso stato su tutte le linee Node. Su **Node 22** la documentazione dice "Stability: 1.1 - Active development" e il modulo emette ancora `ExperimentalWarning` [S1][S6]. Da **Node 24.15.0 / 25.7.0** (e su **Node 26**) e' "Stability: 1.2 - Release candidate" e il warning e' stato rimosso [S2][S3][S5][S7][S8].
2. "Release candidate" (1.2) non e' "Stable" (2): la fonte dice "No further breaking changes are anticipated but may still occur"; la definizione generale di Stability 1 dice "not subject to semantic versioning rules" e "not recommended in production environments" [S4]. Cambiamenti di comportamento in versioni minori sono documentati anche dopo l'RC (es. `defensive` attivo di default in v24.14.0/v25.5.0; rinomina `DatabaseSync` in `Database` in v26.11.0, con alias) [S3][S10].
3. Node 22 e' in Maintenance dal 2025-10-21 e arriva a fine vita il 2027-04-30 [S11]; la doc v22 non riporta il passaggio a RC. Su Node 22 `backup()`, l'opzione `timeout` e `isTransaction` richiedono **>= 22.16.0** [S1]: un `engines` ">=22.14" non li garantisce.
4. Backup consistente: l'API di backup online, `VACUUM INTO` (SQLite >= 3.27.0) e `sqlite3_rsync` sono i metodi che la documentazione SQLite indica come sicuri su DB in uso [S19][S20][S21][S33][S34]. Copiare il file mentre una transazione e' in corso puo' dare un file con "some old and some new content" [S20]. Gli snapshot del volume: nessuna fonte SQLite li tratta, **non verificato**.
5. `better-sqlite3` 13.0.3: modulo nativo MIT, `engines` node >=22, dalla v13.0.0 i prebuild (anche `linuxmusl-x64/arm64`) sono dentro il pacchetto npm e non c'e' script di install [S40][S41][S43]; il pacchetto pesa 27,3 MB decompresso [S41]; SQLite incluso 3.53.4 [S46]; nessun avviso di sicurezza pubblicato e nessun SECURITY.md [S49].
6. PostgreSQL 18 (corrente 18.6, supporto 5 anni, fine 2030-11-14) [S61] con `pg` 8.23.1 (JS, ~100 KB, nessuna dipendenza nativa obbligatoria) [S70][S71] o `postgres` 4.0.0 [S73][S74]. Costo: un secondo container (immagine `postgres:18-alpine` 120.046.199 byte secondo Docker Hub [S58]) e `shared_buffers` di default "typically 128MB" [S62], pari all'intero limite RAM attuale.
7. Strumenti di migrazione: per SQLite le migrazioni SQL numerate con `PRAGMA user_version` [S28] sono sufficienti per una tabella; `dbmate` copre sia SQLite sia PostgreSQL [S88]; `node-pg-migrate` solo PostgreSQL [S77]; Drizzle supporta `node:sqlite` ma le istruzioni di installazione indicano `drizzle-orm@rc` [S81]; Kysely documenta SQLite solo con `better-sqlite3` [S84].
8. SQLite stesso: un solo scrittore alla volta; WAL solo se tutti i processi stanno sullo stesso host [S23][S29]; supporto dichiarato fino al 2050 e formato file stabile [S30].
9. Rischi aperti principali: versione SQLite effettiva nella release Node in uso (non verificata), nessun test di ripristino, durabilita' WAL con `synchronous=NORMAL`, API async di `node:sqlite` ancora in discussione, nessuna cifratura nativa in SQLite pubblico e in PostgreSQL non e' citata una cifratura trasparente [S38][S68].
10. Questo file raccoglie fatti. La sezione "Raccomandazione" e' una proposta ragionata separata, per caso attuale e caso futuro, la decisione resta a chi gestisce il progetto.

## Contesto letto nel repo (sola lettura)

- `server/waitlist.cjs` [L1]: `require('node:sqlite')` aperto in modo lazy, `new DatabaseSync(dbPath)` senza opzioni (quindi `timeout` = 0 [S1]), `PRAGMA journal_mode = WAL`, `CREATE TABLE IF NOT EXISTS waitlist (...)`, nessun sistema di migrazioni, nessun backup nel codice.
- `Dockerfile` [L2]: `node:26-alpine`, `npm ci --omit=dev --ignore-scripts`, `VOLUME /data`, `USER node`, DB in `/data/waitlist.sqlite`.
- `package.json` [L3]: `engines.node >=26.0.0` in questo checkout (il ticket parla di `>=22.14` nel repo di orchestrazione: entrambi i casi sono trattati sotto).

## Tabella di confronto

| Criterio | `node:sqlite` su Node 22 | `node:sqlite` su Node 24.15+/26 | `better-sqlite3` 13.0.3 | PostgreSQL 18 + `pg` 8.23.1 / `postgres` 4.0.0 |
|---|---|---|---|---|
| Stato dichiarato | Stability 1.1, Active development [S1] | Stability 1.2, Release candidate (24.15.0; 25.7.0; Node 26) [S2][S3][S18] | Libreria di terzi, MIT, nessun "stability index" [S39][S40] | Versione maggiore supportata 5 anni dalla prima release [S61] |
| Flag / avviso | Nessun flag dal 22.13.0 [S1]; emette `ExperimentalWarning` (`emitExperimentalWarning('SQLite')`) [S6][S9] | Nessun flag; nessuna chiamata a `emitExperimentalWarning` nei branch v24.x e v26.x [S7][S8]; la PR "remove the experimental warning" [S5] | n/a | n/a |
| Esecuzione | Sincrona: "All APIs exposed by this class execute synchronously" [S1] | Idem [S3] | Sincrona; per query lente suggerisce worker thread [S39][S48] | Asincrona; per transazioni serve lo stesso client, non `pool.query` [S69][S72] |
| Backup online | `sqlite.backup()` da v22.16.0 [S1] | `backup()` da v23.8.0 / v22.16.0 [S2][S3] | `db.backup()` restituisce una Promise, con callback `progress` [S45] | `pg_dump` consistente senza bloccare [S65]; archiviazione continua/PITR [S66] |
| Timeout su lock (busy) | Opzione `timeout`, default 0, da v22.16.0 [S1] | `timeout` da v24.0.0 / v22.16.0, default 0 [S2][S3] | `timeout` default 5000 ms [S45] | n/a (server multi-connessione, `max_connections` tipicamente 100 [S63]) |
| Estensioni | `allowExtension` default false; `loadExtension` da v22.13.0 [S1]; compilato con FTS3/FTS5/RTREE/GEOPOLY/SESSION ecc. [S17] | Idem [S3] | `loadExtension` [S45]; FTS5 e altre opzioni di compilazione [S46] | Estensioni server (es. `pgcrypto` citata) [S68]; altro non verificato |
| Dipendenze native | Nessun pacchetto npm: SQLite e' dentro Node [S15] | Idem [S16] | Modulo nativo N-API; prebuild nel pacchetto npm dalla v13.0.0, inclusi `linuxmusl-x64/arm64` [S40][S43]; fallback compilazione se manca il prebuild [S43] | `pg`: nessuna dipendenza nativa obbligatoria (`pg-native` peer opzionale) [S70]; `postgres`: "ES module with no dependencies" [S74] |
| Peso | 0 oltre Node; `node:22-alpine` 61.337.515 byte (amd64) [S56] | `node:26-alpine` 62.944.608 byte (amd64) [S57] | 27.302.969 byte decompressi (tutti i prebuild) [S41] | `pg` 102.632 byte [S71]; `postgres` 270.989 byte [S73]; server `postgres:18-alpine` 120.046.199 byte [S58] |
| RAM | Cache default -2000 = 2.048.000 byte per file DB aperto [S28]; altro non verificato | Idem | Idem (SQLite incluso) [S28][S46]; altro non verificato | `shared_buffers` default tipicamente 128MB, `work_mem` 4MB, `maintenance_work_mem` 64MB [S62] |
| Node supportati | Da v22.5.0 [S1] | Idem [S2][S3] | `engines` >=22 [S40]; prebuild Node 26 dalla v12.10.0, rimossi Node 20 e 23 [S44] | `pg`: `engines` >=16 [S70], doc: "all current and LTS versions" [S69]; `postgres`: Node >=20 [S74] |
| SQLite incluso | Branch v22.x: 3.53.4 [S15]; branch main: 3.54.1 [S16]; sqlite.org: 3.54.1 [S31] | Vedi sinistra; versione per release Node non verificata | 3.53.4 [S46] | n/a |
| Aggiornamenti sicurezza | Con le release Node; Node 22 in Maintenance fino al 2027-04-30 [S11][S13]; policy per feature sperimentali in sez. 4 [S14] | Node 24 LTS fino al 2028-04-30, Node 26 LTS fino al 2029-04-30 [S11] | Nuove release del pacchetto; nessun SECURITY.md, nessun advisory [S49] | Release minori "at least once every three months" [S61] |
| Migrazioni | Sez. 5 | Sez. 5 | Sez. 5 | Sez. 5 |

## 1. Stabilita' di `node:sqlite`

### 1.1 Cosa dice la documentazione ufficiale

| Linea | Stato nella doc | Cronologia a livello di modulo | Fonte |
|---|---|---|---|
| Node 22 | "Stability: 1.1 - Active development." | v22.5.0 aggiunto; v22.13.0 "SQLite is no longer behind `--experimental-sqlite` but still experimental." | [S1] |
| Node 24 | "Stability: 1.2 - Release candidate." | v24.15.0 "SQLite is now a release candidate."; v23.4.0/v22.13.0 senza flag | [S2] |
| Node 25 | RC dalla v25.7.0 (2026-02-24, "Current" all'epoca); linea oggi EOL | v25.7.0 "SQLite is now a release candidate." | [S3][S18][S11][S12] |
| Node 26 | "Stability: 1.2 - Release candidate." | v25.7.0 RC; classi rinominate (vedi 1.3) | [S3][S10] |

- Date del ciclo di vita lette in `schedule.json` [S11]: Node 22 manutenzione dal 2025-10-21, fine 2027-04-30; Node 24 manutenzione dal 2026-10-20, fine 2028-04-30; Node 26 LTS dal 2026-10-28, manutenzione dal 2027-10-20, fine 2029-04-30. La pagina "previous releases" elenca v22, v24, v26 come LTS, v26 ultima v26.13.0, v22 ultima v22.23.4, v24 ultima v24.22.2 [S12].
- La PR #61262 "sqlite: mark as release candidate" (mcollina) ha come descrizione "Mark the SQLite module as release candidate and remove the experimental warning"; risulta unita il 2026-02-21 e presente nelle note di v24.15.0 (15 aprile 2026, secondo la pagina della PR) [S5]. Nella discussione: un revisore chiedeva una decisione definitiva sull'API async prima della stabilizzazione e la discussione e' stata spostata su #54307; alla domanda se fossero possibili breaking change l'autore ha risposto che lo sarebbero "unless there are major usability issues" [S5].

### 1.2 Definizioni dello "Stability index" (citazioni letterali) [S4]

- Stability 1 - Experimental: "The feature is not subject to semantic versioning rules. Non-backward compatible changes or removal may occur in any future release. Use of the feature is not recommended in production environments."
- 1.1: "Experimental features at this stage are nearing minimum viability."
- 1.2: "Experimental features at this stage are hopefully ready to become stable. No further breaking changes are anticipated but may still occur in response to user feedback or the features' underlying specification development."
- "Experimental features leave the experimental status typically either by graduating to stable, or are removed without a deprecation cycle."
- Stability 2 - Stable: "Compatibility with the npm ecosystem is a high priority."
- "Experimental features may also emit a warning."

### 1.3 Cosa e' cambiato tra le versioni (dalle tabelle "History" delle doc)

- Su Node 22: `createSession`/`applyChangeset` v22.12.0; `loadExtension`, `enableLoadExtension`, `function`, `sqlite.constants`, fine del flag v22.13.0; `isOpen`, `path` come Buffer/URL, `Symbol.dispose` v22.15.0; `backup()`, `timeout`, `isTransaction`, `location()`, `aggregate()` v22.16.0; "Add new SQLite database options" v22.18.0 [S1]. Quindi API nuove sono arrivate in versioni minori della linea LTS.
- `defensive`: opzione aggiunta in v25.1.0/v24.12.0; "Enable `defensive` by default" in v25.5.0/v24.14.0 [S3]. Il testo dice: "When the defensive flag is enabled, language features that allow ordinary SQL to deliberately corrupt the database file are disabled" [S3]. La doc v22 non elenca `defensive` tra le opzioni del costruttore [S1].
- `database.prepare()`: opzione `persistent` e "Throw `ERR_INVALID_ARG_VALUE` if `sql` contains no statements" in v26.8.0 [S3].
- Rinomina: `DatabaseSync` -> `Database` e `StatementSync` -> `Statement`, deprecazione "Documentation-only" DEP0210/DEP0211 in v26.11.0, con alias mantenuto [S10]. Il codice sorgente v26.x continua a esportare `DatabaseSync` e `StatementSync` come alias, con commento "Documentation-only deprecation, kept for backward compatibility" [S8]. Il codice del repo usa `DatabaseSync` [L1]: continua a funzionare, non verificato se una futura major lo rimuova.
- `sqlite.backup()`: "Added in: v23.8.0, v22.16.0"; `path` accetta Buffer/URL da v23.10.0 [S3]. La doc v22 riporta "Added in: v22.16.0" [S1]; la doc v24 riporta v23.8.0 [S2].

### 1.4 Politica di compatibilita'

- Linee LTS: "Active LTS" accetta "New features, bug fixes, and updates that have been audited by the Release team"; "Maintenance" (fino a Node 26): "Critical bug fixes and security updates", con nuove feature a discrezione del Release team, di solito per agevolare la migrazione [S13]. La pagina non cita le API sperimentali [S13].
- Fino a Node 26 un LTS dura 12 mesi attivi + 18 di maintenance; da Node 27 "Every release line receives 30 months of Long Term Support" [S13].
- Un'API RC non e' coperta da semver come una stabile [S4]. La PR cita che dopo la stabilizzazione eventuali breaking change richiederebbero una semver-major (affermazione di un revisore nella discussione) [S5].

### 1.5 `ExperimentalWarning`

- Il messaggio ha forma "`<feature> is an experimental feature and might change at any time`" ed e' emesso con `process.emitWarning(msg, 'ExperimentalWarning', ...)`, una volta per feature [S9].
- Branch `v22.x`: `lib/sqlite.js` chiama `emitExperimentalWarning('SQLite')` al caricamento [S6]. Branch `v24.x`, `v26.x` e `main`: `lib/sqlite.js` non la chiama [S7][S8].
- La documentazione non nomina `ExperimentalWarning` nelle pagine `sqlite.html` v22, v24, v26 (non presente nei testi letti; le ultime ~2.000 e ~13.000 caratteri delle pagine v24 e v26 non sono state lette) [S1][S2][S3].

## 2. Differenze funzionali rilevanti

### 2.1 Transazioni
- SQLite: la transazione predefinita e' DEFERRED; senza `BEGIN` ogni comando apre e chiude una transazione automatica [S27]. `BEGIN IMMEDIATE` avvia subito una transazione di scrittura e puo' fallire con SQLITE_BUSY se un'altra scrittura e' attiva; in WAL EXCLUSIVE e IMMEDIATE coincidono [S27]. Se una transazione di lettura deve diventare di scrittura e un'altra connessione ha gia' modificato il DB, la scrittura fallisce con SQLITE_BUSY [S27].
- `node:sqlite` v22: nell'elenco dei membri di `DatabaseSync` c'e' `isTransaction` (da v22.16.0, wrapper di `sqlite3_get_autocommit()`) ma nessun helper per transazioni [S1]: si usano `BEGIN`/`COMMIT`/`ROLLBACK` via `exec()` (inferenza dall'elenco).
- `better-sqlite3`: `db.transaction(fn)` con commit/rollback automatici, savepoint annidati e varianti `deferred`/`immediate`/`exclusive` [S45].
- `pg`: "You must use the same client instance for all statements within a transaction" e "Do not use transactions with the pool.query method" [S72].

### 2.2 WAL [S23][S28]
- WAL e' disponibile da SQLite 3.7.0 (2010-07-21); `PRAGMA journal_mode=WAL` e' persistente [S23][S28].
- Vantaggi dichiarati: piu' veloce, "readers do not block writers and a writer does not block readers"; ma "there can only be one writer at a time" [S23].
- Svantaggi dichiarati: tutti i processi sullo stesso host, "WAL does not work over a network filesystem"; presenza dei file `-wal` e `-shm`; checkpoint; "WAL might be very slightly slower (perhaps 1% or 2% slower)" nei carichi quasi solo lettura [S23].
- Checkpoint automatico a 1000 pagine (circa 4 MB); "checkpoint starvation": con lettori sovrapposti il file WAL puo' crescere senza limite [S23].
- Durabilita': con `synchronous=NORMAL` in WAL "A transaction committed in WAL mode with synchronous=NORMAL might roll back following a power loss or system crash" [S28].
- Il default di `journal_mode` e' DELETE [S28]; la doc di Node non parla di WAL [S1][S2][S3].

### 2.3 Backup online e `VACUUM INTO`
Vedi sezione 6. Esistono in `node:sqlite` (`backup()`) e in `better-sqlite3` (`db.backup()`); `VACUUM INTO` e' un comando SQL (eseguibile con `exec()`, inferenza).

### 2.4 Estensioni
- `node:sqlite`: `allowExtension` default `false`; "When `allowExtension` is `false` when constructing, you cannot enable loading extensions for security reasons" [S1][S3].
- Opzioni di compilazione di SQLite in Node (branch v22.x): `SQLITE_ENABLE_FTS3`, `FTS3_PARENTHESIS`, `FTS5`, `GEOPOLY`, `MATH_FUNCTIONS`, `RTREE`, `SESSION`, `COLUMN_METADATA`, `DBSTAT_VTAB`, `PREUPDATE_HOOK`, `RBU`, `SQLITE_DEFAULT_MEMSTATUS=0` [S17].
- `better-sqlite3`: opzioni incluse tra cui `SQLITE_ENABLE_FTS5`, `SQLITE_THREADSAFE=2`, `SQLITE_DEFAULT_FOREIGN_KEYS=1`, `SQLITE_DQS=0`; amalgamation personalizzabile [S46].
- Chiavi esterne: SQLite le lascia OFF di default [S28]; `node:sqlite` le abilita di default (`enableForeignKeyConstraints` true) [S1]; `better-sqlite3` le compila attive [S46].

### 2.5 Errori e lock con accessi concorrenti
- SQLITE_BUSY: conflitto con un'altra connessione, di solito in un altro processo; puo' comparire all'inizio, durante una scrittura o al commit; con `BEGIN IMMEDIATE`, se riesce, nessuna operazione successiva fino al `COMMIT` restituira' SQLITE_BUSY [S24]. SQLITE_LOCKED invece riguarda la stessa connessione (o cache condivisa) [S24].
- Solo in WAL: SQLITE_BUSY_SNAPSHOT (promozione read -> write dopo che altri hanno scritto) e SQLITE_BUSY_RECOVERY (recupero dopo crash in corso) [S24].
- Il gestore di busy predefinito e' NULL: "SQLITE_BUSY is returned immediately upon encountering the lock" [S26]. `sqlite3_busy_timeout()` installa un gestore che dorme fino ad almeno `ms` millisecondi poi lascia tornare SQLITE_BUSY [S25]. In caso di rischio di deadlock SQLite restituisce SQLITE_BUSY senza invocare il gestore [S26].
- `node:sqlite`: `timeout` e' il busy timeout, default 0 [S1]. `better-sqlite3`: default 5000 ms [S45]. Il codice attuale non lo imposta [L1].
- Se come oggi c'e' un solo processo con una sola connessione, i conflitti possono nascere solo da altri processi che aprono lo stesso file (es. un backup eseguito da fuori); inferenza dalla definizione di SQLITE_BUSY [S24].
- Come `node:sqlite` espone codici di errore (`errcode`): non verificato.

### 2.6 Prepared statement
- `node:sqlite`: `database.prepare()` e' un wrapper di `sqlite3_prepare_v2()` (doc v22) / `sqlite3_prepare_v3()` (doc v26) [S1][S3]; "prepared statements are preferred over hand-crafted SQL strings when handling user input" [S3]. `StatementSync` e' sincrono [S1].
- `better-sqlite3`: statement preparati come API principale [S39][S45]. `pg`: "prepared statements" tra le funzioni elencate [S69].

### 2.7 Esecuzione sincrona e threading
- Entrambi i driver SQLite bloccano il thread chiamante per la durata della query [S1][S39]; `better-sqlite3` e' "fast enough to use in the main thread without blocking for a noticeable amount of time", altrimenti consiglia un pool di worker [S48].
- SQLite ha tre modalita' di threading, il default e' serialized [S36]. `better-sqlite3` e' compilato con `SQLITE_THREADSAFE=2` (multi-thread: nessuna connessione usata da due thread contemporaneamente) [S46][S36].
- Se `backup()` di `node:sqlite` blocchi l'event loop durante la copia: non verificato (la doc dice solo che restituisce una Promise) [S1].

## 3. Alternative per peso e maturita'

### 3.1 `better-sqlite3`
- Repo `WiseLibs/better-sqlite3`, MIT, circa 7,5k stelle e 485 fork (sidebar, 2026-10-31) [S39]. Ultima release 13.0.3 (5 agosto; la pagina mostra giorno e mese, il footer riporta 2026) [S42].
- v13.0.0: "first version ... to run on" Node-API (`node-addon-api`); i prebuild sono pubblicati "directly with the `better-sqlite3` code itself"; rimossa la dipendenza `prebuild-install`; "If your platform/architecture doesn't have a prebuilt binary, it should compile during install as before" [S43]. `package.json`: nessuno script `install`, `gypfile: false`, entry per `linux-x64`, `linux-arm64`, `linuxmusl-x64`, `linuxmusl-arm64`, `darwin-*`, `win32-*` [S40][S41]. L'immagine Alpine usa musl [S59] (inferenza: i prebuild `linuxmusl-*` sono quelli per Alpine; il testo delle release non nomina Alpine [S43]).
- Node supportati: `engines` `>=22` [S40]; v12.10.0 ha aggiunto i prebuild Node 26 e rimosso Node 20 e 23 [S44]; README: "Requires a currently supported Node.js version" [S39].
- Cronologia recente (ultime 8 release, [S42]): v12.12.0 SQLite 3.53.3; v13.0.0 (21 luglio) rilascio major; v13.0.2 SQLite 3.53.4 e correzione di abort con worker terminati; v12.11.0 marcata "NOT A VIABLE RELEASE" e sostituita da v12.11.1. Nessuna correzione e' etichettata come fix di sicurezza nelle 8 release [S42].
- Sicurezza: "No security policy detected", "There aren't any published security advisories" [S49].
- Documentazione ufficiale: WAL "recommended to turn on WAL mode to greatly increase overall performance", con "a few disadvantages to consider"; per WAL e checkpoint grandi suggerisce `wal_checkpoint(RESTART)` [S47].

### 3.2 Driver PostgreSQL
- `pg` (node-postgres) 8.23.1, MIT, `engines` node >=16, dipendenze `pg-connection-string`, `pg-pool`, `pg-protocol`, `pg-types`, `pgpass`; `pg-native` solo peer opzionale; 102.632 byte decompressi [S70][S71]. Supporta "every version of the PostgreSQL database from 8.x" [S69]. Funzioni: callback, promise, async/await, pool, prepared statement, cursori [S69].
- `postgres` (porsager) 4.0.0, licenza Unlicense, `engines` node >=20, 270.989 byte, "ES module with no dependencies", "Fastest full-featured PostgreSQL client" (dichiarazione del README) [S73][S74].
- Server: PostgreSQL 18.6 corrente; 17.11, 16.15, 15.19, 14.24 supportate; fine supporto 18: 2030-11-14, 17: 2029-11-08, 16: 2028-11-09, 15: 2027-11-11, 14: 2026-11-12 [S61].

### 3.3 Altro di rilevante
- `sqlite3` (node-sqlite3, TryGhost): "[DEPRECATED]", "This repository is currently unmaintained", archiviato dal proprietario il 2026-07-01, sola lettura; SQLite incluso 3.52.0 [S51]. Da escludere come candidato.
- libSQL (Turso): fork open-contribution di SQLite, MIT, "actively maintained, but new features are being developed in Turso"; Turso Database e' una riscrittura "not a fork of SQLite" in beta [S52]. Per una tabella non porta vantaggi documentati; altro non verificato.
- PGlite: Postgres in processo per Node/Bun/Deno; "only has a single exclusive connection"; nessuna dichiarazione di idoneita' alla produzione nella pagina letta [S55]. Non adatto a piu' utenti concorrenti per quanto scritto.
- Litestream: replica continua e asincrona delle pagine WAL su storage di oggetti [S53][S54]; strumento di backup, non un driver (vedi sezione 6).
- Query builder/ORM (Drizzle, Kysely, Knex): non sono driver; vedi sezione 5.

## 4. Costi operativi

### 4.1 Dimensione immagine (valori dell'API Docker Hub, tag aggiornati tra il 2026-10-22 e il 2026-10-28)
- `node:22-alpine`: 61.337.515 byte (amd64), 61.142.798 (arm64) [S56].
- `node:26-alpine`: 62.944.608 byte (amd64), 68.000.094 (arm64) [S57].
- `postgres:18-alpine`: 120.046.199 byte (amd64), 117.883.318 (arm64) [S58].
- Se i valori siano compressi: non verificato (la risposta non lo dice).
- `better-sqlite3` aggiunge a `node_modules` fino a 27,3 MB decompressi (comprende tutti i prebuild e i sorgenti) [S41]; `pg` circa 0,1 MB [S71].

### 4.2 RAM
- SQLite: cache predefinita -2000 (2.048.000 byte) per file DB aperto, modificabile con `PRAGMA cache_size` [S28]. Altri consumi dei driver SQLite: non verificato (nessun dato ufficiale letto).
- PostgreSQL: `shared_buffers` "typically 128 megabytes"; "On systems with less than 1GB of RAM, a smaller percentage of RAM is appropriate"; `work_mem` 4MB; `max_connections` tipicamente 100 e le risorse (anche memoria condivisa) dipendono da quel valore [S62][S63]. Nell'immagine Docker `/dev/shm` e' di 64MB di default [S60]. Memoria minima ufficiale di PostgreSQL: non verificato. Inferenza: la configurazione di default da sola eguaglia i 128 MB attuali, quindi servirebbe una RAM separata e una configurazione dedicata.

### 4.3 Compilazione di moduli nativi nel Dockerfile
- `node:sqlite`: nessuna compilazione (SQLite e' compilato dentro Node) [S15][S17].
- `better-sqlite3` 13: prebuild nel pacchetto, nessuno script di install [S40][S41][S43]. Il Dockerfile attuale usa `npm ci --ignore-scripts` [L2]: con il percorso prebuild non serve eseguire script; come funzioni il "fallback compile during install" in presenza di `--ignore-scripts`: non verificato.
- Se si dovesse compilare: node-gyp richiede "A supported version of Python", `make`, "A proper C/C++ compiler toolchain" [S50]; nomi dei pacchetti Alpine corrispondenti: non verificato. L'immagine Alpine usa musl e "software will often run into issues depending on the depth of their libc requirements/assumptions" [S59].
- `pg`/`postgres`: JavaScript, nessuna compilazione [S70][S74]. L'immagine `postgres` Alpine usa musl; "Previous Postgres versions based on alpine do not support locales", dalla 15 sono supportate le locale ICU [S60].

### 4.4 Aggiornamenti di sicurezza
- Node: i fix di SQLite per `node:sqlite` arrivano con le release di Node. Versione di SQLite nel branch v22.x al momento della lettura: 3.53.4 (source id 2026-07-24) [S15]; nel branch main 3.54.1 (2026-10-16) [S16]; ultima su sqlite.org 3.54.1 [S31]. La versione dentro la specifica release Node in uso: non verificata (lette solo le teste dei branch).
- `SECURITY.md` di Node: per feature sperimentali a flag runtime `--experimental-*` con opt-in esplicito, 1.0/1.1 "will **not** be accepted as valid security issues" salvo impatto su feature stabili, mentre per lo stadio 1.2 "are acceptable as valid security issues" [S14]. `node:sqlite` su Node 22 non e' piu' dietro flag dalla 22.13.0 [S1], quindi non e' detto come la regola si applichi: non verificato. Lo stesso file elenca come esempio di uso scorretto dell'applicazione (non vulnerabilita' di Node) consentire a utenti non fidati di registrare funzioni SQLite definite dall'utente [S14].
- SQLite: "The SQLite developers do not write CVEs ... CVEs about SQLite probably do not apply to your use of SQLite"; bug corretti "usually within a few hours"; "It is not necessary to have the latest patched version of SQLite" per applicazioni che controllano il proprio SQL; con SQL non fidato "It is good to keep up-to-date with the latest patches" [S32]. Impegno: supporto "through the year 2050", formato file stabile e retrocompatibile [S30].
- `better-sqlite3`: SQLite incluso aggiornato dalle release del pacchetto (3.53.4 in v13.0.2) [S42][S46]; al momento della lettura sqlite.org e Node main sono a 3.54.1 [S16][S31]. Un ritardo di una minore e' osservato, nessuna conseguenza di sicurezza verificata.
- PostgreSQL: release minori almeno ogni tre mesi con fix di sicurezza; supporto di 5 anni per versione maggiore [S61]. Gli aggiornamenti minori richiedono di "simply replace the executables while the server is down and restart" [S67]; per le maggiori "dump and restore" o `pg_upgrade` [S67].

## 5. Strumenti di migrazione dello schema

| Strumento | Scelte compatibili | Cosa dice la documentazione ufficiale | Fonte |
|---|---|---|---|
| SQL numerate a mano + `PRAGMA user_version` | SQLite (qualsiasi driver) | `user_version` e' "an integer that is available to applications to use however they want. SQLite makes no use of the user-version itself." E' a offset 60 dell'header. | [S28] |
| `dbmate` | SQLite e PostgreSQL | Binario singolo; SQL puro con `-- migrate:up` / `-- migrate:down`; tabella `schema_migrations`; immagini su `ghcr.io/amacneil/dbmate`; MIT; "Supports MySQL, MariaDB, PostgreSQL, SQLite, and ClickHouse" | [S88] |
| `umzug` 3.8.3 | Qualsiasi (agnostico) | "framework-agnostic migration tool for Node"; storage JSON, memoria, Sequelize, MongoDB o custom; SQL grezzo con `resolve` personalizzato (`migrations/*.up.sql`); non elenca storage nativi per SQLite o `pg`; MIT | [S75][S76] |
| `node-pg-migrate` 9.0.0 (npm latest) | Solo PostgreSQL | "only targets PostgreSQL"; file `.sql` con `-- Up Migration` / `-- Down Migration`; la pagina docs mostra la versione 10.0.0-alpha.7; peer `pg` >=4.3.0 <9.0.0 | [S77][S78] |
| Drizzle Kit 0.31.11 (npm latest) | PostgreSQL, SQLite (e altri); `node:sqlite`, `better-sqlite3`, `libsql` | `generate` crea file SQL, `migrate` li applica, `push` salta i file; la doc su `node:sqlite` indica `npm i drizzle-orm@rc` e `drizzle-kit@rc`; banner "Beta release" (v1.0.0-beta.2) | [S79][S80][S81][S82] |
| Kysely 0.29.7 | PostgreSQL (`pg`), SQLite con `better-sqlite3` | `Migrator`, `FileMigrationProvider`; blocco a livello di DB; `node:sqlite` non menzionato tra i dialetti integrati; `engines` node >=22 | [S83][S84][S85] |
| Knex 3.3.0 | PostgreSQL, SQLite3 (peer opzionali `pg`, `sqlite3`, `better-sqlite3`) | Tabella `knex_migrations`; ogni migrazione in transazione di default; per SQLite "Disabling / enabling foreign key checking has no effect within a transaction", consigliato `transaction: false`; `node:sqlite` non citato | [S86][S87] |

Note su SQLite:
- `ALTER TABLE` supporta solo rinomina tabella, rinomina colonna, aggiunta e rimozione colonna; per altre modifiche la doc descrive una procedura in 12 passi (disabilitare `foreign_keys`, transazione, nuova tabella, copia, `DROP`, `RENAME`, ricreare indici/trigger/viste, `foreign_key_check`) [S35]. `PRAGMA foreign_keys` e' un no-op dentro una transazione [S28].
- Se si cambia verso PostgreSQL, la sintassi DDL cambia e le migrazioni SQLite non sono riusabili tali e quali (inferenza); `dbmate` e `umzug` mantengono lo stesso meccanismo di gestione migrazioni passando da un DB all'altro, i file SQL vanno riscritti.

## 6. Backup consistente di un file SQLite in uso

| Metodo | Cosa dice la documentazione | Fonte |
|---|---|---|
| API di backup online (`sqlite3_backup_init/step/finish`) | La destinazione diventa "a bit-wise identical copy of the source database as it was when the copying commenced"; puo' essere incrementale, con lock di lettura solo durante i passi; se un'altra connessione/processo scrive durante la copia "SQLite detects this and usually restarts the backup"; se la scrittura usa lo stesso handle la destinazione e' aggiornata insieme alla sorgente; "If the backup process is restarted frequently enough it may never run to completion"; copia in un solo passo (`-1`) tiene il lock di lettura e impedisce le scritture; a fine operazione il backup e' "a consistent and up-to-date snapshot" | [S19] |
| `backup()` di Node / `db.backup()` | `node:sqlite`: astrae `sqlite3_backup_init/step/finish`; "mutations from other connections will cause the backup process to restart"; `rate` default 100 pagine; restituisce una Promise con il numero di pagine. `better-sqlite3`: Promise, callback `progress` | [S1][S3][S45] |
| `VACUUM INTO 'file'` | Aggiunto in SQLite 3.27.0 (2019-02-07). "Alternative to the backup API for generating backup copies of a live database"; copia minima in dimensione, senza tracce di dati cancellati; l'API di backup "uses fewer CPU cycles and can be executed incrementally"; il file di destinazione non deve esistere (o essere vuoto); la copia e' "a consistent snapshot", ma se interrotta da spegnimento improvviso il file puo' essere "incomplete and corrupt"; con `synchronous` NORMAL/FULL viene fatto `fsync` alla fine. Un `VACUUM` normale puo' richiedere fino al doppio dello spazio libero; per `VACUUM INTO` la pagina non da' una cifra | [S21][S33] |
| Comando `.backup` della shell `sqlite3` | La pagina dice solo `.backup ?DB? FILE  Backup DB (default "main") to FILE` e che `.save` e' un alias; non dichiara quale API usi ne' se sia sicuro con scritture concorrenti: non verificato nella documentazione ufficiale letta | [S22] |
| `sqlite3_rsync` | Disponibile da SQLite 3.47.0 (2024-10-21); "Both databases may be 'live'"; la replica e' "a copy of a snapshot of ORIGIN as it existed when the sqlite3_rsync command started"; l'eseguibile serve a entrambi i lati; i vincoli WAL/page-size sono stati rimossi in 3.50.0 | [S20][S34] |
| Copia a freddo del file | "It is also safe to make a copy of an SQLite database file as long as there are no transactions in progress while the copy is taking place"; se una transazione precedente e' fallita va copiato anche `-journal`/`-wal` insieme al DB | [S20] |
| Snapshot del volume | Nessuna pagina SQLite letta tratta gli snapshot di volume: non verificato. Inferenza: serve uno snapshot atomico che includa DB e `-wal` nello stesso istante, perche' "If a database file is separated from its WAL file, then transactions that were previously committed to the database might be lost, or the database file might become corrupt" [S23] | [S23][S37] |
| Litestream (strumento terzo, doc ufficiale) | Processo separato che copia in continuo le pagine WAL su una replica; richiede WAL; "Litestream works by effectively taking over the checkpointing process"; replica asincrona ("Litestream performs asynchronous replication"): le scritture recenti possono andare perse; raccomanda `busy_timeout = 5000` e `synchronous = NORMAL`; ogni DB ha una sola destinazione; la granularita' di restore e' piu' grossolana del ritmo di scrittura | [S53][S54] |

### Perche' una semplice copia durante la scrittura puo' corrompere
- Fonte: "Systems that run automatic backups in the background might try to make a backup copy of an SQLite database file while it is in the middle of a transaction. The backup copy then might contain some old and some new content, and thus be corrupt." [S20]
- Il vecchio metodo "lock e copia" ha anche questo limite: "If a power failure or operating system failure occurs while copying the database file the backup database may be corrupted following system recovery" [S19].
- Lo stato del DB e' controllato da DB e journal insieme: "Copying a database file without also copying its journal" e "Overwriting a database file with another without also deleting any hot journal" sono azioni "likely to lead to corruption" [S20]. In WAL il file `-wal` "should be kept with the database if the database is copied or moved" [S23].
- La pagina sulle corruzioni non cita Docker, container o macchine virtuali [S20]. Cita invece filesystem di rete con lock difettosi (rischio di corruzione), rinomina/cancellazione di un DB aperto e piu' link allo stesso file [S20]; per WAL "All processes using a database must be on the same host computer" [S23]. Comportamento di un volume Docker/bind mount rispetto a questi vincoli: non verificato.
- SQLite assume che `fsync` funzioni come dichiarato dal sistema; la pagina avverte che su alcune versioni di Windows e Linux e' difettoso e che i controller possono mentire [S37].

### PostgreSQL (confronto)
- Tre approcci: SQL dump, backup a livello di file system, archiviazione continua [S64]. `pg_dump` "makes consistent exports even if the database is being used concurrently" e non blocca altri utenti, ma "except in simple cases, pg_dump is generally not the right choice for taking regular backups of production databases" [S65]. `pg_dump` esporta un solo database; ruoli e tablespace richiedono `pg_dumpall` [S65]. Archiviazione continua con `pg_basebackup` + WAL archiviati consente il point-in-time recovery [S66].

## 7. Rischi che restano aperti

1. **Stato dell'API.** RC non e' stabile [S4]; la discussione sull'API async e un eventuale cambio di nomi (`Sync`) erano aperti nella PR di stabilizzazione (#54307) [S5]; la rinomina in `Database` e' gia' avvenuta con alias [S10]. Su Node 22 lo stato resta 1.1 [S1].
2. **Versione di Node e `engines`.** `backup()`, `timeout`, `isTransaction` richiedono >= 22.16.0 [S1]; il repo di orchestrazione dichiara `>=22.14` (dal ticket). Node 22 esce di supporto il 2027-04-30 [S11].
3. **Versione di SQLite effettiva** nella release Node in uso e in `better-sqlite3`: non verificata per le release specifiche; branch letti 3.53.4/3.54.1 [S15][S16][S46].
4. **Politica di sicurezza per `node:sqlite` su Node 22** (non piu' dietro flag, stadio 1.1): non e' chiaro se rientri tra le feature sperimentali escluse da `SECURITY.md` [S14].
5. **Nessun backup ne' test di ripristino** oggi; nessun backup incluso nel codice [L1]. Un backup mai ripristinato non e' verificato.
6. **Durabilita' in WAL** con `synchronous=NORMAL`: una transazione puo' tornare indietro dopo un crash [S28]. Impostazione attuale di `synchronous` nel codice: non impostata [L1].
7. **Lock concorrenti**: `timeout` 0 [S1][L1]; un processo esterno (es. backup via CLI) puo' ricevere o causare SQLITE_BUSY [S24]. Comportamento di `.backup` sotto carico: non verificato [S22].
8. **Event loop**: esecuzione sincrona [S1]; comportamento di `backup()`, `VACUUM`, query lente sul thread principale non verificato.
9. **Modello multi-istanza**: WAL richiede stesso host [S23]; SQLite non e' indicato per piu' computer che accedono direttamente allo stesso DB in rete [S29]. Una sola istanza e' l'ipotesi attuale.
10. **Cifratura a riposo**: la pagina SEE dice che SEE e' un componente aggiuntivo a pagamento, e non afferma esplicitamente l'assenza di cifratura nel SQLite pubblico [S38]; PostgreSQL elenca cifratura di colonne (`pgcrypto`), di partizione/file system, di rete e client-side, senza un'affermazione su cifratura trasparente integrata [S68]. Requisiti legali/regolatori per dati sanitari: fuori dall'ambito di questa ricerca, non valutati.
11. **`better-sqlite3`**: ritardo di una versione minore di SQLite rispetto a sqlite.org [S31][S46]; fallback di compilazione con `--ignore-scripts` non verificato [S43][L2]; release v12.11.0 ritirata per "NOT A VIABLE RELEASE" (segnale che i rilasci possono richiedere una correzione rapida) [S42].
12. **PostgreSQL**: secondo container, RAM dedicata (default `shared_buffers` 128MB [S62]), aggiornamenti di versione maggiore con dump/restore o `pg_upgrade` [S67], backup e monitoraggio da gestire.
13. **Strumenti di migrazione**: `node:sqlite` e' supportato da Drizzle solo con pacchetti `@rc` secondo le istruzioni [S81]; Kysely lo documenta solo con `better-sqlite3` [S84]; Knex cita `sqlite3`/`better-sqlite3` come peer opzionali [S87].
14. **Documentazione che puo' divergere**: le pagine v22/v24/v26 di `node:sqlite` riportano versioni "Added in" diverse per `backup()` (v22.16.0 / v23.8.0) (la pagina v24 cita solo v23.8.0, la v26 cita entrambe) [S1][S2][S3]; per i numeri di versione usare la pagina della linea effettivamente installata.

## Raccomandazione (proposta; i fatti sono sopra, la decisione resta al committente)

### Caso attuale: waitlist, una tabella, un processo, 128 MB
- Dai fatti: una tabella, una istanza, `INSERT ... ON CONFLICT DO NOTHING` [L1]; il formato file SQLite e' stabile e supportato fino al 2050 [S30]; SQLite regge siti a basso/medio traffico ("fewer than 100K hits/day should work fine") [S29]; nessun costo di RAM/immagine aggiuntivo con `node:sqlite` [S15][S56][S57].
- **Su Node 26** (RC, nessun avviso, nessuna dipendenza): proposta di restare su `node:sqlite`. Il rischio principale (cambi di API) e' limitato a una tabella e a poche chiamate (`prepare`, `run`, `exec`, `close`) [L1]; l'alias `DatabaseSync` e' ancora esportato [S8].
- **Su Node 22**: restare e' difendibile solo con consapevolezza di Stability 1.1, `ExperimentalWarning` e fine supporto 2027-04-30 [S1][S6][S11]. Se si usano `backup()` o `timeout`, alzare `engines` a >=22.16.0 [S1]. Consigliabile pianificare il passaggio a Node 24/26.
- `better-sqlite3` per questo caso aggiunge 27,3 MB e una dipendenza di terzi [S41] senza esigenze funzionali documentate qui; il vantaggio concreto (`db.transaction()`, `timeout` 5000 di default) non e' necessario per un `INSERT` singolo. Non proposto per ora, resta il piano B se `node:sqlite` cambiasse.
- Misure a costo basso suggerite dai fatti (non cambiano scelta tecnologica): impostare `timeout` (es. via opzione; 5000 ms e' il valore di default di `better-sqlite3` e quello raccomandato da Litestream) [S1][S45][S54]; backup periodico con `backup()` o `VACUUM INTO` su un file nuovo, copiato fuori dal volume, e **provare un ripristino** [S19][S21]; versionare lo schema con `PRAGMA user_version` e SQL numerato [S28]; fissare la versione patch dell'immagine Node.

### Caso futuro: dati sanitari, piu' utenti
- Dai fatti: SQLite ammette un solo scrittore alla volta [S23][S29]; WAL richiede stesso host [S23]; la guida "when to use" indica un RDBMS client/server quando molti client accedono via rete o servono alta concorrenza di scrittura [S29]; i backup di SQLite richiedono procedure esplicite (sez. 6), con replica continua solo tramite strumenti terzi asincroni (finestra di perdita dati) [S53][S54]; PostgreSQL offre `pg_dump` consistente, archiviazione continua e PITR [S65][S66], 5 anni di supporto per versione maggiore [S61] e piu' opzioni di cifratura documentate [S68].
- Proposta: valutare **PostgreSQL con `pg`** (o `postgres`) come candidato principale se previsti piu' istanze, piu' scrittori concorrenti, requisiti di RPO/PITR o separazione di ruoli; il costo e' un secondo container, RAM dedicata (>128 MB) e gestione di backup/upgrade [S58][S62][S67]. `pg` e' la scelta piu' documentata (engines >=16, Node correnti e LTS) [S69][S70]; `postgres` e' piu' recente (v4, Node >=20) [S73][S74]. Migrazioni: `dbmate` (stesso strumento anche per SQLite) o `node-pg-migrate` (solo PostgreSQL, alpha nella pagina docs) [S77][S88].
- Se invece restano una sola istanza e pochi utenti, SQLite (`node:sqlite` su Node 24/26 o `better-sqlite3`) e' ancora difendibile **a condizione di** backup testati, `busy_timeout`, e almeno un meccanismo di replica/backup frequente; la scelta tra i due driver dipende allora dalla tolleranza al rischio di API RC contro l'aggiunta di una dipendenza nativa di terzi (sez. 3.1, 7).
- Prima di scegliere: requisiti legali e di cifratura a riposo per dati sanitari (non valutati qui), stima del numero di scrittori concorrenti, RPO/RTO attesi.

## Cosa non e' stato possibile verificare
- Versione di SQLite dentro la specifica release Node in uso (lette solo le teste dei branch `v22.x` e `main`) [S15][S16].
- Se `backup()` di `node:sqlite` o `db.backup()` di `better-sqlite3` bloccano l'event loop; quale API C usa `db.backup()`.
- Se `.backup` della shell `sqlite3` usa l'API di backup e il suo comportamento con scritture concorrenti [S22]; se `node:alpine` includa il CLI `sqlite3`.
- Consistenza di snapshot di volume Docker/storage rispetto a SQLite WAL; comportamento di volumi Docker/bind mount rispetto ai vincoli di locking.
- Nomi dei pacchetti Alpine per compilare `better-sqlite3`; comportamento del fallback di compilazione con `npm ci --ignore-scripts`.
- Consumi di RAM misurati dei driver e requisito minimo ufficiale di RAM di PostgreSQL.
- Se le dimensioni di Docker Hub sono compresse.
- Come `node:sqlite` espone i codici di errore SQLite; se `node:sqlite` bloccherebbe una futura rimozione di `DatabaseSync`.
- Compatibilita' di Knex e Kysely con `node:sqlite` (non menzionata nelle pagine lette).
- Cifratura nativa di SQLite pubblico e di PostgreSQL (solo parzialmente documentata nelle pagine lette); requisiti normativi.
- Data di rilascio esatta di Node 24.15.0 se non tramite la pagina della PR [S5].

## Elenco fonti (tutte verificate il 2026-10-31)

### Node.js
- [S1] https://nodejs.org/docs/latest-v22.x/api/sqlite.html
- [S2] https://nodejs.org/docs/latest-v24.x/api/sqlite.html
- [S3] https://nodejs.org/docs/latest-v26.x/api/sqlite.html
- [S4] https://nodejs.org/api/documentation.html (Stability index)
- [S5] https://github.com/nodejs/node/pull/61262
- [S6] https://raw.githubusercontent.com/nodejs/node/v22.x/lib/sqlite.js
- [S7] https://raw.githubusercontent.com/nodejs/node/v24.x/lib/sqlite.js
- [S8] https://raw.githubusercontent.com/nodejs/node/v26.x/lib/sqlite.js (identico alla versione su `main`: https://raw.githubusercontent.com/nodejs/node/main/lib/sqlite.js)
- [S9] https://raw.githubusercontent.com/nodejs/node/v22.x/lib/internal/util.js
- [S10] https://nodejs.org/docs/latest-v26.x/api/deprecations.html (DEP0210, DEP0211)
- [S11] https://raw.githubusercontent.com/nodejs/Release/main/schedule.json
- [S12] https://nodejs.org/en/about/previous-releases
- [S13] https://raw.githubusercontent.com/nodejs/Release/main/README.md
- [S14] https://raw.githubusercontent.com/nodejs/node/main/SECURITY.md
- [S15] https://raw.githubusercontent.com/nodejs/node/v22.x/deps/sqlite/sqlite3.h
- [S16] https://raw.githubusercontent.com/nodejs/node/main/deps/sqlite/sqlite3.h
- [S17] https://raw.githubusercontent.com/nodejs/node/v22.x/deps/sqlite/sqlite.gyp
- [S18] https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V25.md (v25.7.0)

### SQLite
- [S19] https://www.sqlite.org/backup.html
- [S20] https://www.sqlite.org/howtocorrupt.html
- [S21] https://www.sqlite.org/lang_vacuum.html
- [S22] https://www.sqlite.org/cli.html
- [S23] https://www.sqlite.org/wal.html
- [S24] https://www.sqlite.org/rescode.html
- [S25] https://www.sqlite.org/c3ref/busy_timeout.html
- [S26] https://www.sqlite.org/c3ref/busy_handler.html
- [S27] https://www.sqlite.org/lang_transaction.html
- [S28] https://www.sqlite.org/pragma.html
- [S29] https://www.sqlite.org/whentouse.html
- [S30] https://www.sqlite.org/lts.html
- [S31] https://www.sqlite.org/download.html
- [S32] https://www.sqlite.org/cves.html
- [S33] https://www.sqlite.org/releaselog/3_27_0.html
- [S34] https://www.sqlite.org/rsync.html
- [S35] https://www.sqlite.org/lang_altertable.html
- [S36] https://www.sqlite.org/threadsafe.html
- [S37] https://www.sqlite.org/atomiccommit.html
- [S38] https://www.sqlite.org/com/see.html

### better-sqlite3 e altri driver/strumenti SQLite
- [S39] https://github.com/WiseLibs/better-sqlite3
- [S40] https://raw.githubusercontent.com/WiseLibs/better-sqlite3/master/package.json
- [S41] https://registry.npmjs.org/better-sqlite3/latest
- [S42] https://github.com/WiseLibs/better-sqlite3/releases
- [S43] https://github.com/WiseLibs/better-sqlite3/releases/tag/v13.0.0
- [S44] https://github.com/WiseLibs/better-sqlite3/releases/tag/v12.10.0
- [S45] https://raw.githubusercontent.com/WiseLibs/better-sqlite3/master/docs/api.md
- [S46] https://raw.githubusercontent.com/WiseLibs/better-sqlite3/master/docs/compilation.md
- [S47] https://raw.githubusercontent.com/WiseLibs/better-sqlite3/master/docs/performance.md
- [S48] https://raw.githubusercontent.com/WiseLibs/better-sqlite3/master/docs/threads.md
- [S49] https://github.com/WiseLibs/better-sqlite3/security
- [S50] https://raw.githubusercontent.com/nodejs/node-gyp/main/README.md
- [S51] https://github.com/TryGhost/node-sqlite3
- [S52] https://github.com/tursodatabase/libsql
- [S53] https://litestream.io/how-it-works/
- [S54] https://litestream.io/tips/
- [S55] https://pglite.dev/docs/

### Immagini Docker
- [S56] https://hub.docker.com/v2/repositories/library/node/tags/22-alpine
- [S57] https://hub.docker.com/v2/repositories/library/node/tags/26-alpine
- [S58] https://hub.docker.com/v2/repositories/library/postgres/tags/18-alpine
- [S59] https://raw.githubusercontent.com/docker-library/docs/master/node/README.md
- [S60] https://raw.githubusercontent.com/docker-library/docs/master/postgres/README.md

### PostgreSQL e driver
- [S61] https://www.postgresql.org/support/versioning/
- [S62] https://www.postgresql.org/docs/current/runtime-config-resource.html
- [S63] https://www.postgresql.org/docs/current/runtime-config-connection.html
- [S64] https://www.postgresql.org/docs/current/backup.html
- [S65] https://www.postgresql.org/docs/current/app-pgdump.html
- [S66] https://www.postgresql.org/docs/current/continuous-archiving.html
- [S67] https://www.postgresql.org/docs/current/upgrading.html
- [S68] https://www.postgresql.org/docs/current/encryption-options.html
- [S69] https://node-postgres.com/
- [S70] https://raw.githubusercontent.com/brianc/node-postgres/master/packages/pg/package.json
- [S71] https://registry.npmjs.org/pg/latest
- [S72] https://node-postgres.com/features/transactions
- [S73] https://registry.npmjs.org/postgres/latest
- [S74] https://github.com/porsager/postgres

### Strumenti di migrazione
- [S75] https://github.com/sequelize/umzug
- [S76] https://registry.npmjs.org/umzug/latest
- [S77] https://salsita.github.io/node-pg-migrate/
- [S78] https://registry.npmjs.org/node-pg-migrate/latest
- [S79] https://orm.drizzle.team/docs/kit-overview
- [S80] https://orm.drizzle.team/docs/get-started-sqlite
- [S81] https://orm.drizzle.team/docs/connect-node-sqlite
- [S82] https://registry.npmjs.org/drizzle-kit/latest
- [S83] https://kysely.dev/docs/migrations
- [S84] https://kysely.dev/docs/getting-started
- [S85] https://registry.npmjs.org/kysely/latest
- [S86] https://knexjs.org/guide/migrations.html
- [S87] https://registry.npmjs.org/knex/latest
- [S88] https://github.com/amacneil/dbmate

### File locali (sola lettura)
- [L1] `C:\Users\thego\Desktop\JIRACHI\NutriPro\server\waitlist.cjs`
- [L2] `C:\Users\thego\Desktop\JIRACHI\NutriPro\Dockerfile`
- [L3] `C:\Users\thego\Desktop\JIRACHI\NutriPro\package.json`
