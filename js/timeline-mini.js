/* Timeline-mini — уменьшенная карта-ориентир в шапке.
 * См. MAIN_SCREEN.md → "Timeline-mini" для смысла и поведения.
 *
 * Своя координатная система: 1 год = 1 px, диапазон 1700..2100 (4 века).
 *
 * focus = отражение видимой области основного Timeflow (зависит от scroll
 * и ширины окна). При scroll/resize — позиция и ширина focus пересчитываются. */

const MINI_START = 1700;
const MINI_END   = 2100;
const MINI_WIDTH = MINI_END - MINI_START;   // 400px (1 год = 1 px)
const ROMAN = ['XVIII', 'XIX', 'XX', 'XXI'];   // 4 видимых века

function yearToMiniX(year) {
  return year - MINI_START;
}

/** Один раз отрисовывает структуру timeline-mini (дивайдеры, лейблы веков,
 * полосу time, fade-left, сам элемент focus). Координаты focus задаются
 * через `updateFocus`. */
export function renderTimelineMini(el) {
  el.innerHTML = '';
  el.style.width = MINI_WIDTH + 'px';

  // Порядок DOM (от «низа» к «верху») важен:
  //   1. time (полоса времени) — самый нижний слой.
  //   2. fade-left (прогрессивный blur поверх time).
  //   3. дивайдеры и метки веков — поверх fade, чтобы НЕ блюрились.
  //   4. focus — поверх всего.

  // 1. Time — фактическая полоса от 1700 до текущего года.
  const nowYear = new Date().getFullYear();
  const time = document.createElement('div');
  time.className = 'time timeline-mini__time';
  time.style.left  = '0px';
  time.style.width = (nowYear - MINI_START) + 'px';
  el.appendChild(time);

  // 2. Fade слева — прогрессивный blur. Лежит между time и дивайдерами,
  //    поэтому блюрит time, но дивайдеры/лейблы остаются резкими.
  const fade = document.createElement('div');
  fade.className = 'timeline-mini__fade-left';
  el.appendChild(fade);

  // 3. Дивайдеры между веками: на 0, 100, 200, 300, 400.
  for (let x = 0; x <= MINI_WIDTH; x += 100) {
    const div = document.createElement('div');
    div.className = 'timeline-mini__divider';
    div.style.left = x + 'px';
    el.appendChild(div);
  }

  // 3b. Метки веков: центр каждого — между дивайдерами (50, 150, 250, 350).
  ROMAN.forEach((name, i) => {
    const label = document.createElement('div');
    label.className = 'timeline-mini__label';
    label.style.left = (50 + i * 100) + 'px';
    label.textContent = name;
    el.appendChild(label);
  });

  // 4. Focus — рамка видимой области. Позиция и ширина обновляются отдельно.
  const focus = document.createElement('div');
  focus.className = 'focus timeline-mini__focus';
  focus.id = 'timeline-mini-focus';
  el.appendChild(focus);
}

/** Пересчитать позицию и ширину focus на основе видимой области Timeflow.
 *
 * @param {object} state    глобальный state (startYear, pxPerYear)
 * @param {number} scrollLeft  scrollLeft основного скроллера
 * @param {number} viewportPx  ширина viewport основного скроллера в px */
export function updateFocus(state, scrollLeft, viewportPx) {
  const focus = document.getElementById('timeline-mini-focus');
  if (!focus) return;

  // Год слева/справа от viewport основного Timeflow:
  const viewStartYear = state.startYear + scrollLeft / state.pxPerYear;
  const viewEndYear   = state.startYear + (scrollLeft + viewportPx) / state.pxPerYear;

  // Перевод в координаты timeline-mini (1 год = 1 px от 1700)
  const left  = yearToMiniX(viewStartYear);
  const width = Math.max(viewEndYear - viewStartYear, 4);  // минимум 4px чтобы рамка была видна

  focus.style.left  = left + 'px';
  focus.style.width = width + 'px';
}
