/* Авто-рендер всех CSS custom properties из :root.
 * Группирует по семантике, рендерит карточки с превью и значением.
 */

import { renderNav } from './library-nav.js';

renderNav('/tokens.html');

/** Считывает все --* свойства, объявленные на :root в любом из таблиц стилей. */
function readCustomProps() {
  const props = {};
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of rules) {
      if (rule.type !== CSSRule.STYLE_RULE) continue;
      if (rule.selectorText !== ':root') continue;
      for (const name of rule.style) {
        if (!name.startsWith('--')) continue;
        props[name] = rule.style.getPropertyValue(name).trim();
      }
    }
  }
  return props;
}

/** Резолвит var(--x) до конкретного rgb(...)/rgba(...) через computed style. */
const resolverEl = document.createElement('div');
resolverEl.style.position = 'absolute';
resolverEl.style.visibility = 'hidden';
document.body.appendChild(resolverEl);

function resolveColor(varName) {
  resolverEl.style.color = `var(${varName})`;
  return getComputedStyle(resolverEl).color;
}

/** Категоризация токенов по префиксу/паттерну. */
function categorize(props) {
  const groups = {
    'Solid colors': [],
    'Black (alpha grades)': [],
    'White (alpha grades)': [],
    'Light (alpha grades)': [],
    'Dark': [],
    'Brand': [],
    'Text': [],
    'Surface': [],
    'Border': [],
    'Radius': [],
    'Spacing': [],
    'Typography': [],
  };
  const solidNames = new Set(['--red', '--green', '--blue', '--yellow', '--purple']);

  for (const [name, value] of Object.entries(props)) {
    if (solidNames.has(name)) groups['Solid colors'].push([name, value]);
    else if (name.startsWith('--black-')) groups['Black (alpha grades)'].push([name, value]);
    else if (name.startsWith('--white-')) groups['White (alpha grades)'].push([name, value]);
    else if (name.startsWith('--light-')) groups['Light (alpha grades)'].push([name, value]);
    else if (name.startsWith('--dark-')) groups['Dark'].push([name, value]);
    else if (name.startsWith('--brand-')) groups['Brand'].push([name, value]);
    else if (name.startsWith('--text-')) groups['Text'].push([name, value]);
    else if (name.startsWith('--surface-')) groups['Surface'].push([name, value]);
    else if (name.startsWith('--border-')) groups['Border'].push([name, value]);
    else if (name.startsWith('--radius-')) groups['Radius'].push([name, value]);
    else if (name.startsWith('--spacing-')) groups['Spacing'].push([name, value]);
    else if (name.startsWith('--font-')) groups['Typography'].push([name, value]);
  }
  return groups;
}

/** Сортировка внутри палитровых групп: по числовому суффиксу убыванием (100 → 4). */
function sortByGrade(entries) {
  return entries.slice().sort((a, b) => {
    const an = parseInt(a[0].split('-').pop(), 10) || 0;
    const bn = parseInt(b[0].split('-').pop(), 10) || 0;
    return bn - an;
  });
}

function makeColorCard(name, rawValue) {
  const card = document.createElement('div');
  card.className = 'lib-card';
  const preview = document.createElement('div');
  preview.className = 'lib-card__preview';
  const swatch = document.createElement('div');
  swatch.className = 'lib-card__swatch';
  swatch.style.background = `var(${name})`;
  preview.appendChild(swatch);
  card.append(
    preview,
    elem('div', 'lib-card__name', name),
    elem('div', 'lib-card__value', `${rawValue}  →  ${resolveColor(name)}`),
  );
  return card;
}

function makeRadiusCard(name, value) {
  const card = document.createElement('div');
  card.className = 'lib-card';
  const preview = document.createElement('div');
  preview.className = 'lib-card__preview';
  const box = document.createElement('div');
  box.className = 'lib-card__radius-box';
  box.style.borderRadius = `var(${name})`;
  preview.appendChild(box);
  card.append(
    preview,
    elem('div', 'lib-card__name', name),
    elem('div', 'lib-card__value', value),
  );
  return card;
}

function makeSpacingCard(name, value) {
  const card = document.createElement('div');
  card.className = 'lib-card';
  const preview = document.createElement('div');
  preview.className = 'lib-card__preview';
  const bar = document.createElement('div');
  bar.className = 'lib-card__spacing-bar';
  bar.style.width = `var(${name})`;
  preview.appendChild(bar);
  card.append(
    preview,
    elem('div', 'lib-card__name', name),
    elem('div', 'lib-card__value', value),
  );
  return card;
}

/* Группируем `--font-*` токены в стили: h1, h2, lead, body, body-s, semibold-14
 * (плюс общий --font-family). Одна карточка = один стиль с превью и
 * параметрами (weight/size/line-height/letter-spacing). */
