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
import { resizePhotoUrl } from './lib/photo.js';

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

  // Re-render: переключение на другое событие того же человека (R22) —
  // меняем только .popup внутри overlay, close-кнопка остаётся (иначе
  // её opacity-fade re-trigger'ится). rerender передаётся вниз в
  // buildLifetimeStrip, который вешает её на клики по dot/arrow.
  let popupEl = null;
  function rerender(newEvent) {
    const newPopupEl = buildPopup(person, newEvent, state, data, rerender);
    if (popupEl) popupEl.replaceWith(newPopupEl);
    else overlayEl.appendChild(newPopupEl);
    popupEl = newPopupEl;
    fixOrphansInTree(popupEl);
    scrollEventToVisibleSlot(state, newEvent.year);
  }
  rerender(event);

  overlayEl.classList.add('is-open');
  backdropEl?.classList.add('is-open');
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
    <section class="popup__about-section">
      <h2 class="popup__about-section-title">Что за проект</h2>
      <div class="popup__about-section-body">
        <p>Этот проект для тех, кому интересна история. Не та, школьная, про завоевания, правителей и разрушение империй, а более человеческая.</p>
        <p>Помните, как было: мы отдельно учили мировую историю, потом отдельно российскую, потом шли на литру, где много читали произведений и мало про их авторов. После уроков (давайте для складности повествования представим) шли в музей, где смотрели на картины каких-то там художников.</p>
        <figure class="popup__about-illustration popup__about-block--gap-lg">
          <img src="/assets/about/illustration.png" alt="" />
        </figure>
        <p class="popup__about-block--gap-lg">В итоге в голове так и остались какие-то разрозненные знания, но все эти знания — это одна цельная история. Лев Толстой жил в одно время с Уолтом Диснеем, Малевич демонстрировал миру «Чёрный квадрат» в разгар Первой мировой войны. У Троцкого был роман с Фридой Кало.</p>
        <div class="popup__about-pair popup__about-block--gap-lg">
          <figure class="popup__about-figure"><img src="/assets/about/pair-left.png" alt="" /></figure>
          <figure class="popup__about-figure popup__about-figure--accent"><img src="/assets/about/pair-right.png" alt="" /></figure>
        </div>
        <p class="popup__about-block--gap-lg">Паст симпл придуман для того, чтобы наглядно показать вот эти вот все параллели. Чтобы собрать воедино картину того, как жили разные люди в прошлом.</p>
      </div>
    </section>

    <section class="popup__about-section">
      <h2 class="popup__about-section-title">Как этим пользоваться?</h2>
      <div class="popup__about-section-body">
        <p>Прям как угодно. Я<sup class="popup__about-asterisk">*</sup> постарался спроектировать всё так, чтобы можно было смотреть на историю под разными углами и самостоятельно искать интересные параллели.</p>
        <p>Можно выбрать сразу всех людей и смотреть кто с кем был связан, что происходило в одно и то же время, что делали разные люди во время мировых событий. А можно наоборот выбрать только тех, кто нравится и детально посмотреть на их жизнь. Можно просто сравнить сколько кому было лет, например, в 1917 году. Способ исследования выбираете вы. Круто же!</p>
      </div>
    </section>

    <div class="popup__about-lifeline" aria-hidden="true">
      <div class="popup__about-lifeline-track"></div>
      <span class="popup__about-lifeline-dot" style="left: 8.5%"></span>
      <span class="popup__about-lifeline-dot" style="left: 33%"></span>
      <span class="popup__about-lifeline-dot" style="left: 49.2%"></span>
      <span class="popup__about-lifeline-dot" style="left: 53.7%"></span>
      <span class="popup__about-lifeline-dot" style="left: 81.4%"></span>
    </div>

    <section class="popup__about-section">
      <h2 class="popup__about-section-title">Будут ли обновления?</h2>
      <div class="popup__about-section-body">
        <p>Обязательно. Сейчас паст симпл охватывает промежуток между 1850 и 1950 годами, но скоро появится весь XX век, а потом отправимся дальше в прошлое. Новые исторические личности тоже будут добавляться, вы, кстати, можете кого-то предложить. Но в планах не только расширение того, что уже есть, но и совершенно новые фичи. Подписывайтесь на мой телеграм-канал, пока что я буду рассказывать про все обновления там.</p>
      </div>
    </section>

    <section class="popup__about-section">
      <h2 class="popup__about-section-title">Ну как вам?</h2>
      <div class="popup__about-section-body">
        <p>Буду очень признателен, если напишите, как вам проект. Если найдёте ошибку или предложите улучшение, буду признателен вдвойне. Вдруг вам просто не терпится сказать, как здесь всё круто сделано и как вам такого не хватало. Что ж, прекрасно могу вас понять, не держите в себе.</p>
      </div>
    </section>

    <div class="popup__about-tail">
      <a class="popup__about-cta" href="mailto:deezayner@yandex.ru">
        <img class="popup__about-cta-arrow" src="/assets/about/arrow.svg" alt="" />
        <span class="popup__about-cta-text">Пишите</span>
      </a>

      <div class="popup__about-footer">
        <div class="popup__about-footer-content">
          <p class="popup__about-signature">*Я — это <a href="https://ermolaev.space" target="_blank" rel="noopener">Артём Ермолаев</a>, автор проекта.</p>
          <a class="popup__about-policy" href="/privacy.html">Политика конфиденциальности</a>
        </div>
      </div>
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

