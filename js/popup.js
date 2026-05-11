/* Popup — карточка-шторка с подробностями события. См. MAIN_SCREEN.md → Popup.
 *
 * openPopup() рендерит контент в .popup-overlay, добавляет .is-open (анимация
 * выезда справа налево) и программно скроллит Timeflow так, чтобы выбранное
 * событие оказалось горизонтально по центру 15vw-просвета слева от попапа.
 * closePopup() убирает .is-open.
 *
 * Тексты внутри попапа проходят через fixOrphansInTree — однобуквенные
 * предлоги/союзы получают non-breaking space, чтобы не оставаться в конце
 * строки. Применяется ко всем дочерним text nodes overlay'я. */

import { fixOrphansInTree } from './lib/typography.js';

const CATEGORY_CLASS = {
  artist:      'artist',
  writer:      'writer',
  musician:    'musician',
  scientist:   'scientist',
  businessman: 'businessman',
  politician:  'politic',
};

function catCls(category) {
  return CATEGORY_CLASS[category] || 'artist';
}

/* Сохраняем последние ссылки на overlay/backdrop, чтобы внутри попапа
 * (например, при клике на имя в «В это же время») можно было заново
 * вызвать openPopup без таскания ссылок через всю иерархию. */
let _lastOverlayEl  = null;
let _lastBackdropEl = null;
let _lastState = null;
let _lastData  = null;

/** Рисует контент попапа в overlayEl, синхронно показывает backdrop, применяет
 *  .is-open. backdropEl — `.popup-backdrop` (затемняющий слой под попапом). */
export function openPopup(overlayEl, backdropEl, state, data, personId, eventYear) {
  const person = data.people.find(p => p.id === personId);
  if (!person) return;
  const event = (person.events || []).find(e => e.year === eventYear);
  if (!event) return;

  // Запоминаем для re-open изнутри попапа (кликабельные имена в
  // «В это же время»).
  _lastOverlayEl = overlayEl;
  _lastBackdropEl = backdropEl;
  _lastState = state;
  _lastData  = data;

  // Снимаем модификатор about, если попап ранее открывался как about.
  overlayEl.classList.remove('popup-overlay--about');
  overlayEl.innerHTML = '';

  // Close — кладём прямо в overlay (а не внутрь .popup-grid), чтобы
  // абсолютное позиционирование считалось от overlay и кнопка точно
  // не клиппилась grid-контейнером.
  const closeBtn = document.createElement('button');
  closeBtn.className = 'icon-btn icon-btn--ghost popup__close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Закрыть');
  closeBtn.innerHTML = ICON_CLOSE;
  closeBtn.addEventListener('click', () => closePopup(overlayEl, backdropEl));
  overlayEl.appendChild(closeBtn);

  overlayEl.appendChild(buildPopup(person, event, state, data));
  fixOrphansInTree(overlayEl);
  overlayEl.classList.add('is-open');
  backdropEl?.classList.add('is-open');

  scrollEventToVisibleSlot(state, eventYear);
}

export function closePopup(overlayEl, backdropEl) {
  overlayEl.classList.remove('is-open');
  backdropEl?.classList.remove('is-open');
}

/** Рисует попап «О проекте» в overlayEl. Та же шторка-overlay, что и для
 *  событий, но контент полностью другой: огромный display-heading,
 *  длинный intro с примерами, два изображения side-by-side, форма
 *  обратной связи (Web3Forms). Поведение open/close идентичное. */
export function openAboutPopup(overlayEl, backdropEl) {
  overlayEl.innerHTML = '';
  // About открывается на 100vw (см. styles/components/popup.css → --about).
  overlayEl.classList.add('popup-overlay--about');

  const closeBtn = document.createElement('button');
  closeBtn.className = 'icon-btn icon-btn--ghost popup__close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Закрыть');
  closeBtn.innerHTML = ICON_CLOSE;
  closeBtn.addEventListener('click', () => closePopup(overlayEl, backdropEl));
  overlayEl.appendChild(closeBtn);

  overlayEl.appendChild(buildAboutPopup());
  fixOrphansInTree(overlayEl);
  overlayEl.classList.add('is-open');
  backdropEl?.classList.add('is-open');
}

