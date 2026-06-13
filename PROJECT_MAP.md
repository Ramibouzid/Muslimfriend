# MuslimFriend — Project Map

> **Date:** 2026-06-13
> **Status:** Planning Phase
> **Principle:** Simplicity First

---

## [TECH_STACK]

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Language** | TypeScript (strict) | Type safety for JSON data contracts |
| **Runtime** | Node.js 20.x | LTS, Render.com native support |
| **Frontend** | Vanilla HTML/CSS/JS (no framework) | Zero build overhead, max simplicity |
| **Bundler** | Vite | Fast dev server, native ESM, trivial config |
| **Data Store** | Local JSON files | No DB dependency; data is read-only Quran corpus |
| **Deployment** | Render.com Web Service | Min Node.js server serves `dist/` + `/api/recommend-verse` proxy |
| **Package Mgr** | npm | Standard, lockfile v3 |
| **Lint** | ESLint + Prettier | Minimal config, catch type errors early |

**Explicitly Excluded:** React, Vue, Angular, Tailwind, any DBMS, any ORM, any SSR framework.

---

## [SYSTEM_FLOW]

```
User Browser
     │
     ▼
 ┌─────────────────────────────────────────────┐
 │  Presentation Layer (Vanilla JS + Vite)     │
 │  src/pages/   src/components/   src/styles/ │
 └──────────────────┬──────────────────────────┘
                    │ import / fetch
 ┌──────────────────▼──────────────────────────┐
 │  Data Access Layer (DAL)                    │
 │  src/lib/getVerse.ts         ← reads JSON   │
 │  src/lib/getSurah.ts                        │
 │  src/lib/getPage.ts                         │
 │  src/lib/search.ts                          │
 └──────────────────┬──────────────────────────┘
                    │ fs / fetch local JSON
 ┌──────────────────▼──────────────────────────┐
 │  Data Layer (read-only JSON)                │
 │  Data/json/verses/{surah}_{verse}.json      │
 │  Data/json/metadata.json                    │
 │  Data/mainDataQuran.json                    │
 │  Data/pagesQuran.json                       │
 └──────────────────┬──────────────────────────┘
                    │
 ┌──────────────────▼──────────────────────────┐
 │  Safety Layer (Content Filter)              │
 │  src/lib/safety.ts                          │
 │  Intercepts crisis/health keywords          │
 │  Returns emergency hotline + disclaimer     │
 └─────────────────────────────────────────────┘
```

**Data Flow:**
1. User interacts with UI → triggers `getVerse(surah, verse)`
2. DAL constructs path `Data/json/verses/{surah}_{verse}.json` → `fetch()` or inline `import`
3. Returns typed `Verse` object `{ number, text: { ar, en }, juz, page, sajda }`
4. Safety layer inspects all output text for crisis keywords before display
5. If match found → prepend emergency banner (not block, just augment)

---

## [ARCHITECTURE]

### Directory Structure (proposed)

```
Muslimfriend/
├── Data/                          # Read-only data (already exists)
│   ├── json/
│   │   ├── verses/                # ~6236 individual verse files
│   │   └── metadata.json          # 114 surah metadata array
│   ├── mainDataQuran.json         # Full Quran + audio reciters
│   └── pagesQuran.json            # 604 page definitions
├── src/
│   ├── lib/
│   │   ├── getVerse.ts            # getVerse(surah: number, verse: number): Verse
│   │   ├── getSurah.ts            # getSurah(number): Surah
│   │   ├── getPage.ts             # getPage(number): Page
│   │   ├── search.ts              # search(term, lang): Verse[]
│   │   └── safety.ts              # ContentFilter class
│   ├── components/
│   │   ├── verse-card.ts          # Renders a single verse
│   │   ├── surah-header.ts        # Bismillah + surah name
│   │   ├── surah-list.ts          # Index of all 114 surahs
│   │   ├── page-viewer.ts         # Page image + overlay
│   │   ├── audio-player.ts        # Reciter selection + play
│   │   └── search-bar.ts          # Search input + results
│   ├── pages/
│   │   ├── index.html             # Home / surah list
│   │   ├── surah.html             # Single surah view
│   │   ├── page.html              # Mushaf page viewer
│   │   └── search.html            # Search results
│   ├── styles/
│   │   └── main.css               # Single CSS file (modular sections)
│   ├── types/
│   │   └── quran.ts               # TypeScript interfaces
│   ├── main.ts                    # App entry + router
│   └── vite-env.d.ts
├── server.js                      # Node.js server: serves dist/ + /api/recommend-verse proxy
├── package.json                   # deps: none (devDeps: vite, typescript)
├── tsconfig.json
├── vite.config.ts
├── .prettierrc
├── PROJECT_MAP.md                 # ← this file
└── README.md
```

