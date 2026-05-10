# Past Simple — Design Snapshot

**Snapshot date:** 2026-05-10
**Source:** Figma file `UWWMIMoOJUYRhoEk5byWs4`

Снимок токенов и архитектуры дизайна. По правилу 2.2 глобального CLAUDE.md этот файл — **кэш**, не источник правды. Для токенов источник правды — `styles/tokens.css`. При расхождении доверяем коду.

---

## 1. Токены (Variables)

Двухуровневая структура: примитивы (палитра) + семантические токены, ссылающиеся на примитивы через `var()`.

### Примитивы — палитра

Шкала из 9 ступеней alpha (100/80/64/48/32/24/16/8/4) для каждого базового цвета:

| Группа | Base | Назначение |
|---|---|---|
| `--black-*` | `#1c1e25` | Тёмные оттенки и фоны |
| `--white-*` | `#ffffff` | Белые наложения |
| `--light-*` | `#c9d5ff` | Светлый текст и UI на тёмном фоне |
| `--dark-*` | `#3b5172` | Приглушённые акценты (lifeline и т.д.) |
| `--red-*` | `#f95b70` | Категория politic |
| `--green-*` | `#4dc7a4` | Категория scientist |
| `--blue-*` | `#3ed6f5` | Категория businessman |
| `--yellow-*` | `#feac39` | Категория artist |
| `--purple-*` | `#b697ff` | Категория writer |
| `--toxic-*` | `#c7ef42` | Категория musician |

Solid-токен без alpha-шкалы: `--brand: #8856fd`.

### Семантические — Text

| Token | Source | Назначение |
|---|---|---|
| `--text-primary` | `var(--light-100)` | Основной контрастный текст |
| `--text-primary-hovered` | `var(--light-48)` | |
| `--text-primary-active` | `var(--light-100)` | |
| `--text-secondary` | `var(--light-64)` | Hint-подписи |
| `--text-tertiary` | `var(--light-24)` | Приглушённый |
| `--text-white` | `var(--white-100)` | |
| `--text-black` | `var(--black-100)` | |
| `--text-century` | `var(--red-64)` | Подпись века «XX» сверху |

### Семантические — Surface (фоны)

| Token | Source | Назначение |
|---|---|---|
| `--surface-bg` | `var(--black-100)` | Фон страницы |
| `--surface-bg-secondary` | `var(--light-48)` | |
| `--surface-popup-bg` | `#18191d` | Фон попапа (отличается от `--surface-bg`) |
| `--surface-darkener` | `var(--black-64)` | Затемняющий слой под попапом |
| `--surface-header` | `var(--light-8)` | Шапка |
| `--surface-divider` | `var(--light-32)` | |
| `--surface-divider-secondary` | `var(--light-16)` | |
| `--surface-icon` | `var(--white-100)` | |
| `--surface-icon-secondary` | `var(--light-64)` | |
| `--surface-icon-tertiary` | `var(--black-100)` | Иконки на ярком фоне |
| `--surface-icon-button-hovered` | `var(--light-8)` | |
| `--surface-century` | `var(--red-64)` | Вертикальная линия-разделитель века |
| `--surface-category-hovered` | `var(--light-4)` | Карточка категории в сайдбаре при hover |

### Семантические — категории людей

| Категория | Token | Source |
|---|---|---|
| politic | `--surface-person-politic` | `var(--red-100)` |
| scientist | `--surface-person-scientist` | `var(--green-100)` |
| businessman | `--surface-person-businessman` | `var(--blue-100)` |
| artist | `--surface-person-artist` | `var(--yellow-100)` |
| writer | `--surface-person-writer` | `var(--purple-100)` |
| musician | `--surface-person-musician` | `var(--toxic-100)` |

### Семантические — Checkbox

| Token | Source |
|---|---|
| `--surface-checkbox` | `var(--light-24)` |
| `--surface-checkbox-hovered` | `var(--light-32)` |
| `--surface-checkbox-active` | `var(--brand)` |

### Семантические — Lifeline

| Token | Source |
|---|---|
| `--surface-lifeline` | `var(--dark-48)` |

Hover-цвет lifeline берётся не из статичного токена, а из категории человека через runtime CSS-переменную `--lifeline-hovered-color` — устанавливается JS на основе категории. Реализация: `styles/components/life-line.css`.

### Семантические — Border

| Token | Source | Назначение |
|---|---|---|
| `--border-lineend` | `var(--red-100)` | Красная метка «сейчас» |
| `--border-category` | `var(--light-8)` | |
| `--border-checkbox` | `var(--light-16)` | |
| `--border-checkbox-hovered` | `var(--light-24)` | |
| `--border-event` | `var(--light-16)` | |
| `--border-event-hovered` | `var(--light-64)` | |
| `--border-focus` | `var(--light-64)` | |

