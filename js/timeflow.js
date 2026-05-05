/* Timeflow — рендер центральной области из данных по правилам MAIN_SCREEN.md.
 *
 * Главная формула: x = (year − startYear) × pxPerYear.
 * Все позиции (имена, life-line, event-dot, мировые события, метки веков)
 * считаются ИЗ НЕЁ. Координаты в Figma — иллюстрация, не задание.
 *
 * Slice 1: статический рендер. Без интерактива (hover/click/scroll-listeners). */

// Маппинг категории data → CSS-класса (в data — `politician`, в CSS — `politic`).
const CATEGORY_CLASS = {
  artist:      'artist',
  writer:      'writer',
  musician:    'musician',
  scientist:   'scientist',
  businessman: 'businessman',
  politician:  'politic',
};

// Порядок людей сверху-вниз на Timeflow (по категории).
const CATEGORY_ORDER = ['artist', 'writer', 'musician', 'scientist', 'businessman', 'politician'];

function categoryRank(category) {
  const i = CATEGORY_ORDER.indexOf(category);
  return i < 0 ? CATEGORY_ORDER.length : i;
}

// Минимальный шаг между линиями жизни. До этого порога — равномерное
// растяжение по высоте; ниже — фиксированный шаг и вертикальный скролл.
const MIN_ROW_STEP   = 43;
// От top имени до top life-line — константа дизайна (имя выше линии).
const NAME_TO_LINE_GAP = 19;

function yearToX(year, state) {
  return (year - state.startYear) * state.pxPerYear;
}

/** Вертикальные позиции линий жизни для N людей при доступной высоте H.
 *  Возвращает массив y-координат (в px) центров линий, длиной N.
 *
 *  Правило (см. MAIN_SCREEN.md):
 *  - При N людях шаг = H / (N + 1), линии равномерно занимают H.
 *  - Если шаг получился меньше MIN_ROW_STEP — ставим MIN_ROW_STEP,
 *    контент станет выше H, появится вертикальный скролл. */
function distributeRows(n, H, minStep = MIN_ROW_STEP) {
  if (n <= 0) return [];
  const step = Math.max(H / (n + 1), minStep);
  return Array.from({ length: n }, (_, i) => Math.round(step * (i + 1)));
}

/** Дивайдеры между веками: годы вида 1900, 2000... попадающие строго внутрь диапазона. */
function centuryDividers(state) {
  const result = [];
  const first = Math.ceil(state.startYear / 100) * 100;  // 1850 → 1900
  const last  = Math.floor(state.endYear / 100) * 100;   // 1950 → 1900
  for (let y = first; y <= last; y += 100) {
    if (y > state.startYear && y < state.endYear) result.push(y);
  }
  return result;
}