function buildAboutPopup() {
  const popup = document.createElement('div');
  popup.className = 'popup popup--about';
  popup.innerHTML = ABOUT_HTML;

  // Логотип «past simple» виден только на десктопе (см. CSS @media).
  // initLogoHover навешивает hover-эффект; на мобиле блок display:none,
  // hover недоступен → безвредно.
  const heading = popup.querySelector('.popup__about-heading');
  if (heading) initLogoHover(heading);

  return popup;
}

const ABOUT_HTML = `
  <h1 class="popup__about-heading">past simple</h1>

  <div class="popup__about-container">
    <div class="popup__about-intro">
      <p>Наше представление о мировой истории фрагментарно. Вот есть Лев Толстой и есть Уолт Дисней, сходу кажется, что они из разных эпох, а на самом деле оба жили в одно время. Ну ладно, всего 9 лет, но жили же!</p>
      <p>Или вот мы читаем про Первую мировую войну и в голове картины боёв, окопы, взрывы. Но война происходила не везде в мире (хоть и мировая, ну да). Параллельно с окопами и взрывами в Петрограде, например, выставлялся Малевич со своим «Чёрным квадратом». А Эйнштейн в это же время закончил общую теорию относительности.</p>
    </div>

    <div class="popup__about-pair">
      <figure class="popup__about-figure">
        <div class="popup__about-image"><img src="/assets/about/tolstoy.png" alt="Лев Толстой"></div>
      </figure>
      <figure class="popup__about-figure">
        <div class="popup__about-image"><img src="/assets/about/mickey.png" alt="Микки Маус"></div>
      </figure>
    </div>

    <p class="popup__about-bridge">Даже с хорошим воображением в голове сложно проводить все эти параллели, чтобы сложилась полная картинка. Past Simple создан как раз для этого.</p>

    <p class="popup__about-mission">Наглядно показать взаимосвязи людей и событий в истории. Дать больше контекста, чтобы лучше представить время, которое нам интересно.</p>

    <div class="popup__about-bottom">
      <p class="popup__about-contact">Если нашли ошибку или у вас есть предложение по улучшению сервиса, напишите мне на <a href="mailto:deezayner@yandex.ru">почту</a>.</p>

      <div class="popup__about-outro">
        <p>Сейчас охвачен промежуток между 1850 и 1950 годами, но скоро мы доберёмся и до всего XX века, а потом пойдём дальше в прошлое. Известные люди и события тоже будут добавляться. Кстати, вы можете это ускорить. Предложите тех, кого хотелось бы здесь увидеть. Вот прямо тут, слева. Про ошибки или идеи пишите тоже туда. Я* скажу вам большое спасибо.</p>
      </div>
    </div>

    <div class="popup__about-footer">
      <p class="popup__about-signature">*Я — это <a href="https://ermolaev.space" target="_blank" rel="noopener">Артём Ермолаев</a>, автор проекта.</p>
      <a class="popup__about-policy" href="/privacy.html">Политика конфиденциальности</a>
    </div>
  </div>
`;

/* Hover-эффект на логотипе «past simple»: при наведении на букву она
 * красится в случайный цвет из палитры на ~1с, потом возвращается
 * обратно. Создаёт «шлейф» при движении курсора по логотипу.
 * См. https://pureemaison.com — там аналогичный эффект на
 * «voir tous les projets». */
const LOGO_COLORS = [
  '--red-100', '--green-100', '--blue-100',
  '--yellow-100', '--purple-100', '--toxic-100',
];

function initLogoHover(headingEl) {
  // Разбиваем текст на отдельные letter-span'ы (с сохранением пробелов).
  const text = headingEl.textContent;
  headingEl.textContent = '';
  for (const ch of text) {
    const span = document.createElement('span');
    span.className = 'popup__about-heading-letter';
    span.textContent = ch;
    if (ch === ' ') span.style.whiteSpace = 'pre';
    headingEl.appendChild(span);
  }

  headingEl.addEventListener('mouseover', (e) => {
    const letter = e.target.closest('.popup__about-heading-letter');
    if (!letter) return;
    const color = LOGO_COLORS[Math.floor(Math.random() * LOGO_COLORS.length)];
    // И смена цвета, и возврат — резкие, без transition.
    letter.style.color = `var(${color})`;
    clearTimeout(letter._restoreTimer);
    letter._restoreTimer = setTimeout(() => { letter.style.color = ''; }, 1000);
  });
}