const FONT_PROPS = ['weight', 'size', 'line-height', 'letter-spacing'];

function parseFontToken(name) {
  if (name === '--font-family') return { kind: 'family' };
  for (const prop of FONT_PROPS) {
    if (name.endsWith('-' + prop)) {
      const prefix = name.slice('--font-'.length, name.length - prop.length - 1);
      return { kind: 'style', prefix, prop };
    }
  }
  return null;
}

function groupFontTokens(entries) {
  const styles = {};
  let family = null;
  for (const [name, value] of entries) {
    const parsed = parseFontToken(name);
    if (!parsed) continue;
    if (parsed.kind === 'family') family = value;
    else {
      (styles[parsed.prefix] ||= { name: parsed.prefix })[parsed.prop] = value;
    }
  }
  return { family, styles: Object.values(styles) };
}

function makeFontFamilyCard(value) {
  const card = document.createElement('div');
  card.className = 'lib-card lib-card--font';
  card.append(
    elem('div', 'lib-card__type-sample', 'The quick brown fox jumps over the lazy dog 1234'),
    elem('div', 'lib-card__name', '--font-family'),
    elem('div', 'lib-card__value', value),
  );
  return card;
}

function makeFontStyleCard(style) {
  const card = document.createElement('div');
  card.className = 'lib-card lib-card--font';

  // Превью — применяем utility-класс .text-<name>
  card.append(elem('div', `lib-card__type-sample text-${style.name}`,
    'The quick brown fox 1234'));

  // Имя стиля
  card.append(elem('div', 'lib-card__name', style.name));

  // Параметры — один dl со всеми свойствами
  const params = document.createElement('dl');
  params.className = 'lib-card__params';
  for (const prop of FONT_PROPS) {
    if (!(prop in style)) continue;
    params.append(elem('dt', null, prop));
    params.append(elem('dd', null, style[prop]));
  }
  card.append(params);

  return card;
}

function elem(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text != null) el.textContent = text;
  return el;
}

function renderGroup(root, title, entries, type) {
  if (!entries.length) return;
  const sorted = (type === 'palette') ? sortByGrade(entries) : entries;

  const section = document.createElement('section');
  section.className = 'lib-section';
  section.append(elem('h2', 'lib-section__title', title));
  const grid = document.createElement('div');
  grid.className = 'lib-grid';

  if (type === 'typography') {
    const { family, styles } = groupFontTokens(sorted);
    if (family) grid.appendChild(makeFontFamilyCard(family));
    for (const style of styles) grid.appendChild(makeFontStyleCard(style));
  } else {
    for (const [name, value] of sorted) {
      let card;
      switch (type) {
        case 'radius':  card = makeRadiusCard(name, value); break;
        case 'spacing': card = makeSpacingCard(name, value); break;
        default:        card = makeColorCard(name, value); break;
      }
      grid.appendChild(card);
    }
  }
  section.appendChild(grid);
  root.appendChild(section);
}

function renderSupersection(root, title, sub, items) {
  const wrapper = document.createElement('section');
  wrapper.className = 'lib-supersection';
  wrapper.append(elem('h2', 'lib-supersection__title', title));
  if (sub) wrapper.append(elem('p', 'lib-supersection__sub', sub));
  for (const [groupTitle, entries, type] of items) {
    renderGroup(wrapper, groupTitle, entries, type);
  }
  root.appendChild(wrapper);
}

function render() {
  const root = document.getElementById('app');
  const props = readCustomProps();
  const groups = categorize(props);

  renderSupersection(root, 'Примитивы',
    'Палитра базовых значений: чистые цвета и градации прозрачности. На них ссылаются семантические токены.',
    [
      ['Solid colors', groups['Solid colors'],         'color'],
      ['Brand',        groups['Brand'],                'palette'],
      ['Light',        groups['Light (alpha grades)'], 'palette'],
      ['Black',        groups['Black (alpha grades)'], 'palette'],
      ['White',        groups['White (alpha grades)'], 'palette'],
      ['Dark',         groups['Dark'],                 'palette'],
    ]
  );

  renderSupersection(root, 'Семантические токены',
    'Именованные значения для использования в компонентах. Цветовые ссылаются на примитивы через var(); radius / spacing / typography — независимые шкалы.',
    [
      ['Text',       groups['Text'],       'color'],
      ['Surface',    groups['Surface'],    'color'],
      ['Border',     groups['Border'],     'color'],
      ['Radius',     groups['Radius'],     'radius'],
      ['Spacing',    groups['Spacing'],    'spacing'],
      ['Typography', groups['Typography'], 'typography'],
    ]
  );
}

render();
