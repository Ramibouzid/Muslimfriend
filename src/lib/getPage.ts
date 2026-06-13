import type { PageEntry } from '../types/quran.js';

export async function getPage(pageNumber: number): Promise<PageEntry | null> {
  try {
    const res = await fetch('/Data/pagesQuran.json');
    if (!res.ok) return null;
    const data = (await res.json()) as PageEntry[];
    return data.find(p => p.page === pageNumber) ?? null;
  } catch {
    return null;
  }
}

export async function getAllPages(): Promise<PageEntry[]> {
  try {
    const res = await fetch('/Data/pagesQuran.json');
    if (!res.ok) return [];
    return (await res.json()) as PageEntry[];
  } catch {
    return [];
  }
}