const ICON_CLOSE = `<svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="M21.2815 9.2961C21.6735 8.9071 22.3094 8.9071 22.7014 9.2961C23.0932 9.6852 23.0933 10.3154 22.7014 10.7043L17.4192 15.9446L22.7102 21.1956C23.1018 21.5845 23.1019 22.2148 22.7102 22.6038C22.3182 22.9928 21.6823 22.9928 21.2903 22.6038L16.0002 17.3538L10.7102 22.6038C10.3182 22.9928 9.6823 22.9928 9.2903 22.6038C8.8984 22.2148 8.8985 21.5846 9.2903 21.1956L14.5803 15.9456L9.2991 10.7043C8.907 10.3153 8.907 9.6842 9.2991 9.2952C9.6911 8.9065 10.3271 8.9063 10.719 9.2952L16.0002 14.5364L21.2815 9.2961Z"/>
</svg>`;

function buildPopup(person, event, state, data) {
  const popup = document.createElement('div');
  popup.className = 'popup';

  // Header: H1 слева + круглое фото справа (R22)
  popup.appendChild(buildHeader(person, event));

  // Lifetime track — на всю ширину под шапкой (R22)
  popup.appendChild(buildLifetimeStrip(person, event));

  // Body: 2 колонки grid 636fr/232fr — контент / concurrent
  const body = document.createElement('div');
  body.className = 'popup__body';
  body.appendChild(buildLeftColumn(person, event));
  body.appendChild(buildRightColumn(person, event, state, data));
  popup.appendChild(body);

  return popup;
}

/** Header (R22): H1 + фото в одной строке. H1 центрирован вертикально
 *  относительно фото (через align-items: center в CSS). */
function buildHeader(person, event) {
  const header = document.createElement('div');
  header.className = 'popup__header';

  const title = document.createElement('h1');
  title.className = 'popup__title';
  title.textContent = `${person.name} в ${event.year}`;
  header.appendChild(title);

  const photo = document.createElement('div');
  photo.className = 'popup__photo';
  photo.setAttribute('role', 'img');
  photo.setAttribute('aria-label', person.name);
  if (person.photo) photo.style.backgroundImage = `url('${person.photo}')`;
  header.appendChild(photo);

  return header;
}

/** Левая колонка: lead + sections (R22 — title и lifetime вынесены наверх). */
function buildLeftColumn(person, event) {
  const left = document.createElement('div');
  left.className = 'popup__left';

  // Lead — короткий выделенный абзац (event.description).
  if (event.description) {
    const lead = document.createElement('p');
    lead.className = 'popup__lead';
    lead.textContent = event.description;
    left.appendChild(lead);
  }

  // Sections — подзаголовки с подробным текстом (опционально).
  // См. public/data/_schema.js → events[i].sections.
  if (Array.isArray(event.sections) && event.sections.length > 0) {
    const text = document.createElement('div');
    text.className = 'popup__text';
    for (const sec of event.sections) {
      const section = document.createElement('section');
      section.className = 'popup__section';

      const h = document.createElement('h2');
      h.className = 'popup__section-title';
      h.textContent = sec.title;
      section.appendChild(h);

      const p = document.createElement('p');
      p.className = 'popup__section-body';
      p.textContent = sec.body;
      section.appendChild(p);

      text.appendChild(section);
    }
    left.appendChild(text);
  }

  return left;
}

