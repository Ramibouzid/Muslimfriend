export default function renderQuestionSection(): string {
  return `
    <div class="question-section">
      <h2 class="question-headline">Ask Any Question,<br>Receive Guidance From the Quran</h2>
      <p class="question-subtitle">Share what's on your heart — a worry, a hope, a question — and receive a verse that speaks directly to you, with a personal note from a friend who truly cares.</p>
      <textarea id="question-input" rows="4" placeholder="e.g., I'm feeling lost and need direction..." class="question-input"></textarea>
      <button id="question-submit" class="question-submit-btn">Find Guidance</button>
      <div id="question-result" class="question-result"></div>
      <div id="question-loader" class="question-loader" style="display:none;"><div class="loader-spinner"></div><span>Seeking wisdom for you...</span></div>
    </div>
  `;
}
