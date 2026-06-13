import { t } from '../lib/i18n.js';

export default function renderQuestionSection(): string {
  return `
    <div class="question-section">
      <h2 class="question-headline">${t('question_headline')}</h2>
      <p class="question-subtitle">${t('question_subtitle')}</p>
      <textarea id="question-input" rows="4" placeholder="${t('question_placeholder')}" class="question-input"></textarea>
      <button id="question-submit" class="question-submit-btn">${t('find_guidance')}</button>
      <div id="question-result" class="question-result"></div>
      <div id="question-loader" class="question-loader" style="display:none;"><div class="loader-spinner"></div><span>${t('seeking_wisdom')}</span></div>
    </div>
  `;
}
