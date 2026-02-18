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
