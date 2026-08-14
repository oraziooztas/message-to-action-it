# DEVLOG

Log cronologico di decisioni, problemi e lezioni per questo progetto.

---

## [2026-02-18] — Sync docs iniziale

**Cosa fatto:**
- Sistema NLP completato per convertire messaggi in italiano (WhatsApp, email) in azioni strutturate
- Pipeline di analisi rule-based con 7 tipi di intent detection (richiesta, appuntamento, urgenza, pagamento, informazione, conferma, domanda)
- Estrazione task con priorita (Alta/Media/Bassa), tag contestuali e scadenze da espressioni temporali italiane
- Estrazione eventi calendario con rilevamento location, export ICS RFC 5545-compliant
- Generazione 3 risposte suggerite per tone (formale, cordiale, sintetica)
- Raccomandazione next-step con checklist
- Storico analisi persistito via Prisma + SQLite (CRUD completo via REST API)
- Export multi-formato: ICS, CSV, Markdown
- 6 modalita di contesto (famiglia, universita, lavoro, palestra, vendite, altro)
- UI con shadcn/ui + Tailwind CSS v4, dark mode via next-themes

**Decisioni prese:**
- Next.js 16 App Router per UI + API in un unico progetto
- Pipeline NLP completamente rule-based (no LLM per default) per velocita e costo zero
- SQLite via Prisma per zero-configuration (nessun server DB esterno)
- Zod v4 per validazione schemi sia lato API che lato frontend
- date-fns-tz per gestione timezone (default Europe/Rome)
- Architettura: lib/analyzer/ contiene tutti i moduli NLP isolati e testabili indipendentemente

**Problemi incontrati:**
- Nessuno (sync iniziale)

**Lezioni apprese:**
- Il parser date italiano richiede gestione separata di espressioni relative ("domani", "la settimana prossima") vs assolute ("20 marzo")
- ICS RFC 5545 richiede escaping preciso di ; , \ e gestione VTIMEZONE
- Prisma 7 con SQLite e dev.db: ricordarsi di eseguire `npx prisma migrate dev` dopo ogni schema change

**Prossimi passi:**
- Integrare LLM provider opzionale (OpenAI/Anthropic) per analisi piu accurate
- Aggiungere sync con Notion database
- Implementare test automatici per i moduli analyzer
- Valutare deploy su Vercel (SQLite → PostgreSQL per produzione)

---

## [2026-08-14] — PR #1 mergiata e prima CI verde della storia del repo

**Il lavoro dell'08/08 è entrato in main.** LLM fallback per l'analisi
(`src/lib/analyzer/llm-fallback.ts`, output validato contro
`AnalysisResultSchema`), routing dall'analizzatore a regole, SQLite in locale.
Squash merge `960b007`.

**Ma la PR non era mergiabile come stava: la CI era rossa.** E non per colpa
sua — i due run precedenti su `main` fallivano identici. `npx tsc --noEmit`
cadeva su:

```
src/lib/prisma.ts(1,10): error TS2305: Module '@prisma/client' has no exported member 'PrismaClient'
src/app/api/analyses/route.ts(44,39): error TS7006: Parameter 'analysis' implicitly has an 'any' type
```

**Causa, letta alla fonte e non a memoria.**
`node_modules/@prisma/client/default.d.ts` contiene una riga sola:
`export * from '.prisma/client/default'`. È uno stub: il client vero lo scrive
`prisma generate`, che `npm ci` non esegue. Il secondo errore è a valle del
primo — senza tipi generati il `.map()` perde l'inferenza. In locale tutto
passava perché `.prisma/client` c'era da un generate precedente: **il verde
locale non diceva niente sulla CI**, misurava un ambiente che la CI non ha.

**Fix:** `"postinstall": "prisma generate"` in `package.json`. Scelto al posto
di uno step nel workflow perché copre anche i deploy — Vercel e simili
installano senza eseguire i nostri step.

**Verifica con la sequenza esatta della CI, dopo aver rifatto `npm ci` da
zero** (non ereditata dallo stato locale): `npm ci` = 0 e `.prisma/client`
generato, `tsc --noEmit` = 0, `eslint` = 0 (12 warning, 0 errori), `next build`
= 0. Poi i due run reali su GitHub, push e pull_request, entrambi **success**
prima del merge; e il run su `main` dopo il merge, anch'esso success.

**Nota utensili.** `npm run lint` lanciato dentro rtk restituiva `exit 2` con
«ESLint output (JSON parse failed)»: è rtk che corrompe l'output, non eslint
che fallisce. Con `rtk proxy node ./node_modules/.bin/eslint` l'exit reale è 0.
Su un exit code sospetto, rilanciare fuori da rtk prima di crederci.

**Debito residuo:** 12 warning `no-unused-vars` negli analyzer (import e
variabili morte, nessun errore). La CI usa `node-version: 20` e GitHub avvisa
che gli action runtime Node 20 sono deprecati — non è la causa del rosso, resta
da fare.
