/* Обновление фото в data/people.json через Wikipedia REST API.
 *
 * Запуск: node js/build/refresh-photos.js
 *
 * Стратегия (для каждого person пробуем по очереди до первого успеха):
 *   1. en-wiki по fullName.
 *   2. en-wiki по {первое слово} + {последнее слово} fullName
 *      (для длинных middle-name'ов типа "Walter Elias Disney" → "Walter Disney").
 *   3. ru-wiki по name (русское имя).
 *   4. ru-wiki по first+last русского name.
 *
 * Все картинки на Wikipedia — Public Domain или CC, легально использовать. */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const FILE = path.join(ROOT, 'public/data/people.json');
const DELAY_MS = 250;   // мягкая пауза, чтобы не дёргать API слишком быстро

const people = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** Целевая ширина фото в попапе (retina-ready для блока ~320px wide). */
const TARGET_PHOTO_WIDTH = 600;

/** Из URL Wikimedia (originalimage.source / thumbnail.source) делаем
 *  стабильную ссылку на thumbnail заданной ширины через Special:FilePath.
 *  Это в десятки раз легче, чем оригинальная full-size картинка. */
function thumbUrl(sourceUrl, width) {
  if (!sourceUrl) return null;
  // Берём filename — последняя часть URL после '/'.
  const m = sourceUrl.match(/\/([^\/?#]+)(?:[?#]|$)/);
  if (!m) return sourceUrl;
  // filename в URL уже percent-encoded (например `%28`); декодируем для
  // последующего encodeURIComponent — иначе будет двойное кодирование.
  let filename;
  try { filename = decodeURIComponent(m[1]); } catch { filename = m[1]; }
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=${width}`;
}

/** Запрос /summary/{title}. Возвращает {photo, foundTitle} или null если 404 / без фото. */
async function fetchSummary(lang, title) {
  const slug = title.replace(/ /g, '_');
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`;
  const r = await fetch(url, {
    headers: { 'User-Agent': 'PastSimple/1.0 (https://github.com/Qrootto/chronos)' },
  });
  if (r.status === 404) return null;
  if (!r.ok) {
    console.log(`   [HTTP ${r.status}] ${url}`);
    return null;
  }
  const j = await r.json();
  // Тип "disambiguation" → не персональная страница
  if (j.type === 'disambiguation') return null;
  const source = j.originalimage?.source || j.thumbnail?.source || null;
  if (!source) return null;
  const photo = thumbUrl(source, TARGET_PHOTO_WIDTH);
  return { photo, foundTitle: j.title, lang };
}

/** Первое + последнее слово полного имени (без скобок). */
function shortenName(name) {
  if (!name) return null;
  // Убираем скобочные части типа "(Mark Zakharovich Shagal)"
  const stripped = name.replace(/\([^)]*\)/g, '').trim().replace(/\s+/g, ' ');
  const words = stripped.split(' ').filter(Boolean);
  if (words.length <= 2) return null;   // нечего сокращать
  return `${words[0]} ${words[words.length - 1]}`;
}

async function findPhoto(person) {
  const candidates = [];
  if (person.fullName) {
    candidates.push(['en', person.fullName]);
    const short = shortenName(person.fullName);
    if (short) candidates.push(['en', short]);
  }
  if (person.name) {
    candidates.push(['ru', person.name]);
    const shortRu = shortenName(person.name);
    if (shortRu) candidates.push(['ru', shortRu]);
  }

  for (const [lang, title] of candidates) {
    try {
      const r = await fetchSummary(lang, title);
      if (r) return r;
    } catch (e) {
      console.log(`   error ${lang}/${title}: ${e.message}`);
    }
  }
  return null;
}

console.log(`Обновляю фото для ${people.length} людей…\n`);

let okCount = 0;
let failCount = 0;

for (const p of people) {
  const r = await findPhoto(p);
  if (r) {
    p.photo = r.photo;
    okCount++;
    console.log(`✓ ${p.name.padEnd(28)} ← [${r.lang}] ${r.foundTitle}`);
  } else {
    failCount++;
    console.log(`✗ ${p.name.padEnd(28)}   (не найдено)`);
  }
  await sleep(DELAY_MS);
}

fs.writeFileSync(FILE, JSON.stringify(people, null, 2) + '\n', 'utf-8');

console.log(`\nГотово: ${okCount} ок, ${failCount} не найдено.`);
console.log(`Обновлён ${FILE}`);