/** Главный рендер. Очищает контейнер и рисует все элементы Timeflow заново. */
export function renderTimeflow(el, state, people, worldEvents = []) {
  el.innerHTML = '';

  // Координаты для всех вертикальных event-блоков:
  //   top = 23 (низ метки века = 19, +4 gap)
  //   bottom = 4 (зазор до точек в Year scale)
  //     → height = 100% - 23 - 4 = 100% - 27px
  // Центрирование: левый/правый край event'а (1px) центром на координате года →
  //   left = yearToX(year) - 0.5; ширина = (toYear-fromYear)*pxPerYear + 1.

  // 1. Дивайдеры между веками (event--secondary). Метка века = persistent caption.
  const ROMAN_FOR = (year) => {
    const n = Math.ceil(year / 100);  // 1900 → 19, 2000 → 20
    const ROMAN = ['', 'I','II','III','IV','V','VI','VII','VIII','IX',
                   'X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI','XXII'];
    return ROMAN[n] || String(n);
  };

  for (const y of centuryDividers(state)) {
    const div = document.createElement('div');
    div.className = 'event event--secondary';   // standalone, без --less-than-year
    div.style.left = (yearToX(y, state) - 0.5) + 'px';
    div.style.top = '31px';
    /* events.bottom = низ timeflow (= нижняя граница Timeflow по
     * MAIN_SCREEN.md). Зазор до Year scale задан через margin-bottom
     * у .canvas__timeflow-area. */
    div.style.height = 'calc(100% - 31px)';

    // Метка века как persistent caption — над дивайдером, привязана к нему.
    // Текст: римская цифра века, в который входит год сразу ПОСЛЕ дивайдера
    // (например, дивайдер 1900 разделяет XIX и XX → метка XX, относится к XX).
    const caption = document.createElement('span');
    caption.className = 'event__caption event__caption--persistent';
    caption.textContent = ROMAN_FOR(y + 1);  // y+1 — первый год нового века
    div.appendChild(caption);
    el.appendChild(div);
  }

  // (Метки веков для крайних случаев, когда дивайдер не виден в диапазоне:
  //  это в visibleCenturies() — пока используются только над дивайдерами,
  //  если в видимом диапазоне нет дивайдера, метка центруется на середине
  //  видимой части века. Для 1850-1950 виден дивайдер 1900, поэтому
  //  всё покрыто.)

  // 2. Мировые события (вертикальные блоки)
  for (const ev of worldEvents) {
    const fromYear = ev.year != null ? ev.year : ev.startYear;
    const toYear   = ev.year != null ? ev.year : ev.endYear;
    if (toYear < state.startYear || fromYear > state.endYear) continue;

    const visFrom = Math.max(fromYear, state.startYear);
    const visTo   = Math.min(toYear,   state.endYear);
    const widthYears = visTo - visFrom;
    const xLeft  = yearToX(visFrom, state) - 0.5;   // left edge centered на годе
    const widthPx = widthYears * state.pxPerYear + 1; // +1 чтобы right edge тоже centered

    const block = document.createElement('div');
    if (widthYears <= 0) {
      // Однолетнее точечное событие — 1px (плюс +1 уже в widthPx)
      block.className = 'event event--less-than-year';
    } else if (widthYears <= 1) {
      block.className = 'event event--one-year';
      block.style.width = widthPx + 'px';
    } else {
      block.className = 'event event--several-years';
      block.style.width = widthPx + 'px';
    }
    block.style.left = xLeft + 'px';
    block.style.top = '31px';
    block.style.height = 'calc(100% - 31px)';
    block.dataset.eventId = ev.id;

    // Caption: название события, появляется при hover
    if (ev.name) {
      const caption = document.createElement('span');
      caption.className = 'event__caption';
      caption.textContent = ev.name;
      block.appendChild(caption);
    }
    el.appendChild(block);
  }

  // 4. Линии жизни, имена, точки событий.
  // Вертикальные позиции — равномерно по доступной высоте.
  // clientHeight = текущая высота Timeflow (canvas__timeflow-area).
  const H = el.clientHeight || 600;

  // Если контент людей шире viewport (scroll по вертикали), увеличиваем
  // min-height .timeflow до этого нужного значения. Это влияет на
  // events.height = calc(100% - 31px) — они тоже растягиваются до низа
  // фактического контента, а не только до visible viewport.
  // Сортируем по категории (см. CATEGORY_ORDER), внутри категории сохраняем
  // относительный порядок входа (стабильно — для предсказуемости вывода).
  const sortedPeople = [...people].sort((a, b) =>
    categoryRank(a.category) - categoryRank(b.category)
  );
  const rowYs = distributeRows(sortedPeople.length, H);

  // Полная высота контента: либо viewport (если все люди влезают), либо
  // последний row + небольшой запас. Применяем как min-height — events
  // через calc(100% - 31px) автоматически тянутся до низа.
  const lastRowY = rowYs.length ? rowYs[rowYs.length - 1] : 0;
  const contentH = Math.max(H, lastRowY + 10);
  el.style.minHeight = contentH + 'px';

  sortedPeople.forEach((person, idx) => {
    const lifeLineTop = rowYs[idx];           // y-координата самой линии
    const top         = lifeLineTop - NAME_TO_LINE_GAP;  // y имени = выше линии
    const cat         = CATEGORY_CLASS[person.category] || 'artist';

    // Линия жизни — обрезаем по диапазону viewport-координат
    const visibleBorn = Math.max(person.born, state.startYear);
    const visibleDied = Math.min(person.died, state.endYear);
    if (visibleDied <= visibleBorn) return;

    const lineLeft  = yearToX(visibleBorn, state);
    const lineWidth = (visibleDied - visibleBorn) * state.pxPerYear;

    const line = document.createElement('div');
    line.className = 'life-line life-line--' + cat;
    line.style.left  = lineLeft + 'px';
    line.style.top   = lifeLineTop + 'px';
    line.style.width = lineWidth + 'px';
    line.dataset.personId = person.id;
    el.appendChild(line);

    // Имя — sticky (см. updateStickyNames). По умолчанию ставим на координате
    // born; updateStickyNames пересчитает на scroll/resize согласно правилам.
    const bornXFull = yearToX(person.born, state);
    const diedXFull = yearToX(person.died, state);
    const name = document.createElement('div');
    name.className = 'timeflow__name timeflow__name--' + cat;
    name.style.top = top + 'px';
    name.style.left = bornXFull + 'px';
    name.textContent = person.name;
    name.dataset.personId = person.id;
    name.dataset.bornX = bornXFull;
    name.dataset.diedX = diedXFull;
    // Стрелка-индикатор «там линия» (сглаженные углы 2px через SVG).
    // По умолчанию скрыта; видна только в --stuck-left/--stuck-right.
    const arrow = document.createElement('span');
    arrow.className = 'timeflow__name-arrow';
    arrow.innerHTML =
      '<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg"' +
      ' fill="currentColor" stroke="currentColor" stroke-width="4"' +
      ' stroke-linejoin="round">' +
      '<polygon points="3,3 7,5 3,7"/>' +
      '</svg>';
    name.appendChild(arrow);
    el.appendChild(name);

    // Точки событий — для каждого события в диапазоне
    (person.events || []).forEach(ev => {
      if (ev.year < state.startYear || ev.year > state.endYear) return;
      const dot = document.createElement('span');
      dot.className = 'event-dot event-dot--' + cat;
      // Box event-dot 11×11; center должен лечь на center life-line (lifeLineTop+1.5).
      // top = lifeLineTop + 1.5 - 5.5 = lifeLineTop - 4.
      dot.style.left = (yearToX(ev.year, state) - 5) + 'px';  // -5 = центр относительно box 11
      dot.style.top  = (lifeLineTop - 4) + 'px';
      dot.dataset.personId  = person.id;
      dot.dataset.eventYear = ev.year;
      dot.dataset.eventTitle = ev.title || '';
      dot.dataset.category   = cat;
      el.appendChild(dot);
    });
  });

  // 5. Default-connections: видны всегда, пока обе связанные точки в DOM.
  renderDefaultConnections(el, state, sortedPeople, rowYs);
}