### Core Types (`src/types/quran.ts`)

```ts
interface Verse {
  number: number;
  text: { ar: string; en: string };
  juz: number;
  page: number;
  sajda: boolean;
}

interface SurahName {
  ar: string;
  en: string;
  transliteration: string;
}

interface SurahMeta {
  number: number;
  name: SurahName;
  revelation_place: { ar: string; en: string };
  verses_count: number;
  words_count: number;
  letters_count: number;
}

interface Surah extends SurahMeta {
  verses: Verse[];
  audio: AudioReciter[];
}

interface AudioReciter {
  id: number;
  reciter: { ar: string; en: string };
  rewaya: { ar: string; en: string };
  server: string;
  link: string;
}

interface Page {
  page: number;
  image: { url: string };
  start: { surah_number: number; verse: number; name: SurahName };
  end: { surah_number: number; verse: number; name: SurahName };
}
```

### Key Function Signature: `getVerse`

```ts
/**
 * Reads a single verse from local JSON.
 * @param surah - Surah number (1-114)
 * @param verse - Verse number within surah
 * @returns Promise<Verse | null>
 *
 * Path: Data/json/verses/{surah}_{verse}.json
 * Format: 001_001.json, 002_286.json, etc.
 * 
 * Fallback: if file not found, linear scan mainDataQuran.json
 */
export declare function getVerse(surah: number, verse: number): Promise<Verse | null>;
```

### Safety Layer (`src/lib/safety.ts`)

Pattern-matching filter that runs **after** verse retrieval, **before** DOM render:

```ts
class ContentFilter {
  private static CRISIS_KEYWORDS = [
    'suicide', 'self-harm', 'kill myself',
    'انتحار', 'أقتل نفسي', 'إيذاء النفس'
  ];

  static CRISIS_RESPONSE = {
    banner: '⚠️ If you or someone you know is in crisis, contact your local emergency services or helpline.',
    helplines: [
      { country: 'Saudi Arabia', number: '937' },
      { country: 'UAE', number: '800 4673' },
      { country: 'USA/Canada', number: '988 (Suicide & Crisis Lifeline)' },
      { country: 'UK', number: '111' },
    ]
  };

  static scan(text: string): { safe: boolean; message?: string } { ... }
}
```

---

## [COMPLETED]

| Item | Status | Notes |
|------|--------|-------|
| `package.json` | ✅ Done | `type:module`, engines node ≥20, 3 devDeps only |
| `tsconfig.json` | ✅ Done | Strict TS, ESNext modules, DOM lib |
| `vite.config.ts` | ✅ Done | Static copy for `Data/` into `dist/` |
| `index.html` | ✅ Done | Entry point, viewport meta, mobile-ready |
| `src/types/quran.ts` | ✅ Done | Verse, SurahMeta, Surah, AudioReciter, PageEntry, SearchResult |
| `src/lib/getVerse.ts` | ✅ Done | Fetch from `Data/json/verses/{pad(surah)}_{pad(verse)}.json` + fallback |
| `src/lib/getSurah.ts` | ✅ Done | Fetch single/all surah metadata |
| `src/lib/getPage.ts` | ✅ Done | Fetch page data from pagesQuran.json |
| `src/lib/search.ts` | ✅ Done | Bilingual search (ar/en), max 50 results |
| `src/lib/safety.ts` | ✅ Done | Crisis keyword scan + international helpline banner |
| `src/lib/openrouter.ts` | ✅ Done | OpenRouter client → calls backend `/api/recommend-verse` proxy |
| `src/components/surah-list.ts` | ✅ Done | Renders all 114 surahs with metadata |
| `src/components/verse-card.ts` | ✅ Done | Renders single verse with ar/en, juz, page, sajda |
| `src/components/feeling-button.ts` | ✅ Done | "How are you feeling?" CTA card |
| `src/components/audio-player.ts` | ✅ Done | Reciter dropdown + play/pause with 100+ reciters |
| `src/styles/main.css` | ✅ Done | Apple-inspired redesign: #f5f5f7 canvas, #ffffff cards, #0071e3 CTA, 28px card radius, 999px buttons |
| `src/main.ts` | ✅ Done | Hash router + home page with 3 sections: Ask a Question, Listen to the Quran, Browse Surahs |
| Feeling → Question | ✅ Done | Replaced "How are you feeling?" modal with inline "Ask Any Question, Receive Guidance From the Quran" section; response in Arabic + English with warm friend-like advisory |
| Audio player on home | ✅ Done | Separate "Listen to the Quran" section on home page with surah + reciter selector |
| Audio player | ✅ Done | 100+ reciters per surah, play/pause |
| `server.js` | ✅ Done | Updated system prompt for bilingual advisory response (english_advisory + arabic_advisory) |
| `npm run build` | ✅ Verified | 16 modules, 6236 verse files in dist/Data, 0 TS errors |
| `src/lib/i18n.ts` | ✅ Done | Full i18n system with 40+ translation keys, ar/en switching, localStorage persistence |
| `src/components/language-toggle.ts` | ✅ Done | Top-left toggle button, dispatches `languagechange` event to re-render |
| Arabic default + RTL | ✅ Done | `index.html` `lang="ar" dir="rtl"`, CSS RTL overrides for headings, inputs, lists |
| Description text | ✅ Done | "منصة ذكية تجمع بين القرآن الكريم..." on home page in both languages |