/** Полоска life-line внутри попапа: born | event_year | died + dot. */
function buildLifetimeStrip(person, event) {
  const lifetime = document.createElement('div');
  lifetime.className = 'popup__lifetime';
  const cat = catCls(person.category);

  // Позиция года события на отрезке born..died (в процентах)
  const span = (person.died - person.born) || 1;
  const pct = ((event.year - person.born) / span) * 100;

  const yBorn = document.createElement('span');
  yBorn.className = 'popup__lifetime-year';
  yBorn.style.left = '0';
  yBorn.textContent = person.born;
  lifetime.appendChild(yBorn);

  const yEvent = document.createElement('span');
  yEvent.className = 'popup__lifetime-year popup__lifetime-year--event';
  yEvent.style.left = pct + '%';
  yEvent.style.color = `var(--surface-person-${cat})`;
  yEvent.textContent = event.year;
  lifetime.appendChild(yEvent);

  const yDied = document.createElement('span');
  yDied.className = 'popup__lifetime-year popup__lifetime-year--end';
  yDied.textContent = person.died;
  lifetime.appendChild(yDied);

  const track = document.createElement('div');
  track.className = 'popup__lifetime-track';
  lifetime.appendChild(track);

  const dot = document.createElement('span');
  dot.className = 'popup__lifetime-dot';
  dot.style.left = pct + '%';
  dot.style.background = `var(--surface-person-${cat})`;
  lifetime.appendChild(dot);

  return lifetime;
}

/** Правая колонка: «В это же время» (R22 — фото вынесено в header). */
function buildRightColumn(person, event, state, data) {
  const right = document.createElement('div');
  right.className = 'popup__right';

  // Современники — другие видимые люди, у которых на тот же год есть свой event
  const concurrent = data.people
    .filter(p => state.peopleIds.includes(p.id) && p.id !== person.id)
    .map(p => ({ p, ev: (p.events || []).find(e => e.year === event.year) }))
    .filter(x => x.ev);

  if (concurrent.length > 0) {
    const block = document.createElement('div');
    block.className = 'popup__concurrent';

    const title = document.createElement('div');
    title.className = 'popup__concurrent-title';
    title.textContent = 'В это же время';
    block.appendChild(title);

    const list = document.createElement('div');
    list.className = 'popup__concurrent-list';
    for (const { p, ev } of concurrent) {
      list.appendChild(buildConcurrentItem(p, ev));
    }
    block.appendChild(list);
    right.appendChild(block);
  }

  return right;
}

function buildConcurrentItem(person, event) {
  const cat = catCls(person.category);
  const item = document.createElement('div');
  item.className = 'popup__concurrent-item';

  const dot = document.createElement('span');
  dot.className = `popup__concurrent-dot popup__concurrent-dot--${cat}`;
  item.appendChild(dot);

  // Имя — button: hover сдвигает на 4px вправо (см. popup.css),
  // click открывает попап события этого человека.
  const name = document.createElement('button');
  name.type = 'button';
  name.className = `popup__concurrent-name popup__concurrent-name--${cat}`;
  name.textContent = person.name;
  name.addEventListener('click', () => {
    if (_lastOverlayEl && _lastState && _lastData) {
      openPopup(_lastOverlayEl, _lastBackdropEl, _lastState, _lastData, person.id, event.year);
    }
  });
  item.appendChild(name);

  const desc = document.createElement('div');
  desc.className = 'popup__concurrent-desc';
  desc.textContent = event.title || event.description || '';
  item.appendChild(desc);

  return item;
}

/** Программный скролл Timeflow: год события центрируется в 15vw-просвете
 *  слева от попапа (= 7.5vw от левого края окна). */
function scrollEventToVisibleSlot(state, eventYear) {
  const scrollEl = document.getElementById('canvas-scroll');
  if (!scrollEl) return;
  const eventX = (eventYear - state.startYear) * state.pxPerYear;
  const rect = scrollEl.getBoundingClientRect();
  const targetWindowX = window.innerWidth * 0.075;     // 7.5vw
  // Координата события в окне = rect.left + (eventX − scrollLeft); хотим
  // её равной targetWindowX → scrollLeft = eventX + rect.left − targetWindowX.
  const newScrollLeft = eventX + rect.left - targetWindowX;
  scrollEl.scrollTo({ left: Math.max(0, newScrollLeft), behavior: 'smooth' });
}