/** Рисует все уникальные default-connection между парами видимых людей,
 *  у которых есть взаимная связь и event у обоих в один и тот же год.
 *  Уникальный ключ хранится в data-key для последующей подсветки на hover. */
function renderDefaultConnections(el, state, sortedPeople, rowYs) {
  const idToIdx = new Map(sortedPeople.map((p, i) => [p.id, i]));
  const drawn = new Set();

  sortedPeople.forEach((personA, idxA) => {
    const yA = rowYs[idxA];
    const catA = CATEGORY_CLASS[personA.category] || 'artist';
    const eventsA = personA.events || [];

    (personA.connections || []).forEach(conn => {
      const idxB = idToIdx.get(conn.personId);
      if (idxB == null) return;          // B не виден на Timeflow
      const personB = sortedPeople[idxB];
      if (idxB === idxA) return;

      // Условие связи (Вариант 3): у обоих есть event на тот же год.
      const evA = eventsA.find(e => e.year === conn.year);
      const evB = (personB.events || []).find(e => e.year === conn.year);
      if (!evA || !evB) return;

      // Уникальный ключ — отсортированная пара id + год.
      const [iA, iB] = [personA.id, personB.id].sort();
      const key = `${iA}|${iB}|${conn.year}`;
      if (drawn.has(key)) return;
      drawn.add(key);

      const yB = rowYs[idxB];
      const catB = CATEGORY_CLASS[personB.category] || 'artist';
      // Линия — прямая вертикальная по центру точек. CSS transform:
      // translateX(-50%) на .connection центрирует её относительно left.
      // Отступ CONN_EXIT_OFFSET по вертикали оставлен — линия не лезет
      // в сам круг точки (а раньше использовался ещё и горизонтально для
      // дугообразной SVG-линии под 45°).
      const x = yearToX(conn.year, state);
      const top = Math.min(yA, yB) + CONN_EXIT_OFFSET;
      const height = Math.abs(yA - yB) - 2 * CONN_EXIT_OFFSET;
      const topCat    = (yA <= yB) ? catA : catB;
      const bottomCat = (yA <= yB) ? catB : catA;

      el.appendChild(makeConnectionEl({
        x, top, height, key, topCat, bottomCat,
      }));
    });
  });
}