## [ORPHANS & PENDING]

| Item | Status | Action |
|------|--------|--------|
| `Data/quran_image/` | ❌ Missing | Referenced in pagesQuran.json but absent; page viewer shows broken image |
| GitHub repo | ❌ Not set up | User needs to create repo and push |
| Render.com deploy | ❌ Not deployed | User needs to connect GitHub repo to Render |

---

## MILESTONES — Actual Status

### ✅ M1 — Scaffold & Types (Complete)
- `package.json`, `tsconfig.json`, `vite.config.ts`, `.prettierrc`
- `src/types/quran.ts` — all interfaces
- `src/lib/getVerse.ts` — reads JSON with fallback
- **Accept:** `npm run build` succeeds, `tsc --noEmit` has 0 errors

### ✅ M2 — Core Views (Complete)
- `surah-list` renders all 114 surahs
- `verse-card` renders verses with ar/en text
- `page-viewer` shows page image with prev/next navigation
- Hash-based SPA router with 5 routes
- **Accept:** All routes render without JS errors

### ✅ M3 — Safety + Search (Complete)
- `src/lib/safety.ts` scans crisis keywords in ar + en
- `src/lib/search.ts` bilingual text search across entire Quran
- Search results link directly to verses
- Safety banner shown before crisis content
- **Accept:** Search "mercy" returns results; crisis keyword shows red banner

### ✅ M4 — Audio + Polish (Complete)
- `audio-player` with dropdown of 100+ reciters and multiple riwayat
- Play/pause per surah audio
- Backend proxy via `server.js` hides API key server-side
- **Accept:** `npm run build` produces clean dist/ with no errors

### ✅ M6 — Apple Redesign + Question Section (Complete)
- "Ask Any Question, Receive Guidance From the Quran" section replaces feeling modal
- Response in Arabic + English with warm friend-like advisory text
- Audio section on home page with surah picker + reciter selector
- Apple-inspired design: #f5f5f7 fog canvas, #ffffff cards, 28px radius, 999px pill buttons, #0071e3 CTA
- All old features preserved: surah list, verse card, search, audio, page viewer, safety
- **Accept:** `npm run build + tsc --noEmit` = 0 errors

### ⏳ M5 — Deploy (Pending User Action)
- `npm run build` produces `/dist` — verified working
- Need user to: create GitHub repo → push → connect to Render.com
- Render config: **Web Service**, Build Command = `npm install && npm run build`, Start Command = `npm start`
- **Environment variable:** `OPENROUTER_KEY` — set via Render dashboard

---

## DEPLOYMENT NOTES (Render.com)

- **Type:** Web Service (not Static Site)
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Node Version:** 20.x (set via `engines` in package.json)
- **Environment Variable:** `OPENROUTER_KEY` — paste your OpenRouter key here in Render dashboard (Environment → Environment Variables)
- **Architecture:** `server.js` serves `dist/` for all static files + handles `POST /api/recommend-verse` using the env var key; OpenRouter API key never reaches the client browser
