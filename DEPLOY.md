# Деплой Past Simple

## Где хостится

- **GitHub repo:** https://github.com/Qrootto/chronos (origin/main) — имя репозитория исторически осталось `chronos`, не переименовываем.
- **Production URL:** https://past-simple.ru (apex). `www.past-simple.ru` автоматически редиректится на apex.
- **Fallback URL Netlify:** https://coruscating-entremet-9241f5.netlify.app — всегда отдаёт последний билд, удобно для проверки в обход DNS.
- **Хостинг:** Netlify, бесплатный тариф. Подключён к GitHub repo, деплоит main автоматически.

## DNS-настройки

Регистратор: reg.ru. DNS-записи:

```
A    @    →  75.2.60.5      (apex Netlify)
A    www  →  75.2.60.5      (тот же IP, Netlify сам сделает редирект на apex)
```

HTTPS-сертификат — Let's Encrypt, выпускается Netlify автоматически и продлевается без участия.

⚠️ **Deploy preview vs production.** Netlify для каждого билда даёт временный URL вида `https://<deploy-hash>--coruscating-entremet-9241f5.netlify.app/`. Это **снимок конкретного коммита**, он не обновляется. Production — `https://past-simple.ru` (или fallback `coruscating-entremet-9241f5.netlify.app` без префикса с хешем).

## Как деплоить изменения

Любой `git push` в `main` → Netlify пересобирает и деплоит. Цикл занимает ~30-60 секунд.

```bash
# Локально
git add <files>
git commit -m "сообщение"
git push
# ~30 секунд ждём → live на past-simple.ru
```

## Build settings (на стороне Netlify)

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Branch to deploy:** `main`

Vite сам собирает: `index.html`, `tokens.html`, `components.html` и кладёт всё в `dist/` вместе с `dist/data/` и `dist/assets/<bundle>` (JS + CSS бандлы).

## Структура сборки (что копируется в `dist/`)

- HTML: `index.html`, `tokens.html`, `components.html` (rollup-входные точки в `vite.config.js`).
- JS-бандлы: `dist/assets/<name>-<hash>.js`.
- CSS-бандлы: `dist/assets/<name>-<hash>.css`.
- Статика: всё что лежит в `public/` копируется как есть в `dist/` (включая `public/data/*.json` → `/data/*.json`).

## Если нужно проверить production-сборку локально

```bash
npm run build     # собрать в dist/
npm run preview   # локальный сервер на http://localhost:4173/
```

## Ограничения Netlify free tier

- 100 GB bandwidth/месяц — для нашего объёма данных хватает с большим запасом.
- 300 build minutes/месяц — наш билд ~10 секунд, до ~1800 деплоев в месяц.
- 1 одновременный билд (нам не критично).

Сайт продолжит работать в рамках free tier при любых разумных нагрузках.

## Не забывать

- `node_modules/`, `dist/`, `assets/Popup.{svg,png}` (тяжёлые исходники Figma) — в `.gitignore`, не пушим.
- Все рабочие данные (`people.json`, `events.json` и т.д.) лежат в `public/data/` — оттуда они попадают в production. Не клади туда секреты.
