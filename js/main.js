/* Главная точка входа Past Simple. См. MAIN_SCREEN.md для смысла и поведения.
 *
 * Архитектура:
 * - applyState(): полный рендер всех частей (Timeflow, Year scale, Timeline-mini).
 * - syncDynamic(): пересчёт динамических вещей на каждый scroll/resize:
 *     - focus в timeline-mini,
 *     - sticky-имена.
 * - resize: ещё и applyState() — потому что меняется H, и линии должны
 *           перераспределиться. */

import { renderTimeflow, updateStickyNames, attachHoverCaptions } from './timeflow.js';
import { renderYearScale, yearAtX, setHoveredYear } from './year-scale.js';
import { renderTimelineMini, updateFocus } from './timeline-mini.js';
import { initZoom, scrollLeftToKeepCenter } from './zoom.js';
import { initSidebar } from './sidebar.js';
import { openPopup, closePopup, openAboutPopup } from './popup.js';

const STATE = {
  startYear: 1850,
  endYear:   1950,
  pxPerYear: 40,
  peopleIds: [],
  /** Какая группа сейчас раскрыта в Sidebar — null или ключ группы
   *  (`__events__` или ключ категории). Только одна. */
  openSidebarKey: null,
  /** Включённые мировые события (рендерятся на Timeflow). */
  selectedEventIds: new Set(),
};

const RANDOM_COUNT = 10;
const STORAGE_PEOPLE_KEY = 'past-simple:selected-people';
const DEFAULT_CENTER_YEAR = 1900;   // разделитель XIX/XX, по центру при load.
let DATA = null;

async function loadData() {
  const [people, events] = await Promise.all([
    fetch('/data/people.json').then(r => r.json()),
    fetch('/data/events.json').then(r => r.json()),
  ]);
  return { people, events };
}

function pickRandomPeople(people, count, state) {
  const candidates = people.filter(p =>
    p.died >= state.startYear && p.born <= state.endYear
  );
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(p => p.id);
}

/** Восстанавливает выбор людей из localStorage. Возвращает null если
 *  сохранения нет, формат битый или пустой массив. */
function loadSelectedPeople() {
  try {
    const json = localStorage.getItem(STORAGE_PEOPLE_KEY);
    if (!json) return null;
    const arr = JSON.parse(json);
    if (!Array.isArray(arr) || !arr.length) return null;
    return arr.filter(id => typeof id === 'string');
  } catch {
    return null;
  }
}

/** Сохраняет текущий STATE.peopleIds в localStorage. Вызывается из
 *  sidebar handlers после каждого изменения списка. */
function saveSelectedPeople() {
  try {
    localStorage.setItem(STORAGE_PEOPLE_KEY, JSON.stringify(STATE.peopleIds));
  } catch {}
}

/** Скроллит главный horizontal scroll так, чтобы заданный год оказался
 *  в центре viewport. Вызывается один раз при init. */
function scrollToCenter(year) {
  const scrollEl = document.getElementById('canvas-scroll');
  const yearX = (year - STATE.startYear) * STATE.pxPerYear;
  const targetLeft = yearX - scrollEl.clientWidth / 2;
  scrollEl.scrollLeft = Math.max(0, targetLeft);
}

/** Показывает scroll-hint только когда есть вертикальный скролл по людям
 *  (timeflowArea.scrollHeight > clientHeight). Вызывается из applyState
 *  и из resize. */
function updateScrollHint() {
  const hintEl = document.getElementById('scroll-hint');
  const timeflowArea = document.querySelector('.canvas__timeflow-area');
  if (!hintEl || !timeflowArea) return;
  const hasVertical = timeflowArea.scrollHeight > timeflowArea.clientHeight + 1;
  hintEl.toggleAttribute('hidden', !hasVertical);
}

