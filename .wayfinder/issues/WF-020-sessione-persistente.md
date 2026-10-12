---
id: WF-020
title: Mantenere l'accesso fra aperture dell'app e deploy
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: open
assignee: manu
assignment: manu
assignment_mode: flexible
blocked_by: []
---

# Mantenere l'accesso fra aperture dell'app e deploy

## Requirement comment

2026-10-10 — richiesta in sessione (Manu): l'app chiede l'accesso Google quasi
a ogni apertura. Diagnosi sul codice: la **sessione NutriPro** (non il token
Google) dura 12 ore fisse senza rinnovo ed è tenuta in memoria dal server, quindi
ogni riavvio, cioè ogni deploy da `dev`, chiude tutte le sessioni.

Decisioni del PO (Manu) nella stessa sessione:

1. Durata di 90 giorni.
2. Scadenza rinnovata a ogni uso: scade solo dopo 90 giorni senza aprire l'app.
3. Sessione in un cookie firmato dal server con una chiave segreta
   (`SESSION_SECRET`), che sopravvive a riavvii e deploy. Il logout chiude
   quel dispositivo; per chiudere tutte le sessioni si cambia la chiave.

## Dipendenza esterna

`SESSION_SECRET` (almeno 32 caratteri casuali) va aggiunto a
`/home/hermes/.config/nutripro/auth.env` su Hermes, fuori dai repository. Senza
la chiave il server ne genera una a ogni avvio: tutto funziona, ma i deploy
continuano a chiudere le sessioni. Se `auth.env` imposta `SESSION_TTL_SECONDS`,
va aggiornato a `7776000`.

## Acceptance criteria

- Una sessione resta valida dopo il riavvio del server con la stessa chiave.
- Ogni uso entro i 90 giorni sposta in avanti la scadenza; dopo 90 giorni di
  inattività serve un nuovo accesso.
- Cookie alterati, firmati con un'altra chiave o scaduti non danno accesso.
- Un account tolto da `ALLOWED_EMAILS` perde l'accesso alla richiesta successiva.
- Logout e nuovo login invalidano il cookie precedente su quel server.
- Il timer di scadenza del client non scatta subito con durate oltre 24 giorni.
- Nessun dato dei piani nel cookie: solo identità Google (`sub`, email, nome),
  token CSRF e scadenza.
- `npm test` e `npm run test:browser` verdi.
- Ogni push su `dev` fa deploy automatico: l'ultimo commit di un push che
  contiene codice non deve avere `[skip ci]`.

## Implementation comment

2026-10-10 — implementazione locale (Manu con Claude), non committata né pubblicata.

- `server/app.cjs`: cookie di sessione firmato con HMAC-SHA256 e `SESSION_SECRET`;
  contiene solo `sub`, email, nome, token CSRF, emissione e scadenza. Durata di
  default 90 giorni, massimo configurabile 180. Rinnovo al primo uso dopo almeno
  un giorno dall'emissione; `ALLOWED_EMAILS` ricontrollato a ogni richiesta.
- Logout e nuovo login revocano il cookie precedente in memoria: dopo un riavvio
  la revoca si perde e un cookie copiato resta valido fino alla scadenza. Per
  chiudere tutte le sessioni si cambia `SESSION_SECRET`.
- Senza `SESSION_SECRET` il server usa una chiave per processo (comportamento di
  prima ai riavvii) e in produzione scrive un avviso nei log.
- `src/App.jsx`: timer di scadenza limitato a 2^31-1 ms, altrimenti con sessioni
  oltre 24 giorni il browser lo farebbe scattare subito.
- `.env.example` documenta `SESSION_SECRET` e la nuova durata.
- Verifiche: `npm test` 53/53 (due test nuovi in `tests/auth.test.cjs`),
  `npm run test:browser` 16/16.
- Da fare per chiudere: `SESSION_SECRET` in `auth.env` su Hermes, commit e push
  su `dev`, verifica che la sessione regga a un deploy sul dominio pubblico.