/** Создаёт connection — вертикальную линию gradient (top color → bottom).
 *  По умолчанию 1px; при hover становится 3px (см. connection.css). */
function makeConnectionEl({ x, top, height, key, topCat, bottomCat, hovered = false }) {
  const el = document.createElement('div');
  el.className = 'connection' + (hovered ? ' connection--hovered' : '');
  el.style.left   = x + 'px';
  el.style.top    = top + 'px';
  el.style.height = height + 'px';
  el.style.setProperty('--conn-top',    `var(--surface-person-${topCat})`);
  el.style.setProperty('--conn-bottom', `var(--surface-person-${bottomCat})`);
  if (key) el.dataset.connKey = key;
  return el;
}

/* ===== Hover на event-dot — показывает event-caption =====
 * См. MAIN_SCREEN.md → "Hover на event-dot".
 *
 * По умолчанию caption справа-сверху от точки. Если уезжает за правый
 * край viewport ИЛИ перекрывает имя — переключаем на слева-сверху. */

// caption приклеивается к hovered-точке (15×15, радиус 7.5):
//   caption.bottom == top edge of hovered dot      → caption.top = dotCy - 7.5 - ch
//   caption.left   == right edge of hovered dot    → caption.left = dotCx + 7.5
// (см. MAIN_SCREEN.md → Hover на event-dot.)
const HOVERED_RADIUS = 7.5;
const DOT_HALF       = 5.5; // половина box event-dot (11×11) — центр в боксе

// Точка выхода connection из event-dot — её угол по диагонали "левый-нижний →
// правый-верхний", т.е. на R/√2 от центра. R = 4.5 (default visible radius).
// См. MAIN_SCREEN.md → Connections → Точки выхода/входа.
const CONN_EXIT_OFFSET = 4.5 / Math.SQRT2;   // ≈ 3.18

// Шаг между двумя соседними sticky-Б на одной стороне (см. MAIN_SCREEN.md →
// Несколько sticky-имён): 14 (font 14, line-height 1) + 2px gap = 16.
const STICKY_STEP = 16;

function rectsOverlap(a, b) {
  return !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
}

function showCaption(timeflowEl, dot) {
  // Не дублируем
  if (timeflowEl.querySelector('.event-caption.is-hover-caption')) return;

  const title = dot.dataset.eventTitle;
  const cat   = dot.dataset.category || 'artist';
  if (!title) return;

  const caption = document.createElement('span');
  caption.className = `event-caption event-caption--${cat} event-caption--right is-hover-caption`;
  caption.textContent = title;
  caption.style.position = 'absolute';
  caption.style.visibility = 'hidden';   // скроем для измерения
  timeflowEl.appendChild(caption);

  const dotLeft = parseFloat(dot.style.left);
  const dotTop  = parseFloat(dot.style.top);
  const dotCx   = dotLeft + DOT_HALF;
  const dotCy   = dotTop  + DOT_HALF;
  const cw      = caption.offsetWidth;
  const ch      = caption.offsetHeight;

  // Position: right-top по умолчанию
  // caption.left == правый край hovered-dot (= dotCx + 7.5)
  // caption.bottom == верхний край hovered-dot (= dotCy - 7.5)
  const rightLeft = dotCx + HOVERED_RADIUS;
  const topPx     = dotCy - HOVERED_RADIUS - ch;

  // Проверка 1: уходит за правый край видимой области
  const scrollEl = document.getElementById('canvas-scroll');
  const scrollRect = scrollEl.getBoundingClientRect();
  const dotScreenLeft = dot.getBoundingClientRect().left;
  const captionRightEdge = dotScreenLeft + DOT_HALF + HOVERED_RADIUS + cw;
  let useLeft = captionRightEdge > scrollRect.right;

  // Проверка 2: перекрывает имена
  if (!useLeft) {
    const tentativeRect = {
      left: rightLeft, top: topPx, right: rightLeft + cw, bottom: topPx + ch,
    };
    const names = timeflowEl.querySelectorAll('.timeflow__name');
    for (const n of names) {
      const nLeft = parseFloat(n.style.left);
      const nTop  = parseFloat(n.style.top);
      const nRect = {
        left: nLeft, top: nTop,
        right: nLeft + n.offsetWidth, bottom: nTop + n.offsetHeight,
      };
      if (rectsOverlap(tentativeRect, nRect)) { useLeft = true; break; }
    }
  }

  if (useLeft) {
    caption.classList.replace('event-caption--right', 'event-caption--left');
    // caption.right == левый край hovered-dot (= dotCx - 7.5)
    caption.style.left = (dotCx - HOVERED_RADIUS - cw) + 'px';
  } else {
    caption.style.left = rightLeft + 'px';
  }
  caption.style.top = topPx + 'px';
  caption.style.visibility = 'visible';

  // Подавляем persistent-метки веков, которые перекрылись новой caption.
  suppressOverlappingPersistent(timeflowEl, caption);
}

