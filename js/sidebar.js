/* Sidebar — фильтр людей и событий. См. MAIN_SCREEN.md → Sidebar.
 *
 * 7 групп: «События» + 6 категорий людей. Только одна группа открыта в
 * момент времени. В раскрытой группе — список чекбоксов; если он не
 * помещается, появляется внутренний скролл (через CSS flex:1 на .sidebar__list). */

const CATEGORIES = [
  { key: 'artist',      label: 'Художники',  cssCls: 'artist' },
  { key: 'writer',      label: 'Писатели',   cssCls: 'writer' },
  { key: 'musician',    label: 'Музыканты',  cssCls: 'musician' },
  { key: 'scientist',   label: 'Учёные',     cssCls: 'scientist' },
  { key: 'businessman', label: 'Бизнесмены', cssCls: 'businessman' },
  { key: 'politician',  label: 'Политики',   cssCls: 'politic' },
];
const EVENTS_GROUP_KEY = '__events__';

const ICON_CLOSE = `<svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="M21.2815 9.2961C21.6735 8.9071 22.3094 8.9071 22.7014 9.2961C23.0932 9.6852 23.0933 10.3154 22.7014 10.7043L17.4192 15.9446L22.7102 21.1956C23.1018 21.5845 23.1019 22.2148 22.7102 22.6038C22.3182 22.9928 21.6823 22.9928 21.2903 22.6038L16.0002 17.3538L10.7102 22.6038C10.3182 22.9928 9.6823 22.9928 9.2903 22.6038C8.8984 22.2148 8.8985 21.5846 9.2903 21.1956L14.5803 15.9456L9.2991 10.7043C8.907 10.3153 8.907 9.6842 9.2991 9.2952C9.6911 8.9065 10.3271 8.9063 10.719 9.2952L16.0002 14.5364L21.2815 9.2961Z"/>
</svg>`;

const ICON_CHEVRON = `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M12.0004 9.0001C12.2562 9.0002 12.5123 9.0979 12.7074 9.2931L16.7065 13.2931C17.097 13.6836 17.097 14.3166 16.7065 14.7072C16.3159 15.0975 15.6829 15.0976 15.2924 14.7072L11.9994 11.4142L8.7074 14.7072C8.3169 15.0977 7.6839 15.0977 7.2934 14.7072C6.9029 14.3166 6.9029 13.6836 7.2934 13.2931L11.2924 9.2941C11.3413 9.2452 11.3941 9.2018 11.4496 9.1652C11.5605 9.0919 11.6829 9.0431 11.809 9.0187C11.8722 9.0065 11.9363 9.0001 12.0004 9.0001Z"/>
</svg>`;

