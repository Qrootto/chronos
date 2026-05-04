# Past Simple — Design Snapshot

Снимок состояния Figma на 2026-05-01. Источник истины для генерации кода. Перечитывать Figma имеет смысл, только если дизайн обновился.

Figma file key: `UWWMIMoOJUYRhoEk5byWs4`

---

## 1. Токены (Variables)

В Figma две коллекции:
1. **Примитивы** — получены через скриншоты от пользователя.
   - Solid: `red`, `green`, `blue`, `yellow`, `purple`
   - Black: 9 ступеней alpha (100/80/64/48/32/24/16/8/4)
   - White: 9 ступеней alpha
   - Light: 9 ступеней alpha (base #c9d5ff)
   - Dark: 2 solid shade (`/100` = #384059, `/48` = #5a6589 — именование `/48` стилистическое, не alpha)
   - Brand: `100` = #5c78db
   - **Итого 45 примитивов.**
2. **Семантические токены** — получены через MCP, все 38 чисто мапятся в примитивы.

### Засечённые из семантических токенов базовые значения

| Token | Value | Назначение |
|---|---|---|
| `Light/100` | `#c9d5ff` | Базовый светлый цвет (на тёмном фоне) |
| `brand/100` | `#5c78db` | Брендовый акцент (active states) |

### Surface (фоны)

| Token | Value |
|---|---|
| `surface/background/default` | `#1c1e25` |
| `surface/secondary/default` | `#c9d5ff7a` (Light/100 @ 48%) |
| `surface/tertiary/default` | `#c9d5ff3d` (Light/100 @ 24%) |
| `surface/header/primary/default` | `#c9d5ff14` (Light/100 @ 8%) |
| `surface/divider/primary/default` | `#c9d5ff52` |
| `surface/divider/secondary/default` | `#c9d5ff29` |
| `surface/icon/primary/default` | `#ffffff` |
| `surface/icon/secondary/default` | `#c9d5ffa3` |
| `surface/icon/secondary/hovered` | `#c9d5ffcc` |
| `surface/icon button/primary/hovered` | `#c9d5ff14` |

### Surface — категории людей

| Категория | Token | Color |
|---|---|---|
| politic | `surface/person/politic/default` | `#f95b70` |
| scientist | `surface/person/scientist/default` | `#4dc7a4` |
| businessman | `surface/person/businessman/default` | `#3ed6f5` |
| artist | `surface/person/artist/default` | `#ffdf86` |
| writer | `surface/person/writer/default` | `#de97ff` |

### Surface — checkbox

| Token | Value |
|---|---|
| `surface/checkbox/primary/default` | `#c9d5ff3d` |
| `surface/checkbox/primary/hovered` | `#c9d5ff52` |
| `surface/checkbox/primary/active` | `#5c78db` |

### Surface — lifeline

| Token | Value |
|---|---|
| `surface/lifeline/default` | `#384059` |
| `surface/lifeline/hovered` | `#5a6589` |

### Surface — category card hover

| Token | Value |
|---|---|
| `surface/category/primary/hovered` | `#c9d5ff0a` |

### Border

| Token | Value |
|---|---|
| `border/lineend` | `#f95b70` (метка "конец линии жизни"?) |
| `border/category` | `#c9d5ff14` |
| `border/checkbox/primary/default` | `#c9d5ff29` |
| `border/checkbox/primary/hovered` | `#c9d5ff3d` |
| `border/event/primary/default` | `#c9d5ff3d` |
| `border/event/primary/hovered` | `#c9d5ffa3` |
| `border/event/secondary/default` | `#c9d5ff7a` |
| `border/event/secondary/hovered` | `#c9d5ffcc` |
| `border/focus` | `#c9d5ffa3` |

### Text

| Token | Value |
|---|---|
| `text/primary/default` | `#c9d5ff3d` |
| `text/primary/hovered` | `#c9d5ff7a` |
| `text/primary/active` | `#c9d5ff` |
| `text/constant/white` | `#ffffff` |
| `text/constant/black` | `#1c1e25` |

### Типографика

Утверждено 2026-05-02 (зафиксировано пользователем при попапе):

| Назначение | Стиль | Токены |
|---|---|---|
| h1 (имя в попапе) | Inter Regular 48 | `--font-h1-*` |
| h2 (подзаголовки в попапе) | Inter SemiBold 24 | `--font-h2-*` |
| Lead (краткое описание года под таймлайном) | Inter Regular 24 | `--font-lead-*` |
| Body (основной текст) | Inter Regular 16 | `--font-body-*` |
| Body S (описание под именами «В это же время») | Inter Regular 14 | `--font-body-s-*` |
| Labels / имена / `Inter SemiBold 14` | Inter SemiBold 14 | `--font-semibold-14-*` |

---

## 2. Компоненты (что есть в Figma)

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

## 5. Утверждённые токены (2026-05-02)

### Border radius
| Token | Value |
|---|---|
| `radius/xs` | 2px |
| `radius/s` | 4px |
| `radius/m` | 8px |
| `radius/l` | 12px |
| `radius/xl` | 16px |
| `radius/xxl` | 24px |
| `radius/xxxl` | 32px |

### Spacing
| Token | Value |
|---|---|
| `spacing/2xs` | 4px |
| `spacing/xs` | 8px |
| `spacing/sm` | 12px |
| `spacing/md` | 16px |
| `spacing/lg` | 24px |
| `spacing/xl` | 32px |
| `spacing/2xl` | 48px |
| `spacing/3xl` | 64px |

«Битые» значения из макета (27/43/56/72) при переносе в код округляются к ближайшей ступени по моему усмотрению. Точечные нестандартные размеры компонентов выносим в `spacing/component/*` при необходимости.

---

## 6. Шкала времени и красная метка "сейчас"

- **Размер шкалы:** компонент `Timeline` = "вся история", где **1 пиксель = 1 год**.
- **Между разделителями веков:** ровно 100px (1 век).
- **Красная метка** на шкале (border/lineend `#f95b70`) = текущая дата (now). Позиция от разделителя XXI = `(currentYear - 2000) * 1px`. Сегодня (2026-05-02) метка стоит на ~26px правее разделителя XXI.
- В коде вычисляется как `(new Date().getFullYear() - 2000) * pxPerYear`, обновляется при загрузке страницы. Анимация "ползёт" не нужна — точность по году достаточна.

---

## 6. Состояние работы

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