/** Скрывает persistent caption'ы (метки веков), которые сейчас визуально
 *  перекрываются hover-caption-ом. Снимается в hideCaption. */
function suppressOverlappingPersistent(timeflowEl, hoverCaption) {
  const hRect = hoverCaption.getBoundingClientRect();
  const persistents = timeflowEl.querySelectorAll('.event__caption--persistent');
  persistents.forEach(p => {
    const pRect = p.getBoundingClientRect();
    if (!(hRect.right <= pRect.left || pRect.right <= hRect.left ||
          hRect.bottom <= pRect.top || pRect.bottom <= hRect.top)) {
      p.classList.add('is-suppressed');
    }
  });
}

function hideCaption(timeflowEl) {
  const c = timeflowEl.querySelector('.event-caption.is-hover-caption');
  if (c) c.remove();
  // Возвращаем persistent caption'ы на место
  timeflowEl.querySelectorAll('.event__caption--persistent.is-suppressed')
            .forEach(p => p.classList.remove('is-suppressed'));
}

/** Подключает делегированные обработчики hover на event-dot.
 * Вызывается один раз при инициализации.
 *
 * Hover на event-dot триггерит:
 *  - caption (event-caption);
 *  - connections (если у события есть связанный человек);
 *  - hovered-state у life-line, которой принадлежит точка (см.
 *    styles/components/life-line.css → .life-line--hovered). */
export function attachHoverCaptions(timeflowEl, getData, getState) {
  timeflowEl.addEventListener('mouseover', (e) => {
    const dot = e.target.closest('.event-dot');
    if (!dot || dot.classList.contains('is-sticky-dot')) return;
    showCaption(timeflowEl, dot);
    showConnectionsFor(timeflowEl, dot, getData(), getState());
    setLifeLineHovered(timeflowEl, dot.dataset.personId, true);
  });
  timeflowEl.addEventListener('mouseout', (e) => {
    const dot = e.target.closest('.event-dot');
    if (!dot || dot.classList.contains('is-sticky-dot')) return;
    const related = e.relatedTarget;
    if (related && dot.contains(related)) return;
    hideCaption(timeflowEl);
    hideConnections(timeflowEl);
    setLifeLineHovered(timeflowEl, dot.dataset.personId, false);
  });
}

/** Тогглим класс .life-line--hovered у линии этого человека. */
function setLifeLineHovered(timeflowEl, personId, on) {
  if (!personId) return;
  const line = timeflowEl.querySelector(`.life-line[data-person-id="${personId}"]`);
  if (line) line.classList.toggle('life-line--hovered', on);
}

/* ===== Connections (см. MAIN_SCREEN.md → Connections) ===== */

/** Показать связи для hovered точки А в год Y:
 *  ищем personA.connections с year=Y и видимыми personB; рисуем gradient-линии,
 *  включаем hover у dot B и caption у dot B. Если B вертикально вне viewport —
 *  создаём sticky-ghost у края Timeflow и тянем линию туда. */
