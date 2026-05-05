/* Типографические улучшения текстов.
 *
 * fixOrphans — убирает «висячие» однобуквенные предлоги/союзы в конце
 * строки. После них ставится non-breaking space, чтобы при переносе
 * слово не «прилипало» к ним отдельно.
 *
 * Покрытые слова (русский): в, с, у, о, и, а, я, к.
 *
 * Применение:
 *   - fixOrphans(string)         — для одиночной строки.
 *   - fixOrphansInTree(rootEl)   — обход всех text nodes внутри DOM-узла.
 *     Использовать после рендера контента (innerHTML / appendChild).
 */

const NBSP = ' ';
// Слово = пробел/начало строки + однобуквенный предлог/союз + ОБЫЧНЫЙ пробел.
// Заменяем последний пробел на NBSP. Используем positive lookbehind через
// группу: ([\s\xA0(>«„"'—–-]) — допустимый разделитель перед
// предлогом (пробел, начало строки/тега, скобки, кавычки, тире).
const ORPHAN_RE = /(^|[\s(«„"'>])([вусоикаяВСУОИКАЯ])\s(?=\S)/g;

export function fixOrphans(text) {
  if (typeof text !== 'string' || !text) return text;
  return text.replace(ORPHAN_RE, `$1$2${NBSP}`);
}

/** Обходит все text nodes внутри rootEl и применяет fixOrphans к каждому.
 *  Не модифицирует HTML-структуру, только текстовое содержимое. */
export function fixOrphansInTree(rootEl) {
  if (!rootEl) return;
  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null);
  let node;
  while ((node = walker.nextNode())) {
    const before = node.nodeValue;
    const after = fixOrphans(before);
    if (after !== before) node.nodeValue = after;
  }
}
