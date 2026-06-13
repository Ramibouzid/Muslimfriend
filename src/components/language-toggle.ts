import { getLang, setLang, type Lang } from '../lib/i18n.js';

export default function renderLangToggle(): string {
  const currentLang = getLang();
  const label = currentLang === 'ar' ? 'English' : 'العربية';
  return `<button id="lang-toggle" class="lang-toggle">${label}</button>`;
}

export function initLangToggle() {
  const btn = document.getElementById('lang-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const next: Lang = getLang() === 'ar' ? 'en' : 'ar';
    setLang(next);
    btn.textContent = next === 'ar' ? 'English' : 'العربية';
    window.dispatchEvent(new CustomEvent('languagechange'));
  });
}
