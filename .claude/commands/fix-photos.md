# /fix-photos

Проверяет URL'ы поля `photo` в `public/data/people.json`. Для 404 — ищет замену через Wikipedia REST API (thumbnail) или Wikimedia Commons (public domain). Покрывает R3.

## Аргумент

- `/fix-photos` — по всем людям.
- `/fix-photos <person-id>` — по одному.

## Алгоритм

1. **Собери цели:**
   ```bash
   jq '[.[] | {id, fullName, photo}]' public/data/people.json
   ```

2. **HEAD-проверка каждого URL.** Параллельно (xargs/curl):
   ```bash
   curl -sI -o /dev/null -w "%{http_code} %{url_effective}\n" "<url>"
   ```
   Категоризируй:
   - `200` → OK, не трогаем.
   - `404`/`410`/`500` → требует замены.
   - `301`/`302` → возможно работает по новой ссылке, проверь финальный код через `curl -sIL`.
   - timeout / connection error → пометить, спросить позже.

3. **Для каждого «требует замены»:**

   a. **Wikipedia REST API** (быстро, обычно даёт thumbnail хорошего качества):
      ```
      https://en.wikipedia.org/api/rest_v1/page/summary/<Page_Title>
      ```
      где `<Page_Title>` — из `fullName` (URL-encoded, пробелы → `_`).
      
      Из ответа возьми `thumbnail.source` (обычно 320×320) или `originalimage.source` (полное разрешение).

   b. Если REST API не вернул фото — **Wikimedia Commons** через categories:
      ```
      https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&titles=File:<filename>&iiprop=url&format=json
      ```

   c. **Проверка лицензии** — только если новый URL не с `upload.wikimedia.org`. Тогда WebFetch на страницу файла, ищи `Public domain` или CC0/CC-BY.

4. **Отчёт:**

   ```
   # fix-photos

   ## OK (без замены)
   - <id-1>: <url> (200)
   - <id-2>: <url> (200)
   ...

   ## Требуют замены
   ### <id-3>: <fullName>
   - Старый URL: <old> (404)
   - Найдено в Wikipedia REST: <new-url> (320×320, public domain)

   ### <id-4>: <fullName>
   - Старый URL: <old> (timeout)
   - Wikipedia REST не вернула фото. Wikimedia Commons: <new-url> (CC BY-SA 3.0)
   - ⚠️ Нужно проверить лицензию вручную.

   ## Не удалось найти
   - <id-5>: <fullName> — ни REST, ни Commons не дали результата

   ## Итог
   ✅ N работают, 🔄 M замен предложено, ❌ K не найдено
   ```

5. **Применение** — список замен, пользователь выбирает (`all` / `none` / `1,3`). Edit на конкретные `photo` поля.

6. **После применения** — попроси пользователя визуально открыть попап одного из заменённых людей в dev-режиме (`npm run dev`), чтобы убедиться, что фото грузится.

## Что НЕ делает

- Не оптимизирует фото (это R20 — отдельный одноразовый скрипт, после фиксации URL'ов).
- Не заменяет URL без явного подтверждения пользователя.
- Не использует фото с непрозрачной/коммерческой лицензией.

## Подсказки по производительности

- HEAD-чекинг 43 URL'ов параллельно через `xargs -P 10` или GNU `parallel` — секунды.
- Wikipedia REST не требует ключа и быстрый. Сначала всегда он.
- Wikimedia Commons — fallback, дороже по запросам.
