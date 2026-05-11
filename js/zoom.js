/* Zoom — управление масштабом времени.
 *
 * 5 фиксированных шагов pxPerYear: [27, 40, 47, 54, 61]. Дефолтное
 * состояние сайта (40) — второй слева. Минимум 27 подобран так, чтобы
 * метки годов на year-scale не наезжали друг на друга на самом
 * сжатом шаге. Шаги 40+ — с равномерной дельтой 7.
 *
 * Кнопки +/− переключают шаг по одному. Thumb на треке прыгает по
 * 5 равномерным позициям (0%, 25%, 50%, 75%, 100%) с плавной
 * анимацией. Также thumb можно перетаскивать мышью (drag, R23).
 *
 * При смене шага сохраняем центр viewport: год, который был под центром
 * экрана, остаётся под центром. См. MAIN_SCREEN.md → Zoom. */

export const ZOOM_STEPS = [27, 40, 47, 54, 61];

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

/** Рендерит .zoom__tick'и в трек по количеству ZOOM_STEPS. Вызывается
 *  один раз на init — позволяет менять количество шагов без правки HTML. */
function renderTicks(trackEl) {
  trackEl.querySelectorAll('.zoom__tick').forEach(t => t.remove());
  for (let i = 0; i < ZOOM_STEPS.length; i++) {
    const tick = document.createElement('span');
    tick.className = 'zoom__tick';
    tick.style.left = thumbPercentFor(i) + '%';
    // Thumb должен быть последним в DOM, чтобы рендериться поверх тиков.
    trackEl.insertBefore(tick, trackEl.firstChild);
  }
}

/** Подключает обработчики +/−, drag по thumb'у, и устанавливает позицию
 *  thumb по текущему шагу. onChange(newPxPerYear) вызывается при смене шага. */
export function initZoom({ minusBtn, plusBtn, thumbEl, getState, onChange }) {
  const trackEl = thumbEl.parentElement;
  renderTicks(trackEl);

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

  // === Drag thumb (R23) ===
  // Во время drag: thumb визуально следует курсору без transition.
  // Параллельно вычисляется ближайший step — если он изменился, вызываем
  // onChange (timeflow зумится в реальном времени, центр viewport сохраняется).
  // На отпускании курсора восстанавливаем transition и snapping к реальному step.
  let isDragging = false;

  thumbEl.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    isDragging = true;
    thumbEl.setPointerCapture(e.pointerId);
    thumbEl.style.transition = 'none';
  });

  thumbEl.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const rect = trackEl.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    thumbEl.style.left = (ratio * 100) + '%';
    const stepIdx = Math.round(ratio * (ZOOM_STEPS.length - 1));
    const newPx = ZOOM_STEPS[stepIdx];
    if (newPx !== getState().pxPerYear) onChange(newPx);
  });

  function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    thumbEl.releasePointerCapture(e.pointerId);
    thumbEl.style.transition = '';
    syncThumb();
  }
  thumbEl.addEventListener('pointerup',     endDrag);
  thumbEl.addEventListener('pointercancel', endDrag);

  syncThumb();
  return { syncThumb };
}
