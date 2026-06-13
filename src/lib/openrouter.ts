export function getApiKey(): string {
  return localStorage.getItem('openrouter_key') || '';
}

export function setApiKey(key: string): void {
  localStorage.setItem('openrouter_key', key);
}

export interface VerseRecommendation {
  surah: number;
  verse: number;
  reason: string;
}

export async function recommendVerse(feeling: string): Promise<VerseRecommendation | null> {
  const key = getApiKey();
  if (!key) return null;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': window.location.origin,
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a Quranic guidance assistant. Given a user\'s feeling or situation, recommend ONE relevant Quran verse. Respond ONLY with valid JSON: {"surah": number, "verse": number, "reason": "brief explanation in English"}. No markdown, no extra text.',
          },
          { role: 'user', content: feeling },
        ],
        max_tokens: 150,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(content) as VerseRecommendation;

    if (!parsed.surah || !parsed.verse) return null;
    return parsed;
  } catch {
    return null;
  }
}