/** Полный рендер. Вызывается при инициализации, изменении state, resize. */
function applyState() {
  const innerEl     = document.getElementById('canvas-inner');
  const yearInnerEl = document.getElementById('canvas-year-inner');
  const totalWidth  = (STATE.endYear - STATE.startYear) * STATE.pxPerYear + 'px';
  innerEl.style.width     = totalWidth;
  yearInnerEl.style.width = totalWidth;

  const visiblePeople = DATA.people.filter(p => STATE.peopleIds.includes(p.id));
  const visibleEvents = DATA.events.filter(e => STATE.selectedEventIds.has(e.id));

  renderTimeflow(
    document.getElementById('timeflow'),
    STATE,
    visiblePeople,
    visibleEvents,
  );
  renderYearScale(
    document.getElementById('year-scale'),
    STATE,
  );

  syncDynamic();
}

/** Пересчёт динамических вещей: focus в timeline-mini, sticky-имена,
 *  синхронизация Timeflow с главным scroll-контейнером (через transform
 *  на canvas-inner). Вызывается на scroll/resize.
 *
 *  Главный horizontal scroll сейчас в bottom-bar (#canvas-scroll);
 *  timeflow-pane — overflow: hidden, движется через transform. */
function syncDynamic() {
  const scrollEl   = document.getElementById('canvas-scroll');
  const innerEl    = document.getElementById('canvas-inner');
  const timeflow   = document.getElementById('timeflow');
  const scrollLeft = scrollEl.scrollLeft;
  const viewportPx = scrollEl.clientWidth;

  innerEl.style.transform = `translateX(${-scrollLeft}px)`;

  updateFocus(STATE, scrollLeft, viewportPx);
  updateStickyNames(timeflow, scrollLeft, viewportPx);
  syncCurrentYear(scrollLeft);
  updateScrollHint();
}

/** При scroll/resize/zoom двигаем current-year линию (если она видна).
 *  Year хранится в dataset.year, новая viewport-x = yearX - scrollLeft. */
function syncCurrentYear(scrollLeft) {
  const cy = document.getElementById('current-year');
  if (!cy || cy.hasAttribute('hidden')) return;
  const y = +cy.dataset.year;
  if (!y) return;
  const yearX = (y - STATE.startYear) * STATE.pxPerYear;
  cy.style.transform = `translateX(${yearX - scrollLeft}px)`;
}

/** Wheel events на timeflow-pane.
 *
 *  Pane имеет overflow: hidden, нативный wheel-скролл не сработает —
 *  обрабатываем сами и решаем, куда направить:
 *
 *  - **Shift зажат** → vertical scroll в timeflow-area (по высоте людей).
 *  - **deltaX ≠ 0** (трекпад двумя пальцами в сторону) → horizontal scroll;
 *    deltaY в этом же событии оставляем браузеру (нативный vertical
 *    scroll timeflow-area).
 *  - **только deltaY**:
 *      - **Мышь** (дискретное колесо, deltaMode > 0 или |dy| ≥ 50 и целое)
 *        → перенаправляем в horizontal (default на этом сайте).
 *      - **Трекпад** вертикально (маленькие/дробные значения) → оставляем
 *        браузеру (нативный vertical scroll timeflow-area). */
function setupWheel() {
  const paneEl   = document.querySelector('.canvas__pane');
  const scrollEl = document.getElementById('canvas-scroll');

  paneEl.addEventListener('wheel', (e) => {
    if (e.deltaX === 0 && e.deltaY === 0) return;

    // Shift+scroll → vertical в timeflow-area (для людей, когда их много).
    if (e.shiftKey) {
      const timeflowArea = e.target.closest('.canvas__timeflow-area');
      if (timeflowArea) {
        e.preventDefault();
        timeflowArea.scrollTop += (e.deltaY || e.deltaX);
      }
      return;
    }

    // Трекпад двумя пальцами в сторону: deltaX уже есть. Нативный
    // scroll не сработает (pane overflow: hidden) — двигаем сами.
    if (e.deltaX !== 0) {
      e.preventDefault();
      scrollEl.scrollLeft += e.deltaX;
      return;
    }

    // Только deltaY. Отличаем мышь от трекпада: мышь даёт дискретные
    // большие целые значения (типично кратные 100/120) или deltaMode > 0
    // (line/page mode). Трекпад — маленькие/дробные пиксельные значения.
    const isMouseWheel = e.deltaMode > 0 ||
                         (Math.abs(e.deltaY) >= 50 && Number.isInteger(e.deltaY));

    if (isMouseWheel) {
      // Мышь: deltaY → horizontal scroll (default behavior).
      e.preventDefault();
      scrollEl.scrollLeft += e.deltaY;
    }
    // Трекпад vertical → не preventDefault'им, браузер сам скроллит
    // timeflow-area нативно (overflow-y: auto на ней).
  }, { passive: false });
}

