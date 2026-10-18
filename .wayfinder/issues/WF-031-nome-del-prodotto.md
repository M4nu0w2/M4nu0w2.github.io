---
id: WF-031
title: Scegliere il nome del prodotto
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Scegliere il nome del prodotto

## Question

Qual è il nome del prodotto, uno solo, per landing, app, dominio, icona e
comunicazioni? E come ci si arriva senza scegliere un nome già usato?

Richiesta del PO (2026-10-18): un nome definitivo non c'è ancora.

## Stato attuale (verificato)

- **Nutrà**: landing (`BRAND_NAME`), titolo, SEO.
- **NutriPro**: app, README, repository, container.
- **NutriPro Basta**: titolo pagina e `name` del manifest dell'app; compare nel
  dominio temporaneo `nutriprobasta.jirachibot.eu`.
- Icona: una sola (`icon-512.png`), con il nome «NutriPro» come riferimento.

## Decisioni aperte per il PO

Non sono decisioni prese.

1. **Criteri**: pronunciabile in italiano, memorabile, non in conflitto con
   altri prodotti nutrizionali, dominio e profili social disponibili,
   scrivibile senza accenti (Nutrà ha un accento: nelle URL, nelle email e nei
   motori di ricerca è un attrito).
2. **Verifiche obbligatorie** prima di scegliere: marchio (banche dati nazionali
   ed europea), dominio, nomi su App Store e Google Play, social. Le fa una
   persona, non l'agente.
3. **Un nome o due**: prodotto unico per nutrizionisti e pazienti, oppure marchio
   madre e nomi per i due piani?
4. **Dominio definitivo** e destino del dominio temporaneo.
5. **Cosa cambia**: landing, manifest, titoli, email di sistema, informativa,
   prompt di Gemini, nome del repository, icona e identità visiva.

## Acceptance criteria del ticket

- Nome scelto con l'elenco delle verifiche di disponibilità fatte e il loro esito.
- Elenco dei punti del prodotto e dei documenti da rinominare.

## Out of scope

- Disegno del logo (ticket a parte, dopo il nome).
- La rimozione di Progeo ([Rimuovere Progeo come riferimento da prodotto, codice e documenti](WF-029-rimuovere-progeo-come-riferimento.md)).
