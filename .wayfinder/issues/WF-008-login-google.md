---
id: WF-008
title: Implementare login Google e proteggere la home
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: closed
assignee: codex
assignment: null
assignment_mode: flexible
blocked_by: []
resolved: 2026-10-06
---

# Implementare login Google e proteggere la home

## Requirement comment

2026-10-06 — richiesta esplicita del PO in conversazione: login Google reale;
home accessibile soltanto dopo login; preparare tutto il necessario e poi
richiedere i dati mancanti. Questo ticket scorpora l'autenticazione da WF-001:
archivio remoto e CRUD dei piani rimangono da specificare in quel ticket.

## Acceptance criteria

- Senza sessione valida, `/` e `/index.html` rimandano alla pagina di accesso.
- Google verifica l'identità; il server verifica il token e crea una sessione
  in cookie HttpOnly, Secure in produzione, con scadenza e logout revocabile.
- Nessun token Google o Client Secret nel frontend o in localStorage.
- Errori, consenso annullato, credenziali mancanti e sessione scaduta non
  consentono di inizializzare la home.
- Piano e tracking locali distinti per account Google, senza assegnare
  automaticamente a un account i dati precedenti privi di proprietario.
- Verifica con Google reale sul dominio finale prima della chiusura.

## Implementation comment

2026-10-06 — codice preparato localmente su `dev`:

- Servizio Node 22 e libreria ufficiale `google-auth-library`, flusso OAuth
  authorization code con state, nonce e PKCE. Scope `openid email profile`.
- Home protetta sul server, pagina di accesso, logout, controllo sessione
  al ritorno in una scheda, nessuna cache della home autenticata.
- Sessioni opache in memoria, durata iniziale 12 ore; un riavvio richiede login.
- Storage locale separato per Google `sub`; vecchie chiavi conservate ma non
  importate automaticamente. Ricaricare il PDF per il primo accesso autenticato.
- Docker e CI aggiornati. Nel repository Orchestrator sono preparati backend,
  proxy e smoke di deploy, con segreti fuori dal clone e log senza codici OAuth.
- 28 test Node e 4 browser passati, provider Google simulato nei test di flusso;
  firma RSA verificata anche dalla libreria reale. Nessun test con account Google
  reale, nessuna build Docker (daemon locale non disponibile), nessun deploy.

## Missing configuration

- Client OAuth di tipo applicazione web: Client ID e Client Secret.
- Redirect autorizzato: `https://nutriprobasta.jirachibot.eu/auth/google/callback`.
- Branding/consenso Google e utenti di test se il progetto è in Testing.
- Policy di accesso: il codice permette tutti gli account Google verificati;
  `ALLOWED_EMAILS` può limitare gli accessi a una lista esplicita.
- Pubblicazione coordinata dei due repository, credenziali su Hermes e prova
  reale. GitHub Pages non esegue il backend: disabilitare la vecchia app pubblica
  o sostituirla con un redirect verso il dominio protetto durante il rollout.

Il ticket resta aperto fino alla configurazione e verifica reale.

## Validation comment

2026-10-06 — Client ID e Client Secret inseriti dal PO nel `.env` locale,
escluso da Git. Formati e caricamento configurazione verificati senza mostrare
le credenziali. Servizio avviato su `http://localhost:8080`: home senza sessione
rimanda a `/login`; pagina di accesso e configurazione OAuth rispondono.
Il PO ha testato la login Google reale e confermato in conversazione «worka».
Questo valida la login in locale; logout manuale e dominio di produzione non
risultano ancora verificati. Il ticket resta aperto per il rollout e la prova
sul dominio finale, come richiesto dagli acceptance criteria.

## Production confirmation

2026-10-06 - il PO conferma che funziona dopo aggiunta del callback Google
pubblico e deploy React. Login reale in produzione confermata; ticket chiuso.
