import type { SurahMeta } from '../types/quran.js';

export async function getSurahMeta(surahNumber: number): Promise<SurahMeta | null> {
  try {
    const res = await fetch('/Data/json/metadata.json');
    if (!res.ok) return null;
    const data = (await res.json()) as SurahMeta[];
    return data.find(s => s.number === surahNumber) ?? null;
  } catch {
    return null;
  }
}

export async function getAllSurahMeta(): Promise<SurahMeta[]> {
  try {
    const res = await fetch('/Data/json/metadata.json');
    if (!res.ok) return [];
    return (await res.json()) as SurahMeta[];
  } catch {
    return [];
  }
}
