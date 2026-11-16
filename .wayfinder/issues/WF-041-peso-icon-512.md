---
id: WF-041
title: Ridurre il peso di public/icon-512.png
parent: WF-MAP-001
labels: [wayfinder:task]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Ridurre il peso di public/icon-512.png

## Requirement comment

2026-11-14 — proposta emersa dall'analisi della dashboard nutrizionista, da
confermare dal PO.

Fatto verificato il 2026-11-14: [public/icon-512.png](../../public/icon-512.png)
pesa 558.465 byte (circa 545 KiB). Nota a margine, verificata con lo stesso
comando: nonostante l'estensione `.png`, il file è in realtà una JPEG
1024×1024 — da correggere insieme alla riduzione di peso, non in un ticket
separato.

## Vincoli

- Nessuna perdita visibile di qualità all'occhio, alle dimensioni in cui
  l'icona viene effettivamente mostrata (installazione PWA, home screen).
- `manifest.webmanifest` deve restare valido (stesso percorso o percorso
  aggiornato ovunque sia referenziato).

## Acceptance criteria

- File sotto 100 KB.
- Formato coerente con l'estensione (PNG reale, o rinominato se si sceglie di
  restare su JPEG — da annotare quale scelta si fa).
- `manifest.webmanifest` valido dopo la modifica.
- Fatto verificato il 2026-11-14: nessun service worker o precache
  nell'app (`src/`); nessun aggiornamento di quel tipo necessario.

## Out of scope

- Ridisegnare l'icona: solo ottimizzazione del file esistente.
