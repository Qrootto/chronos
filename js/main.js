/* Главная точка входа Chronos. См. MAIN_SCREEN.md для смысла и поведения.
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
import { openPopup, closePopup } from './popup.js';

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

/** Полный рендер. Вызывается при инициализации, изменении state, resize. */
function applyState() {
  const innerEl = document.getElementById('canvas-inner');
  innerEl.style.width = (STATE.endYear - STATE.startYear) * STATE.pxPerYear + 'px';

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

/** Пересчёт динамических вещей: focus в timeline-mini, sticky-имена.
 *  Вызывается на scroll/resize. */
function syncDynamic() {
  const scrollEl = document.getElementById('canvas-scroll');
  const timeflow = document.getElementById('timeflow');
  const scrollLeft = scrollEl.scrollLeft;
  const viewportPx = scrollEl.clientWidth;

  updateFocus(STATE, scrollLeft, viewportPx);
  updateStickyNames(timeflow, scrollLeft, viewportPx);
}

function setupPopup() {
  const overlayEl  = document.getElementById('popup-overlay');
  const backdropEl = document.getElementById('popup-backdrop');
  const timeflow   = document.getElementById('timeflow');

  // Click на event-dot → openPopup
  timeflow.addEventListener('click', (e) => {
    const dot = e.target.closest('.event-dot');
    if (!dot || dot.classList.contains('is-sticky-dot')) return;
    const personId = dot.dataset.personId;
    const year     = +dot.dataset.eventYear;
    if (!personId || !year) return;
    openPopup(overlayEl, backdropEl, STATE, DATA, personId, year);
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
  const innerEl     = document.getElementById('canvas-inner');
  const yearScaleEl = document.getElementById('year-scale');
  let hovered = null;

  innerEl.addEventListener('mousemove', (e) => {
    // x относительно canvas-inner content — это x в "содержательной"
    // координатной системе (та же что и yearToX).
    const rect = innerEl.getBoundingClientRect();
    const xInside = e.clientX - rect.left;
    const y = yearAtX(xInside, STATE);
    if (y < STATE.startYear || y > STATE.endYear) return;
    if (y !== hovered) {
      setHoveredYear(yearScaleEl, hovered, y);
      hovered = y;
    }
  });

  innerEl.addEventListener('mouseleave', () => {
    setHoveredYear(yearScaleEl, hovered, null);
    hovered = null;
  });
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
  STATE.peopleIds = pickRandomPeople(DATA.people, RANDOM_COUNT, STATE);
  // Стартово все мировые события включены («События: все»)
  STATE.selectedEventIds = new Set(DATA.events.map(e => e.id));

  // Один раз отрисовываем структуру timeline-mini
  renderTimelineMini(document.getElementById('timeline-mini'));

  applyState();
  setupSidebar();

  // Hover на event-dot → показ event-caption + connections (delegated)
  attachHoverCaptions(document.getElementById('timeflow'), () => DATA, () => STATE);

  // Click на event-dot → попап (см. MAIN_SCREEN.md → Popup)
  setupPopup();

  // Hover на любую точку Timeflow → подсветить соответствующий год в Year scale
  // (см. MAIN_SCREEN.md → Year scale → Hover на год).
  initYearHover();

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

  window.__chronos = { state: STATE, data: DATA, applyState };
})();