// pathLength="100" нормализует длину пути → CSS-анимация рисования галочки
// через stroke-dasharray:100 / stroke-dashoffset:100→0 (см. checkbox.css).
const ICON_CHECK = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="2.8 7.8 6.5 11.5 13.2 4.3" pathLength="100"/>
</svg>`;

export function initSidebar(el, getData, getOpenKey, callbacks) {
  // Запоминаем выбранных людей/события из прошлого render — чтобы при
  // следующем render отметить именно те чекбоксы, которые только что были
  // переключены, и проиграть на них draw-анимацию (.checkbox--just-checked).
  // Без этого DOM пересоздаётся целиком и анимация запускается на ВСЕХ
  // checked-чекбоксах одновременно — выглядит как «волна», но пользователь
  // ожидает анимацию только на той галочке, которую кликнули.
  let prevPeople = new Set();
  let prevEvents = new Set();

  function render() {
    el.innerHTML = '';
    const data = getData();
    const openKey = getOpenKey();

    // Текущее множество выбранных — для diff с прошлым рендером.
    const currPeople = new Set(data.people.filter(p => callbacks.isPersonSelected(p.id)).map(p => p.id));
    const currEvents = new Set(data.events.filter(e => callbacks.isEventSelected(e.id)).map(e => e.id));
    // newly = current ∖ previous (только что переключённые в checked).
    const newlyCheckedPeople = new Set([...currPeople].filter(id => !prevPeople.has(id)));
    const newlyCheckedEvents = new Set([...currEvents].filter(id => !prevEvents.has(id)));
    prevPeople = currPeople;
    prevEvents = currEvents;

    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';

    // Close
    const closeRow = document.createElement('div');
    closeRow.className = 'sidebar__close';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'icon-btn icon-btn--ghost';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Закрыть');
    closeBtn.innerHTML = ICON_CLOSE;
    closeBtn.addEventListener('click', callbacks.onClose);
    closeRow.appendChild(closeBtn);
    sidebar.appendChild(closeRow);

    // События
    sidebar.appendChild(makeSelector({
      catCss:  null,
      label:   'События',
      count:   countText(data.events, callbacks.isEventSelected),
      expanded: openKey === EVENTS_GROUP_KEY,
      onClick: () => callbacks.onToggleGroup(EVENTS_GROUP_KEY),
    }));
    if (openKey === EVENTS_GROUP_KEY) {
      sidebar.appendChild(makeEventList(
        data.events, callbacks.isEventSelected, callbacks.onToggleEvent,
        callbacks.onToggleAllEvents, newlyCheckedEvents,
      ));
    }

    // Категории
    for (const cat of CATEGORIES) {
      const inCat = data.people.filter(p => p.category === cat.key);
      sidebar.appendChild(makeSelector({
        catCss:  cat.cssCls,
        label:   cat.label,
        count:   countText(inCat, callbacks.isPersonSelected),
        expanded: openKey === cat.key,
        onClick: () => callbacks.onToggleGroup(cat.key),
      }));
      if (openKey === cat.key) {
        sidebar.appendChild(makePersonList(
          inCat, callbacks.isPersonSelected, callbacks.onTogglePerson,
          callbacks.onToggleAllPeople, cat.cssCls, newlyCheckedPeople,
        ));
      }
    }

    el.appendChild(sidebar);
  }

  return { render };
}

/** Текст счётчика для группы: число выбранных или "все" если все. */
function countText(items, isSelected) {
  if (!items.length) return '0';
  const sel = items.filter(it => isSelected(it.id)).length;
  if (sel === items.length) return 'все';
  return String(sel);
}

function makeSelector({ catCss, label, count, expanded, onClick }) {
  const btn = document.createElement('button');
  btn.className = 'selector';
  if (expanded) btn.classList.add('selector--active');
  btn.type = 'button';

  if (catCss) {
    const dot = document.createElement('span');
    dot.className = `event-dot event-dot--${catCss} event-dot--sm`;
    btn.appendChild(dot);
  }

  const name = document.createElement('span');
  name.className = 'selector__name';
  name.textContent = label;
  btn.appendChild(name);

  if (count != null) {
    const countEl = document.createElement('span');
    countEl.className = 'selector__count';
    countEl.textContent = count;
    btn.appendChild(countEl);
  }

  const chevron = document.createElement('span');
  chevron.className = 'selector__chevron';
  chevron.innerHTML = ICON_CHEVRON;
  btn.appendChild(chevron);

  btn.addEventListener('click', onClick);
  return btn;
}

function makePersonList(people, isSelected, onToggle, onToggleAll, catCss, justChecked) {
  return makeCheckboxList(
    people.map(p => ({ id: p.id, label: p.name })),
    isSelected, onToggle, onToggleAll, catCss, justChecked,
  );
}

function makeEventList(events, isSelected, onToggle, onToggleAll, justChecked) {
  return makeCheckboxList(
    events.map(e => ({ id: e.id, label: e.name })),
    isSelected, onToggle, onToggleAll, null, justChecked,
  );
}

/** catCss — css-имя категории ('politic'/'writer'/...) для подкраски
 *  активных/частично-активных чекбоксов в цвет группы. null — события
 *  (используется дефолтный --surface-checkbox-active).
 *  justChecked — Set id'шников, у которых поставить класс
 *  .checkbox--just-checked → проиграется CSS-анимация рисования галочки.
 *  Отсутствие = ни на ком не рисуем (например, при первом open-е sidebar). */
function makeCheckboxList(items, isSelected, onToggle, onToggleAll, catCss, justChecked) {
  const list = document.createElement('div');
  list.className = 'sidebar__list';

  // «Все» — первый чекбокс. checked / deselect / unchecked в зависимости от items.
  if (items.length > 0 && onToggleAll) {
    const selectedCount = items.filter(it => isSelected(it.id)).length;
    const allOn  = selectedCount === items.length;
    const partial = !allOn && selectedCount > 0;

    const allItem = document.createElement('label');
    allItem.className = 'sidebar__item';

    const cb = document.createElement('span');
    cb.className = 'checkbox';
    if (catCss) cb.classList.add(`checkbox--${catCss}`);
    if (allOn) {
      cb.classList.add('checkbox--checked');
      // Если все элементы стали checked одновременно (toggle "Все") — это и
      // есть «только что переключено» для всех id'шников: тогда пользователь
      // ожидает увидеть рисующиеся галочки на всех чекбоксах группы.
      // Для чекбокса самой "Все" анимацию проигрываем тоже — он только что
      // стал checked.
      if (justChecked && items.some(it => justChecked.has(it.id))) {
        cb.classList.add('checkbox--just-checked');
      }
      cb.innerHTML = ICON_CHECK;
    } else if (partial) {
      cb.classList.add('checkbox--deselect');
    }
    allItem.appendChild(cb);
    allItem.appendChild(document.createTextNode(' Все'));

    allItem.addEventListener('click', (e) => {
      e.preventDefault();
      // Если уже все выбраны — снимаем; иначе выбираем все.
      onToggleAll(items.map(it => it.id), !allOn);
    });

    list.appendChild(allItem);
  }

  for (const it of items) {
    const item = document.createElement('label');
    item.className = 'sidebar__item';

    const cb = document.createElement('span');
    cb.className = 'checkbox';
    if (catCss) cb.classList.add(`checkbox--${catCss}`);
    if (isSelected(it.id)) {
      cb.classList.add('checkbox--checked');
      if (justChecked && justChecked.has(it.id)) {
        cb.classList.add('checkbox--just-checked');
      }
      cb.innerHTML = ICON_CHECK;
    }
    item.appendChild(cb);

    item.appendChild(document.createTextNode(' ' + it.label));

    item.addEventListener('click', (e) => {
      e.preventDefault();
      onToggle(it.id);
    });

    list.appendChild(item);
  }

  return list;
}
