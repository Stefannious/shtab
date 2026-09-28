// Штаб — sends reminders (morning plan, pills, evening check-in) to the user's devices.
// Runs every 10 minutes from .github/workflows/remind.yml. Logs contain only counts, never your data.
import { send } from './webpush.mjs';
const TOKEN = process.env.DATA_TOKEN, REPO = process.env.DATA_REPO || `${process.env.GITHUB_REPOSITORY_OWNER}/shtab-data`;
const API = process.env.GH_API || 'https://api.github.com', DRY = !!process.env.DRY_RUN, NOW = process.env.NOW ? new Date(process.env.NOW) : new Date();
const GRACE = 90; // minutes: GitHub sometimes starts scheduled runs late
if (!TOKEN) { console.log('::notice::Добавь секрет DATA_TOKEN (Settings → Secrets and variables → Actions), чтобы включить напоминания.'); process.exit(0); }
const H = { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
async function read(path) { const r = await fetch(`${API}/repos/${REPO}/contents/${path}`, { headers: H }); if (r.status === 404) return [null, null]; if (!r.ok) throw new Error(`read ${path}: HTTP ${r.status}`); const j = await r.json(); return [JSON.parse(Buffer.from(j.content, 'base64').toString('utf8') || 'null'), j.sha]; }
async function write(path, obj, sha, msg) { const r = await fetch(`${API}/repos/${REPO}/contents/${path}`, { method: 'PUT', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, content: Buffer.from(JSON.stringify(obj, null, 1)).toString('base64'), ...(sha ? { sha } : {}) }) }); return r.status; }
const T = {
  ru: { mt: 'Доброе утро', med: 'Пора принять', et: 'Закрой день', tasks: ['задача', 'задачи', 'задач'], habits: ['привычка', 'привычки', 'привычек'], today: (a) => `Сегодня: ${a}.`, gym: (n) => `Зал: ${n}.`, pills: (m) => `Утром: ${m}.`, free: 'На сегодня плана нет — добавь главное.', eb: (d, n) => `Сделано ${d} из ${n}. Отметь настроение и сон — 20 секунд.`, eb0: 'Отметь настроение и сон — 20 секунд.' },
  en: { mt: 'Good morning', med: 'Time to take', et: 'Close the day', tasks: ['task', 'tasks'], habits: ['habit', 'habits'], today: (a) => `Today: ${a}.`, gym: (n) => `Gym: ${n}.`, pills: (m) => `Morning: ${m}.`, free: 'No plan for today yet — add the main thing.', eb: (d, n) => `Done ${d} of ${n}. Log mood and sleep — 20 seconds.`, eb0: 'Log mood and sleep — 20 seconds.' },
  uk: { mt: 'Добрий ранок', med: 'Час прийняти', et: 'Закрий день', tasks: ['завдання', 'завдання', 'завдань'], habits: ['звичка', 'звички', 'звичок'], today: (a) => `Сьогодні: ${a}.`, gym: (n) => `Зала: ${n}.`, pills: (m) => `Зранку: ${m}.`, free: 'На сьогодні плану немає — додай головне.', eb: (d, n) => `Зроблено ${d} з ${n}. Відміть настрій і сон — 20 секунд.`, eb0: 'Відміть настрій і сон — 20 секунд.' },
  es: { mt: 'Buenos días', med: 'Hora de tomar', et: 'Cierra el día', tasks: ['tarea', 'tareas'], habits: ['hábito', 'hábitos'], today: (a) => `Hoy: ${a}.`, gym: (n) => `Gimnasio: ${n}.`, pills: (m) => `Por la mañana: ${m}.`, free: 'Aún no hay plan para hoy: añade lo principal.', eb: (d, n) => `Hecho ${d} de ${n}. Anota ánimo y sueño: 20 segundos.`, eb0: 'Anota ánimo y sueño: 20 segundos.' },
  de: { mt: 'Guten Morgen', med: 'Zeit für', et: 'Tag abschließen', tasks: ['Aufgabe', 'Aufgaben'], habits: ['Gewohnheit', 'Gewohnheiten'], today: (a) => `Heute: ${a}.`, gym: (n) => `Gym: ${n}.`, pills: (m) => `Morgens: ${m}.`, free: 'Noch kein Plan für heute – trag das Wichtigste ein.', eb: (d, n) => `${d} von ${n} erledigt. Stimmung und Schlaf eintragen – 20 Sekunden.`, eb0: 'Stimmung und Schlaf eintragen – 20 Sekunden.' },
};
function plural(lang, n, f) { if (f.length === 2) return f[n === 1 ? 0 : 1]; const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? f[0] : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? f[1] : f[2]; }
const mins = (hm) => { const m = /^(\d{1,2}):(\d{2})$/.exec(hm || ''); return m ? +m[1] * 60 + +m[2] : null; };

const [[meta], [tasks], [habits], [meds], [logs], [vapid], [subs, subsSha], [state, stateSha]] = await Promise.all(
  ['data/meta.json', 'data/tasks.json', 'data/habits.json', 'data/meds.json', 'data/logs.json', 'push/vapid.json', 'push/subs.json', 'push/state.json'].map(read));
