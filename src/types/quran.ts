export interface Verse {
  number: number;
  text: { ar: string; en: string };
  juz: number;
  page: number;
  sajda: boolean;
}

export interface SurahName {
  ar: string;
  en: string;
  transliteration: string;
}

export interface SurahMeta {
  number: number;
  name: SurahName;
  revelation_place: { ar: string; en: string };
  verses_count: number;
  words_count: number;
  letters_count: number;
}

export interface AudioReciter {
  id: number;
  reciter: { ar: string; en: string };
  rewaya: { ar: string; en: string };
  server: string;
  link: string;
}

export interface Surah extends SurahMeta {
  verses: Verse[];
  audio: AudioReciter[];
}

export interface PageEntry {
  page: number;
  image: { url: string };
  start: { surah_number: number; verse: number; name: SurahName };
  end: { surah_number: number; verse: number; name: SurahName };
}

export interface SearchResult {
  surah: number;
  verse: number;
  text: { ar: string; en: string };
  surahName: SurahName;
}