const ICON_ARROW_LEFT = `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M17.293 9.29286C17.6835 8.90239 18.3165 8.90236 18.707 9.29286C19.0973 9.68339 19.0974 10.3165 18.707 10.7069L13.4141 15.9999L18.707 21.2929C19.0974 21.6834 19.0975 22.3165 18.707 22.7069C18.3166 23.0974 17.6835 23.0973 17.293 22.7069L11.293 16.7069C11.1464 16.5603 11.0541 16.3796 11.0176 16.1903C11.0054 16.1275 11 16.0637 11 15.9999C11 15.7439 11.0977 15.4882 11.293 15.2929L17.293 9.29286Z" fill="currentColor"/>
</svg>`;

const ICON_ARROW_RIGHT = `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M13.7068 22.7069C13.3163 23.0974 12.6832 23.0974 12.2927 22.7069C11.9025 22.3164 11.9023 21.6833 12.2927 21.2928L17.5857 15.9999L12.2927 10.7069C11.9024 10.3164 11.9023 9.6833 12.2927 9.29283C12.6832 8.90236 13.3163 8.90246 13.7068 9.29283L19.7068 15.2928C19.8534 15.4394 19.9456 15.6201 19.9822 15.8094C19.9943 15.8723 19.9997 15.9361 19.9998 15.9999C19.9998 16.2558 19.9021 16.5116 19.7068 16.7069L13.7068 22.7069Z" fill="currentColor"/>
</svg>`;

/** R4: ищет «парное» событие — другого человека из data, на которого у
 *  текущего person есть mutual connection с тем же годом, что у текущего
 *  event. Возвращает { person: pairedPerson, event: pairedEvent } либо null.
 *  Условие: connections[] у текущего persona содержит запись с personId
 *  и year=event.year, и у того человека тоже есть event на тот же год.
 *  R23: учитывает фильтр людей — paired выбирается ТОЛЬКО из видимых
 *  (state.peopleIds). Без фильтра у Блока 1921 paired = алфавитно-первый
 *  Ахматова, даже когда в фильтре только Блок+Гумилёв. */
function getPairedFor(person, event, data, state) {
  if (!person.connections || !data) return null;
  const visibleIds = state && Array.isArray(state.peopleIds) ? state.peopleIds : null;
  for (const conn of person.connections) {
    if (conn.year !== event.year) continue;
    if (visibleIds && !visibleIds.includes(conn.personId)) continue;
    const personB = (data.people || []).find(p => p.id === conn.personId);
    if (!personB) continue;
    const evB = (personB.events || []).find(e => e.year === event.year);
    if (evB) return { person: personB, event: evB };
  }
  return null;
}

function buildPopup(person, event, state, data, onEventChange) {
  const popup = document.createElement('div');
  popup.className = 'popup';

  // R4: парное событие (если есть mutual connection в этот год).
  // R23: state передаётся в getPairedFor для фильтрации видимых.
  const paired = getPairedFor(person, event, data, state);
  if (paired) popup.classList.add('popup--paired');

  // Header: H1 + фото; при paired — subtitle и второе фото слева.
  popup.appendChild(buildHeader(person, event, paired));

  // Lifetime track. onEventChange — колбэк переключения попапа на другое
  // событие. При paired — двойная точка (paired-top/bottom) в year события.
  popup.appendChild(buildLifetimeStrip(person, event, onEventChange, paired));

  // Body: 2 колонки grid — контент / concurrent. При paired парный
  // человек в concurrent-списке идёт первым.
  const body = document.createElement('div');
  body.className = 'popup__body';
  body.appendChild(buildLeftColumn(person, event));
  body.appendChild(buildRightColumn(person, event, state, data, paired));
  popup.appendChild(body);

  return popup;
}

