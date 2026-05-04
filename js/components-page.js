/* Страница /components (она же /library).
 *
 * Рендерит:
 *  1. Общую навигацию библиотеки (см. library-nav.js).
 *  2. Под каждой <section data-component="X"> — аккордеон с токенами и
 *     зависимостями. Данные берёт из /data/components-meta.json,
 *     генерируется автоматически в prebuild (см. package.json и
 *     js/build/generate-components-meta.js). */

import { renderNav } from './library-nav.js';

renderNav('/components.html');

(async () => {
  let meta;
  try {
    meta = await fetch('/data/components-meta.json').then(r => r.json());
  } catch (e) {
    console.warn('components-meta.json не найден (запусти `npm run build`):', e);
    return;
  }

  for (const section of document.querySelectorAll('.ks-component[data-component]')) {
    const name = section.dataset.component;
    const data = meta[name];
    if (!data) continue;

    const block = renderMetaBlock(name, data);
    // Вставляем после описания компонента (.ks-component__desc),
    // если есть; иначе сразу после заголовка.
    const desc  = section.querySelector('.ks-component__desc');
    const title = section.querySelector('.ks-component__title');
    const after = desc || title;
    if (after) after.insertAdjacentElement('afterend', block);
    else section.prepend(block);
  }
})();

function renderMetaBlock(name, { tokens, deps }) {
  const details = document.createElement('details');
  details.className = 'ks-meta';

  const summary = document.createElement('summary');
  summary.textContent = `Зависимости (${deps.length}) · Токены (${tokens.length})`;
  details.appendChild(summary);

  const body = document.createElement('div');
  body.className = 'ks-meta__body';

  body.appendChild(renderGroup(
    deps.length ? 'Компоненты внутри' : 'Компоненты внутри (атом — нет зависимостей)',
    deps,
    'атом — нет зависимостей',
  ));

  body.appendChild(renderGroup(
    'Токены',
    tokens,
    'не использует токены',
  ));

  details.appendChild(body);
  return details;
}

function renderGroup(title, items, emptyText) {
  const group = document.createElement('div');
  group.className = 'ks-meta__group';

  const t = document.createElement('div');
  t.className = 'ks-meta__group-title';
  t.textContent = title;
  group.appendChild(t);

  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'ks-meta__empty';
    empty.textContent = emptyText;
    group.appendChild(empty);
  } else {
    const ul = document.createElement('ul');
    ul.className = 'ks-meta__list';
    for (const it of items) {
      const li = document.createElement('li');
      li.textContent = it;
      ul.appendChild(li);
    }
    group.appendChild(ul);
  }
  return group;
}
