# MAP — Project Overview

> Sistema NLP rule-based che converte messaggi italiani (WhatsApp/email) in task prioritizzati, eventi calendario, risposte suggerite e next-step raccomandati.

## Struttura

```
message-to-action-it/
├── prisma/
│   └── schema.prisma               # Schema SQLite: Analysis + Settings
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout con theme provider
│   │   ├── page.tsx                # Main UI: input messaggio + risultati
│   │   └── api/
│   │       ├── analyze/route.ts    # POST: analisi + persistenza
│   │       ├── analyses/
│   │       │   ├── route.ts        # GET: lista storico analisi
│   │       │   └── [id]/
│   │       │       ├── route.ts    # GET/DELETE singola analisi
│   │       │       └── duplicate/route.ts
│   │       └── settings/route.ts   # GET/PUT impostazioni utente
│   ├── components/
│   │   └── ui/                     # shadcn/ui primitives
│   └── lib/
│       ├── analyzer/
│       │   ├── index.ts            # Orchestratore pipeline NLP
│       │   ├── intent-detector.ts  # 7 intent types, weighted patterns
│       │   ├── date-parser.ts      # Parser date/ora italiane
│       │   ├── event-extractor.ts  # Estrazione eventi calendario
│       │   ├── task-generator.ts   # Task con priorita e tag
│       │   ├── reply-generator.ts  # 3 risposte (formale/cordiale/sintetica)
│       │   └── next-step-generator.ts
│       ├── export/
│       │   ├── ics-generator.ts    # RFC 5545 ICS
│       │   ├── csv-generator.ts
│       │   └── markdown-generator.ts
│       ├── types.ts                # Zod schemas + TypeScript types
│       ├── prisma.ts               # Prisma client singleton
│       └── utils.ts
├── dev.db                          # SQLite database (locale)
├── package.json
└── tsconfig.json
```

## File chiave

| File | Cosa fa |
|------|---------|
| `src/lib/analyzer/index.ts` | Orchestra i 4 moduli NLP in parallelo e aggrega i risultati |
| `src/lib/analyzer/intent-detector.ts` | Rileva 7 intent in italiano con pattern regex pesati (confidence 0-1) |
| `src/lib/analyzer/date-parser.ts` | Parse espressioni temporali italiane ("domani alle 15", "lunedi prossimo") |
| `src/lib/analyzer/task-generator.ts` | Genera task con priorita Alta/Media/Bassa e tag contestuali |
| `src/lib/export/ics-generator.ts` | Genera file ICS RFC 5545 validi per eventi e task |
| `src/app/api/analyze/route.ts` | Endpoint principale: riceve messaggio, esegue pipeline, persiste risultato |
| `prisma/schema.prisma` | Schema DB: tabelle Analysis (storico) e Settings (config utente) |

## Entry Points

| Azione | Comando |
|--------|---------|
| Dev server | `npm run dev` |
| Build produzione | `npm run build` |
| Avvia produzione | `npm start` |
| Lint | `npm run lint` |
| Migrazione DB | `npx prisma migrate dev` |
| Prisma Studio | `npx prisma studio` |

## Convenzioni

- **Linguaggio:** TypeScript 5, React 19
- **Framework:** Next.js 16 App Router
- **Database:** SQLite via Prisma 7 (file `dev.db` in root)
- **Deploy:** N/A (locale; per produzione: PostgreSQL + Vercel)

## Note

- NLP completamente rule-based, nessun LLM richiesto per il funzionamento base
- Timezone default: Europe/Rome (configurabile via Settings)
- `dev.db` non va committato in produzione — aggiungere a .gitignore se si fa deploy
- Integrazione LLM opzionale configurabile via Settings UI
