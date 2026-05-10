// DATA SCHEMA — Past Simple project
// Agreed on 2026-04-27. Update this file when schema changes.
//
// Ниже идут JSDoc-описания форматов (для документации) и блок реальных
// экспортов в конце файла (источник правды по константам).

// ─── PERSON ───────────────────────────────────────────────────────────────────
// {
//   "id": "einstein",                  // snake_case, unique
//   "name": "Альберт Эйнштейн",        // display name in Russian
//   "fullName": "Albert Einstein",     // original language, for search/SEO
//   "born": 1879,
//   "died": 1955,
//   "category": "scientist",           // см. PERSON_CATEGORIES
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
//       "type": "collaboration",       // см. CONNECTION_TYPES
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

// ─── CATEGORY COLORS ──────────────────────────────────────────────────────────
// Источник правды по цветам категорий — styles/tokens.css
// (--surface-person-{category}). Здесь не дублируем.

// ─── EXPORTS — single source of truth for project constants ───────────────────

export const START_YEAR = 1850;
export const END_YEAR = 1950;

export const PERSON_CATEGORIES = [
  'writer',
  'artist',
  'scientist',
  'politician',
  'businessman',
  'musician',
];

export const CONNECTION_TYPES = [
  'collaboration',
  'friendship',
  'influence',
  'conflict',
  'teacher',
  'romantic',
];
