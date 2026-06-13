export type Lang = 'ar' | 'en';

let current: Lang = 'ar';

const dict: Record<string, { ar: string; en: string }> = {
  search: { ar: 'بحث', en: 'Search' },
  search_placeholder: { ar: 'ابحث في الآيات...', en: 'Search verses...' },
  search_english: { ar: 'الإنجليزية', en: 'English' },
  search_arabic: { ar: 'العربية', en: 'العربية' },
  searching: { ar: 'جارٍ البحث...', en: 'Searching...' },
  no_results: { ar: 'لا توجد نتائج', en: 'No results found' },
  home_hero_title: { ar: 'ابحث عن السكينة في القرآن', en: 'Find peace in the Quran' },
  home_hero_subtitle: { ar: 'رفيقك في التدبر والهداية والاستماع', en: 'Your companion for reflection, guidance, and listening' },
  question_headline: { ar: 'اسأل أي سؤال، احصل على التوجيه من القرآن', en: 'Ask Any Question, Receive Guidance From the Quran' },
  question_subtitle: { ar: 'شارك ما في قلبك — همًا، أملًا، سؤالًا — واحصل على آية تخاطبك مباشرة، مع كلمة من صديق يهتم بك حقًا.', en: "Share what's on your heart — a worry, a hope, a question — and receive a verse that speaks directly to you, with a personal note from a friend who truly cares." },
  question_placeholder: { ar: 'مثال: أشعر بالضياع وأحتاج إلى توجيه...', en: "e.g., I'm feeling lost and need direction..." },
  find_guidance: { ar: 'ابحث عن التوجيه', en: 'Find Guidance' },
  seeking_wisdom: { ar: 'نبحث عن الحكمة لك...', en: 'Seeking wisdom for you...' },
  read_context: { ar: 'اقرأ السياق الكامل ←', en: 'Read full context →' },
  guidance_error: { ar: 'تعذر العثور على توجيه الآن. حاول مرة أخرى.', en: 'Could not find guidance right now. Please try again.' },
  verse_not_found: { ar: 'بيانات الآية غير موجودة', en: 'Verse data not found.' },
  listen_section: { ar: 'استمع إلى القرآن', en: 'Listen to the Quran' },
  listen_subtitle: { ar: 'اختر سورة وقارئًا للبدء', en: 'Choose a surah and a reciter to begin' },
  no_audio: { ar: 'لا يوجد تسجيل صوتي لهذه السورة', en: 'No audio available for this surah' },
  audio_load_fail: { ar: 'فشل في تحميل البيانات الصوتية', en: 'Failed to load audio data' },
  play_audio: { ar: 'شغل صوت السورة', en: 'Play Surah Audio' },
  pause: { ar: 'إيقاف مؤقت', en: 'Pause' },
  browse_quran: { ar: 'تصفح القرآن', en: 'Browse the Quran' },
  all_surahs: { ar: 'جميع السور ١١٤', en: 'All 114 surahs' },
  verses: { ar: 'آيات', en: 'verses' },
  makkiyah: { ar: 'مكية', en: 'Makkiyah' },
  madaniyah: { ar: 'مدنية', en: 'Madaniyah' },
  previous: { ar: 'السابق', en: '← Previous' },
  next: { ar: 'التالي', en: 'Next →' },
  page_not_found: { ar: 'الصفحة غير موجودة', en: 'Page not found' },
  surah_not_found: { ar: 'السورة غير موجودة', en: 'Surah not found' },
  surah_data_fail: { ar: 'فشل تحميل بيانات السورة', en: 'Failed to load surah data' },
  verse_data_fail: { ar: 'بيانات الآية غير موجودة', en: 'Verse data not found' },
  error_generic: { ar: 'حدث خطأ. يرجى المحاولة مرة أخرى.', en: 'Something went wrong. Please try again.' },
  juz: { ar: 'الجزء', en: 'Juz' },
  page: { ar: 'الصفحة', en: 'Page' },
  sajda: { ar: 'سجدة', en: 'Sajda' },
  footer: { ar: 'أنشأها محمد رامي بوزيد، بحب ودعاء بالسلام لمجتمعنا.', en: 'Created by Mohamed Rami Bouzid, with love and a prayer for peace for our community.' },
  lang_btn: { ar: 'English', en: 'العربية' },
  about_desc: { ar: 'منصة ذكية تجمع بين القرآن الكريم والذكاء الاصطناعي لتقديم التوجيه الروحي المناسب لكل حالة نفسية', en: 'A smart platform that combines the Holy Quran with artificial intelligence to provide spiritual guidance tailored to every emotional state' },
};

export function t(key: string): string {
  return dict[key]?.[current] ?? key;
}

export function setLang(lang: Lang) {
  current = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  localStorage.setItem('lang', lang);
}

export function getLang(): Lang {
  return current;
}

export function initLang() {
  const saved = localStorage.getItem('lang') as Lang | null;
  if (saved === 'ar' || saved === 'en') setLang(saved);
  else setLang('ar');
}
