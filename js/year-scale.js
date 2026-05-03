/* Year scale — нижняя шкала годов. Использует ту же координатную систему,
 * что и Timeflow: x = (year − startYear) × pxPerYear.
 *
 * Каждый год — компонент `.year` (атом, см. styles/components/year.css):
 * бокс 20×17 с __dot и __label, 3 состояния (Default/Hovered/Active).
 *
 * Бокс центрирован на координате года → ставим `left = yearToX − 10`. */

const YEAR_BOX_WIDTH = 20;

function yearToX(year, state) {
  return (year - state.startYear) * state.pxPerYear;
}

export function renderYearScale(el, state) {
  el.innerHTML = '';

  for (let y = state.startYear; y <= state.endYear; y++) {
    const x = yearToX(y, state);

    const yearEl = document.createElement('div');
    yearEl.className = 'year';
    yearEl.style.left = (x - YEAR_BOX_WIDTH / 2) + 'px';
    yearEl.dataset.year = y;

    const dot = document.createElement('div');
    dot.className = 'year__dot';
    yearEl.appendChild(dot);

    const label = document.createElement('span');
    label.className = 'year__label';
    label.textContent = y;
    yearEl.appendChild(label);

    el.appendChild(yearEl);
  }
}

/** Возвращает год под курсором по горизонтальной координате внутри
 *  canvas-inner (с учётом scrollLeft). Округление автоматически даёт
 *  правильные границы hover-area: от центра-между-(Y−1, Y) до центра-между-(Y, Y+1). */
export function yearAtX(xInsideContent, state) {
  return Math.round(xInsideContent / state.pxPerYear) + state.startYear;
}

/** Перекрашивает hover-state на нужный год.
 *  prevYear/newYear могут быть null. */
export function setHoveredYear(yearScaleEl, prevYear, newYear) {
  if (prevYear === newYear) return;
  if (prevYear != null) {
    const prev = yearScaleEl.querySelector(`.year[data-year="${prevYear}"]`);
    if (prev) prev.classList.remove('year--hovered');
  }
  if (newYear != null) {
    const next = yearScaleEl.querySelector(`.year[data-year="${newYear}"]`);
    if (next) next.classList.add('year--hovered');
  }
}