function setupPopup() {
  const overlayEl  = document.getElementById('popup-overlay');
  const backdropEl = document.getElementById('popup-backdrop');
  const timeflow   = document.getElementById('timeflow');
  const infoBtn    = document.querySelector('.header__info');

  // Click на event-dot → openPopup
  timeflow.addEventListener('click', (e) => {
    const dot = e.target.closest('.event-dot');
    if (!dot || dot.classList.contains('is-sticky-dot')) return;
    const personId = dot.dataset.personId;
    const year     = +dot.dataset.eventYear;
    if (!personId || !year) return;
    openPopup(overlayEl, backdropEl, STATE, DATA, personId, year);
  });

  // Click на кнопку «i» в шапке → about-попап (та же шторка, другой контент).
  infoBtn?.addEventListener('click', () => {
    openAboutPopup(overlayEl, backdropEl);
  });

  // Esc → closePopup
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePopup(overlayEl, backdropEl);
  });

  // Click по затемняющему backdrop'у (= видимая часть main screen слева
  // от попапа) → close.
  backdropEl.addEventListener('click', () => closePopup(overlayEl, backdropEl));
}

function initYearHover() {
  const innerEl       = document.getElementById('canvas-inner');
  const yearInnerEl   = document.getElementById('canvas-year-inner');
  const yearScaleEl   = document.getElementById('year-scale');
  const currentYearEl = document.getElementById('current-year');
  const timeflowEl    = document.getElementById('timeflow');
  let hovered = null;

  // Координата xInside в "содержательной" coord-системе (та же что и yearToX):
  // canvas-inner и canvas-year-inner всегда смещены вместе (одинаковый width;
  // year-inner двигается через translateX = -scrollLeft, что эквивалентно
  // одной системе координат).
  function onMove(refEl) {
    return (e) => {
      const rect = refEl.getBoundingClientRect();
      const xInside = e.clientX - rect.left;
      const y = yearAtX(xInside, STATE);
      if (y < STATE.startYear || y > STATE.endYear) return;
      if (y !== hovered) {
        setHoveredYear(yearScaleEl, hovered, y);
        hovered = y;
        updateCurrentYear(currentYearEl, timeflowEl, y);
      }
    };
  }

  function onLeave() {
    setHoveredYear(yearScaleEl, hovered, null);
    hovered = null;
    currentYearEl.setAttribute('hidden', '');
  }

  innerEl.addEventListener('mousemove', onMove(innerEl));
  innerEl.addEventListener('mouseleave', onLeave);
  // Year scale теперь вне canvas-inner (см. main-screen.css → .canvas__bottom-bar) —
  // вешаем отдельный listener, чтобы hover на полосу лет тоже подсвечивал год.
  yearInnerEl.addEventListener('mousemove', onMove(yearInnerEl));
  yearInnerEl.addEventListener('mouseleave', onLeave);

  // Vertical scroll внутри timeflow-area (когда людей много) — пересчитать
  // позиции age-labels у current-year. Horizontal scroll обработан в
  // syncDynamic → syncCurrentYear, который уже двигает translateX линии.
  const timeflowArea = timeflowEl.parentElement;  // .canvas__timeflow-area
  timeflowArea.addEventListener('scroll', () => {
    if (currentYearEl.hasAttribute('hidden')) return;
    const y = +currentYearEl.dataset.year;
    if (!y) return;
    updateCurrentYear(currentYearEl, timeflowEl, y);
  });
}

