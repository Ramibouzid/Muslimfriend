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
| **Deployment** | Render.com Static Site | Serves `/dist` directly, free tier, auto HTTPS |
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
├── public/
│   └── favicon.ico
├── package.json                   # deps: none (devDeps: vite, typescript, eslint)
├── tsconfig.json
├── vite.config.ts
├── .eslintrc.cjs
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
| `src/lib/openrouter.ts` | ✅ Done | OpenRouter API client for verse recommendations |
| `src/components/surah-list.ts` | ✅ Done | Renders all 114 surahs with metadata |
| `src/components/verse-card.ts` | ✅ Done | Renders single verse with ar/en, juz, page, sajda |
| `src/components/feeling-button.ts` | ✅ Done | "How are you feeling?" CTA card |
| `src/components/audio-player.ts` | ✅ Done | Reciter dropdown + play/pause with 100+ reciters |
| `src/styles/main.css` | ✅ Done | Cream bg, 22px font, mobile-first, high contrast |
| `src/main.ts` | ✅ Done | Hash router: home, surah, page, search, verse + feeling modal |
| Feeling + OpenRouter | ✅ Done | User shares feeling → OpenRouter → verse lookup → display with safety scan |
| Audio player | ✅ Done | 100+ reciters per surah, play/pause |
| `npm run build` | ✅ Verified | 15 modules, 6236 verse files in dist/Data, 0 TS errors |

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
- Feeling button with OpenRouter AI verse recommendation
- Modal UI with API key management (localStorage)
- **Accept:** `npm run build` produces clean dist/ with no errors

### ⏳ M5 — Deploy (Pending User Action)
- `npm run build` produces `/dist` — verified working
- Need user to: create GitHub repo → push → connect to Render.com
- Render config: Static Site, Build Command = `npm install && npm run build`, Publish = `dist`

---

## DEPLOYMENT NOTES (Render.com)

- **Type:** Static Site
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Node Version:** 20.x (set via `engines` in package.json)
- **No server needed** — all data is client-fetched JSON
- **CORS:** Vite dev server handles locally; production serves same-origin JSON from `/Data/` placed in `public/` or served via `viteStaticCopy`
