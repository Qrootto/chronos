# Chronos — Session log

Журнал состояния между сессиями. Обновляется в конце каждой сессии (Stop-hook напомнит). При старте новой сессии Claude должен прочитать этот файл первым делом.

---

## Last updated
2026-05-03 (вечер 2026-05-02 → пауза до 2026-05-03)

## Главное (не теряй между сессиями)

**Ментальная модель — `MAIN_SCREEN.md`.** Это источник истины. Координаты в Figma — иллюстрация одного состояния, **не задание раскладки**.

Главная формула: `x = (year − START_YEAR) × pxPerYear`. Сейчас `START_YEAR=1850, END_YEAR=1950, pxPerYear=12`.

Поведение sticky-имени:
- Линия видна и `born` виден → имя стоит на координате `born`, без стрелки.
- Линия частично в viewport, `born` за краем → имя приклеено к видимому концу линии, **без стрелки** (пользователь видит линию).
- Линия полностью за viewport → имя у ближайшего края со стрелкой (`◀ Имя` или `Имя ▶`) — индикатор «там есть человек».

Связи между людьми (`connections[]`) появляются **только при hover события**, рисуются как 1px gradient-линия от категории-А к категории-Б. Hover на любую из двух связанных точек рисует одну и ту же связь.

Подписи мировых событий скрыты, кроме меток веков (XIX, XX и т.п.) — они видны всегда.

---

## Состояние кода

### Готово
- Библиотека из 14 компонентов в `/components.html`: life-line, event-dot, divider, checkbox, year, icon-btn, selector, event, event-caption, zoom, time, focus, year-scale, timeline-mini.
- Композиты: Popup, Header, Sidebar, Timeflow.
- Дизайн-токены в `styles/tokens.css`: цвета, типографика (h1, h2, lead, body, body-s, semibold-14), spacing, radius. Карточки шрифтов на `/tokens.html` сгруппированы по стилю.
- **Slice 1 main screen в `index.html` + `js/main.js` + `js/timeflow.js` + `js/year-scale.js` + `styles/main-screen.css`.** Рендерит 10 рандомных людей по формуле, есть burger-toggle sidebar, синхронный горизонтальный скролл Timeflow и Year scale.

### НЕ готово (Slice 2 — интерактив)
- Hover на event-dot → event-caption + connection если есть `connections[]`.
- Click → popup.
- Sticky-имена при скролле (3 случая, см. MAIN_SCREEN.md).

### НЕ готово (Slice 3 — управление)
- Zoom +/− меняет `pxPerYear`, всё пересчитывается.
- Sidebar чекбоксы добавляют/удаляют людей.
- Year-scale hover.

### Открытые долги (BACKLOG.md)
- Кнопка close + «пара мелочей» в попапе.
- Особый попап для связанных событий (пары).
- Расхождение timeline-mini в Header (Figma 32×405, у нас 36×445).
- Категория `musician`, дополнительная типографика, mobile/empty/loading.

---

## С чего начать завтра

1. **Прочитать `MAIN_SCREEN.md`** — освежить ментальную модель.
2. `npm run dev` в `Chronos/` (vite, обычно :5174).
3. Открыть `http://localhost:5174/`, проверить Slice 1: рандом людей, линии жизни, точки, метки веков, year scale, sidebar по burger.
4. Если Slice 1 ОК у пользователя — переходить к **Slice 2** (интерактив). Начать с самого простого: hover на event-dot → caption (через CSS-only или delegated event listener в timeflow.js).

---

## Важные нюансы общения с пользователем

- Пользователь — дизайнер, не программист. В коде объяснять коротко, в тексте — простым языком (формулы через примеры).
- Не копировать макеты пиксель-в-пиксель. Реализуем правила, не статику. Hover-состояния в Figma — иллюстрация, не дефолт.
- Figma MCP экономим. Каждый фрейм читаем один раз → в `design-snapshot.md`. При rate-limit — пользователь экспортирует SVG/PNG в `Chronos/assets/`. Альтернативный fileKey для копии: `nDUthmmm6tov5YEgmgq2oL` (Sign-up).
- Большие SVG (>50k токенов): Read с `limit` или python/grep для извлечения координат, не читать целиком.
- Stop-хук в `.claude/settings.json` напомнит обновить SESSION.md (срабатывает если файл старше 10 мин).

---

## Файлы для быстрого доступа

| Что | Где |
|---|---|
| Ментальная модель экрана | `MAIN_SCREEN.md` |
| Дизайн-долг и беклог | `BACKLOG.md` |
| Снимок Figma (размеры, цвета) | `design-snapshot.md` |
| Схема данных | `data/_schema.js` |
| Геометрия попапа | `~/.claude/.../memory/chronos_popup_geometry.md` |
| Стартовая точка кода | `index.html` → `js/main.js` |
| Рендер Timeflow | `js/timeflow.js` |
| Рендер Year scale | `js/year-scale.js` |
| Раскладка main screen | `styles/main-screen.css` |
