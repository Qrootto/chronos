# Деплой Chronos

## Где хостится

- **GitHub repo:** https://github.com/Qrootto/chronos (origin/main)
- **Production URL (всегда последний билд):** https://coruscating-entremet-9241f5.netlify.app/
- **Хостинг:** Netlify, бесплатный план. Подключён к GitHub repo, деплоит main автоматически.

⚠️ **Deploy preview vs production.** Netlify для каждого билда даёт временный URL вида `https://<deploy-hash>--coruscating-entremet-9241f5.netlify.app/`. Это **снимок конкретного коммита**, он не обновляется. Если смотришь не последние правки — ты на preview-URL'е. Production (постоянный) — без префикса с хешем.

## Как деплоить изменения

Любой `git push` в `main` → Netlify пересобирает и деплоит. Цикл занимает ~30–60 секунд.

```bash
# Локально
git add <files>
git commit -m "сообщение"
git push
# ~30 секунд ждём → live на coruscating-entremet-9241f5.netlify.app
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

## Будущее: свой домен

Когда купишь домен — зайти в Netlify → **Domain settings** → **Add custom domain** → ввести домен → Netlify даёт CNAME/A-записи → пропишешь у регистратора → через 5–30 минут домен указывает на сайт. HTTPS Netlify автоматически выпускает (Let's Encrypt).

## Не забывать

- `node_modules/`, `dist/`, `assets/Popup.{svg,png}` (тяжёлые исходники Figma) — в `.gitignore`, не пушим.
- Все рабочие данные (`people.json`, `events.json` и т.д.) лежат в `public/data/` — оттуда они попадают в production. Не клади туда секреты.
