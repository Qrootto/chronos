/* Генерация мета-данных компонентов для страницы /library:
 *  - какие токены (var(--*)) использует CSS компонента,
 *  - какие компоненты-атомы он встречает в demo (для составных).
 *
 * Запуск: автоматически перед `vite build` (см. package.json → prebuild).
 *
 * Источники:
 *  - styles/components/<name>.css — токены через regex var(--*).
 *  - components.html — для каждой секции <section data-component="X"> ищем
 *    в её demo-блоке классы, корни которых совпадают с известными атомами.
 *
 * Результат — public/data/components-meta.json:
 *  { "<component>": { "tokens": [...], "deps": [...] } } */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const COMPONENTS_DIR = path.join(ROOT, 'styles/components');
const HTML_FILE = path.join(ROOT, 'components.html');
const OUT_FILE = path.join(ROOT, 'public/data/components-meta.json');

// Список всех атомов = имена файлов без .css.
const componentFiles = fs.readdirSync(COMPONENTS_DIR).filter(f => f.endsWith('.css'));
const components = componentFiles.map(f => f.replace(/\.css$/, '')).sort();

// 1. Токены: для каждого компонента собираем все var(--xxx) в его CSS.
const tokensByComponent = {};
for (const c of components) {
  const css = fs.readFileSync(path.join(COMPONENTS_DIR, c + '.css'), 'utf-8');
  const tokens = new Set();
  const regex = /var\(\s*(--[a-zA-Z0-9_-]+)/g;
  let m;
  while ((m = regex.exec(css)) !== null) {
    tokens.add(m[1]);
  }
  tokensByComponent[c] = [...tokens].sort();
}

// 2. Зависимости: парсим components.html, для каждой <section data-component="X">
// извлекаем все классы внутри неё и оставляем только те, которые соответствуют
// другим атомам. Корень класса вытаскиваем как `name` из `name`, `name__elem`,
// `name--mod` (BEM).
const html = fs.readFileSync(HTML_FILE, 'utf-8');
const sectionRegex = /<section[^>]*data-component="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g;
const depsByComponent = {};
let s;
while ((s = sectionRegex.exec(html)) !== null) {
  const name = s[1];
  const body = s[2];
  const classRegex = /class="([^"]+)"/g;
  const roots = new Set();
  let cm;
  while ((cm = classRegex.exec(body)) !== null) {
    for (const cls of cm[1].split(/\s+/)) {
      const rootMatch = cls.match(/^([a-z][a-z0-9-]*?)(?:__|--|$)/);
      if (rootMatch) roots.add(rootMatch[1]);
    }
  }
  const deps = [...roots]
    .filter(r => components.includes(r) && r !== name)
    .sort();
  depsByComponent[name] = deps;
}

// 3. Объединяем в финальную структуру.
const meta = {};
for (const name of components) {
  meta[name] = {
    tokens: tokensByComponent[name] || [],
    deps: depsByComponent[name] || [],
  };
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(meta, null, 2) + '\n', 'utf-8');

const present = Object.keys(depsByComponent);
const missing = components.filter(c => !present.includes(c));
console.log(`✓ ${OUT_FILE}`);
console.log(`  ${components.length} компонентов, ${present.length} с demo в components.html`);
if (missing.length) {
  console.log(`  без demo (только токены): ${missing.join(', ')}`);
}
