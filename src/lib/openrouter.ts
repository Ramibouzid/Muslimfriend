export interface VerseRecommendation {
  surah: number;
  verse: number;
  english_advisory: string;
  arabic_advisory: string;
}

export async function recommendVerse(feeling: string): Promise<VerseRecommendation | null> {
  try {
    const res = await fetch('/api/recommend-verse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feeling }),
    });

    if (!res.ok) return null;

    return (await res.json()) as VerseRecommendation;
  } catch {
    return null;
  }
}
