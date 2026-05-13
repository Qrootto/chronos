/**
 * Перегенерирует URL фото с нужным значением `?width=`.
 *
 * Для Wikimedia Commons (`Special:FilePath/...?width=N`) сервер сам отдаёт
 * thumbnail указанного размера — это позволяет одной записи в `people.json`
 * обслуживать разные размеры в UI (попап 232×232, paired-secondary 120×120).
 *
 * Для не-Wikimedia URL параметр `width` просто становится лишним query
 * параметром — сервер его игнорирует.
 *
 * Если входной URL пустой/невалидный — возвращается как есть.
 */
export function resizePhotoUrl(url, width) {
  if (!url) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('width', String(width));
    return u.toString();
  } catch {
    return url;
  }
}
