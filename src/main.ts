import './styles/main.css';

type Page = 'home' | 'surah' | 'page' | 'search' | 'verse';

interface Route {
  page: Page;
  params: Record<string, string>;
}

function parseRoute(): Route {
  const hash = location.hash.slice(1) || '/';
  const parts = hash.split('/').filter(Boolean);

  if (parts[0] === 'surah' && parts[1]) {
    return { page: 'surah', params: { number: parts[1], verse: parts[2] || '' } };
  }
  if (parts[0] === 'page' && parts[1]) {
    return { page: 'page', params: { number: parts[1] } };
  }
  if (parts[0] === 'search') {
    return { page: 'search', params: { q: parts[1] || '' } };
  }
  if (parts[0] === 'verse' && parts[1] && parts[2]) {
    return { page: 'verse', params: { surah: parts[1], verse: parts[2] } };
  }
  return { page: 'home', params: {} };
}

function navigate(hash: string) {
  location.hash = hash;
}

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('hashchange', render);
  render();
});

async function render() {
  const route = parseRoute();
  const app = document.getElementById('app');
  if (!app) return;

  try {
    switch (route.page) {
      case 'home':
        await renderHome(app);
        break;
      case 'surah':
        await renderSurah(app, parseInt(route.params.number), parseInt(route.params.verse) || 0);
        break;
      case 'page':
        await renderPage(app, parseInt(route.params.number));
        break;
      case 'search':
        await renderSearch(app, route.params.q);
        break;
      case 'verse':
        await renderVerse(app, parseInt(route.params.surah), parseInt(route.params.verse));
        break;
    }
  } catch {
    app.innerHTML = `<div class="container"><div class="error-state">Something went wrong. Please try again.</div></div>`;
  }
}

async function renderHome(app: HTMLElement) {
  const { getAllSurahMeta } = await import('./lib/getSurah.js');
  const { default: renderSurahList } = await import('./components/surah-list.js');
  const { default: renderFeelingButton } = await import('./components/feeling-button.js');

  const surahs = await getAllSurahMeta();
  app.innerHTML = `
    <div class="header">
      <h1>MuslimFriend</h1>
      <a href="#/search">🔍</a>
    </div>
    <div class="container">
      ${renderFeelingButton()}
      ${renderSurahList(surahs)}
    </div>
  `;

  const feelingBtn = document.getElementById('feeling-btn');
  if (feelingBtn) {
    feelingBtn.addEventListener('click', () => openFeelingModal(app));
  }
}

