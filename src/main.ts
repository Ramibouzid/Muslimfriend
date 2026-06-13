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
  const { default: renderQuestionSection } = await import('./components/feeling-button.js');

  const surahs = await getAllSurahMeta();
  app.innerHTML = `
    <div class="header">
      <h1>MuslimFriend</h1>
      <div class="header-links">
        <a href="#/search" class="header-link">Search</a>
      </div>
    </div>
    <div class="home-hero">
      <div class="home-hero-content">
        <h2 class="home-hero-title">Find peace in the Quran</h2>
        <p class="home-hero-subtitle">Your companion for reflection, guidance, and listening</p>
      </div>
    </div>
    <div class="container">
      ${renderQuestionSection()}
      <div class="home-section-divider"></div>
      <div class="audio-section">
        <h3 class="section-heading">Listen to the Quran</h3>
        <p class="section-subtitle">Choose a surah and a reciter to begin</p>
        <div id="home-audio-panel">
          <select id="home-surah-select" class="home-surah-select">
            ${surahs.map(s => `<option value="${s.number}">${s.number}. ${s.name.transliteration}</option>`).join('')}
          </select>
          <div id="home-reciter-area"></div>
        </div>
      </div>
      <div class="home-section-divider"></div>
      <h3 class="section-heading">Browse the Quran</h3>
      <p class="section-subtitle">All 114 surahs</p>
      ${renderSurahList(surahs)}
    </div>
  `;

  document.getElementById('question-submit')!.addEventListener('click', handleQuestionSubmit);
  document.getElementById('question-input')!.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuestionSubmit();
    }
  });

  initHomeAudio();
}

async function handleQuestionSubmit() {
  const input = document.getElementById('question-input') as HTMLTextAreaElement;
  const text = input.value.trim();
  if (!text) return;

  const loader = document.getElementById('question-loader')!;
  const resultDiv = document.getElementById('question-result')!;
  const submitBtn = document.getElementById('question-submit') as HTMLButtonElement;

  submitBtn.disabled = true;
  resultDiv.innerHTML = '';
  loader.style.display = 'flex';

  const { recommendVerse } = await import('./lib/openrouter.js');
  const { getVerse } = await import('./lib/getVerse.js');
  const { scanText } = await import('./lib/safety.js');

  const recommendation = await recommendVerse(text);
  loader.style.display = 'none';

  if (!recommendation) {
    resultDiv.innerHTML = '<div class="question-error">Could not find guidance right now. Please try again.</div>';
    submitBtn.disabled = false;
    return;
  }

  const verse = await getVerse(recommendation.surah, recommendation.verse);
  if (!verse) {
    resultDiv.innerHTML = '<div class="question-error">Verse data not found.</div>';
    submitBtn.disabled = false;
    return;
  }

  const safety = scanText(verse.text.en + ' ' + verse.text.ar);
  resultDiv.innerHTML = `
    ${safety.message ? `<div class="safety-banner">${safety.message}</div>` : ''}
    <div class="question-response">
      <div class="response-advisory response-advisory-ar" dir="rtl">${recommendation.arabic_advisory || ''}</div>
      <div class="response-verse-ar">${verse.text.ar}</div>
      <div class="response-advisory">${recommendation.english_advisory || ''}</div>
      <div class="response-verse-en">${verse.text.en}</div>
      <a href="#/verse/${recommendation.surah}/${recommendation.verse}" class="response-link">Read full context →</a>
    </div>
  `;
  submitBtn.disabled = false;
  resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initHomeAudio() {
  const select = document.getElementById('home-surah-select') as HTMLSelectElement;
  const reciterArea = document.getElementById('home-reciter-area')!;

  select.addEventListener('change', async () => {
    const surahNumber = parseInt(select.value);
    try {
      const res = await fetch('/Data/mainDataQuran.json');
      const data = await res.json() as { number: number; audio: import('./types/quran.js').AudioReciter[] }[];
      const surah = data.find(s => s.number === surahNumber);
      if (!surah || !surah.audio) {
        reciterArea.innerHTML = '<p class="no-audio">No audio available for this surah</p>';
        return;
      }
      const { default: renderAudioPanel, initAudioPlayer } = await import('./components/audio-player.js');
      reciterArea.innerHTML = renderAudioPanel(surah.audio);
      initAudioPlayer(surahNumber);
    } catch {
      reciterArea.innerHTML = '<p class="no-audio">Failed to load audio data</p>';
    }
  });

  select.dispatchEvent(new Event('change'));
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