function showConnectionsFor(timeflowEl, dotA, data, state) {
  const personId = dotA.dataset.personId;
  const yearStr  = dotA.dataset.eventYear;
  if (!personId || !yearStr) return;
  const year = +yearStr;

  const personA = data.people.find(p => p.id === personId);
  if (!personA) return;

  const conns = (personA.connections || []).filter(c => c.year === year);
  if (!conns.length) return;

  const scrollArea = timeflowEl.parentElement;          // .canvas__timeflow-area
  const scrollTop  = scrollArea.scrollTop;
  const visTop     = scrollTop;
  const visBottom  = scrollTop + scrollArea.clientHeight;

  const dotA_x = parseFloat(dotA.style.left) + DOT_HALF;
  const dotA_y = parseFloat(dotA.style.top)  + DOT_HALF;
  const catA   = dotA.dataset.category || 'artist';

  // Счётчики, чтобы при нескольких связанных Б за одним краем имена не
  // накладывались — каждый следующий ghost сдвигается на STICKY_STEP.
  let topStickyIdx = 0;
  let botStickyIdx = 0;

  for (const conn of conns) {
    const personB = data.people.find(p => p.id === conn.personId);
    if (!personB || !state.peopleIds.includes(personB.id)) continue;

    const dotB = timeflowEl.querySelector(
      `.event-dot[data-person-id="${personB.id}"][data-event-year="${year}"]`
    );
    if (!dotB) continue;

    const dotB_x_actual = parseFloat(dotB.style.left) + DOT_HALF;
    const dotB_y_actual = parseFloat(dotB.style.top)  + DOT_HALF;
    const catB = dotB.dataset.category || 'artist';

    // Уникальный ключ существующей default-connection (если оба видимы вертикально)
    const [iA, iB] = [personId, personB.id].sort();
    const key = `${iA}|${iB}|${year}`;

    if (dotB_y_actual >= visTop && dotB_y_actual <= visBottom) {
      // B в viewport — подсветить существующую default-connection в gradient
      const existing = timeflowEl.querySelector(
        `.connection[data-conn-key="${key}"]`
      );
      if (existing) existing.classList.add('connection--hovered');
      dotB.classList.add('event-dot--hovered');
      showCaption(timeflowEl, dotB);
    } else {
      // B вертикально вне viewport → sticky-ghost у края + ghost gradient-connection.
      // Если уже есть sticky'и за тем же краем — сдвигаем следующий на STICKY_STEP.
      const stickToTop = dotB_y_actual < visTop;
      const dotB_y = stickToTop
        ? (visTop + DOT_HALF + 2 + topStickyIdx * STICKY_STEP)
        : (visBottom - DOT_HALF - 2 - botStickyIdx * STICKY_STEP);
      if (stickToTop) topStickyIdx++; else botStickyIdx++;

      const ghost = createStickyEndpoint(timeflowEl, personB, year, dotB_x_actual, dotB_y, catB);

      // Connection начинается из угла верхней точки, заканчивается в углу нижней.
      const yTop = Math.min(dotA_y, dotB_y) + CONN_EXIT_OFFSET;
      const yBot = Math.max(dotA_y, dotB_y) - CONN_EXIT_OFFSET;
      const topCat    = (dotA_y <= dotB_y) ? catA : catB;
      const bottomCat = (dotA_y <= dotB_y) ? catB : catA;
      const ghostConn = makeConnectionEl({
        x: dotA_x,
        top: yTop, height: yBot - yTop,
        key: null, topCat, bottomCat, hovered: true,
      });
      ghostConn.classList.add('is-ghost-connection');
      timeflowEl.appendChild(ghostConn);

      ghost.classList.add('event-dot--hovered');
      showCaption(timeflowEl, ghost);
    }
  }
}

function hideConnections(timeflowEl) {
  // Снять hovered с подсвеченных default-connection
  timeflowEl.querySelectorAll('.connection.connection--hovered:not(.is-ghost-connection)')
    .forEach(c => c.classList.remove('connection--hovered'));
  // Удалить ghost-connection (созданные при sticky-Б)
  timeflowEl.querySelectorAll('.connection.is-ghost-connection').forEach(c => c.remove());
  // Снять hovered с не-актуальных dot'ов
  timeflowEl.querySelectorAll('.event-dot.event-dot--hovered:not(:hover)')
    .forEach(d => d.classList.remove('event-dot--hovered'));
  // Удалить sticky-ghost endpoints
  timeflowEl.querySelectorAll('.is-sticky-dot, .is-sticky-name')
    .forEach(e => e.remove());
}

