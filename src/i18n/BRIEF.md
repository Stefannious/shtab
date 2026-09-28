# Translation brief — «Штаб» (personal discipline app)

Source: `/home/claude/shtab/i18n/keys.json` — a JSON object. Each KEY is a Russian UI string; the VALUE is a context hint:
- `""` — ordinary UI text (labels, buttons, hints, toasts, exercise names, food names, technique cues)
- `"pattern"` — contains placeholders `{0}`, `{1}`… that the app fills at runtime (numbers, names, dates, other phrases)
- `"seed"` — demo content (habit/med/task/workout-day names) the user sees until they replace it
- `"head"` — static UI chrome
- `"plural:a|b|c"` — the key looks like `#word`; it is a noun that follows a number. The hint shows the Russian forms (1 / 2–4 / 5+).

Output: `/home/claude/shtab/i18n/<LANG>.json` — a JSON object with EXACTLY the same keys, each mapped to its translation (string). Write it in several parts if it is long (e.g. part files merged with a small python/node script), then validate:
`node /home/claude/shtab/i18n/validate.js <LANG>` must print `problems 0` and `missing 0`. Fix and re-run until it passes.

## Hard rules
1. Keep every placeholder `{0}`, `{1}`… exactly once; you may move them to fit grammar. Don't add new ones.
2. Never use the characters `<`, `>` or the straight double quote `"` in translations. For quotation marks use the language's typographic quotes (EN “ ”, DE „ “, ES « », UK « »). Apostrophes are fine.
3. Keep `\n` line breaks where the key has them.
4. Keep leading/trailing punctuation behaviour: if the key ends with `:` or `?` or `.` or `…`, so does the translation. Keep ` · ` separators, `—` dashes, `×`, `%`, `+`, numbers, emoji, `XP`, `PR`, `NOVA` as they are.
5. Plural keys (`#word`): value = forms joined by `|`. English/Spanish/German: 2 forms `one|other` (e.g. `set|sets`). Ukrainian: 3 forms `one|few|many` (e.g. `підхід|підходи|підходів`). Lowercase unless the language capitalizes nouns (German).
6. Words/phrases in the Russian key that start lowercase are usually fragments shown inside other text — keep them lowercase (except German nouns).
7. Very short labels (tab names like «Сегодня», «План», «Тело», «Прогресс», «Зал», weekday abbreviations «Пн»…) must stay short (≤ 10 characters; weekdays 2–3 letters).
8. Tone: friendly, direct, informal second person (EN “you”, UK «ти», ES «tú», DE «du»). Concise, like a premium consumer app. No exclamation overload.

## Glossary (use consistently)
| RU | EN | UK | ES | DE |
|---|---|---|---|---|
| Штаб (app name) | HQ | Штаб | Cuartel | Zentrale |
| привычка | habit | звичка | hábito | Gewohnheit |
| задача | task | завдання | tarea | Aufgabe |
| приём (таблетки) | dose | прийом | toma | Einnahme |
| таблетки и витамины | pills & vitamins | таблетки й вітаміни | pastillas y vitaminas | Tabletten & Vitamine |
| серия | streak | серія | racha | Serie |
| срыв (вредной привычки) | slip | зрив | recaída | Ausrutscher |
| пропуск | skip | пропуск | salto (día saltado) | Pause |
| подход | set | підхід | serie | Satz |
| повтор(ы) | rep(s) | повтор(и) | repetición/rep | Wiederholung(en) / Wdh. |
| рабочий вес | working weight | робоча вага | peso de trabajo | Arbeitsgewicht |
| рекорд | PR / personal record | рекорд | récord | Rekord |
| зал | gym | зала | gimnasio | Gym |
| тренировка | workout | тренування | entreno | Training |
| КБЖУ | macros | КБЖВ | macros | Makros |
| Б / Ж / У (белки/жиры/углеводы) | P / F / C | Б / Ж / В | P / G / C | E / F / K |
| ккал / г / кг / мин / ч | kcal / g / kg / min / h | ккал / г / кг / хв / год | kcal / g / kg / min / h | kcal / g / kg / Min. / Std. |
| Состояние (mood/energy/sleep check-in) | Check-in | Стан | Estado | Befinden |
| Закрыть день | Close the day | Закрити день | Cerrar el día | Tag abschließen |
| Разбор дня / недели | Day review / Weekly review | Розбір дня / тижня | Repaso del día / de la semana | Tagesrückblick / Wochenrückblick |
| Сейчас | Now | Зараз | Ahora | Jetzt |
| План (tab) | Plan | План | Plan | Plan |
| Тело (tab: gym + food) | Body | Тіло | Cuerpo | Körper |
| уровень / ранг / опыт | level / rank / XP | рівень / ранг / досвід | nivel / rango / XP | Level / Rang / XP |
| дисциплина | discipline | дисципліна | disciplina | Disziplin |
| норма (КБЖУ) | target | норма | objetivo | Ziel |
| перекус(ы) | snack(s) | перекус(и) | tentempié(s) | Snack(s) |
| пример (tag on demo items) | example | приклад | ejemplo | Beispiel |
| Фарфор / Шалфей / Пудра / Океан (color palettes) | Porcelain / Sage / Blush / Ocean | Порцеляна / Шавлія / Пудра / Океан | Porcelana / Salvia / Rubor / Océano | Porzellan / Salbei / Puder / Ozean |

Exercise names: use the standard gym name in the target language (EN “Barbell bench press”, “Lat pulldown”, “Romanian deadlift”…). Food names: natural everyday names (EN “Buckwheat, boiled”, “Cottage cheese 5%”, “Shawarma”). Ranks (Новобранец, Боец, Ветеран, Элита, Мастер, Легенда) and achievement titles: short, punchy equivalents. «УР {0}» is the compact “level” badge (EN “LV {0}”, UK «РІВ {0}», ES «NV {0}», DE «LV {0}»).