/** Обновляет вертикальную линию current-year и возрасты людей в местах,
 *  где она пересекает их life-line.
 *
 *  - Линия двигается через translateX = (yearX - scrollLeft) — viewport-x.
 *  - Возраст показываем только если born ≤ year ≤ died и life-line видна
 *    в текущем vertical viewport (с учётом scroll по высоте).
 *  - Русское склонение: 1 год / 2-4 года / 5+ лет (с учётом 11-14 → лет). */
function updateCurrentYear(currentYearEl, timeflowEl, year) {
  const scrollEl     = document.getElementById('canvas-scroll');
  const timeflowArea = timeflowEl.parentElement;  // .canvas__timeflow-area
  const yearX        = (year - STATE.startYear) * STATE.pxPerYear;
  const viewportX    = yearX - scrollEl.scrollLeft;

  currentYearEl.style.transform = `translateX(${viewportX}px)`;
  currentYearEl.dataset.year = String(year);
  currentYearEl.removeAttribute('hidden');

  // Удаляем предыдущие age-labels, оставляем только .current-year__line.
  for (const node of [...currentYearEl.querySelectorAll('.current-year__age')]) {
    node.remove();
  }

  const scrollTop  = timeflowArea.scrollTop;
  const visTop     = scrollTop;
  const visBottom  = scrollTop + timeflowArea.clientHeight;

  for (const personId of STATE.peopleIds) {
    const person = DATA.people.find(p => p.id === personId);
    if (!person) continue;
    if (year < person.born || year > person.died) continue;

    const line = timeflowEl.querySelector(`.life-line[data-person-id="${personId}"]`);
    if (!line) continue;

    const lifeLineTop = parseFloat(line.style.top);
    if (Number.isNaN(lifeLineTop)) continue;

    // Показываем только если life-line видна в vertical viewport.
    if (lifeLineTop < visTop || lifeLineTop > visBottom) continue;

    const age = year - person.born;
    const label = document.createElement('div');
    label.className = 'current-year__age';
    label.dataset.personId = personId;
    // Если life-line этого человека уже в hovered (курсор над event-dot
    // этого же человека) — сразу применяем подсветку возраста.
    if (line.classList.contains('life-line--hovered')) {
      label.classList.add('current-year__age--hovered');
    }
    label.textContent = formatAge(age);
    // Координаты current-year относительно canvas (родитель). Y ось:
    //   life-line.style.top — в координатах canvas-inner (timeflow-area).
    //   В canvas координатах = lifeLineTop - timeflowArea.scrollTop
    //     (с учётом vertical scroll людей).
    //   "Выше life-line на 4px" + line-height ~14 → top = visibleTop - 4 - 14.
    const visibleY = lifeLineTop - scrollTop;
    label.style.top = (visibleY - 4 - 14) + 'px';
    currentYearEl.appendChild(label);
  }
}

/** Возраст в годах с русским склонением: 1 год / 2-4 года / 5+ лет.
 *  Учитывает «лет» для 11-14 (11 лет, не «11 год»). */
function formatAge(n) {
  const mod10  = n % 10;
  const mod100 = n % 100;
  let word;
  if (mod10 === 1 && mod100 !== 11)                          word = 'год';
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) word = 'года';
  else                                                        word = 'лет';
  return `${n} ${word}`;
}

