# Message to Action (IT)

Natural language processing system that converts Italian-language messages (WhatsApp, email, etc.) into structured actionable items: prioritized tasks, calendar events with ICS export, suggested replies in three tones, and recommended next steps.

## Features

- **Italian Intent Detection** -- Regex-based NLP pipeline that identifies 7 intent types in Italian text: richiesta (request), appuntamento (appointment), urgenza (urgency), pagamento (payment), informazione (information), conferma (confirmation), and domanda (question). Each intent uses weighted pattern matching with confidence scoring
- **Task Extraction** -- Automatically generates prioritized tasks (Alta/Media/Bassa) from message content. Tasks include titles, descriptions, due dates inferred from temporal expressions, deadline reasoning, and contextual tags (call, email, documenti, universita, appuntamento, pagamento, risposta)
- **Italian Date/Time Parsing** -- Custom parser for Italian temporal expressions: "domani alle 15", "lunedi prossimo", "entro il 20 marzo", "dopodomani", "la settimana prossima". Handles relative dates, absolute dates, and time-of-day expressions
- **Calendar Event Extraction** -- Detects appointment-related messages and extracts structured events with: auto-generated titles (personalized with contact names), start/end times with configurable default durations (30min calls, 60min meetings), location detection (physical addresses and online platforms like Zoom/Teams), and confirmation status
- **ICS Calendar Export** -- Generates RFC 5545-compliant ICS files for both events and tasks. Events include location, notes, and TENTATIVE/CONFIRMED status. Tasks are exported as all-day events on their due dates with priority mapping (Alta=1, Media=5, Bassa=9)
- **Three-Tone Reply Generator** -- Produces three reply variants for every message: formale (formal), cordiale (friendly), and sintetica (brief). Replies are context-aware, adapting to the source type (WhatsApp vs Email) and relationship context (famiglia, universita, lavoro, etc.)
- **Next Step Recommendations** -- Generates a recommended action and checklist based on the detected intents, extracted tasks, and calendar events
- **Multi-Format Export** -- Export analysis results as ICS (calendar), CSV (spreadsheet), or Markdown files
- **Analysis History** -- All analyses are persisted via Prisma/SQLite with full CRUD operations (create, read, duplicate, delete) through REST API endpoints
- **Context-Aware Processing** -- Six context modes (famiglia, universita, lavoro, palestra, vendite, altro) that influence task priority assignment, reply tone, and tag selection
- **Configurable Settings** -- Timezone (default Europe/Rome), default context, preferred reply tone, event durations, optional LLM provider integration, and Notion database sync

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | SQLite via Prisma ORM 7 |
| UI | React 19, shadcn/ui, Tailwind CSS v4 |
| Validation | Zod v4 |
| Calendar | ics library + custom ICS generator |
| Date Handling | date-fns, date-fns-tz |
| NLP | Custom Italian regex-based intent detection |

## Getting Started

### Prerequisites

- Node.js 20+

### Installation

```bash
git clone https://github.com/yourusername/message-to-action-it.git
cd message-to-action-it
npm install
```

### Database Setup

```bash
npx prisma migrate dev
npx prisma generate
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

## Project Structure

```
message-to-action-it/
├── prisma/
│   └── schema.prisma                # Analysis history + Settings (SQLite)
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout with theme support
│   │   ├── page.tsx                 # Main interface
│   │   └── api/
│   │       ├── analyze/route.ts     # POST: analyze message, persist result
│   │       └── analyses/
│   │           ├── route.ts         # GET: list all analyses
│   │           └── [id]/
│   │               ├── route.ts     # GET/DELETE: single analysis
│   │               └── duplicate/route.ts  # POST: duplicate analysis
│   ├── components/
│   │   └── ui/                      # shadcn/ui primitives (dialog, tabs, select, etc.)
│   ├── lib/
│   │   ├── analyzer/
│   │   │   ├── index.ts             # Main analyzer orchestrator
│   │   │   ├── intent-detector.ts   # Italian intent detection (7 types, weighted patterns)
│   │   │   ├── date-parser.ts       # Italian date/time expression parser
│   │   │   ├── event-extractor.ts   # Calendar event extraction with location detection
│   │   │   ├── task-generator.ts    # Task extraction with priority and tag assignment
│   │   │   ├── reply-generator.ts   # Three-tone reply generation (formale/cordiale/sintetica)
│   │   │   └── next-step-generator.ts # Action recommendation engine
│   │   ├── export/
│   │   │   ├── ics-generator.ts     # RFC 5545 ICS file generation
│   │   │   ├── csv-generator.ts     # CSV export
│   │   │   └── markdown-generator.ts # Markdown export
│   │   ├── types.ts                 # Zod schemas and TypeScript types for all entities
│   │   ├── prisma.ts                # Prisma client singleton
│   │   └── utils.ts                 # Shared utilities
├── package.json
└── tsconfig.json
```

## How It Works

1. **Input** -- User pastes an Italian message and selects the source type (WhatsApp/Email/Other) and context (family/university/work/gym/sales/other), optionally providing the sender's name and role.

2. **Analysis Pipeline** -- The message passes through four parallel processors:
   - **Intent Detector** scans for Italian-language patterns across 7 intent categories with weighted confidence scoring
   - **Task Generator** extracts actionable items with priorities, deadlines, and tags
   - **Event Extractor** identifies appointments by combining intent detection with Italian date parsing and location extraction
   - **Reply Generator** produces three reply variants adapted to the context

3. **Output** -- The user receives: a list of prioritized tasks, optional calendar event (downloadable as ICS), three reply options, and a next-step recommendation with checklist.

## Technical Details

**Intent Detection.** Each intent type has 4-8 Italian regex patterns with individual weights (0.5-0.95). The total weight is normalized to a 0-1 confidence score. Multiple intents can fire simultaneously -- a message can be both an appointment request and an urgency signal.

**Date Parsing.** The Italian date parser handles: relative expressions ("domani", "dopodomani", "la settimana prossima"), day names ("lunedi", "martedi"), explicit dates ("20 marzo", "15/01/2025"), and time expressions ("alle 15", "ore 10:30"). Each parsed date includes a confidence flag and whether a specific time was mentioned.

**ICS Generation.** Calendar files follow the RFC 5545 specification with proper escaping of special characters (semicolons, commas, backslashes), VTIMEZONE support via date-fns-tz, and TENTATIVE/CONFIRMED status based on whether the original message contained both a confirmed date and specific time.

## Notes

- The NLP pipeline is entirely rule-based (no LLM required by default), making it fast and cost-free for basic usage. Optional LLM integration can be enabled in settings for improved analysis quality.
- The SQLite database is zero-configuration -- no external database server needed.
- All date handling defaults to the Europe/Rome timezone, configurable via settings.

## License

MIT
