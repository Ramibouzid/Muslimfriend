import type { SurahMeta } from '../types/quran.js';

export default function renderSurahList(surahs: SurahMeta[]): string {
  return `
    <div class="card">
      <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:0.5rem;">${surahs.length} Surahs</div>
      ${surahs.map(s => `
        <a class="surah-list-item" href="#/surah/${s.number}">
          <div class="surah-number-badge">${s.number}</div>
          <div class="surah-info">
            <div class="surah-name-ar">${s.name.ar}</div>
            <div class="surah-name-en">${s.name.transliteration} — ${s.name.en}</div>
            <div class="surah-meta">${s.verses_count} verses · ${s.revelation_place.en}</div>
          </div>
        </a>
      `).join('')}
    </div>
  `;
}
