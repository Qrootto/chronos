# /check

Проверяет целостность данных проекта. Запускается без аргументов: `/check`

## Что проверяется

1. **Схема people.json** — у каждого персонажа есть все обязательные поля: `id`, `name`, `fullName`, `born`, `died`, `category`, `nationality`, `photo`, `bio`, `events`, `connections`

2. **Двусторонность связей** — если у персонажа A есть связь с B, у B должна быть связь с A

3. **Корректность ссылок** — все `personId` в `connections` указывают на реально существующие `id` в `people.json`

4. **Схема events.json** — у каждого события есть `id`, `name`, `description` и либо `year`, либо `startYear`+`endYear` (не оба варианта одновременно)

5. **Синхронизация ростера** — все записи с `added: true` в `roster.json` реально присутствуют в `people.json` / `events.json`, и наоборот: все ID в базах есть в ростере

## Алгоритм

Запусти следующий Python-скрипт:

```python
import json

people = json.load(open('public/data/people.json', encoding='utf-8'))
events = json.load(open('public/data/events.json', encoding='utf-8'))
roster = json.load(open('public/data/roster.json', encoding='utf-8'))

errors = []
warnings = []

# 1. Схема people.json
required = ['id','name','fullName','born','died','category','nationality','photo','bio','events','connections']
for p in people:
    for field in required:
        if field not in p:
            errors.append(f"[people] {p.get('id','?')}: отсутствует поле '{field}'")

# 2. Двусторонность связей
ids = {p['id'] for p in people}
roster_all_ids = {r['id'] for r in roster['people']}
for p in people:
    for c in p.get('connections', []):
        pid = c.get('personId')
        if pid not in ids:
            if pid in roster_all_ids:
                warnings.append(f"[connections] {p['id']} → '{pid}': ещё не добавлен в базу (есть в ростере)")
            else:
                errors.append(f"[connections] {p['id']} → '{pid}': не найден ни в базе, ни в ростере")
        else:
            other = next(x for x in people if x['id'] == pid)
            reverse = [x for x in other.get('connections', []) if x.get('personId') == p['id']]
            if not reverse:
                errors.append(f"[connections] связь {p['id']} ↔ {pid} односторонняя (нет обратной у {pid})")

# 3. Схема events.json
for e in events:
    for field in ['id', 'name', 'description']:
        if field not in e:
            errors.append(f"[events] {e.get('id','?')}: отсутствует поле '{field}'")
    has_year = 'year' in e
    has_span = 'startYear' in e and 'endYear' in e
    if not has_year and not has_span:
        errors.append(f"[events] {e.get('id','?')}: нет ни 'year', ни 'startYear'+'endYear'")
    if has_year and has_span:
        warnings.append(f"[events] {e.get('id','?')}: есть и 'year', и 'startYear'/'endYear' — лишнее поле")

# 4. Синхронизация ростера
roster_people = {r['id']: r['added'] for r in roster['people']}
roster_events = {r['id']: r['added'] for r in roster.get('events', [])}
db_people_ids = {p['id'] for p in people}
db_event_ids = {e['id'] for e in events}

for rid, added in roster_people.items():
    if added and rid not in db_people_ids:
        errors.append(f"[roster] {rid}: added=true, но в people.json не найден")
for pid in db_people_ids:
    if pid not in roster_people:
        warnings.append(f"[roster] {pid}: есть в people.json, но не в ростере")

for rid, added in roster_events.items():
    if added and rid not in db_event_ids:
        errors.append(f"[roster] {rid}: added=true, но в events.json не найден")
for eid in db_event_ids:
    if eid not in roster_events:
        warnings.append(f"[roster] {eid}: есть в events.json, но не в ростере")

# Результат
print(f"\n{'='*50}")
print(f"Людей: {len(people)}  |  Событий: {len(events)}")
print(f"Ошибок: {len(errors)}  |  Предупреждений: {len(warnings)}")
print('='*50)
if errors:
    print("\n🔴 ОШИБКИ:")
    for e in errors: print(f"  {e}")
if warnings:
    print("\n🟡 ПРЕДУПРЕЖДЕНИЯ:")
    for w in warnings: print(f"  {w}")
if not errors and not warnings:
    print("\n✅ Всё в порядке")
```

## Вывод результата

Покажи пользователю вывод скрипта. Если есть ошибки — предложи исправить их прямо сейчас. Предупреждения — на усмотрение пользователя.
