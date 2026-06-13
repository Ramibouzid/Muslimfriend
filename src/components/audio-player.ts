import type { AudioReciter } from '../types/quran.js';
import { t } from '../lib/i18n.js';

export default function renderAudioPanel(reciters: AudioReciter[]): string {
  return `
    <div class="audio-panel">
      <select id="reciter-select">
        ${reciters.map(r => `<option value="${r.id}" data-link="${r.link}">${r.reciter.en} — ${r.rewaya.en}</option>`).join('')}
      </select>
      <button class="audio-btn" id="play-btn">▶ ${t('play_audio')}</button>
      <audio id="audio-player" style="display:none;"></audio>
    </div>
  `;
}

export function initAudioPlayer(surahNumber: number) {
  const select = document.getElementById('reciter-select') as HTMLSelectElement;
  const playBtn = document.getElementById('play-btn') as HTMLButtonElement;
  const audio = document.getElementById('audio-player') as HTMLAudioElement;

  if (!select || !playBtn || !audio) return;

  const pad = String(surahNumber).padStart(3, '0');
  const playLabel = t('play_audio');
  const pauseLabel = t('pause');

  playBtn.addEventListener('click', () => {
    const selectedOption = select.options[select.selectedIndex];
    let link = selectedOption.getAttribute('data-link') || '';
    link = link.replace(/\/\d+\.mp3$/, '') + `/${pad}.mp3`;

    if (audio.src === link && !audio.paused) {
      audio.pause();
      playBtn.textContent = `▶ ${playLabel}`;
      return;
    }

    audio.src = link;
    audio.play();
    playBtn.textContent = `⏸ ${pauseLabel}`;
    audio.onended = () => { playBtn.textContent = `▶ ${playLabel}`; };
  });
}
