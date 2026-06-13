const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'self-harm', 'end my life',
  'انتحار', 'أقتل نفسي', 'إيذاء النفس', 'أعدم حياتي',
];

const HELPLINES = [
  { country: 'Saudi Arabia', number: '937' },
  { country: 'UAE', number: '800 4673' },
  { country: 'USA/Canada', number: '988' },
  { country: 'UK', number: '111' },
  { country: 'Egypt', number: '0800 888 0700' },
];

export interface SafetyResult {
  safe: boolean;
  message: string | null;
}

export function scanText(text: string): SafetyResult {
  const lower = text.toLowerCase();
  for (const kw of CRISIS_KEYWORDS) {
    if (lower.includes(kw)) {
      const helplineText = HELPLINES.map(h => `${h.country}: ${h.number}`).join(' · ');
      return {
        safe: false,
        message: `⚠️ If you need help, contact your local emergency services. Helplines: ${helplineText}`,
      };
    }
  }
  return { safe: true, message: null };
}
