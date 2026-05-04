// DATA SCHEMA — Chronos project
// Agreed on 2026-04-27. Update this file when schema changes.

// ─── PERSON ───────────────────────────────────────────────────────────────────
// {
//   "id": "einstein",                  // snake_case, unique
//   "name": "Альберт Эйнштейн",        // display name in Russian
//   "fullName": "Albert Einstein",     // original language, for search/SEO
//   "born": 1879,
//   "died": 1955,
//   "category": "scientist",           // writer | artist | scientist | politician | businessman | musician
//   "nationality": "Германия",
//   "photo": "url-or-path",            // portrait, public domain
//   "bio": "Краткая биография 2–3 предложения.",
//   "events": [
//     {
//       "year": 1905,
//       "title": "Теория относительности",   // short label shown on timeline
//       "description": "Lead-абзац: 1-2 предложения, идут как popup__lead.",
//       // Опциональное поле — подзаголовки и подробный текст в попапе.
//       // Если есть — рендерятся в popup__text после lead.
//       "sections": [
//         {
//           "title": "Подзаголовок",
//           "body": "Подробный текст этой секции."
//         }
//       ]
//     }
//   ],
//   "connections": [
//     {
//       "personId": "bohr",            // id of the other person
//       "year": 1920,
//       "type": "collaboration",       // collaboration | friendship | influence | conflict | teacher | romantic
//       "description": "Встреча на Сольвеевском конгрессе."
//     }
//   ]
// }

// ─── WORLD EVENT ──────────────────────────────────────────────────────────────
// {
//   "id": "wwi",
//   "name": "Первая мировая война",
//   "startYear": 1914,                 // use startYear+endYear for spans
//   "endYear": 1918,
//   "year": null,                      // use year (not start/end) for single-year events
//   "description": "Текст для попапа."
// }

// ─── CATEGORY COLORS (from design) ────────────────────────────────────────────
// writer      → purple  (#9B59B6 approx)
// artist      → yellow  (#F1C40F approx)
// scientist   → green   (#2ECC71 approx)
// politician  → red     (#E74C3C approx)
// businessman → cyan    (#1ABC9C approx)
// musician    → TBD (will be defined in Figma)

// ─── TIME RANGE ───────────────────────────────────────────────────────────────
// 1880 – 1950
