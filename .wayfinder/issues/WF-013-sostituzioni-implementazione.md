---
id: WF-013
title: Implementare sostituzioni rapide con la bacchetta magica
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: open
assignee: null
assignment: manu
assignment_mode: flexible
blocked_by: [WF-010]
---

# Implementare sostituzioni rapide con la bacchetta magica

## Requirement comment

2026-10-10 — richiesta in sessione (Manu): implementare le decisioni di
[Definire equivalenza nutrizionale delle sostituzioni rapide](WF-006-sostituzioni.md),
senza ridiscuterle. Sintesi: candidati solo alimenti dello stesso piano con lo
stesso **ruolo nel pasto**; **valori stimati** da Gemini per 100 g; calorie
±5%, ogni macronutriente entro il più largo fra ±5 g e ±15%; verifica
deterministica nell'app; sola consultazione.

Bloccato da [Integrare Gemini con opzione gratuita e veloce](WF-010-integrazione-gemini.md):
la chat Gemini non è ancora funzionante né configurata in produzione.

## Vincoli

- L'invio a Gemini è consentito solo come già deciso: tocco sulla bacchetta come
  consenso, avviso al primo uso, solo nomi degli alimenti e grammature, nessun
  dato identificativo né `sub` o email. Nessun altro dato del piano o del
  tracking.
- Chiamata tramite il backend autenticato con CSRF; mai chiave nel frontend.
- Stime salvate con il piano in `diet_plan_archive:<sub>`, rispettando la
  revisione dell'archivio; perimetro da riallineare con
  [Definire persistenza e dati condivisi con l'assistente](WF-003-dati.md).

## Acceptance criteria

- Bacchetta accanto a ogni voce del pasto del **piano attivo**; mostra
  "Alternative del piano" (le **alternative alimentari** prescritte, "oppure …")
  separate da "Proposte stimate", con peso adattato, calorie e macro.
- Le alternative prescritte non compaiono fra le proposte stimate.
- Con meno di due proposte valide si mostrano quelle trovate, anche nessuna, con
  avviso; mai quantità forzate.
- Peso proposto nello stato del PDF (crudo o cotto; legumi cotti sgocciolati).
- **Spunte:** invariate; la spunta resta sulla voce originale.
- **Quantità effettiva dell'olio:** invariata dalle proposte.
- **Lista della spesa:** invariata; le proposte non diventano voci.
- Stessi numeri a ogni consultazione grazie alle stime salvate.
- Gemini non disponibile (offline, quota, errore): solo alternative del piano e
  avviso, nessun errore bloccante.
- Test con provider Gemini simulato; `npm test` e `npm run test:browser` verdi.
- Ogni push su `dev` fa deploy automatico: l'ultimo commit di un push che
  contiene codice non deve avere `[skip ci]`.
