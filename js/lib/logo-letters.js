/* Logo letters — авто-эффект «шлейфа» на лого «past simple».
 *
 * Разбивает текст в headingEl на span'ы по букве и периодически красит
 * случайную букву в случайный цвет из LOGO_COLORS. Цвет держится 1с,
 * потом сбрасывается обратно на дефолтный (через resetting inline-style).
 * Из-за наложения 1-секундных окон одновременно «горят» несколько букв —
 * это и есть «шлейф».
 *
 * Цвета и их использование симметричны исходному desktop-hover эффекту
 * (раньше был в js/popup.js → initLogoHover). Здесь курсор не нужен:
 * эффект запускается сам собой.
 *
 * Используется на mobile-stub-лого; см. js/main.js → mobile-stub init. */

export const LOGO_COLORS = [
  '--red-100', '--green-100', '--blue-100',
  '--yellow-100', '--purple-100', '--toxic-100',
];

/** Инициализирует авто-эффект на heading-элементе.
 *  letterClass — CSS-класс, который ставится на каждый span-буквы;
 *  intervalMs  — частота, с которой выбирается следующая буква. */
export function initLogoAutoColors(headingEl, { letterClass, intervalMs = 220 } = {}) {
  const text = headingEl.textContent;
  headingEl.textContent = '';
  const letters = [];
  for (const ch of text) {
    const span = document.createElement('span');
    span.className = letterClass;
    span.textContent = ch;
    if (ch === ' ') span.style.whiteSpace = 'pre';
    headingEl.appendChild(span);
    letters.push(span);
  }

  setInterval(() => {
    const letter = letters[Math.floor(Math.random() * letters.length)];
    if (!letter || letter.textContent === ' ') return;
    const color = LOGO_COLORS[Math.floor(Math.random() * LOGO_COLORS.length)];
    letter.style.color = `var(${color})`;
    clearTimeout(letter._restoreTimer);
    letter._restoreTimer = setTimeout(() => { letter.style.color = ''; }, 1000);
  }, intervalMs);
}