const devices = Object.entries(subs || {});
if (!vapid || !devices.length) { console.log('no devices subscribed'); process.exit(0); }
const profile = (meta && meta.profile) || {}, lang = T[profile.lang] ? profile.lang : 'ru', L = T[lang];
const prefs = { morning: '08:50', meds: true, evening: '21:45', ...(profile.push || {}) };
const tz = profile.tz || 'Europe/Moscow';
const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' }).formatToParts(NOW).map((p) => [p.type, p.value]));
const today = `${parts.year}-${parts.month}-${parts.day}`, nowMin = +parts.hour * 60 + +parts.minute;
const wd = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[parts.weekday];
const log = (logs || {})[today] || {}, hv = log.h || {}, taken = log.m || {}, skipped = log.sk || {};
const onDay = (days) => !days || !days.length || days.map(Number).includes(wd);
const tasksToday = Object.values(tasks || {}).filter((t) => t && t.date === today);
const habitsToday = Object.entries(habits || {}).filter(([id, h]) => h && !h.archived && !h.bad && onDay(h.days) && (h.since || '0') <= today && !skipped[id]);
const doses = []; for (const [id, m] of Object.entries(meds || {})) { if (!m || !onDay(m.days) || (m.since || '0') > today) continue; for (const t of m.times || []) doses.push({ key: `${id}@${t}`, time: t, name: [m.name, m.dose].filter(Boolean).join(' '), taken: !!taken[`${id}@${t}`] }); }
const plan = ((meta && meta.plan && meta.plan.days) || []).find((d) => (d.wd || []).map(Number).includes(wd));
const due = (hm) => { const m = mins(hm); return m != null && nowMin >= m && nowMin - m <= GRACE; };
const st = state || {}; st.sent = st.sent || {}; const sent = new Set(st.sent[today] || []);
const out = [];
if (prefs.morning && due(prefs.morning) && !sent.has('morning')) {
  const openT = tasksToday.filter((t) => !t.done).length, hN = habitsToday.length, bits = [];
  if (openT) bits.push(`${openT} ${plural(lang, openT, L.tasks)}`); if (hN) bits.push(`${hN} ${plural(lang, hN, L.habits)}`);
  const am = doses.filter((d) => !d.taken && mins(d.time) < 12 * 60).map((d) => d.name);
  const body = [bits.length ? L.today(bits.join(', ')) : '', plan ? L.gym(plan.name) : '', am.length ? L.pills(am.join(', ')) : ''].filter(Boolean).join(' ') || L.free;
  out.push({ key: 'morning', title: L.mt, body, tag: 'morning' });
}
if (prefs.meds) { const byTime = {}; for (const d of doses) if (!d.taken && due(d.time) && !sent.has('m:' + d.key)) (byTime[d.time] ||= []).push(d);
  for (const [t, ds] of Object.entries(byTime)) out.push({ keys: ds.map((d) => 'm:' + d.key), title: `${L.med} · ${t}`, body: ds.map((d) => d.name).join(', '), tag: 'med-' + t }); }
if (prefs.evening && due(prefs.evening) && !sent.has('evening') && !log.mood) {
  const isDone = ([id, h]) => (h.kind === 'check' ? (+hv[id] || 0) >= 1 : (+hv[id] || 0) >= (+h.target || 1));
  const n = tasksToday.length + doses.length + habitsToday.length, d = tasksToday.filter((t) => t.done).length + doses.filter((x) => x.taken).length + habitsToday.filter(isDone).length;
  out.push({ key: 'evening', title: L.et, body: n ? L.eb(d, n) : L.eb0, tag: 'evening' });
}
if (!out.length) { console.log('nothing due'); process.exit(0); }
let okN = 0; const dead = [];
for (const n of out) for (const [id, sub] of devices) {
  if (DRY) { console.log('DRY', JSON.stringify({ title: n.title, body: n.body })); okN++; continue; }
  try { const r = await send(sub, { title: n.title, body: n.body, tag: n.tag, url: './' }, vapid, { topic: n.tag }); if (r.ok) okN++; else { console.log(`push HTTP ${r.status}`); if (r.status === 404 || r.status === 410) dead.push(id); } } catch (e) { console.log('push error', e.message); } }
for (const n of out) for (const k of n.keys || [n.key]) sent.add(k);
st.sent = { [today]: [...sent] }; st.last = NOW.toISOString();
if (!DRY) { let s = await write('push/state.json', st, stateSha, 'reminders'); if (s === 409 || s === 422) { const [, sha2] = await read('push/state.json'); await write('push/state.json', st, sha2, 'reminders'); }
  if (dead.length) { const [cur, sha] = await read('push/subs.json'); for (const id of dead) delete (cur || {})[id]; await write('push/subs.json', cur || {}, sha, 'remove expired device'); } }
console.log(`sent ${okN} notification(s) to ${devices.length} device(s)${dead.length ? `, removed ${dead.length} expired` : ''}`);
