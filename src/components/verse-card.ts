import type { Verse } from '../types/quran.js';

export default function renderVerseCard(verse: Verse, surahNumber: number): string {
  return `
    <div class="card verse-row" id="verse-${verse.number}" onclick="location.hash='#/verse/${surahNumber}/${verse.number}'">
      <div class="verse-number">${verse.number}</div>
      <div style="flex:1;min-width:0;">
        <div class="verse-text-ar">${verse.text.ar}</div>
        <div class="verse-text-en">${verse.text.en}</div>
        <div style="font-size:0.55rem;color:var(--text-muted);margin-top:0.25rem;">
          Juz ${verse.juz} · Page ${verse.page}${verse.sajda ? ' · ۩ Sajda' : ''}
        </div>
      </div>
    </div>
  `;
}