### Семантические — Event tick (точечное событие, less-than-year)

| Token | Source |
|---|---|
| `--surface-event-tick-default` | `var(--light-24)` |
| `--surface-event-tick-hovered` | `var(--light-32)` |

Отдельные токены, чтобы управлять цветом независимо от других вариантов event.

### Семантические — Connection

| Token | Source |
|---|---|
| `--connection-default` | `var(--light-24)` |

Линия связи между событиями двух людей — default цвет (без hover).

### Border radius

| Token | Value |
|---|---|
| `--radius-xs` | 2px |
| `--radius-s` | 4px |
| `--radius-m` | 8px |
| `--radius-l` | 12px |
| `--radius-xl` | 16px |
| `--radius-xxl` | 24px |
| `--radius-xxxl` | 32px |

### Spacing

| Token | Value |
|---|---|
| `--spacing-3xs` | 2px |
| `--spacing-2xs` | 4px |
| `--spacing-xs` | 8px |
| `--spacing-sm` | 12px |
| `--spacing-md` | 16px |
| `--spacing-lg` | 24px |
| `--spacing-xl` | 32px |
| `--spacing-2xl` | 48px |
| `--spacing-3xl` | 64px |
| `--spacing-4xl` | 72px |
| `--spacing-5xl` | 80px |
| `--spacing-6xl` | 180px |

«Битые» значения из макета (27/43/56) при переносе в код округляются к ближайшей ступени.

### Motion

| Token | Value | Назначение |
|---|---|---|
| `--motion-duration-fast` | 150ms | Hover, color, мини-state |
| `--motion-duration-base` | 250ms | Появление, layout-shift |
| `--motion-duration-slow` | 400ms | Большие переходы (попап slide-in) |
| `--motion-duration-xslow` | 1000ms | «Шлейф» при mouseout, плавное затухание |
| `--motion-ease-out` | `cubic-bezier(0.2, 0, 0, 1)` | Вход — стандарт |
| `--motion-ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Двусторонние state-переходы |
| `--motion-ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Лёгкий bounce/overshoot |

### Typography

Default `--font-family`: `Inter, system-ui, -apple-system, sans-serif`. Inter подключён self-hosted (variable-файл `/assets/fonts/InterVariable.woff2`, веса 100–900). Wildfire — display-шрифт, self-hosted (`/assets/fonts/Wildfire.woff2`).

| Стиль | Family | Weight | Size | Line height |
|---|---|---|---|---|
| h1 (имя в попапе, крупные акценты в about) | Wildfire | 400 | 64px | 1.1 |
| h2 (подзаголовки в попапе) | Inter Light | 300 | 24px | 22px |
| Lead (краткое описание года) | Inter Light | 300 | 24px | 34px |
| Body (основной текст в попапе) | Inter Light | 300 | 16px | 26px |
| Body S (описания «В это же время») | Inter Regular | 400 | 14px | 1.4 |
| Labels / имена / SemiBold 14 | Inter SemiBold | 600 | 14px | 1 |

---

## 2. Компоненты (что есть в Figma)

> ⚠️ Не сверено с кодом на 2026-05-10. Может содержать устаревшие данные. Использовать только как ориентир, перед работой проверить актуальность по CSS/HTML.

Из metadata фрейма Components (`365:2873`):

| Компонент | Состояния / варианты |
|---|---|
| **Year** | Default / Hovered / Active |
| **Timeline** | Size=L (1557×17), Size=S (329×20) |
| **Zoom** | (один вариант, 128×22) — контейнер для контролов зума |
| **Icon / arrow up**, **arrow down** | (без состояний — это иконки) |
| **Event dot** | 5 категорий × Default/Hovered (politic, scientist, business, art, writer) |
| **Checkbox** | Default / Hovered / Checked |
| **Checkbox + text** | (без вариантов) |
| **Divider** | Type=Primary (32×1), Type=Secondary (32×1) |
| **Event** (вертикальная полоса/блок мирового события) | 4 типа × Default/Hovered: Several years / One year / Less than year / Next century |
| **Selector** (в сайдбаре) | Default / Hovered / Active (288×56) |
| **Life line** | Default (3px) / Hovered (5px) |
| **Event caption** (текстовый ярлык события) | Orientation=Right/Left × Category=Politic/Businessman/Artist/Writer/Scientist |
| **Icon button / plus** | Default / Hovered (24px) |
| **Icon button / minus** | Default / Hovered (24px) |
| **Icon button / info** | Default / Hovered (32px) |
| **Icon button / burger** | Default / Hovered (32px) |
| **Icon** (универсальная) | Default / Hovered (24px) |
| **Header** | один вариант (1280×64) |
| **Popup** | один вариант (1046×682) |