/** Sidebar: динамический рендер групп + одна открытая группа за раз. */
function setupSidebar() {
  const sidebarEl = document.getElementById('sidebar');
  const burger    = document.getElementById('burger');

  const sb = initSidebar(
    sidebarEl,
    () => DATA,
    () => STATE.openSidebarKey,
    {
      onClose: () => {
        sidebarEl.classList.remove('is-open');
        document.querySelector('.main-canvas').classList.remove('main-canvas--shifted');
      },
      onToggleGroup: (key) => {
        STATE.openSidebarKey = (STATE.openSidebarKey === key) ? null : key;
        sb.render();
      },
      isPersonSelected: (id) => STATE.peopleIds.includes(id),
      onTogglePerson: (id) => {
        const i = STATE.peopleIds.indexOf(id);
        if (i >= 0) STATE.peopleIds.splice(i, 1);
        else STATE.peopleIds.push(id);
        saveSelectedPeople();
        sb.render();
        applyState();
      },
      isEventSelected: (id) => STATE.selectedEventIds.has(id),
      onToggleEvent: (id) => {
        if (STATE.selectedEventIds.has(id)) STATE.selectedEventIds.delete(id);
        else STATE.selectedEventIds.add(id);
        sb.render();
        applyState();
      },
      onToggleAllPeople: (ids, turnOn) => {
        if (turnOn) {
          for (const id of ids) {
            if (!STATE.peopleIds.includes(id)) STATE.peopleIds.push(id);
          }
        } else {
          STATE.peopleIds = STATE.peopleIds.filter(id => !ids.includes(id));
        }
        saveSelectedPeople();
        sb.render();
        applyState();
      },
      onToggleAllEvents: (ids, turnOn) => {
        for (const id of ids) {
          if (turnOn) STATE.selectedEventIds.add(id);
          else        STATE.selectedEventIds.delete(id);
        }
        sb.render();
        applyState();
      },
    },
  );
  sb.render();

  // Toggle Sidebar + push canvas вправо (см. MAIN_SCREEN.md → Sidebar)
  const mainCanvas = document.querySelector('.main-canvas');
  burger.addEventListener('click', () => {
    const open = sidebarEl.classList.toggle('is-open');
    mainCanvas.classList.toggle('main-canvas--shifted', open);
  });
}

(async () => {
  DATA = await loadData();
  // Сначала пытаемся восстановить выбор людей из localStorage (если
  // пользователь заходил раньше). Иначе — 10 рандомных.
  STATE.peopleIds = loadSelectedPeople()
                  ?? pickRandomPeople(DATA.people, RANDOM_COUNT, STATE);
  // Стартово все мировые события включены («События: все»)
  STATE.selectedEventIds = new Set(DATA.events.map(e => e.id));

  // Один раз отрисовываем структуру timeline-mini
  renderTimelineMini(document.getElementById('timeline-mini'));

  applyState();
  // Скроллим к центру XX века (1900) при первой загрузке. Дальше
  // пользователь может скроллить свободно — мы это положение не трогаем.
  scrollToCenter(DEFAULT_CENTER_YEAR);
  syncDynamic();
  setupSidebar();

  // Hover на event-dot → показ event-caption + connections (delegated)
  attachHoverCaptions(document.getElementById('timeflow'), () => DATA, () => STATE);

  // Click на event-dot → попап (см. MAIN_SCREEN.md → Popup)
  setupPopup();

  // Hover на любую точку Timeflow → подсветить соответствующий год в Year scale
  // (см. MAIN_SCREEN.md → Year scale → Hover на год).
  initYearHover();

  // Wheel events на timeflow-pane → главный horizontal scroll.
  setupWheel();

  // Zoom: +/− меняет pxPerYear по фиксированным шагам, сохраняет центр viewport
  initZoom({
    minusBtn: document.getElementById('zoom-out'),
    plusBtn:  document.getElementById('zoom-in'),
    thumbEl:  document.querySelector('.zoom__thumb'),
    getState: () => STATE,
    onChange: (newPxPerYear) => {
      const scrollEl = document.getElementById('canvas-scroll');
      const oldPxPerYear = STATE.pxPerYear;
      const newScrollLeft = scrollLeftToKeepCenter(
        STATE, oldPxPerYear, newPxPerYear, scrollEl.scrollLeft, scrollEl.clientWidth
      );
      STATE.pxPerYear = newPxPerYear;
      applyState();
      scrollEl.scrollLeft = Math.max(0, newScrollLeft);
      syncDynamic();
    },
  });

  // Scroll → пересчёт focus и sticky-имён
  document.getElementById('canvas-scroll').addEventListener('scroll', syncDynamic);

  // Resize → полный re-render (меняется H и распределение линий) + sync
  window.addEventListener('resize', applyState);

  window.__pastSimple = { state: STATE, data: DATA, applyState };
})();
