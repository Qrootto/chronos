# Деплой Past Simple

## Где хостится

- **GitHub repo:** https://github.com/Qrootto/chronos (origin/main) — имя репозитория исторически осталось `chronos`, не переименовываем.
- **Production URL:** https://past-simple.ru (apex). `www.past-simple.ru` редиректится на apex.
- **Fallback URL Cloudflare Pages:** https://chronos-5fa.pages.dev — всегда отдаёт последний билд, удобно для проверки в обход DNS.
- **Хостинг:** Cloudflare Pages, бесплатный тариф. Подключён к GitHub repo, деплоит main автоматически.

## История

Изначально хостили на Netlify. **2026-05-04** — мигрировали на Cloudflare Pages, потому что новая модель Netlify free tier (1 deploy ≈ 15 credits, 300 credits/мес ≈ 20 деплоев) перестала покрывать активную разработку. У Cloudflare Pages — 500 builds/мес и unlimited bandwidth.

## DNS-настройки

Регистратор домена: reg.ru. **DNS-управление: Cloudflare** (nameservers перенесены 2026-05-04).

Nameservers reg.ru → Cloudflare:
```
carl.ns.cloudflare.com
millie.ns.cloudflare.com
```

DNS-записи теперь редактируются в Cloudflare dashboard (раздел DNS / Records). Cloudflare Pages автоматически создаёт записи для apex/www при подключении custom domain через **CNAME flattening** (CF-фишка, позволяющая CNAME на корне домена).

HTTPS-сертификат — Let's Encrypt, выпускается Cloudflare автоматически и продлевается без участия.

⚠️ **Если нужно поменять DNS-запись** — делать в Cloudflare, не в reg.ru. Reg.ru теперь только держит регистрацию домена и ссылается на CF nameservers.

## Как деплоить изменения

Любой `git push` в `main` → Cloudflare Pages пересобирает и деплоит. Цикл занимает ~30-60 секунд.

```bash
# Локально
git add <files>
git commit -m "сообщение"
git push
# ~30 секунд ждём → live на past-simple.ru
```

## Build settings (на стороне Cloudflare Pages)

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Production branch:** `main`
- **Framework preset:** None
- **Root directory:** (default — корень репо)

Vite сам собирает: `index.html`, `tokens.html`, `components.html` и кладёт всё в `dist/` вместе с `dist/data/` и `dist/assets/<bundle>` (JS + CSS бандлы).

## URL-маршруты

В `public/_redirects` (формат Cloudflare Pages, совпадает с Netlify):

```
/library     /components.html  200
/library/    /components.html  200
```

`200` = rewrite (URL остаётся `/library`, контент берётся из `/components.html`).

Тут же можно добавить новые красивые URL по мере необходимости (`/tokens` → `/tokens.html` и т.п.).

## Структура сборки (что копируется в `dist/`)

- HTML: `index.html`, `tokens.html`, `components.html` (rollup-входные точки в `vite.config.js`).
- JS-бандлы: `dist/assets/<name>-<hash>.js`.
- CSS-бандлы: `dist/assets/<name>-<hash>.css`.
- Статика: всё что лежит в `public/` копируется как есть в `dist/` (включая `public/data/*.json` → `/data/*.json`, `public/_redirects` → `/_redirects`).

## Если нужно проверить production-сборку локально

```bash
npm run build     # собрать в dist/
npm run preview   # локальный сервер на http://localhost:4173/
```

⚠️ `npm run preview` (Vite) не обрабатывает `_redirects` — этот файл понимает только Cloudflare Pages в проде. Для проверки `/library` маршрута локально открывай напрямую `/components.html`.

## Лимиты Cloudflare Pages free tier

- **500 builds/месяц** — наш билд ~10 секунд, до ~3000 деплоев в месяц.
- **Unlimited bandwidth** — ограничений по трафику нет.
- **Unlimited requests** — нет лимита запросов.
- **1 concurrent build** (вторые в очереди — нам не критично).

Сайт продолжит работать в рамках free tier при любых разумных нагрузках на разработку.

## Не забывать

- `node_modules/`, `dist/`, `assets/Popup.{svg,png}` (тяжёлые исходники Figma) — в `.gitignore`, не пушим.
- Все рабочие данные (`people.json`, `events.json` и т.д.) лежат в `public/data/` — оттуда они попадают в production. Не клади туда секреты.
- `public/_redirects` — конфиг URL-маршрутов для Cloudflare Pages, версионируем в git.
