# DEPLOY.md — Past Simple

Инструкция по выкладке проекта в production.

## Где живёт прод

- **Платформа:** Cloudflare Pages, бесплатный тариф. Подключён к GitHub repo, деплоит `main` автоматически.
- **Production URL:** `https://past-simple.ru` (apex). `www.past-simple.ru` редиректится на apex.
- **Fallback URL Cloudflare Pages:** `https://chronos-5fa.pages.dev` — всегда отдаёт последний билд, удобно для проверки в обход DNS.

  > Имя сайта на Cloudflare осталось `chronos-5fa` из истории — см. `DECISIONS.md` (2026-05-04, «Переименование Chronos → Past Simple»). Менять имя сайта на CF без переезда DNS не стоит, поэтому оставлено как есть.

- **GitHub repo:** `https://github.com/Qrootto/chronos` (`origin/main`) — имя репозитория исторически осталось `chronos`, не переименовываем (та же причина, та же запись в DECISIONS.md).

## Как деплоить

Любой `git push` в `main` → Cloudflare Pages пересобирает и деплоит. Цикл занимает ~30–60 секунд.

```bash
# Локально
git add <files>
git commit -m "сообщение"
git push
# ~30 секунд ждём → live на past-simple.ru
```

### Build settings (на стороне Cloudflare Pages)

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Production branch:** `main`
- **Framework preset:** None
- **Root directory:** (default — корень репо)
- **Env vars:** не используются.

Vite собирает 4 entry-point'а (см. `vite.config.js`): `index.html`, `tokens.html`, `components.html`, `privacy.html` → всё в `dist/` вместе с `dist/data/` и `dist/assets/<bundle>` (JS + CSS бандлы).

### Проверка production-сборки локально

```bash
npm run build     # собрать в dist/
npm run preview   # локальный сервер на http://localhost:4173/
```

⚠️ `npm run preview` (Vite) не обрабатывает `_redirects` — этот файл понимает только Cloudflare Pages в проде. Для проверки `/library` маршрута локально открывай напрямую `/components.html`.

## Особенности и лимиты тарифа

### Лимиты Cloudflare Pages free tier

- **500 builds/месяц** — наш билд ~10 секунд, до ~3000 деплоев в месяц на практике не упрёмся.
- **Unlimited bandwidth** — ограничений по трафику нет.
- **Unlimited requests** — нет лимита запросов.
- **1 concurrent build** (вторые в очереди — нам не критично).

Сайт продолжит работать в рамках free tier при любых разумных нагрузках на разработку.

### DNS-настройки

Регистратор домена: **reg.ru**. **DNS-управление: Cloudflare** (nameservers перенесены 2026-05-04).

Nameservers reg.ru → Cloudflare:
```
carl.ns.cloudflare.com
millie.ns.cloudflare.com
```

DNS-записи редактируются в Cloudflare dashboard (раздел DNS / Records). Cloudflare Pages автоматически создаёт записи для apex/www при подключении custom domain через **CNAME flattening** (CF-фишка, позволяющая CNAME на корне домена).

HTTPS-сертификат — Let's Encrypt, выпускается Cloudflare автоматически и продлевается без участия.

⚠️ **Если нужно поменять DNS-запись** — делать в Cloudflare, не в reg.ru. Reg.ru теперь только держит регистрацию домена и ссылается на CF nameservers.

### URL-маршруты

В `public/_redirects` (формат Cloudflare Pages, совпадает с Netlify):

```
/library     /components.html  200
/library/    /components.html  200
```

`200` = rewrite (URL остаётся `/library`, контент берётся из `/components.html`). Тут же можно добавить новые красивые URL по мере необходимости.

### Структура сборки

- HTML: `index.html`, `tokens.html`, `components.html`, `privacy.html` (rollup-входные точки в `vite.config.js`).
- JS-бандлы: `dist/assets/<name>-<hash>.js`.
- CSS-бандлы: `dist/assets/<name>-<hash>.css`.
- Статика: всё что лежит в `public/` копируется как есть в `dist/` (включая `public/data/*.json` → `/data/*.json`, `public/_redirects` → `/_redirects`).

### Не забывать

- `node_modules/`, `dist/`, `assets/Popup.{svg,png}` (тяжёлые исходники Figma) — в `.gitignore`, не пушим.
- Все рабочие данные (`people.json`, `events.json` и т.д.) лежат в `public/data/` — оттуда они попадают в production. Не клади туда секреты.
- `public/_redirects` — конфиг URL-маршрутов для Cloudflare Pages, версионируем в git.

## История миграций

### 2026-05-04 — Переезд Netlify → Cloudflare Pages

**Причина:** новая модель Netlify free tier (1 deploy ≈ 15 credits, 300 credits/мес ≈ 20 деплоев) перестала покрывать активную разработку.

**Что сделано:** перенесли репо на Cloudflare Pages (500 builds/мес, unlimited bandwidth), перенастроили DNS — nameservers reg.ru переехали на Cloudflare, DNS-записи теперь живут в CF dashboard. HTTPS — Let's Encrypt auto.

См. также `DECISIONS.md` → запись 2026-05-04 «Миграция Netlify → Cloudflare Pages».