/** Header (R22): H1 + фото в одной строке. H1 центрирован вертикально
 *  относительно фото (через align-items: center в CSS).
 *  R4 (paired): title — имя текущего человека (как обычно). Снизу
 *  добавляется subtitle «и <имя2> в <год>». Фото — два круга: основной
 *  232×232 + второй 120×120 слева, vert-centered, 50% overlap. */
function buildHeader(person, event, paired) {
  const header = document.createElement('div');
  header.className = 'popup__header';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'popup__title-wrap';

  const title = document.createElement('h1');
  title.className = 'popup__title';
  if (paired) {
    // Только имя; год переезжает в subtitle вместе с paired-именем.
    title.textContent = person.name;
  } else {
    title.textContent = `${person.name} в ${event.year}`;
  }
  titleWrap.appendChild(title);

  if (paired) {
    const sub = document.createElement('div');
    sub.className = 'popup__subtitle';
    sub.textContent = `и ${paired.person.name} в ${event.year}`;
    titleWrap.appendChild(sub);
  }
  header.appendChild(titleWrap);

  const photo = document.createElement('div');
  photo.className = 'popup__photo';
  photo.setAttribute('role', 'img');
  photo.setAttribute('aria-label', person.name);
  // Main фото — 232×232 в CSS, 2× retina → 464px (R20).
  if (person.photo) photo.style.backgroundImage = `url('${resizePhotoUrl(person.photo, 464)}')`;

  if (paired) {
    const photo2 = document.createElement('div');
    photo2.className = 'popup__photo-secondary';
    photo2.setAttribute('role', 'img');
    photo2.setAttribute('aria-label', paired.person.name);
    // Paired secondary — 120×120, 2× retina → 240px (R20).
    if (paired.person.photo) photo2.style.backgroundImage = `url('${resizePhotoUrl(paired.person.photo, 240)}')`;
    photo.appendChild(photo2);
  }

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
/** Линия жизни персонажа с маркерами событий и навигацией (R22).
 *  Структура:
 *    .popup__lifetime           (flex: arrow | inner | arrow)
 *      .popup__lifetime-arrow--prev (32×32)
 *      .popup__lifetime-inner   (track + years + dots, flex: 1)
 *      .popup__lifetime-arrow--next (32×32)
 *  Прочие события человека — пустые dots с border цвета категории
 *  и подписями года цветом --text-secondary. Клик по dot или стрелке
 *  → onEventChange(targetEvent). На граничных событиях соответствующая
 *  стрелка disabled. */
function buildLifetimeStrip(person, event, onEventChange, paired) {
  const lifetime = document.createElement('div');
  lifetime.className = 'popup__lifetime';
  const cat = catCls(person.category);
  const catPaired = paired ? catCls(paired.person.category) : null;

  const sortedEvents = [...(person.events || [])].sort((a, b) => a.year - b.year);
  const currentIdx = sortedEvents.findIndex(e =>
    e === event || (e.year === event.year && e.title === event.title)
  );
  const prevEvent = currentIdx > 0 ? sortedEvents[currentIdx - 1] : null;
  const nextEvent = currentIdx >= 0 && currentIdx < sortedEvents.length - 1
    ? sortedEvents[currentIdx + 1]
    : null;

  // --- Prev arrow ---
  const prevBtn = document.createElement('button');
  prevBtn.className = 'popup__lifetime-arrow popup__lifetime-arrow--prev';
  prevBtn.type = 'button';
  prevBtn.setAttribute('aria-label', 'Предыдущее событие');
  prevBtn.innerHTML = ICON_ARROW_LEFT;
  if (!prevEvent || !onEventChange) prevBtn.disabled = true;
  else prevBtn.addEventListener('click', () => onEventChange(prevEvent));
  lifetime.appendChild(prevBtn);

  // --- Inner (track + years + dots) ---
  const inner = document.createElement('div');
  inner.className = 'popup__lifetime-inner';
  lifetime.appendChild(inner);

  const track = document.createElement('div');
  track.className = 'popup__lifetime-track';
  inner.appendChild(track);

  const span = (person.died - person.born) || 1;

  const yBorn = document.createElement('span');
  yBorn.className = 'popup__lifetime-year';
  yBorn.style.left = '0';
  yBorn.textContent = person.born;
  inner.appendChild(yBorn);

  const yDied = document.createElement('span');
  yDied.className = 'popup__lifetime-year popup__lifetime-year--end';
  yDied.textContent = person.died;
  inner.appendChild(yDied);

  // Alt events — пустые dots. Год-подписи у alt-dots не рисуем: при
  // близком расположении событий они наезжают друг на друга.
  for (const e of sortedEvents) {
    if (e === event) continue;
    const altPct = ((e.year - person.born) / span) * 100;

    const dotAlt = document.createElement('button');
    dotAlt.className = 'popup__lifetime-dot popup__lifetime-dot--alt';
    dotAlt.type = 'button';
    dotAlt.style.left = altPct + '%';
    // currentColor в CSS берёт цвет отсюда → border, на hover background.
    dotAlt.style.color = `var(--surface-person-${cat})`;
    dotAlt.setAttribute('aria-label', `Событие ${e.year}: ${e.title}`);
    if (onEventChange) dotAlt.addEventListener('click', () => onEventChange(e));
    inner.appendChild(dotAlt);
  }

  // Текущее событие — год + dot. Кладём ПОСЛЕ alt, чтобы при наложении
  // подпись/dot текущего были сверху.
  const pct = ((event.year - person.born) / span) * 100;
  const yEvent = document.createElement('span');
  yEvent.className = 'popup__lifetime-year popup__lifetime-year--event';
  yEvent.style.left = pct + '%';
  yEvent.style.color = `var(--surface-person-${cat})`;
  yEvent.textContent = event.year;
  inner.appendChild(yEvent);

  if (paired) {
    // Двойная точка: верх — текущий, низ — paired. 4px overlap. См. CSS
    // .popup__lifetime-dot--paired-top/--paired-bottom для top-смещений.
    const dotTop = document.createElement('span');
    dotTop.className = 'popup__lifetime-dot popup__lifetime-dot--paired-top';
    dotTop.style.left = pct + '%';
    dotTop.style.background = `var(--surface-person-${cat})`;
    inner.appendChild(dotTop);

    const dotBottom = document.createElement('span');
    dotBottom.className = 'popup__lifetime-dot popup__lifetime-dot--paired-bottom';
    dotBottom.style.left = pct + '%';
    dotBottom.style.background = `var(--surface-person-${catPaired})`;
    inner.appendChild(dotBottom);
  } else {
    const dot = document.createElement('span');
    dot.className = 'popup__lifetime-dot';
    dot.style.left = pct + '%';
    dot.style.background = `var(--surface-person-${cat})`;
    inner.appendChild(dot);
  }

  // --- Next arrow ---
  const nextBtn = document.createElement('button');
  nextBtn.className = 'popup__lifetime-arrow popup__lifetime-arrow--next';
  nextBtn.type = 'button';
  nextBtn.setAttribute('aria-label', 'Следующее событие');
  nextBtn.innerHTML = ICON_ARROW_RIGHT;
  if (!nextEvent || !onEventChange) nextBtn.disabled = true;
  else nextBtn.addEventListener('click', () => onEventChange(nextEvent));
  lifetime.appendChild(nextBtn);

  return lifetime;
}

/** Правая колонка: «В это же время» (R22 — фото вынесено в header).
 *  R4 (paired): парный человек идёт первым в списке (всегда, даже если
 *  не в peopleIds — отфильтрован). */
function buildRightColumn(person, event, state, data, paired) {
  const right = document.createElement('div');
  right.className = 'popup__right';

  // Современники — другие видимые люди, у которых на тот же год есть свой event
  let concurrent = data.people
    .filter(p => state.peopleIds.includes(p.id) && p.id !== person.id)
    .map(p => ({ p, ev: (p.events || []).find(e => e.year === event.year) }))
    .filter(x => x.ev);

  if (paired) {
    // Убрать paired из списка (если уже есть) и поставить в начало.
    concurrent = concurrent.filter(x => x.p.id !== paired.person.id);
    concurrent.unshift({ p: paired.person, ev: paired.event });
  }

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
