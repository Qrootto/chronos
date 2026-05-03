/* Zoom — управление масштабом времени.
 *
 * 5 фиксированных шагов pxPerYear: [33, 40, 47, 54, 61]. Текущее состояние
 * сайта (40) — второй слева. Дельта между шагами постоянная (7).
 *
 * Кнопки +/− переключают шаг. Thumb на треке прыгает по 5 равномерным
 * позициям (0%, 25%, 50%, 75%, 100%) с плавной анимацией.
 *
 * При смене шага сохраняем центр viewport: год, который был под центром
 * экрана, остаётся под центром. См. MAIN_SCREEN.md → Zoom. */

export const ZOOM_STEPS = [33, 40, 47, 54, 61];

/** Индекс текущего шага по pxPerYear. Если значение не точное —
 *  возвращает ближайший. */
export function stepIndexFor(pxPerYear) {
  let bestI = 0, bestD = Infinity;
  ZOOM_STEPS.forEach((v, i) => {
    const d = Math.abs(v - pxPerYear);
    if (d < bestD) { bestD = d; bestI = i; }
  });
  return bestI;
}

export function thumbPercentFor(stepIdx) {
  return (stepIdx / (ZOOM_STEPS.length - 1)) * 100;
}

/** Вычисляет новый scrollLeft так, чтобы год, который был под центром
 *  viewport, остался под центром после смены масштаба. */
export function scrollLeftToKeepCenter(state, oldPxPerYear, newPxPerYear, scrollLeft, viewportPx) {
  const centerYear = state.startYear + (scrollLeft + viewportPx / 2) / oldPxPerYear;
  return (centerYear - state.startYear) * newPxPerYear - viewportPx / 2;
}

/** Подключает обработчики +/− и устанавливает позицию thumb по текущему
 *  шагу. onChange(newPxPerYear) вызывается при смене шага. */
export function initZoom({ minusBtn, plusBtn, thumbEl, getState, onChange }) {
  function syncThumb() {
    const idx = stepIndexFor(getState().pxPerYear);
    thumbEl.style.left = thumbPercentFor(idx) + '%';
  }

  function shift(delta) {
    const state = getState();
    const idx = stepIndexFor(state.pxPerYear);
    const next = Math.max(0, Math.min(ZOOM_STEPS.length - 1, idx + delta));
    if (next === idx) return;
    onChange(ZOOM_STEPS[next]);
    syncThumb();
  }

  minusBtn.addEventListener('click', () => shift(-1));
  plusBtn .addEventListener('click', () => shift(+1));

  syncThumb();
  return { syncThumb };
}