---

## 3. Экраны

> ⚠️ Не сверено с кодом на 2026-05-10. Может содержать устаревшие данные. Использовать только как ориентир, перед работой проверить актуальность по CSS/HTML.

### Main screen (`379:3264`) — 1280×720

Источник истины: **`Main screen + different hovers`** (Sign-up file `nDUthmmm6tov5YEgmgq2oL`, node `8061:2965`) — там зафиксированы и hover-состояния, и связи, и Person-приклеивание справа.

- **Header** сверху, 64px (`y=0`).
- **Timeflow** — основная область `1280×613` на `y=72`, в ней:
  - **Метка века** `XX` сверху-слева. `top=0`, центрирована (`transform: translateX(-50%)`) на `left=202px`. Шрифт **Inter SemiBold 11**, цвет `--light-48`.
  - **Имена людей слева** (`x=4`), цвет = категория (Inter SemiBold 14 «политик» = #f95b70, «учёный» = #4dc7a4 и т.д.). Шаг по вертикали — **43px** (top=34, 77, 120, 163, 206, 249, 292, 335, 378, 421, 464, 507, 550).
  - Если линия начинается уже внутри экрана (Тьюринг, `x=550`) — имя ставится в начало линии, не на `x=4`.
  - Если линия уходит вправо за экран (Тесла) — имя приклеивается к **правому краю**, рядом polygon-стрелка вправо. Component-обёртка `.timeflow__person`.
  - **Life line** на `y={top_имени + 19}`. Default 3px, hovered 5px **+ opacity 0.48** + цвет `--surface-lifeline-hovered`.
  - **Event dot** 9×9 default, 11×11 hovered (donut с 3px дыркой). Цвет — категория.
  - **Вертикальные мировые события** (Event): `top=17, height=596`. Несколько типов (`--several-years` 117px, `--one-year` 30px, `--less-than-year` 1px). Hovered получает подпись над блоком (`y=-21`, Inter SemiBold 14, `--text-primary-hovered`).
  - **Дивайдер века** (между XVIII/XIX/XX/XXI) — отдельный `.event--secondary` (1px, цвет `--border-event-secondary` — ярче чем less-than-year).
  - **Connection** — вертикальная 1px **gradient-линия** между точкой первого человека и точкой второго: `linear-gradient(to bottom, <цвет-категории-1>, <цвет-категории-2>)`. Анимируется при hover события со связью.
  - **Event caption** (при hover точки) — пузырёк цвета категории, текст чёрный, ассиметричное скругление: `8/32/32/1` для ориентации `--right` (закрытый угол bl=1 указывает на точку). Padding `1px 7px 2px 5px`.
- **Year scale** — `1557×17` на `y=689`, выходит за края экрана (длиннее viewport).
- **Zoom controls** — 128×22, `x=1144, y=659`.

### Sidebar opened (`401:3406`) — 1280×720
- **Sidebar** слева, 288×720 (`Frame 223`)
- Timeflow сдвигается вправо: занимает `x=288, y=72`, width=992
- Внутри сайдбара — селекторы для людей и событий (Selector)
- Header остаётся 1280px на всю ширину

### Main screen / popup opened (`422:1251`) — 1280×720
- **Popup** — 1046×696, позиционирован `x=222, y=12`
- Левая видимая область таймлайна: ~222px
- Header, Timeline, Zoom — те же

### Hover-варианты (страница "Explanations")
- **Lifeline hovered** — линия жизни становится 5px
- **Event hovered** — точка события становится 11×11 + появляется Event caption (текст рядом с точкой)
- **World event hovered** — вертикальная полоса мирового события подсвечивается + появляется текстовая подпись сверху (например "1 мировая война")

---

## 4. Решения и отложенные пункты (зафиксировано 2026-05-01)

> ⚠️ Не сверено с кодом на 2026-05-10. Может содержать устаревшие данные. Использовать только как ориентир, перед работой проверить актуальность по CSS/HTML.

### Что добавим позже (после первой итерации в коде)
- **Категория `musician`** — токены и Event caption-вариант. Пользователь напомнит, я тоже напомню.
- **Дополнительные стили типографики** (Display, Body, Caption, Section heading и т.д.). Пока используем только Inter SemiBold 14.
- **Mobile / адаптив**, **Empty state**, **Popup "О проекте"**, **Loading state**.

### Что отменили
- **Категории мировых событий не нужны.** Все мировые события визуально одинаковые. Убрать `world.category` из данных можно позже при чистке.

### Что не нужно
- **Тени** — не используются.

### Header (расшифровано из скриншота)
- Слева: `Icon button / burger` (32px).
- Справа: `Icon button / info` (32px).
- Центр: `Timeline / Size=L` — мини-шкала по векам (XVIII / XIX / XX / XXI), viewport indicator (скруглённый прямоугольник вокруг текущей видимой области), вертикальные дивайдеры между веками, красная отметка `border/lineend` (#f95b70) — граница данных.
- Высота 64px, фон `surface/header/primary/default` (#c9d5ff14 на background).

### Popup (расшифровано из SVG `assets/Popup.svg` 2026-05-02)
- Контейнер: **1046×682, `rx=12`, fill `#18191D`** (NB: отличается от `surface-bg #1c1e25` — отдельный фон попапа; добавляем токен `--surface-popup-bg`).
- За попапом — `backdrop-filter: blur(4px)`: фон main screen блюрится.
- **Левая колонка** (`x≈8-336`):
  - Фото `328×328`, `rx=6`, на `(8, 8)`.
  - Под фото блок «В это же время»: заголовок на `y≈385` + 4 записи «имя (в цвете категории) + описание».
- **Правая колонка** (`x≈377-1014`, ширина ~637, паддинг справа 32):
  - Имя (Display, ~32px): начало `y≈51`, высота ~35.
  - Годовая шкала (Caption, ~10px): `y≈141-152` — три года: рождения, текущий, смерти.
  - **Life timeline (попап-вариант — НЕ Size=S=329×20!):**
    - Track: `637×3`, `y=162`, fill `#384059` (`surface/lifeline`).
    - Конец-жизни маркер: `x=1013, width=2`, fill `#F95B70` (`border/lineend`).
    - Точка-маркер «текущий момент»: `9×9`, `rx=4.5`, fill — цвет категории персоны (artist=`#FFDF86`).
  - Body основного события: `y≈215` (длинный multi-line).
  - Section heading: `y≈480`.
  - Body 2: `y≈510`.
- ⚠️ Расхождение со старой записью «Timeline / Size=S, 329×20»: фактический lifetimeline в попапе — `637×3`. Уточнить при возможности.
- Нужно добавить: **Icon button / close** (нет в текущих компонентах).

### Категории людей и связь с цветами
- politic — `#f95b70` (красный)
- scientist — `#4dc7a4` (зелёный)
- businessman — `#3ed6f5` (голубой)
- artist — `#ffdf86` (жёлтый)
- writer — `#de97ff` (фиолетовый)
- musician — TBD

В попапе у Дисней голубой → значит **businessman**. Зафиксировать в `roster.json` при актуализации.

---

## 5. Шкала времени и красная метка "сейчас"

> ⚠️ Не сверено с кодом на 2026-05-10. Может содержать устаревшие данные. Использовать только как ориентир, перед работой проверить актуальность по CSS/HTML.

- **Размер шкалы:** компонент `Timeline` = "вся история", где **1 пиксель = 1 год**.
- **Между разделителями веков:** ровно 100px (1 век).
- **Красная метка** на шкале (border/lineend `#f95b70`) = текущая дата (now). Позиция от разделителя XXI = `(currentYear - 2000) * 1px`. Сегодня (2026-05-02) метка стоит на ~26px правее разделителя XXI.
- В коде вычисляется как `(new Date().getFullYear() - 2000) * pxPerYear`, обновляется при загрузке страницы. Анимация "ползёт" не нужна — точность по году достаточна.

---

## 6. Состояние работы (на 2026-05-01)

> ⚠️ Не сверено с кодом на 2026-05-10. Может содержать устаревшие данные. Использовать только как ориентир, перед работой проверить актуальность по CSS/HTML.

| Раздел | Состояние |
|---|---|
| Семантические токены (resolved hex) | ✅ Получены |
| Примитивы (palette) | ✅ Получены через скриншоты |
| tokens.css (двухуровневый) | ✅ Сгенерирован |
| Цвета 5 категорий людей | ✅ (нет `musician` — отложено) |
| Категории мировых событий | ❌ Решили не использовать |
| Spacing scale | ✅ Утверждено (8 ступеней) |
| Border radius | ✅ Утверждено (xs/s/m/l/xl/xxl/xxxl) |
| Типографика | ✅ 1 стиль (остальные — позже) |
| Shadows | ❌ Не нужны |
| Components: states | ✅ |
| Components: Icon button / close | ⏳ Нужно добавить в Figma |
| Main screen layout | ✅ |
| Sidebar opened | ✅ |
| Popup | ✅ Структура понята |
| Hover screens | ✅ |
| Empty / Loading / Mobile | ⏳ После первой итерации |
| Popup "О проекте" | ⏳ После первой итерации |
