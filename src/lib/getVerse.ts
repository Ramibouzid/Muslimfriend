import type { Verse } from '../types/quran.js';

const VERSE_DIR = 'Data/json/verses';

export async function getVerse(surah: number, verse: number): Promise<Verse | null> {
  const pad = (n: number) => String(n).padStart(3, '0');
  const path = `/${VERSE_DIR}/${pad(surah)}_${pad(verse)}.json`;

  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return (await res.json()) as Verse;
  } catch {
    return null;
  }
}

export async function getVerseFallback(surah: number, verse: number): Promise<Verse | null> {
  try {
    const res = await fetch('/Data/mainDataQuran.json');
    if (!res.ok) return null;
    const data = await res.json() as { number: number; verses: Verse[] }[];
    const surahData = data.find(s => s.number === surah);
    if (!surahData) return null;
    return surahData.verses.find(v => v.number === verse) ?? null;
  } catch {
    return null;
  }
}