/** Создаёт ghost dot + ghost name у края Timeflow для sticky-Б.
 *  year — год связи (для подбора title события у B).
 *  Имя — СЛЕВА от точки на расстоянии 4px (см. MAIN_SCREEN.md → sticky-Б). */
function createStickyEndpoint(timeflowEl, personB, year, x, y, catB) {
  const ghost = document.createElement('span');
  ghost.className = `event-dot event-dot--${catB} is-sticky-dot`;
  ghost.style.position = 'absolute';
  ghost.style.left = (x - DOT_HALF) + 'px';
  ghost.style.top  = (y - DOT_HALF) + 'px';
  const ev = (personB.events || []).find(e => e.year === year);
  ghost.dataset.eventTitle = ev ? (ev.title || '') : '';
  ghost.dataset.category   = catB;
  timeflowEl.appendChild(ghost);

  const ghostName = document.createElement('div');
  ghostName.className = `timeflow__name timeflow__name--${catB} is-sticky-name`;
  // Имя центрировано по вертикали с точкой (font 14, line-height 1).
  ghostName.style.top = (y - 7) + 'px';
  // Сначала ставим за пределами видимости, чтобы измерить ширину
  ghostName.style.left = '-9999px';
  ghostName.textContent = personB.name;
  timeflowEl.appendChild(ghostName);

  // Слева от точки на 4px: name.right = ghost.left - 4
  // ghost.left визуально = x - DOT_HALF; name.right = name.left + nameWidth.
  // → name.left = (x - DOT_HALF) - 4 - nameWidth.
  const nameWidth = ghostName.offsetWidth;
  ghostName.style.left = ((x - DOT_HALF) - 4 - nameWidth) + 'px';

  return ghost;
}

/** Sticky-имена: пересчитывает позицию каждого `.timeflow__name` на основе
 * текущего scrollLeft и ширины viewport.
 *
 * Три случая по MAIN_SCREEN.md → "Имена на линиях жизни":
 * 1. born виден → left = bornX, без стрелки.
 * 2. Линия пересекает viewport, born уехал за край → имя приклеено к
 *    видимому концу линии, без стрелки.
 * 3. Линия полностью за viewport → имя у края + стрелка в сторону линии. */
export function updateStickyNames(el, scrollLeft, viewportPx) {
  const names = el.querySelectorAll('.timeflow__name');
  const viewLeft  = scrollLeft;
  const viewRight = scrollLeft + viewportPx;
  const PAD = 4;

  names.forEach(name => {
    const bornX = parseFloat(name.dataset.bornX);
    const diedX = parseFloat(name.dataset.diedX);
    if (Number.isNaN(bornX) || Number.isNaN(diedX)) return;

    let stuckClass = null;       // null | 'left' | 'right'
    let leftPx;

    if (bornX >= viewLeft && bornX <= viewRight) {
      // Случай 1 — born в viewport
      leftPx = bornX;
    } else if (bornX < viewLeft && diedX > viewLeft) {
      // Случай 2 — линия пересекает, born ушёл влево
      leftPx = viewLeft + PAD;
    } else if (bornX > viewRight && diedX > viewRight) {
      // Линия полностью справа от viewport (born и died правее) → стрелка вправо
      stuckClass = 'right';
      leftPx = viewRight - name.offsetWidth - PAD;
    } else if (diedX < viewLeft) {
      // Линия полностью слева → стрелка влево
      stuckClass = 'left';
      leftPx = viewLeft + PAD;
    } else {
      // Все остальные случаи (линия пересекает с правого края — born внутри,
      // died справа) — имя на born без стрелки
      leftPx = bornX;
    }

    name.style.left = leftPx + 'px';
    name.classList.toggle('timeflow__name--stuck-left',  stuckClass === 'left');
    name.classList.toggle('timeflow__name--stuck-right', stuckClass === 'right');
  });
}
