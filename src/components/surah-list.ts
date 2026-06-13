import type { SurahMeta } from '../types/quran.js';
import { t, getLang } from '../lib/i18n.js';

export default function renderSurahList(surahs: SurahMeta[]): string {
  const lang = getLang();
  return `
    <div class="card">
      <div style="font-size:0.7rem;color:var(--color-graphite);margin-bottom:0.5rem;">${surahs.length} ${t('verses')}</div>
      ${surahs.map(s => `
        <a class="surah-list-item" href="#/surah/${s.number}">
          <div class="surah-number-badge">${s.number}</div>
          <div class="surah-info">
            <div class="surah-name-ar">${s.name.ar}</div>
            <div class="surah-name-en">${s.name.transliteration} — ${s.name.en}</div>
            <div class="surah-meta">${s.verses_count} ${t('verses')} · ${lang === 'ar' ? s.revelation_place.ar : s.revelation_place.en}</div>
          </div>
        </a>
      `).join('')}
    </div>
  `;
}
