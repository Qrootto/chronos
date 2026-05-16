/**
 * Локальный путь к фото человека (WebP, 458px = 2× retina от 229px display).
 * Файлы лежат в `public/assets/people/<id>.webp` (см. R24 P2 — скачаны
 * через скрипт с Wikimedia при `width=458`, переконвертированы в WebP).
 *
 * Используется в попапах событий (main 232×232, secondary paired 120×120)
 * и в about-эффекте hover-фото. Один размер на все use-case — браузер
 * scale'ит вниз без потерь, кэш переиспользуется.
 */
export function localPhotoPath(personId) {
  return `/assets/people/${personId}.webp`;
}

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