async function openFeelingModal(_app: HTMLElement) {
  const existing = document.getElementById('feeling-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'feeling-modal';
  modal.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200;
    display: flex; align-items: center; justify-content: center; padding: 1rem;
  `;
  modal.innerHTML = `
    <div class="card" style="max-width:450px;width:100%;">
      <div style="font-size:0.85rem;font-weight:600;margin-bottom:0.75rem;">How are you feeling?</div>
      <p style="font-size:0.65rem;color:var(--text-muted);margin-bottom:0.75rem;">Share your feeling and get a verse that resonates with you.</p>
      <textarea id="feeling-input" rows="3" class="search-input" placeholder="e.g., I feel anxious about my future..." style="resize:vertical;font-family:inherit;"></textarea>
      <div style="margin-top:0.75rem;display:flex;gap:0.5rem;">
        <button id="feeling-submit" class="audio-btn" style="flex:1;">Find a Verse</button>
        <button id="feeling-cancel" class="audio-btn" style="flex:1;background:var(--text-muted);">Cancel</button>
      </div>
      <div id="feeling-result" style="margin-top:0.75rem;"></div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  document.getElementById('feeling-cancel')!.addEventListener('click', () => modal.remove());

  document.getElementById('feeling-submit')!.addEventListener('click', async () => {
    const input = document.getElementById('feeling-input') as HTMLTextAreaElement;
    const text = input.value.trim();
    if (!text) return;

    const resultDiv = document.getElementById('feeling-result')!;
    resultDiv.innerHTML = '<div class="loading" style="padding:1rem;">Finding a verse for you...</div>';
    (document.getElementById('feeling-submit') as HTMLButtonElement).disabled = true;

    const { recommendVerse } = await import('./lib/openrouter.js');
    const { getVerse } = await import('./lib/getVerse.js');
    const { scanText } = await import('./lib/safety.js');

    const recommendation = await recommendVerse(text);
    if (!recommendation) {
      resultDiv.innerHTML = '<div class="error-state" style="font-size:0.65rem;">Could not find a verse. Check your API key or try again.</div>';
      (document.getElementById('feeling-submit') as HTMLButtonElement).disabled = false;
      return;
    }

    const verse = await getVerse(recommendation.surah, recommendation.verse);
    if (!verse) {
      resultDiv.innerHTML = '<div class="error-state" style="font-size:0.65rem;">Verse data not found.</div>';
      (document.getElementById('feeling-submit') as HTMLButtonElement).disabled = false;
      return;
    }

    const safety = scanText(verse.text.en + ' ' + verse.text.ar);
    resultDiv.innerHTML = `
      ${safety.message ? `<div class="safety-banner" style="font-size:0.65rem;border-radius:8px;margin-bottom:0.5rem;">${safety.message}</div>` : ''}
      <div class="verse-text-ar" style="font-size:1.2rem;">${verse.text.ar}</div>
      <div class="verse-text-en" style="font-size:0.65rem;">${verse.text.en}</div>
      <div style="font-size:0.6rem;color:var(--text-muted);margin-top:0.5rem;">
        ${recommendation.reason}
        <br><a href="#/verse/${recommendation.surah}/${recommendation.verse}" style="color:var(--primary);">Go to verse →</a>
      </div>
    `;
    modal.querySelector('.card')!.scrollTop = 0;
    (document.getElementById('feeling-submit') as HTMLButtonElement).disabled = false;
  });
}

async function renderSurah(app: HTMLElement, surahNumber: number, highlightVerse: number) {
  const { getSurahMeta } = await import('./lib/getSurah.js');
  const { default: renderVerseCard } = await import('./components/verse-card.js');
  const { default: renderAudioPanel, initAudioPlayer } = await import('./components/audio-player.js');

  const meta = await getSurahMeta(surahNumber);
  if (!meta) {
    app.innerHTML = `<div class="container"><div class="error-state">Surah not found</div></div>`;
    return;
  }

  try {
    const res = await fetch('/Data/mainDataQuran.json');
    const data = await res.json() as { number: number; verses: import('./types/quran.js').Verse[]; audio: import('./types/quran.js').AudioReciter[] }[];
    const surah = data.find(s => s.number === surahNumber);

    if (!surah) {
      app.innerHTML = `<div class="container"><div class="error-state">Surah data not found</div></div>`;
      return;
    }

    app.innerHTML = `
      <div class="header">
        <button class="back-btn" onclick="location.hash='#/'">←</button>
        <h1>${meta.name.transliteration}</h1>
        <a href="#/search">🔍</a>
      </div>
      <div class="container">
        <div class="surah-name">${meta.name.ar} — ${meta.name.en}</div>
        ${renderAudioPanel(surah.audio)}
        <div class="bismillah">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</div>
        ${surah.verses.map(v => renderVerseCard(v, surahNumber)).join('')}
      </div>
    `;

    initAudioPlayer(surahNumber);

    if (highlightVerse) {
      setTimeout(() => {
        const el = document.getElementById(`verse-${highlightVerse}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  } catch {
    app.innerHTML = `<div class="container"><div class="error-state">Failed to load surah data</div></div>`;
  }
}

async function renderPage(app: HTMLElement, pageNumber: number) {
  const { getPage } = await import('./lib/getPage.js');
  const page = await getPage(pageNumber);

  if (!page) {
    app.innerHTML = `<div class="container"><div class="error-state">Page not found</div></div>`;
    return;
  }

  app.innerHTML = `
    <div class="header">
      <button class="back-btn" onclick="location.hash='#/'">←</button>
      <h1>Page ${pageNumber}</h1>
    </div>
    <div class="container">
      <div class="page-viewer">
        <img src="${page.image.url}" alt="Page ${pageNumber}" onerror="this.alt='Page image not available'" loading="lazy">
      </div>
      <div class="page-nav">
        <button ${pageNumber <= 1 ? 'disabled' : ''} onclick="location.hash='#/page/${pageNumber - 1}'">← Previous</button>
        <span>${page.start.name.transliteration} ${page.start.verse}:${page.start.surah_number} — ${page.end.verse}:${page.end.surah_number}</span>
        <button ${pageNumber >= 604 ? 'disabled' : ''} onclick="location.hash='#/page/${pageNumber + 1}'">Next →</button>
      </div>
    </div>
  `;
}

async function renderSearch(app: HTMLElement, query: string) {
  app.innerHTML = `
    <div class="header">
      <button class="back-btn" onclick="location.hash='#/'">←</button>
      <h1>Search</h1>
    </div>
    <div class="container">
      <input class="search-input" id="search-input" type="text" placeholder="Search verses..." value="${escapeHtml(query)}">
      <div class="search-lang-toggle">
        <button class="search-lang-btn active" data-lang="en">English</button>
        <button class="search-lang-btn" data-lang="ar">العربية</button>
      </div>
      <div id="search-results"></div>
    </div>
  `;

  const input = document.getElementById('search-input') as HTMLInputElement;
  const langBtns = document.querySelectorAll('.search-lang-btn');
  let lang: 'ar' | 'en' = 'en';

  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      langBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      lang = (btn.getAttribute('data-lang') || 'en') as 'ar' | 'en';
      if (input.value.trim()) doSearch(input.value.trim(), lang);
    });
  });

  let debounceTimer: number;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const q = input.value.trim();
      if (q) {
        navigate(`/search/${encodeURIComponent(q)}`);
        doSearch(q, lang);
      } else {
        document.getElementById('search-results')!.innerHTML = '';
      }
    }, 300) as unknown as number;
  });

  if (query) {
    input.value = query;
    doSearch(query, lang);
  }
}

async function doSearch(term: string, lang: 'ar' | 'en') {
  const { searchVerses } = await import('./lib/search.js');
  const resultsDiv = document.getElementById('search-results')!;
  resultsDiv.innerHTML = '<div class="loading">Searching...</div>';

  const results = await searchVerses(term, lang);
  if (results.length === 0) {
    resultsDiv.innerHTML = '<div class="error-state">No results found</div>';
    return;
  }

  resultsDiv.innerHTML = results.map(r => `
    <div class="result-item" onclick="location.hash='#/verse/${r.surah}/${r.verse}'">
      <div class="result-surah">${r.surahName.transliteration} (${r.surah}):${r.verse}</div>
      <div class="result-text-ar" dir="rtl">${escapeHtml(r.text.ar)}</div>
      <div class="result-text-en">${escapeHtml(r.text.en)}</div>
    </div>
  `).join('');
}

async function renderVerse(app: HTMLElement, surah: number, verse: number) {
  const { getSurahMeta } = await import('./lib/getSurah.js');
  const { getVerse } = await import('./lib/getVerse.js');
  const { default: renderVerseCard } = await import('./components/verse-card.js');
  const { scanText } = await import('./lib/safety.js');

  const [meta, v] = await Promise.all([getSurahMeta(surah), getVerse(surah, verse)]);

  if (!v || !meta) {
    app.innerHTML = `<div class="container"><div class="error-state">Verse not found</div></div>`;
    return;
  }

  const safety = scanText(v.text.en + ' ' + v.text.ar);
  app.innerHTML = `
    <div class="header">
      <button class="back-btn" onclick="location.hash='#/surah/${surah}'">←</button>
      <h1>${meta.name.transliteration} ${verse}</h1>
    </div>
    ${safety.message ? `<div class="safety-banner">${safety.message}</div>` : ''}
    <div class="container">
      <div class="surah-name">${meta.name.ar} — ${meta.name.en}</div>
      ${renderVerseCard(v, surah)}
    </div>
  `;
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
