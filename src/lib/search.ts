import type { Surah, SearchResult } from '../types/quran.js';

export async function searchVerses(term: string, lang: 'ar' | 'en' = 'en'): Promise<SearchResult[]> {
  const q = term.toLowerCase().trim();
  if (!q) return [];

  try {
    const res = await fetch('/Data/mainDataQuran.json');
    if (!res.ok) return [];
    const data = (await res.json()) as Surah[];
    const results: SearchResult[] = [];

    for (const surah of data) {
      for (const verse of surah.verses) {
        if (verse.text[lang].toLowerCase().includes(q)) {
          results.push({
            surah: surah.number,
            verse: verse.number,
            text: verse.text,
            surahName: surah.name,
          });
          if (results.length >= 50) return results;
        }
      }
    }
    return results;
  } catch {
    return [];
  }
}
