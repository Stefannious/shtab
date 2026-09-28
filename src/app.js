(function(){
'use strict';
const STARTER = /*STARTER*/null;

/* ================= utils ================= */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const pad = n => String(n).padStart(2,'0');
const ymd = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parseYmd = s => { const a=String(s).split('-').map(Number); return new Date(a[0], (a[1]||1)-1, a[2]||1); };
const addDays = (s,n) => { const d=parseYmd(s); d.setDate(d.getDate()+n); return ymd(d); };
const todayStr = () => ymd(new Date());
const nowHM = () => { const d=new Date(); return pad(d.getHours())+':'+pad(d.getMinutes()); };
const wdOf = s => { const g=parseYmd(s).getDay(); return g===0?7:g; };
const diffDays = (a,b) => Math.round((parseYmd(b)-parseYmd(a))/864e5);
const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-5);
const clone = o => o===undefined ? undefined : JSON.parse(JSON.stringify(o));
const isObj = v => v!==null && typeof v==='object' && !Array.isArray(v);
function deepMerge(a,b){ const out = isObj(a) ? {...a} : {}; for(const k of Object.keys(b||{})){ const bv=b[k]; out[k] = (isObj(bv) && isObj(out[k])) ? deepMerge(out[k], bv) : clone(bv); } return out; }
const cap = s => s ? s.charAt(0).toUpperCase()+s.slice(1) : s;
const avg = a => a.reduce((x,y)=>x+y,0)/(a.length||1);
const WD = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const WDL = ['понедельник','вторник','среда','четверг','пятница','суббота','воскресенье'];
const ALLD = [1,2,3,4,5,6,7];
let fLong = new Intl.DateTimeFormat('ru-RU',{weekday:'long', day:'numeric', month:'long'});
let fDM = new Intl.DateTimeFormat('ru-RU',{day:'numeric', month:'short'});
let fDMY = new Intl.DateTimeFormat('ru-RU',{day:'numeric', month:'long', year:'numeric'});
let nf = new Intl.NumberFormat('ru-RU');
let DEC = ',';
function plural(n,a,b,c){ if(DICT){ const f=DICT['#'+a]; if(f){ const fs=f.split('|'), cat=PLR.select(Math.abs(n)); if(fs.length>=3) return fs[{one:0,few:1,many:2}[cat] ?? 1]; return fs[cat==='one'?0:1] ?? fs[0]; } } n=Math.abs(Math.round(n)); const m10=n%10, m100=n%100; if(m10===1&&m100!==11) return a; if(m10>=2&&m10<=4&&(m100<12||m100>14)) return b; return c; }
function dayLabel(s){ const t=todayStr(); if(s===t) return 'Сегодня'; if(s===addDays(t,1)) return 'Завтра'; if(s===addDays(t,-1)) return 'Вчера'; return cap(fLong.format(parseYmd(s))); }
const shortDate = s => fDM.format(parseYmd(s)).replace('.','');
function daysText(days){ const d=(days&&days.length) ? [...days].map(Number).sort() : ALLD; if(d.length===7) return _L('каждый день'); if(d.join()==='1,2,3,4,5') return _L('по будням'); if(d.join()==='6,7') return _L('по выходным'); return d.map(x=>WD[x-1]).join(', '); }
function num(v){ const n=parseFloat(String(v??'').replace(',','.')); return isFinite(n) ? n : NaN; }
const fmtW = w => { const n=num(w); return isFinite(n) ? String(Math.round(n*100)/100).replace('.',DEC) : '—'; };
function fmtClock(sec){ sec=Math.max(0,Math.floor(sec)); const h=Math.floor(sec/3600), m=Math.floor(sec%3600/60), s=sec%60; return (h ? h+':'+pad(m) : pad(m))+':'+pad(s); }
function fmtDur(min){ min=Math.round(min); return min<60 ? _L('{0} мин', min) : _L('{0} ч {1} мин', Math.floor(min/60), pad(min%60)); }
const clampInt = (v,a,b) => { const n=Math.round(Number(v)); return isFinite(n) ? Math.min(b,Math.max(a,n)) : a; };
const validDate = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s||'')) ? String(s) : null;
const validTime = s => { const m=String(s||'').match(/^(\d{1,2}):(\d{2})$/); if(!m) return null; const h=+m[1], mi=+m[2]; return (h<24&&mi<60) ? pad(h)+':'+pad(mi) : null; };
function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }

/* ================= i18n ================= */
const I18N = /*I18N*/{};
const LANGS = [['ru','Русский'],['en','English'],['uk','Українська'],['es','Español'],['de','Deutsch']]; // native names — never translated
const LOCALES = {ru:'ru-RU', en:'en-US', uk:'uk-UA', es:'es-ES', de:'de-DE'};
const LANG_AI = {en:'English', uk:'українська', es:'español', de:'Deutsch'};
const WD_RU = WD.slice(), WDL_RU = WDL.slice();
let LANG='ru', DICT=null, PLR=new Intl.PluralRules('ru-RU'), trObs=null;
function _L(k, ...a){ let s=(DICT && DICT[k]) || k; if(a.length) s=s.replace(/\{(\d+)\}/g,(m,i)=>{ const v=a[+i]; if(v==null||v===false) return ''; const sv=String(v); if(!DICT) return sv; if(DICT[sv]) return DICT[sv]; const t=sv.trim(); return (t && t!==sv && DICT[t]) ? sv.replace(t, DICT[t]) : sv; }); return s; }
function setLang(l){
  l = (l==='ru' || I18N[l]) ? l : 'ru'; LANG=l; DICT = l==='ru' ? null : I18N[l]; const loc=LOCALES[l]||'ru-RU';
  PLR=new Intl.PluralRules(loc);
  fLong=new Intl.DateTimeFormat(loc,{weekday:'long', day:'numeric', month:'long'}); fDM=new Intl.DateTimeFormat(loc,{day:'numeric', month:'short'}); fDMY=new Intl.DateTimeFormat(loc,{day:'numeric', month:'long', year:'numeric'}); nf=new Intl.NumberFormat(loc);
  DEC = l==='en' ? '.' : ',';
  const ws=new Intl.DateTimeFormat(loc,{weekday:'short'}), wl=new Intl.DateTimeFormat(loc,{weekday:'long'});
  for(let i=0;i<7;i++){ const d=new Date(2024,0,1+i); WD[i] = l==='ru' ? WD_RU[i] : cap(ws.format(d).replace('.','')); WDL[i] = l==='ru' ? WDL_RU[i] : wl.format(d); }
  document.documentElement.lang=l;
  if(trObs){ trObs.disconnect(); trObs=null; }
  trNode(document.body);
  if(DICT){ trObs=new MutationObserver(ms=>{ for(const m of ms){ if(m.type==='characterData') trTextNode(m.target); else if(m.type==='attributes') trAttrs(m.target); else m.addedNodes.forEach(trNode); } });
    trObs.observe(document.body,{subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['placeholder','aria-label','title']}); }
}
const CYRX=/[А-Яа-яЁё]/;
const lcf = s => { s=String(s||''); return LANG==='de' ? s : s.charAt(0).toLowerCase()+s.slice(1); };
function trText(s){ const t=s.trim(); if(!t) return null; let r=DICT[t];
  if(r==null){ const m=t.match(/^(.*?)([,:.!?…]+)$/); if(m && DICT[m[1]]!=null) r=DICT[m[1]]+m[2]; }
  if(r==null && t.includes(' · ')){ let any=false; const tp=t.split(' · ').map(p=>{ const x=DICT[p.trim()]; if(x!=null){ any=true; return x; } return p; }); if(any) r=tp.join(' · '); }
  if(r==null) return null; return s.match(/^\s*/)[0]+r+s.match(/\s*$/)[0]; }
function trTextNode(n){ const v=n.nodeValue; const src=(n.__tr!==undefined && v===n.__tr) ? n.__ru : v; if(!src || !CYRX.test(src)) return;
  if(!DICT){ if(v!==src) n.nodeValue=src; n.__tr=undefined; return; }
  const r=trText(src); if(r==null){ if(v!==src) n.nodeValue=src; return; } if(r!==v){ n.__ru=src; n.__tr=r; n.nodeValue=r; } }
function trAttrs(el){ if(!el || el.nodeType!==1) return; if(el.tagName==='OPTION' && !el.hasAttribute('value')) el.setAttribute('value', el.textContent);
  const o=el.__ruA||(el.__ruA={}); for(const a of ['placeholder','aria-label','title']){ const v=el.getAttribute(a); if(v==null) continue; const src=(o[a] && o[a][1]===v) ? o[a][0] : v; if(!CYRX.test(src)) continue;
    if(!DICT){ if(v!==src) el.setAttribute(a,src); continue; } const r=trText(src); if(r!=null && r!==v){ o[a]=[src,r]; el.setAttribute(a,r); } } }
function trNode(root){ if(!root) return; if(root.nodeType===3){ const p=root.parentElement; if(p && !p.closest('script,style,textarea,[data-notr]')) trTextNode(root); return; } if(root.nodeType!==1) return;
  if(root.closest('[data-notr]')) return; trAttrs(root); root.querySelectorAll('[placeholder],[aria-label],[title],option').forEach(trAttrs);
  const w=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode:n=>{ const p=n.parentElement; return p && !p.closest('script,style,textarea,[data-notr]') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; }});
  let n; while((n=w.nextNode())) trTextNode(n); }

/* ================= icons ================= */
const ICONS = {
  home:'<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8.5" stroke-dasharray="3.2 2.4"/>',
  tasks:'<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M8 12.2l2.8 2.8L16.5 9"/>',
  habits:'<path d="M12 21a6 6 0 0 0 6-6c0-4.5-3.5-6.5-4.5-11-2 2-3 4-3 6.5-1.2-.8-1.8-2-2-3C7 9.2 6 11.2 6 15a6 6 0 0 0 6 6z"/>',
  gym:'<path d="M2.5 10v4M5.5 7.5v9M18.5 7.5v9M21.5 10v4M5.5 12h13"/>',
  stats:'<path d="M5 20v-6M11 20V5M17 20v-9M3 20h18"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  minus:'<path d="M5 12h14"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  left:'<path d="M15 5l-7 7 7 7"/>',
  right:'<path d="M9 5l7 7-7 7"/>',
  send:'<path d="M4 12h15M13 6l6 6-6 6"/>',
  stop:'<rect x="6.5" y="6.5" width="11" height="11" rx="1.5"/>',
  flame:'<path d="M12 21a6 6 0 0 0 6-6c0-4.5-3.5-6.5-4.5-11-2 2-3 4-3 6.5-1.2-.8-1.8-2-2-3C7 9.2 6 11.2 6 15a6 6 0 0 0 6 6z"/>',
  play:'<path d="M8 5.5l11 6.5-11 6.5z"/>',
  pill:'<path d="M10.5 20.5a5 5 0 0 1-7-7l7-7a5 5 0 0 1 7 7z"/><path d="M7 10l7 7"/>',
  mood:'<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14.5c1 1.2 2.1 1.8 3.5 1.8s2.5-.6 3.5-1.8M9 9.5h.01M15 9.5h.01"/>',
  bolt:'<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  food:'<path d="M12 7.5c-1.6-1.3-5.2-1.4-6.6 1.3C4 11.6 5.6 17.3 8 19.6c1.2 1.1 2.6.9 4 .2 1.4.7 2.8.9 4-.2 2.4-2.3 4-8 2.6-10.8-1.4-2.7-5-2.6-6.6-1.3z"/><path d="M12 7.5c0-2 .9-3.5 3-4.2"/>',
  video:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10.5l5-3v9l-5-3z"/>',
  ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  camera:'<path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
  up:'<path d="M6 15l6-6 6 6"/>',
  down:'<path d="M6 9l6 6 6-6"/>',
  spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'
};
const ico = (n, cls='') => `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]||''}</svg>`;

/* ================= domain constants ================= */
const MUSCLES = ['Грудь','Спина','Плечи','Бицепс','Трицепс','Ноги','Ягодицы','Пресс','Кардио'];
const LIB = {
  'Грудь':['Жим штанги лёжа','Жим гантелей лёжа','Жим гантелей на наклонной','Разводка гантелей','Отжимания на брусьях','Отжимания','Сведения в кроссовере'],
  'Спина':['Подтягивания','Тяга штанги в наклоне','Тяга верхнего блока','Тяга гантели одной рукой','Горизонтальная тяга блока','Становая тяга','Гиперэкстензия'],
  'Плечи':['Жим штанги стоя','Жим гантелей сидя','Махи в стороны','Тяга к лицу','Махи в наклоне'],
  'Бицепс':['Подъём штанги на бицепс','Молотки','Подъём гантелей на бицепс','Сгибания на блоке'],
  'Трицепс':['Французский жим','Разгибания на блоке','Жим узким хватом','Отжимания от скамьи'],
  'Ноги':['Приседания со штангой','Жим ногами','Румынская тяга','Выпады','Разгибания ног','Сгибания ног','Подъём на носки'],
  'Ягодицы':['Ягодичный мост','Болгарские выпады','Отведение ноги в кроссовере'],
  'Пресс':['Скручивания','Планка','Подъём ног в висе','Ролик для пресса'],
  'Кардио':['Беговая дорожка','Велотренажёр','Эллипс','Скакалка']
};
const muscleOf = name => { for(const [m,arr] of Object.entries(LIB)) if(arr.includes(name)) return m; return ''; };
const AREAS = ['учёба','работа','личное','здоровье'];
const MOOD = ['','тяжело','так себе','нормально','хорошо','отлично'];
const HICONS = ['💧','📖','🏋️','🌙','🎓','🧘','🚶','🥗','☀️','🧠','✍️','🦷','🚭','📵','🍔','🎯'];
const RANKS = [{min:1,l:'E',n:'Новобранец'},{min:5,l:'D',n:'Боец'},{min:10,l:'C',n:'Ветеран'},{min:15,l:'B',n:'Элита'},{min:20,l:'A',n:'Мастер'},{min:30,l:'S',n:'Легенда'}];
const rankOf = L => RANKS.filter(r=>L>=r.min).pop();
function levelFrom(xp){ let L=1, need=100, rest=xp; while(rest>=need){ rest-=need; L++; need=100+50*(L-1); } return {level:L, into:rest, need}; }
const ACH = [
  {id:'t1', c:'I', t:'Первый шаг', d:'Выполнить первую задачу', test:s=>s.tasksDone>=1},
  {id:'t50', c:'50', t:'Машина', d:'50 выполненных задач', test:s=>s.tasksDone>=50},
  {id:'t200', c:'200', t:'Конвейер', d:'200 выполненных задач', test:s=>s.tasksDone>=200},
  {id:'s7', c:'7Д', t:'Неделя огня', d:'Серия 7 дней по любой привычке', test:s=>s.bestAny>=7},
  {id:'s30', c:'30Д', t:'Железная воля', d:'Серия 30 дней', test:s=>s.bestAny>=30},
  {id:'s100', c:'100', t:'Сотня', d:'Серия 100 дней', test:s=>s.bestAny>=100},
  {id:'w1', c:'W1', t:'В строю', d:'Первая тренировка', test:s=>s.wos>=1},
  {id:'w10', c:'W10', t:'Завсегдатай', d:'10 тренировок', test:s=>s.wos>=10},
  {id:'w50', c:'W50', t:'Железо', d:'50 тренировок', test:s=>s.wos>=50},
  {id:'pr1', c:'PR', t:'Новый рекорд', d:'Побить свой результат', test:s=>s.prs>=1},
  {id:'pr10', c:'PR10', t:'Рекордсмен', d:'10 личных рекордов', test:s=>s.prs>=10},
  {id:'p1', c:'100%', t:'Идеальный день', d:'Закрыть весь план дня', test:s=>s.perfect>=1},
  {id:'p7', c:'7×', t:'Семь идеальных', d:'7 идеальных дней', test:s=>s.perfect>=7},
  {id:'m7', c:'Rx7', t:'По расписанию', d:'7 дней подряд все приёмы', test:s=>s.meds7>=7},
  {id:'mo7', c:'M7', t:'Самонаблюдение', d:'7 отметок состояния', test:s=>s.moods>=7},
  {id:'n7', c:'КБЖУ', t:'В норме', d:'7 дней КБЖУ в пределах нормы', test:s=>s.kbju>=7},
  {id:'l5', c:'D', t:'Ранг D', d:'Достичь 5 уровня', lvl:true, test:s=>s.level>=5},
  {id:'l10', c:'C', t:'Ранг C', d:'Достичь 10 уровня', lvl:true, test:s=>s.level>=10},
  {id:'l20', c:'A', t:'Ранг A', d:'Достичь 20 уровня', lvl:true, test:s=>s.level>=20}
];

/* ================= state ================= */
const COLS = ['tasks','habits','meds','logs','workouts','meta','food','ev'];
const DEF_PROFILE = {name:'', ai:'NOVA', accent:'ink', voice:false, rest:90, start:null, nutriMode:'full'};
const S = { mode:'loading', cols:{}, ready:new Set(), tab:'home', lastTab:null, selDate:todayStr(), today:todayStr(),
  chat:[], thinking:false, ctl:null, aiOff:null, draft:null, closedWo:new Set(), techOpen:new Set(), foodDate:todayStr(), woT:null, exSel:null, modal:null };
COLS.forEach(c => S.cols[c] = new Map());
const P = () => ({...DEF_PROFILE, ...(S.cols.meta.get('profile')||{})});
const PALS = [
  {id:'porcelain', n:'Фарфор', sw:['#FFFFFF','#EFE2CE','#C4A177'], dot:'#1F1A15', dotD:'#C9A36A'},
  {id:'sage', n:'Шалфей', sw:['#FFFFFF','#DEE8D4','#95AE85'], dot:'#22382B', dotD:'#9DB889'},
  {id:'blush', n:'Пудра', sw:['#FFFFFF','#F2DDD7','#C99A8D'], dot:'#4A2530', dotD:'#D39C8E'},
  {id:'ocean', n:'Океан', sw:['#FFFFFF','#DCE6EE','#8EA7BD'], dot:'#1B2E40', dotD:'#8FB0CC'}];
const curTheme = () => { const t=P().theme||uiLoad().theme; return ['light','dark','auto'].includes(t)?t:'light'; };
const curPal = () => { const v=P().pal||uiLoad().pal; return PALS.some(x=>x.id===v)?v:'porcelain'; };
const DARKQ = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
function applyTheme(theme, pal){ const root=document.documentElement; theme=['light','dark','auto'].includes(theme)?theme:'light'; pal=PALS.some(x=>x.id===pal)?pal:'porcelain';
  const host=root.getAttribute('data-theme'), dark = theme==='dark' || (theme==='auto' && (host ? host==='dark' : !!(DARKQ && DARKQ.matches))), mode=dark?'dark':'light';
  if(root.dataset.mode!==mode) root.dataset.mode=mode; if(root.dataset.pal!==pal) root.dataset.pal=pal; if(root.dataset.accent) delete root.dataset.accent;
  const mc=document.querySelector('meta[name="color-scheme"]'); if(mc) mc.content=mode;
  const tc=document.querySelector('meta[name="theme-color"]'); if(tc){ const bg=getComputedStyle(root).getPropertyValue('--bg').trim(); if(bg && tc.content!==bg) tc.content=bg; }
  if(!S.previewTheme && !S.previewPal) uiSave({theme, pal}); }
function themeFade(){ if(REDUCE()) return; const r=document.documentElement; r.classList.add('theme-fade'); clearTimeout(themeFade.t); themeFade.t=setTimeout(()=>r.classList.remove('theme-fade'), 450); }
const UI_KEY='shtab-ui';
const curLang = () => { const l=P().lang||uiLoad().lang||'ru'; return (l==='ru'||I18N[l]) ? l : 'ru'; };
function syncLang(){ const l=curLang(); if(l!==LANG){ setLang(l); uiSave({lang:l}); if(S.modal) renderModal(true); } }
function uiLoad(){ try{ return JSON.parse(localStorage.getItem(UI_KEY)||'{}')||{}; }catch(e){ return {}; } }
function uiSave(o){ try{ const cur=uiLoad(); const nx={...cur, ...o}; if(JSON.stringify(nx)!==JSON.stringify(cur)) localStorage.setItem(UI_KEY, JSON.stringify(nx)); }catch(e){} }
const PLAN = () => { const p=S.cols.meta.get('plan')||{}; return {...p, days: Array.isArray(p.days) ? p.days : []}; };
const BODY = () => ((S.cols.meta.get('body')||{}).w) || {};
const logOf = d => S.cols.logs.get(d) || {};
const habitsAll = () => [...S.cols.habits.values()].filter(h=>!h.archived).sort((a,b)=>((a.order??99)-(b.order??99)) || String(a.since||'').localeCompare(String(b.since||'')) || String(a.name).localeCompare(String(b.name)));
const medsAll = () => [...S.cols.meds.values()].sort((a,b)=>String((a.times||[])[0]||'').localeCompare(String((b.times||[])[0]||'')) || String(a.name).localeCompare(String(b.name)));
const startDate = () => P().start || todayStr();

/* ================= store ================= */
let db = null;
const known = new Set(), queues = {};
const LS_KEY = 'shtab-local-v1';
const strip = o => { const r = clone(o||{}); delete r.id; return r; };
function applyLocal(col,id,data){ if(data===null) S.cols[col].delete(id); else S.cols[col].set(id, {...data, id}); }
function enqueue(path, fn){ const p=(queues[path]||Promise.resolve()).then(fn).catch(onWriteErr); queues[path]=p; return p; }
function onWriteErr(e){
  console.warn('write failed', e);
  const c = e && e.code;
  if(c==='invalid_argument') toast('Не получилось сохранить: у этого просмотра нет прав на запись.','bad');
  else if(c==='quota_exceeded') toast('База заполнена. Удали старые записи из истории.','bad');
  else if(c==='revoked'||c==='not_granted') toast('Доступ к данным отозван. Обнови страницу.','bad');
  else toast('Изменение не сохранилось. Проверь интернет и повтори.','bad');
}
function persistLocal(){ if(S.mode!=='local') return; const o={}; COLS.forEach(c=>{ o[c]=Object.fromEntries([...S.cols[c]].map(([k,v])=>[k,strip(v)])); }); lsSet(LS_KEY, JSON.stringify(o)); }
const Store = {
  set(col,id,data){
    jrec(col,id); trackW(col);
    const body=strip(data); applyLocal(col,id,body); changed();
    if(S.mode==='live'){ const path=col+'/'+id; known.add(path); return enqueue(path, ()=>db.doc(path).set(body)); }
    persistLocal(); return Promise.resolve();
  },
  merge(col,id,patch){
    jrec(col,id); trackW(col);
    patch=clone(patch); const cur=S.cols[col].get(id);
    applyLocal(col,id, deepMerge(cur ? strip(cur) : {}, patch)); changed();
    if(S.mode==='live'){
      const path=col+'/'+id; const existed = !!cur || known.has(path); known.add(path);
      const full = strip(S.cols[col].get(id));
      return enqueue(path, ()=> existed ? db.doc(path).update(patch) : db.doc(path).set(full));
    }
    persistLocal(); return Promise.resolve();
  },
  del(col,id){
    jrec(col,id); trackW(col);
    applyLocal(col,id,null); changed();
    if(S.mode==='live'){ const path=col+'/'+id; known.delete(path); return enqueue(path, ()=>db.doc(path).delete()); }
    persistLocal(); return Promise.resolve();
  }
};

/* ================= domain helpers ================= */
function scheduled(h,d){ const days=(h.days&&h.days.length)?h.days.map(Number):ALLD; return days.includes(wdOf(d)) && d >= (h.since||'0000'); }
function skipped(h,d){ return !!((logOf(d).sk||{})[h.id]); }
function hv(h,d){ let v=Number((logOf(d).h||{})[h.id]||0); if(h.link==='gym' && D.woDates.has(d)) v=Math.max(v,1); return v; }
function isDone(h,d){ const v=hv(h,d); return h.bad ? v===0 : v >= (h.target||1); }
function medScheduled(m,d){ const days=(m.days&&m.days.length)?m.days.map(Number):ALLD; return days.includes(wdOf(d)) && d >= (m.since||'0000'); }
function dosesOn(d){ const l=logOf(d).m||{}; const r=[]; for(const m of medsAll()){ if(!medScheduled(m,d)) continue; for(const tm of (m.times||[])){ const key=m.id+'@'+tm; r.push({key, med:m, time:tm, taken:!!l[key]}); } } return r.sort((a,b)=>a.time.localeCompare(b.time)); }
function taskSort(a,b){ const ta=a.time||'99', tb=b.time||'99'; return (Number(!!a.done)-Number(!!b.done)) || (ta<tb?-1:ta>tb?1:0) || ((b.prio|0)-(a.prio|0)) || String(a.createdAt||'').localeCompare(String(b.createdAt||'')); }
const tasksOn = d => (D.tbd.get(d)||[]).slice().sort(taskSort);
function overdue(){ const t=todayStr(), r=[]; for(const [d,arr] of D.tbd) if(d<t) for(const x of arr) if(!x.done) r.push(x); return r.sort((a,b)=>a.date.localeCompare(b.date)); }
function dayStats(d){
  if(D.dayCache.has(d)) return D.dayCache.get(d);
  let total=0, done=0;
  for(const h of habitsAll()) if(scheduled(h,d) && !skipped(h,d)){ if(h.bad){ if(hv(h,d)>0) total++; continue; } total++; if(isDone(h,d)) done++; }
  for(const x of dosesOn(d)){ total++; if(x.taken) done++; }
  for(const x of (D.tbd.get(d)||[])){ total++; if(x.done) done++; }
  const r={total, done, pct: total ? Math.round(done/total*100) : null};
  D.dayCache.set(d,r); return r;
}
function streakOf(h){
  const t=todayStr(); let d=t, s=0;
  if(!h.bad && scheduled(h,t) && !skipped(h,t) && !isDone(h,t)) d=addDays(t,-1);
  for(let i=0;i<1200;i++){ if(d < (h.since||t)) break; if(scheduled(h,d) && !skipped(h,d)){ if(isDone(h,d)) s++; else break; } d=addDays(d,-1); }
  return s;
}
function bestStreakOf(h){
  const t=todayStr(); let best=0, run=0, free=null, d=h.since||t;
  for(let i=0;i<1200 && d<=t;i++){ if(scheduled(h,d) && !skipped(h,d)){ if(isDone(h,d)){ run++; best=Math.max(best,run); } else if(d===t && !h.bad){} else if(!h.bad && run>0 && (free===null || diffDays(free,d)>=7)){ free=d; } else { run=0; free=null; } } d=addDays(d,1); }
  return best;
}
function progText(h,d){ const v=hv(h,d); if(h.bad) return v ? v+' '+plural(v,'срыв','срыва','срывов') : 'без срывов'; if(h.kind==='count') return `${_L('{0} из {1} {2}', v, h.target, h.unit||'')}`.trim(); if(h.kind==='time') return `${_L('{0} из {1} мин', v, h.target)}`; return v ? 'сделано' : 'не отмечено'; }
function kindLabel(h){ if(h.link==='gym') return _L('отмечается тренировкой'); if(h.bad) return _L('вредная · считаем срывы'); if(h.kind==='count') return `${_L('цель {0} {1}', h.target, h.unit||'')}`.trim(); if(h.kind==='time') return `${_L('цель {0} мин', h.target)}`; return daysText(h.days); }
function planDayFor(d){ return PLAN().days.find(x=>(x.wd||[]).map(Number).includes(wdOf(d))) || null; }
function nextPlanDay(t){ for(let i=1;i<=7;i++){ const d=addDays(t,i); const p=planDayFor(d); if(p) return {date:d, day:p}; } return null; }
const setMetric = s => { const w=num(s.w)||0, r=num(s.r)||0; return w>0 ? w*(1+r/30) : r; };
function lastFor(name){ const arr=D.exHist[name]||[]; for(let i=arr.length-1;i>=0;i--) if(!S.draft || arr[i].wid!==S.draft.id) return arr[i]; return null; }
function stockInfo(m){ if(m.stock===null || m.stock===undefined || m.stock==='') return null; const per=(Number(m.perDose)||1)*Math.max(1,(m.times||[]).length); const days=Math.floor(Number(m.stock)/per); return {stock:Number(m.stock), days}; }

/* ================= derived ================= */
const D = { xp:0, level:1, into:0, need:100, rank:RANKS[0], streak:{}, best:{}, disc7:null, ach:new Set(), st:{}, tbd:new Map(), dayCache:new Map(), wos:[], woDates:new Set(), exHist:{}, bestMetric:{}, woPR:{}, prCount:0 };
let baseline = null;
function derive(){
  const t=todayStr(); S.today=t; D.dayCache=new Map();
  const tbd=new Map(); for(const x of S.cols.tasks.values()){ if(!x.date) continue; if(!tbd.has(x.date)) tbd.set(x.date,[]); tbd.get(x.date).push(x); } D.tbd=tbd;
  const wos=[...S.cols.workouts.values()].filter(w=>w.finishedAt).sort((a,b)=>String(a.startedAt||a.date).localeCompare(String(b.startedAt||b.date)));
  D.wos=wos; D.woDates=new Set(wos.map(w=>w.date));
  const best={}, hist={}, woPR={}; let prc=0;
  for(const w of wos){ const prs=[]; for(const ex of (w.exercises||[])){ const done=(ex.sets||[]).filter(s=>s.done); if(!done.length) continue; const m=Math.max(...done.map(setMetric)); (hist[ex.name] ||= []).push({date:w.date, v:m, sets:done, wid:w.id, muscle:ex.muscle}); if(best[ex.name]!==undefined && m>best[ex.name]+1e-6) prs.push(ex.name); best[ex.name]=Math.max(best[ex.name]??-Infinity, m); } woPR[w.id]=prs; prc+=prs.length; }
  D.bestMetric=best; D.exHist=hist; D.woPR=woPR; D.prCount=prc;
  const hs=habitsAll(); D.streak={}; D.best={};
  D.frozen={}; for(const h of hs){ const si=streakInfo(h); D.streak[h.id]=si.s; D.frozen[h.id]=si.frozen; D.best[h.id]=bestStreakOf(h); }
  let xp=0, tasksDone=0, moods=0;
  for(const x of S.cols.tasks.values()) if(x.done){ tasksDone++; xp += 10 + ([0,3,6,10][x.prio|0]||0); }
  const allH=[...S.cols.habits.values()];
  const dates=new Set([...S.cols.logs.keys(), ...D.woDates]);
  for(const d of dates){ const l=logOf(d); for(const h of allH){ const v=hv(h,d); if(h.bad) xp-=5*v; else if(v>=(h.target||1)) xp+=5; } xp += 2*Object.values(l.m||{}).filter(Boolean).length; if(l.mood){ xp+=3; moods++; } }
  xp += 50*wos.length + 20*prc;
  let kbju=0; const TG=targets();
  for(const [,fd] of S.cols.food){ const it=(fd&&fd.items)||[]; if(!it.length) continue; xp+=2; if(TG){ const sm=sumFood(it); if(Math.abs(sm.kcal-TG.kcal)<=TG.kcal*.1 && sm.p>=TG.p*.9){ xp+=10; kbju++; } } }
  const start=startDate(); let perfect=0, medsRun=0, medsBest=0;
  for(let d=start, i=0; d<=t && i<800; d=addDays(d,1), i++){ const s=dayStats(d); if(s.total>=3 && s.done===s.total) perfect++; const ds=dosesOn(d); if(ds.length){ if(ds.every(x=>x.taken)){ medsRun++; medsBest=Math.max(medsBest,medsRun); } else if(d<t) medsRun=0; } }
  const bestAny=Math.max(0,...Object.values(D.best));
  const st={tasksDone, bestAny, wos:wos.length, prs:prc, perfect, meds7:medsBest, moods, kbju};
  const ach=new Set(); for(const a of ACH) if(!a.lvl && a.test(st)) ach.add(a.id);
  xp += 50*ach.size; xp=Math.max(0,xp);
  const L=levelFrom(xp); st.level=L.level;
  for(const a of ACH) if(a.lvl && a.test(st)) ach.add(a.id);
  Object.assign(D,{xp, level:L.level, into:L.into, need:L.need, rank:rankOf(L.level), ach, st});
  const ps=[]; for(let i=1;i<=7;i++){ const d=addDays(t,-i); if(d<start) break; const s=dayStats(d); if(s.total) ps.push(s.done/s.total); }
  if(!ps.length){ const s=dayStats(t); if(s.total) ps.push(s.done/s.total); }
  D.disc7 = ps.length ? Math.round(avg(ps)*100) : null;
  if(S.ready.size===COLS.length){
    const td=dayStats(t); const full = td.total>=3 && td.done===td.total;
    if(!baseline){ baseline={xp, level:L.level, ach:new Set(ach), full}; }
    else {
      if(xp>baseline.xp) xpPop(xp-baseline.xp);
      if(L.level>baseline.level) toast(`<b>${_L('Новый уровень · {0}', L.level)}</b>${_L('Ранг {0} — {1}', D.rank.l, esc(D.rank.n))}`,'big');
      for(const id of ach) if(!baseline.ach.has(id)){ const a=ACH.find(x=>x.id===id); if(a) toast(`<b>${_L('Достижение: {0}', esc(a.t))}</b>${esc(a.d)}`,'big'); }
      if(full && !baseline.full){ toast('<b>День закрыт на 100%</b>Весь план выполнен.','big'); setTimeout(celebrate, 60); }
      baseline={xp, level:L.level, ach:new Set(ach), full};
    }
  }
}

/* ================= render core ================= */
let rafP=false, dirty=false;
function changed(){ derive(); schedule(); }
function schedule(){ if(rafP) return; rafP=true; requestAnimationFrame(()=>{ rafP=false; render(false); }); }
function editingEl(){ const a=document.activeElement, v=$('#view'); return (a && v && v.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) ? a : null; }
function render(force){
  syncLang();
  renderChrome(); renderHero();
  const v=$('#view'); const ed=editingEl();
  if(ed && !force && !ed.dataset.keep){ dirty=true; return; }
  dirty=false;
  const same = S.lastTab===S.tab;
  const vals = same ? captureVals(v) : null;
  const fid = ed && ed.id && same ? ed.id : null; let sel=null;
  if(ed){ try{ sel=[ed.selectionStart, ed.selectionEnd]; }catch(e){} }
  v.innerHTML = (VIEWS[S.tab]||vHome)();
  if(vals) restoreVals(v, vals);
  if(fid){ const n=document.getElementById(fid); if(n){ n.focus({preventScroll:true}); if(sel && sel[0]!=null) try{ n.setSelectionRange(sel[0],sel[1]); }catch(e){} } }
  S.lastTab=S.tab;
  drawCharts($('#view'));
  applyPop();
}
function captureVals(root){ const o={}; root.querySelectorAll('input[id],textarea[id],select[id]').forEach(n=>{ if(n.type==='checkbox'||n.dataset.fresh) return; o[n.id]=n.value; }); return o; }
function restoreVals(root,o){ for(const id in o){ const n=root.querySelector('#'+CSS.escape(id)); if(n && !n.dataset.fresh && n.value!==o[id]) n.value=o[id]; } }
const TAB_ORDER=['home','tasks','habits','gym','food','progress'];
const REDUCE = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function transition(update, dir){
  const root=document.documentElement; root.dataset.dir = dir||'none';
  if(document.startViewTransition && !REDUCE()){ try{ document.startViewTransition(update); return; }catch(e){} }
  update();
  if(dir && dir!=='none' && !REDUCE()){ const v=$('#view'); v.classList.remove('enter','enter-back'); void v.offsetWidth; v.classList.add(dir==='back'?'enter-back':'enter'); setTimeout(()=>v.classList.remove('enter','enter-back'),600); }
}
function go(tab){
  const from=S.tab;
  if(tab===from){ closeModal(); window.scrollTo({top:0, behavior:REDUCE()?'auto':'smooth'}); return; }
  const dir = TAB_ORDER.indexOf(tab) >= TAB_ORDER.indexOf(from) ? 'fwd' : 'back';
  transition(()=>{ S.tab=tab; closeModal(true); render(true); window.scrollTo({top:0}); updMini(); }, dir);
}
function soft(update, dir){ transition(()=>{ update(); render(true); }, dir||'fade'); }

function renderChrome(){
  const p=P(), root=document.documentElement;
  const ui=uiLoad(); applyTheme(S.previewTheme || p.theme || ui.theme, S.previewPal || p.pal || ui.pal);
  $$('.tab').forEach(b=>{ const k=b.dataset.tab; b.classList.toggle('on', k===S.tab || (k==='plan'&&(S.tab==='tasks'||S.tab==='habits')) || (k==='body'&&(S.tab==='gym'||S.tab==='food'))); });
  { const tb=$('.tabbar'); if(tb){ const ti=[...tb.querySelectorAll(':scope > .tab')].findIndex(b=>b.classList.contains('on')); tb.style.setProperty('--ti', Math.max(0,ti)); tb.dataset.ti=ti; } }
  const h=new Date().getHours();
  const g = h<5 ? 'Доброй ночи' : h<12 ? 'Доброе утро' : h<18 ? 'Добрый день' : h<23 ? 'Добрый вечер' : 'Доброй ночи';
  $('#hello').innerHTML = p.name ? `${esc(g)},<br><em>${esc(p.name)}</em>` : esc(g);
  $('#today-lbl').textContent = fLong.format(new Date());
  { const tt = LANG==='ru' ? ('Штаб '+(p.name||'')).trim() : _L('Штаб')+(p.name?' · '+_L(p.name):''); if(document.title!==tt) document.title=tt; }
  $('#lv-rk').textContent = D.rank.l; $('#lv-t').textContent = _L('УР {0}', D.level); $('#lv-bar').style.width = Math.round(D.into/D.need*100)+'%';
  const cls = S.mode==='live' ? 'live' : S.mode==='local' ? 'local' : '';
  ['#sync','#sync2'].forEach(s=>{ const n=$(s); if(n) n.className='sync '+cls; });
  $('#sync').title = S.mode==='live' ? 'Синхронизировано' : S.mode==='local' ? 'Только этот браузер' : 'Подключение…';
  $('#sync-lbl').textContent = S.mode==='live' ? 'синхронизация' : S.mode==='local' ? 'локально' : 'подключение';
  if(IS_PWA && SY.cfg) syStatus();
  $('#brand-name').textContent = p.ai; $('#core-name').textContent = p.ai;
  const b=$('#banner');
  const bh = S.mode==='local' && !IS_PWA ? '<div class="banner">Синхронизация недоступна в этом окне: данные сохраняются только в этом браузере.</div>'
    : S.mode==='revoked' ? '<div class="banner">Доступ к данным закрыт. Обнови страницу или проверь доступ к ней.</div>' : '';
  if(b.innerHTML!==bh) b.innerHTML=bh;
  $('#hero').hidden = S.tab!=='home';

}

/* ================= hero / assistant UI ================= */
const CHIPS = [
  {l:'Что на сегодня?', q:'Что у меня сегодня? Коротко: задачи, привычки, приёмы, зал. Что главное?', tier:'quick'},
  {l:'Разбор дня', q:'Вечерний разбор: что я сделал сегодня, что осталось и что разумно перенести на завтра. Если предлагаешь перенос — спроси, перенести ли.', tier:'quick'},
  {l:'Программа в зал', a:'ai-plan'},
  {l:'Разбор недели', q:'Сделай разбор моей недели по данным: что получилось, где проседаю (привычки, сон, зал), и 3 конкретных шага на следующую неделю. Используй get_history, если нужно.', tier:'default'},
  {l:'Замотивируй', q:'Коротко замотивируй меня на сегодня, опираясь на мои реальные данные: серии, уровень, что осталось.', tier:'quick'}
];
function summaryHtml(){
  const t=todayStr();
  const tl=tasksOn(t).filter(x=>!x.done).length;
  const hl=habitsAll().filter(h=>scheduled(h,t)&&!skipped(h,t)&&!h.bad&&h.link!=='gym'&&!isDone(h,t)).length;
  const dl=dosesOn(t).filter(x=>!x.taken).length;
  const parts=[];
  if(tl) parts.push(`<b>${tl}</b> ${plural(tl,'задача','задачи','задач')}`);
  if(hl) parts.push(`<b>${hl}</b> ${plural(hl,'привычка','привычки','привычек')}`);
  if(dl) parts.push(`<b>${dl}</b> ${plural(dl,'приём','приёма','приёмов')}`);
  let s = parts.length ? _L('Осталось:')+' '+parts.join(' · ')+'.' : 'План на сегодня закрыт.';
  const day=planDayFor(t);
  if(S.draft) s+=' Тренировка идёт.'; else if(day && !D.woDates.has(t)) s+=` ${_L('Зал:')} <b>${esc(day.name)}</b>.`;
  if(S.aiOff) s+=`<br><span class="muted" style="font-size:12.5px">${esc(S.aiOff)}</span>`;
  return s;
}
function mdLite(src){
  const lines=esc(src).split('\n'); let html='', inList=false, para=[];
  const flush=()=>{ if(para.length){ html+='<p>'+para.join('<br>')+'</p>'; para=[]; } };
  for(const ln of lines){
    const m=ln.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/);
    if(m){ flush(); if(!inList){ html+='<ul>'; inList=true; } html+='<li>'+m[1]+'</li>'; continue; }
    if(inList){ html+='</ul>'; inList=false; }
    if(!ln.trim()){ flush(); continue; }
    para.push(ln.replace(/^#+\s*/,''));
  }
  flush(); if(inList) html+='</ul>';
  return html.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
}
function orbSpeed(fast){ const core=$('#core'); core.classList.toggle('thinking', fast); try{ core.querySelectorAll('.r,.pulse').forEach(n=>n.getAnimations().forEach(a=>{ if(a.updatePlaybackRate) a.updatePlaybackRate(fast?4:1); else a.playbackRate=fast?4:1; })); }catch(e){} }

/* ================= views ================= */
function agenda(t){
  const items=[];
  for(const x of dosesOn(t)) items.push({time:x.time, o:1, done:x.taken, html:`<button class="chk ${x.taken?'on':''}" data-a="med-toggle" data-k="${esc(x.key)}" aria-label="${_L('Приём')}">${ico('check')}</button><button class="main-t" data-a="edit-med" data-id="${x.med.id}"><span class="ttl">${esc(x.med.name)}</span><span class="sub">${[x.med.dose,x.med.food].filter(Boolean).map(s=>`<span>${esc(s)}</span>`).join('')}</span></button><span class="kind">${_L('приём')}</span>`});
  for(const x of tasksOn(t)) items.push({time:x.time||'', o:2, p:x.prio|0, done:!!x.done, sw: x.done?'':`data-swl="task-later" data-swl-id="${x.id}" data-swl-t="${x.time?_L('Через час'):_L('Завтра')}"`, html:`<button class="chk ${x.done?'on':''}" data-a="toggle-task" data-id="${x.id}" aria-label="${_L('Задача')}">${ico('check')}</button><button class="main-t" data-a="edit-task" data-id="${x.id}"><span class="ttl">${esc(x.title)}</span><span class="sub">${x.area?`<span>${esc(x.area)}</span>`:''}${x.prio?`<span class="prio p${x.prio}">${'!'.repeat(x.prio)}</span>`:''}</span></button><span class="kind">${_L('задача')}</span>`});
  const day=planDayFor(t), gd=D.woDates.has(t);
  if(day || gd || S.draft){
    const nm = S.draft ? S.draft.name : gd ? (D.wos.filter(w=>w.date===t).pop()||{}).name : day.name;
    const btn = gd ? `<span class="chk on">${ico('check')}</span>` : S.draft ? `<button class="chk" data-a="tab" data-tab="gym" aria-label="${_L('Открыть тренировку')}">${ico('play','sm')}</button>` : `<button class="chk" data-a="gym-start" data-id="${day.id}" aria-label="${_L('Начать тренировку')}">${ico('play','sm')}</button>`;
    items.push({time:'', o:3, done:gd, html:`${btn}<button class="main-t" data-a="tab" data-tab="gym"><span class="ttl">${_L('Тренировка: {0}', esc(nm||''))}</span><span class="sub"><span>${S.draft?'идёт сейчас':gd?'завершена':'по плану'}</span></span></button><span class="kind">${_L('зал')}</span>`});
  }
  for(const h of habitsAll()){ if(!scheduled(h,t)||skipped(h,t)||h.bad||h.link==='gym') continue; const dn=isDone(h,t); items.push({time:'', o:4, done:dn, sw:`data-swl="habit-skip" data-swl-id="${h.id}" data-swl-t="${_L('Пропустить')}"`, html:`<button class="chk ${dn?'on':''}" data-a="habit-fill" data-id="${h.id}" aria-label="${_L('Привычка')}">${ico('check')}</button><button class="main-t" data-a="habit-open" data-id="${h.id}"><span class="ttl">${esc(h.name)}</span><span class="sub"><span>${esc(progText(h,t))}</span>${h.cue?`<span>${esc(h.cue)}</span>`:''}</span></button><span class="kind">${_L('привычка')}</span>`}); }
  items.sort((a,b)=> (a.time||'99:99').localeCompare(b.time||'99:99') || (a.o-b.o) || ((b.p||0)-(a.p||0)));
  const st=dayStats(t);
  return `<div class="sec-h"><h2>${_L('Сегодня по порядку')}</h2><span class="aside num">${st.done}/${st.total}</span></div>
  <div class="hud list">${items.length ? items.map(i=>`<div class="row ${i.done?'done':''}" ${i.sw||''}><span class="time ${i.time?'':'none'}">${i.time||'—'}</span>${i.html}</div>`).join('') : '<div class="empty">План на сегодня пуст. Добавь задачу или привычку.</div>'}</div>
  <div class="btns" style="margin-top:10px"><button class="btn sm" data-a="new-task">${ico('plus','sm')}${_L('Задача')}</button><button class="btn sm" data-a="new-habit">${ico('plus','sm')}${_L('Привычка')}</button><button class="btn sm" data-a="new-med">${ico('plus','sm')}${_L('Таблетка')}</button></div>`;
}

function taskRow(x, showDate){
  const pr=x.prio|0;
  return `<div class="row ${x.done?'done':''}" ${x.done?'':`data-swl="task-later" data-swl-id="${x.id}" data-swl-t="${x.time?_L('Через час'):_L('Завтра')}"`}><button class="chk ${x.done?'on':''}" data-a="toggle-task" data-id="${x.id}" aria-label="${x.done?'Вернуть':'Выполнить'}">${ico('check')}</button><button class="main-t" data-a="edit-task" data-id="${x.id}"><span class="ttl">${esc(x.title)}</span><span class="sub">${x.time?`<span class="mono">${x.time}</span>`:''}${showDate?`<span>${esc(shortDate(x.date))}</span>`:''}${x.area?`<span>${esc(x.area)}</span>`:''}${x.note?`<span>${esc(x.note.slice(0,70))}</span>`:''}</span></button>${pr?`<span class="prio p${pr}" title="${_L('Приоритет')}">${'!'.repeat(pr)}</span>`:''}</div>`;
}
function vTasks(){
  const sel=S.selDate, t=todayStr(), mon=addDays(sel, 1-wdOf(sel));
  let days=''; for(let i=0;i<7;i++){ const d=addDays(mon,i), arr=D.tbd.get(d)||[], open=arr.filter(x=>!x.done).length; days+=`<button class="wd ${d===t?'today':''} ${d===sel?'sel':''}" data-a="sel-day" data-d="${d}" aria-label="${esc(dayLabel(d))}"><span>${WD[i]}</span><b>${parseYmd(d).getDate()}</b>${arr.length?`<i class="dot ${open?'':'all'}"></i>`:''}</button>`; }
  const arr=tasksOn(sel), open=arr.filter(x=>!x.done), done=arr.filter(x=>x.done), od = sel===t ? overdue() : [];
  return `<div class="page-h"><div><h1>${_L('Задачи')}</h1><p>${_L('{0}{1} · открыто {2}', esc(dayLabel(sel)), sel!==t&&sel!==addDays(t,1)&&sel!==addDays(t,-1)?'':' · '+esc(fDMY.format(parseYmd(sel))), open.length)}</p></div><div class="btns">${sel!==t?`<button class="btn sm" data-a="sel-day" data-d="${t}">${_L('Сегодня')}</button>`:''}<button class="btn sm" data-a="new-task" data-d="${sel}">${ico('plus','sm')}${_L('Подробно')}</button></div></div>
  <div class="week"><button class="btn sm icon" data-a="week" data-v="-7" aria-label="${_L('Прошлая неделя')}">${ico('left','sm')}</button><div class="week-days">${days}</div><button class="btn sm icon" data-a="week" data-v="7" aria-label="${_L('Следующая неделя')}">${ico('right','sm')}</button></div>
  <form class="addbar" data-f="quick-task" autocomplete="off"><input class="inp" id="qt-title" data-keep="1" placeholder="${_L('Новая задача: {0}', esc(lcf(_L(dayLabel(sel)))))}" maxlength="200" enterkeyhint="done" aria-label="${_L('Новая задача')}"><input class="inp t-in" id="qt-time" type="time" aria-label="${_L('Время')}"><button class="btn pri icon" type="submit" aria-label="${_L('Добавить')}">${ico('plus')}</button></form>
  ${od.length?`<div class="hud overdue"><div class="overdue-h"><span>${_L('Просрочено: {0}', od.length)}</span><button class="btn sm" data-a="carry">${_L('Перенести на сегодня')}</button></div><div class="list">${od.map(x=>taskRow(x,true)).join('')}</div></div>`:''}
  <div class="sec-h"><h2>${_L('Открытые')}</h2><span class="aside num">${open.length}</span></div>
  <div class="hud list">${open.length ? open.map(x=>taskRow(x)).join('') : `<div class="empty">${arr.length ? 'Всё закрыто. Хорошая работа.' : 'На этот день задач нет.'}</div>`}</div>
  ${done.length?`<div class="sec-h"><h2>${_L('Выполнено')}</h2><span class="aside num">${done.length}</span></div><div class="hud list">${done.map(x=>taskRow(x)).join('')}</div>`:''}`;
}

function dots7(h){ const t=todayStr(); let s='<span class="dots7" aria-hidden="true">'; for(let i=6;i>=0;i--){ const d=addDays(t,-i); let c='n'; if(d>=(h.since||'0000') && scheduled(h,d)){ if(skipped(h,d)) c='s'; else if(isDone(h,d)) c='d'; else if(d<t) c=(D.frozen[h.id]&&D.frozen[h.id].has(d))?'f':'m'; } s+=`<i class="${c}"></i>`; } return s+'</span>'; }
function habitRow(h,t,off){
  const v=hv(h,t), done=isDone(h,t), sk=skipped(h,t), st=D.streak[h.id]||0;
  let ctrl='';
  if(off) ctrl=`<span class="tag">${esc(daysText(h.days))}</span>`;
  else if(sk) ctrl=`<button class="btn sm" data-a="habit-skip" data-id="${h.id}">${_L('Вернуть')}</button>`;
  else if(h.bad) ctrl=`<div class="stepper"><button class="btn sm icon" data-a="habit-inc" data-id="${h.id}" data-v="-1" ${v?'':'disabled'} aria-label="${_L('Убрать срыв')}">${ico('minus','sm')}</button><span class="v ${v?'':'ok'}">${v ? v+' '+plural(v,'срыв','срыва','срывов') : 'чисто'}</span><button class="btn sm icon" data-a="habit-inc" data-id="${h.id}" data-v="1" aria-label="${_L('Отметить срыв')}">${ico('plus','sm')}</button></div>`;
  else if(h.kind==='count'||h.kind==='time'){ const step=h.kind==='time'?(h.target>=30?10:5):1; ctrl=`<div class="stepper"><button class="btn sm icon" data-a="habit-inc" data-id="${h.id}" data-v="${-step}" ${v?'':'disabled'} aria-label="${_L('Меньше')}">${ico('minus','sm')}</button><span class="v num ${done?'ok':''}">${v}/${h.target}${h.kind==='time'?' '+_L('м'):''}</span><button class="btn sm icon" data-a="habit-inc" data-swr="1" data-id="${h.id}" data-v="${step}" aria-label="${_L('Больше')}">${ico('plus','sm')}</button></div>`; }
  else ctrl=`<button class="chk ${done?'on':''}" data-a="habit-toggle" data-id="${h.id}" aria-label="${_L('Отметить')}">${ico('check')}</button>`;
  return `<div class="row ${sk?'done':''}" ${(!off&&!sk&&!h.bad)?`data-swl="habit-skip" data-swl-id="${h.id}" data-swl-t="${_L('Пропустить')}"`:''}><span class="h-ico">${habitIco(h)}</span><button class="main-t" data-a="habit-open" data-id="${h.id}"><span class="ttl">${esc(h.name)}</span><span class="sub"><span class="flame ${st?'':'zero'}" title="${_L('Серия')}">${ico('flame')}${st}</span><span>${esc(kindLabel(h))}</span>${h.cue?`<span>${esc(h.cue)}</span>`:''}${sk?'<span>пропуск сегодня</span>':''}${D.frozen[h.id]&&[...D.frozen[h.id]].some(x=>x>=addDays(t,-6))?'<span style="color:var(--acc)">пропуск прощён</span>':''}${h.ex?'<span class="tag ex">пример</span>':''}${dots7(h)}</span></button>${ctrl}</div>`;
}
function doseRow(x){
  const si=stockInfo(x.med);
  const stk = si ? `<span class="tag ${si.days<3?'bad':si.days<7?'warn':''}">${_L('запас ~{0} дн', si.days)}</span>` : '';
  return `<div class="row ${x.taken?'done':''}"><span class="time">${x.time}</span><button class="chk ${x.taken?'on':''}" data-a="med-toggle" data-k="${esc(x.key)}" aria-label="${_L('Принял')}">${ico('check')}</button><button class="main-t" data-a="edit-med" data-id="${x.med.id}"><span class="ttl">${esc(x.med.name)}</span><span class="sub">${[x.med.dose,x.med.food].filter(Boolean).map(s=>`<span>${esc(s)}</span>`).join('')}${stk}${x.med.ex?'<span class="tag ex">пример</span>':''}</span></button></div>`;
}
function vHabits(){
  const t=todayStr(), hs=habitsAll(), today=hs.filter(h=>scheduled(h,t)), other=hs.filter(h=>!scheduled(h,t));
  const ds=dosesOn(t), otherMeds=medsAll().filter(m=>!medScheduled(m,t));
  const hdone=today.filter(h=>!skipped(h,t)&&isDone(h,t)).length;
  return `<div class="page-h"><div><h1>${_L('Привычки')}</h1><p>${_L('Дисциплина за 7 дней: {0} · один пропуск в неделю серию не сжигает', D.disc7==null?'—':D.disc7+'%')}</p></div><div class="btns"><button class="btn sm" data-a="new-habit">${ico('plus','sm')}${_L('Привычка')}</button><button class="btn sm" data-a="new-med">${ico('plus','sm')}${_L('Таблетка')}</button></div></div>
  <div class="sec-h"><h2>${_L('Сегодня')}</h2><span class="aside num">${hdone}/${today.length}</span></div>
  <div class="hud list">${today.length ? today.map(h=>habitRow(h,t)).join('') : '<div class="empty">На сегодня привычек нет.</div>'}</div>
  <div class="sec-h"><h2>${_L('Таблетки и витамины')}</h2><span class="aside num">${ds.filter(x=>x.taken).length}/${ds.length}</span></div>
  <div class="hud list">${ds.length ? ds.map(doseRow).join('') : '<div class="empty">Добавь таблетки или витамины: они появятся здесь по времени приёма.</div>'}</div>
  ${other.length||otherMeds.length?`<div class="sec-h"><h2>${_L('Не сегодня')}</h2></div><div class="hud list">${other.map(h=>habitRow(h,t,true)).join('')}${otherMeds.map(m=>`<div class="row"><span class="h-ico">${ico('pill')}</span><button class="main-t" data-a="edit-med" data-id="${m.id}"><span class="ttl">${esc(m.name)}</span><span class="sub"><span>${esc((m.times||[]).join(', '))}</span><span>${esc(daysText(m.days))}</span></span></button></div>`).join('')}</div>`:''}
  <p class="muted" style="font-size:12.5px;margin-top:12px">${_L('Нажми на привычку, чтобы увидеть историю, пропустить день или изменить её.')}</p>`;
}

function vGym(){
  if(S.draft) return vWorkout();
  const t=todayStr(), pl=PLAN(), day=planDayFor(t), doneT=D.woDates.has(t), nx=nextPlanDay(t);
  const sets = day ? day.ex.reduce((a,e)=>a+(Number(e.sets)||0),0) : 0;
  const others = pl.days.filter(d=>!day || d.id!==day.id);
  // muscles last 7 days
  const from=addDays(t,-6), mc={}; MUSCLES.forEach(m=>mc[m]=0);
  for(const w of D.wos) if(w.date>=from) for(const ex of (w.exercises||[])){ const m=ex.muscle||muscleOf(ex.name); if(m) mc[m]=(mc[m]||0)+(ex.sets||[]).filter(s=>s.done).length; }
  const musRows = MUSCLES.filter(m=>m!=='Кардио').map(m=>{ const v=mc[m]||0; const st = m==='Пресс' ? ['',''] : v===0 ? ['мало','bad'] : v<10 ? ['ниже нормы','warn'] : v<=20 ? ['норма','good'] : ['много','warn']; const w=Math.min(100, v/25*100); return `<div class="mus" data-tip="${_L('{0}: {1} {2} за 7 дней{3}', esc(m), v, plural(v,'подход','подхода','подходов'), m==='Пресс'?'':'\nориентир 10–20')}"><span>${m}</span><span class="trk">${m==='Пресс'?'':'<span class="band" style="left:40%;width:40%"></span>'}<span class="fill" style="width:${w}%"></span></span><span class="st num" style="color:var(--${st[1]||'text2'})">${v} · ${st[0]||'подх.'}</span></div>`; }).join('');
  const exNames = Object.keys(D.exHist).sort((a,b)=>D.exHist[b].length-D.exHist[a].length);
  if(!S.exSel || !D.exHist[S.exSel]) S.exSel = exNames[0]||null;
  const bw=BODY(), bwk=Object.keys(bw).sort(), lastBw=bwk.length?bw[bwk[bwk.length-1]]:null;
  const hist=D.wos.slice(-12).reverse();
  return `<div class="page-h"><div><h1>${_L('Зал')}</h1><p>${_L('Тренировок всего: {0} · рекордов: {1}', D.wos.length, D.prCount)}</p></div></div>
  <div class="hud today-card"><div><div class="t-lbl">${ico('gym')}${doneT?'Сегодня — готово':'По плану сегодня'}</div><h3>${day?esc(day.name):'День отдыха'}</h3><div class="dim" style="font-size:13px;margin-top:3px">${day ? `${day.ex.length} ${plural(day.ex.length,'упражнение','упражнения','упражнений')} · ${sets} ${plural(sets,'подход','подхода','подходов')}` : nx ? `${_L('Следующая: {0} — {1}', esc(nx.day.name), esc(WDL[wdOf(nx.date)-1]))}` : 'Добавь тренировочные дни в программу'}</div></div>
  <div class="btns">${day&&!doneT?`<button class="btn pri" data-a="gym-start" data-id="${day.id}">${ico('play','sm')}${_L('Начать')}</button>`:''}${others.map(d=>`<button class="btn sm" data-a="gym-start" data-id="${d.id}">${esc(d.name)}</button>`).join('')}<button class="btn sm ghost" data-a="gym-start" data-id="">${_L('Свободная')}</button></div></div>
  <div class="sec-h"><h2>${_L('Программа')}</h2>${pl.demo?'<span class="tag ex">пример</span>':''}</div>
  ${Array.isArray(pl.prev)?`<div class="banner" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between"><span>${_L('{0} обновил программу.', esc(P().ai))}</span><span class="btns"><button class="btn sm" data-a="plan-undo">${_L('Вернуть прежнюю')}</button><button class="btn sm ghost" data-a="plan-keep">${_L('Оставить новую')}</button></span></div>`:''}
  <div class="hud list">${pl.days.length ? pl.days.map(d=>`<div class="row"><button class="main-t" data-a="plan-edit" data-id="${d.id}"><span class="ttl">${esc(d.name)}</span><span class="sub"><span class="mono">${(d.wd||[]).length?(d.wd||[]).map(x=>WD[x-1]).join(' '):'без дня'}</span><span>${(d.ex||[]).map(e=>esc(e.name)).join(' · ')}</span></span></button><button class="btn sm icon" data-a="gym-start" data-id="${d.id}" aria-label="${_L('Начать')}">${ico('play','sm')}</button></div>`).join('') : '<div class="empty">Программы пока нет.</div>'}</div>
  <div class="btns" style="margin-top:10px"><button class="btn sm" data-a="plan-edit" data-id="">${ico('plus','sm')}${_L('День')}</button><button class="btn sm" data-a="ai-plan">${ico('spark','sm')}${_L('Составить с {0}', esc(P().ai))}</button></div>
  <div class="sec-h"><h2>${_L('Мои упражнения')}</h2><span class="aside">${_L('вес · техника · что дальше')}</span></div>
  <div class="hud list">${myExercises().map(x=>{ const last=lastFor(x.name), mw=EXW()[x.name], rec=recommend(x.name, planTarget(x.name)); const lt = last ? _L('было {0}', last.sets.slice(0,3).map(s=>fmtW(s.w)+'×'+s.r).join(' ')) : (mw && mw.w!=='' ? _L('рабочий {0} кг', fmtW(mw.w))+(mw.r?' × '+mw.r:'') : 'вес не указан'); return `<button class="row" data-a="ex-view" data-n="${esc(x.name)}"><span class="main-t"><span class="ttl">${esc(x.name)}</span><span class="sub"><span>${esc(lt)}</span><span style="color:var(--acc)">${_L('дальше: {0}', esc(recText(rec)))}</span></span></span>${x.muscle?`<span class="tag">${esc(x.muscle)}</span>`:''}</button>`; }).join('') || '<div class="empty">Добавь упражнения, которые делаешь.</div>'}</div>
  <div class="btns" style="margin-top:10px"><button class="btn sm" data-a="ex-add-mine">${ico('plus','sm')}${_L('Упражнение и мой вес')}</button></div>
  <div class="sec-h"><h2>${_L('Мышцы за 7 дней')}</h2><span class="aside">${_L('подходы · ориентир 10–20')}</span></div>
  <div class="hud" style="padding-block:6px">${musRows}</div>
  <div class="charts two" style="margin-top:12px">
    <div class="hud chart-card"><h3>${_L('Прогресс в упражнении')}</h3>${exNames.length?`<p class="cap">${_L('Расчётный максимум на 1 повтор (по формуле Эпли), кг')}</p><select class="inp" id="ex-sel" style="height:36px;font-size:14px;margin-bottom:8px">${exNames.map(n=>`<option ${n===S.exSel?'selected':''}>${esc(n)}</option>`).join('')}</select><div class="chart" data-chart="ex"></div>`:'<p class="cap">Появится после первой тренировки.</p>'}</div>
    <div class="hud chart-card"><h3>${_L('Вес тела')}</h3><p class="cap">${lastBw?`${_L('Последний замер: {0} кг', fmtW(lastBw))}`:'Записывай вес раз в несколько дней'}</p><form class="addbar" data-f="body" style="margin:0 0 8px"><input class="inp" id="bw-in" inputmode="decimal" placeholder="${_L('Вес сегодня, кг')}" aria-label="${_L('Вес, кг')}"><button class="btn" type="submit">${_L('Записать')}</button></form><div class="chart" data-chart="body"></div></div>
  </div>
  <div class="sec-h"><h2>${_L('История')}</h2><span class="aside num">${D.wos.length}</span></div>
  <div class="hud list">${hist.length ? hist.map(w=>{ const vol=volumeOf(w), dur=w.finishedAt&&w.startedAt?(Date.parse(w.finishedAt)-Date.parse(w.startedAt))/6e4:0, prs=(D.woPR[w.id]||[]).length; return `<div class="row"><span class="time">${esc(shortDate(w.date))}</span><button class="main-t" data-a="wo-open" data-id="${w.id}"><span class="ttl">${esc(w.name||'Тренировка')}</span><span class="sub"><span>${fmtDur(dur)}</span><span>${_L('{0} кг объём', nf.format(Math.round(vol)))}</span>${prs?`<span class="tag acc">PR ×${prs}</span>`:''}</span></button></div>`; }).join('') : '<div class="empty">Здесь появятся завершённые тренировки.</div>'}</div>`;
}
const volumeOf = w => (w.exercises||[]).reduce((a,ex)=>a+(ex.sets||[]).filter(s=>s.done).reduce((b,s)=>b+(num(s.w)||0)*(num(s.r)||0),0),0);
function repsLow(target){ const m=String(target||'').match(/×\s*(\d+)/); return m ? m[1] : 'повт.'; }
function vWorkout(){
  if(S.focus) return vFocus();
  const w=S.draft, el=(Date.now()-Date.parse(w.startedAt))/1000, seenM=new Set();
  const cards = w.exercises.map((ex,ei)=>{
    const e=exInfo(ex.name), last=lastFor(ex.name), best=D.bestMetric[ex.name], rec=recommend(ex.name, ex.target), [lo,hi]=repRange(ex.target, ex.name);
    const firstM = ex.muscle && !seenM.has(ex.muscle); if(ex.muscle) seenM.add(ex.muscle);
    const warm = firstM ? warmupText(e, rec) : '';
    const rows = ex.sets.map((s,si)=>{ const pr = s.done && best!==undefined && setMetric(s)>best+1e-6;
      return `<tr class="${s.done?'done':''}"><td>${pr?'<span class="tag acc">PR</span>':si+1}</td><td><input class="inp" id="w-${ei}-${si}-w" data-fresh="1" data-wi="${ei}:${si}:w" inputmode="decimal" value="${esc(s.w)}" placeholder="${rec.w!=null?esc(fmtW(rec.w)):'кг'}" aria-label="${_L('Вес, подход {0}', si+1)}"></td><td><input class="inp" id="w-${ei}-${si}-r" data-fresh="1" data-wi="${ei}:${si}:r" inputmode="numeric" value="${esc(s.r)}" placeholder="${lo===hi?lo:lo+'–'+hi}" aria-label="${_L('Повторы, подход {0}', si+1)}"></td><td class="c"><button class="chk ${s.done?'on':''}" data-a="wo-set" data-e="${ei}" data-s="${si}" aria-label="${_L('Подход выполнен')}">${ico('check')}</button></td><td class="x"><button class="btn sm icon ghost" data-a="wo-del-set" data-e="${ei}" data-s="${si}" aria-label="${_L('Удалить подход')}">${ico('x','sm')}</button></td></tr>`; }).join('');
    const ld=ex.sets.map((s,i)=>s.done?i:-1).filter(i=>i>=0).pop(); const adv = ld!=null ? setAdvice(ex, ld) : null; const open=S.techOpen.has(ex.name);
    return `<div class="hud ex-card"><div class="ex-head"><div><h4>${esc(ex.name)}</h4><div class="last">${last?_L('прошлый раз:')+' '+last.sets.map(s=>`${fmtW(s.w)}×${esc(s.r)}`).join(' · '):'первый раз'}</div></div><div class="btns" style="flex-wrap:nowrap">${ex.muscle?`<span class="tag">${esc(ex.muscle)}</span>`:''}<button class="btn sm icon ghost" data-a="wo-del-ex" data-e="${ei}" data-confirm="${_L('Убрать?')}" aria-label="${_L('Убрать упражнение')}">${ico('x','sm')}</button></div></div>
      <div class="rec">${_L('Сегодня:')} <b>${esc(recText(rec))}</b>${e.t==='db'&&rec.w?' на каждую гантель':''}<br><span class="muted">${esc(cap(rec.why))}</span></div>
      ${warm?`<div class="rec muted">${esc(warm)}</div>`:''}
      ${(()=>{ const ns=ex.sets.find(s=>!s.done); const pt=platesText(ex.name, num(ns?ns.w:rec.w)); return pt?`<div class="rec muted">${esc(pt)}</div>`:''; })()}
      <button class="btn sm ghost" style="margin-top:8px" data-a="tech" data-n="${esc(ex.name)}">${ico('video','sm')}${open?'Скрыть технику':'Техника и видео'}</button>
      ${open?techHtml(ex.name):''}
      <table class="sets"><thead><tr><th>#</th><th>${_L('кг')}</th><th>${_L('повт.')}</th><th></th><th></th></tr></thead><tbody>${rows}</tbody></table>
      ${adv?`<div class="adv">${esc(adv.txt)}</div>`:''}
      <button class="btn sm ghost" style="margin-top:4px" data-a="wo-add-set" data-e="${ei}">${ico('plus','sm')}${_L('Подход')}</button></div>`;
  }).join('');
  const doneSets=w.exercises.reduce((a,ex)=>a+ex.sets.filter(s=>s.done).length,0);
  return `<div class="hud wo-bar"><div><div class="t-lbl">${ico('gym')}${_L('Тренировка идёт · {0} {1}', doneSets, plural(doneSets,'подход','подхода','подходов'))}</div><h3 style="margin:3px 0 0;font:500 18px/1.25 var(--f-disp)">${esc(w.name||'Свободная тренировка')}</h3></div><span class="clock" data-elapsed>${fmtClock(el)}</span><div class="btns"><button class="btn danger sm" data-a="wo-cancel" data-confirm="${_L('Точно отменить?')}">${_L('Отменить')}</button><button class="btn sm" data-a="focus">${_L('Фокус')}</button><button class="btn pri" data-a="wo-finish">${ico('check','sm')}${_L('Завершить')}</button></div></div>
  ${cards || '<div class="hud empty" style="margin-top:10px">Добавь первое упражнение.</div>'}
  <div class="btns" style="margin-top:12px"><button class="btn" data-a="wo-add-ex">${ico('plus','sm')}${_L('Упражнение')}</button></div>
  <p class="muted" style="font-size:12.5px;margin-top:10px">${_L('Вес в подходах уже подставлен по рекомендации — поправь, если делаешь другой. Отметь подход галочкой: запустится таймер отдыха, а следующий подход подстроится под то, как прошёл этот.')}</p>`;
}
function stat(label, value){ return `<div class="hud stat"><div class="t-lbl">${esc(label)}</div><div class="t-val num">${value}</div></div>`; }
function vProgress(){
  const st=D.st, pct=Math.round(D.into/D.need*100), cur=Math.max(0,...Object.values(D.streak)), nr=RANKS.find(r=>r.min>D.level);
  const lg=[.14,.32,.52,.75,1].map(o=>`<i style="background:rgba(var(--acc-rgb),${o})"></i>`).join('');
  return `<div class="page-h"><div><h1>${_L('Прогресс')}</h1><p>${_L('Отсчёт с {0}', esc(fDMY.format(parseYmd(startDate()))))}</p></div><div class="btns"><button class="btn sm" data-a="review">${ico('spark','sm')}${_L('Разбор недели')}</button><button class="btn sm" data-a="mood-open">${ico('mood','sm')}${_L('Состояние')}</button></div></div>
  <div class="hud lvl-card"><div class="hex"><svg viewBox="0 0 84 94" aria-hidden="true"><polygon points="42,2 82,25 82,69 42,92 2,69 2,25" style="fill:rgba(var(--acc-rgb),.08);stroke:var(--acc)" stroke-width="1.5"/><polygon points="42,11 74,29.5 74,64.5 42,83 10,64.5 10,29.5" style="fill:none;stroke:var(--acc)" stroke-opacity=".3" stroke-width="1"/></svg><b>${D.rank.l}</b></div>
  <div><div class="t-lbl">${_L('Ранг {0} · {1}', D.rank.l, esc(D.rank.n))}</div><h3>${_L('Уровень {0}', D.level)}</h3><div class="xpbar"><i style="width:${pct}%"></i></div><div class="mono muted" style="font-size:11.5px">${_L('{0} / {1} XP до уровня {2} · всего {3} XP{4}', D.into, D.need, D.level+1, nf.format(D.xp), nr?` · ${_L('ранг {0} с {1} уровня', nr.l, nr.min)}`:'')}</div></div></div>
  ${weekCard(todayStr(), false)}
  <div class="stats">${stat('Дисциплина 7 дн', D.disc7==null?'—':D.disc7+'%')}${stat('Серия сейчас', cur+' '+plural(cur,'день','дня','дней'))}${stat('Задач выполнено', nf.format(st.tasksDone||0))}${stat('Тренировок', st.wos||0)}</div>
  <p class="muted" style="font-size:12.5px;margin:10px 0 0">${_L('Опыт: задача +10 (важная до +20), привычка +5, приём +2, отметка состояния +3, день в норме КБЖУ +10, тренировка +50, рекорд +20, достижение +50. Срыв вредной привычки −5.')}</p>
  <div class="sec-h"><h2>${_L('Выполнение плана')}</h2></div>
  <div class="charts two"><div class="hud chart-card"><h3>${_L('Последние 14 дней')}</h3><p class="cap">${_L('Доля выполненного за день: задачи, привычки, приёмы')}</p><div class="chart" data-chart="plan14"></div></div>
  <div class="hud chart-card"><h3>${_L('Карта дисциплины')}</h3><p class="cap">${_L('Каждая клетка — день')}</p><div class="hm-wrap"><div class="chart" data-chart="heat"></div></div><div class="legend"><span>${_L('меньше')}</span>${lg}<span>${_L('больше')}</span></div></div></div>
  <div class="sec-h"><h2>${_L('Состояние · 30 дней')}</h2></div>
  <div class="charts two"><div class="hud chart-card"><h3>${_L('Настроение')}</h3><p class="cap">${_L('1 — тяжело, 5 — отлично')}</p><div class="chart" data-chart="mood"></div></div><div class="hud chart-card"><h3>${_L('Сон')}</h3><p class="cap">${_L('Часов за ночь')}</p><div class="chart" data-chart="sleep"></div></div></div>
  ${gatedProgress()}`;
}
function badge(a){ const got=D.ach.has(a.id); return `<div class="badge ${got?'got':'lock'}" style="border:1px solid ${got?'rgba(var(--acc-rgb),.35)':'var(--line)'};border-radius:6px;background:var(--panel)"><span class="bx"><svg viewBox="0 0 40 44" aria-hidden="true"><polygon points="20,1.5 38.5,12 38.5,32 20,42.5 1.5,32 1.5,12" style="fill:${got?'rgba(var(--acc-rgb),.12)':'none'};stroke:${got?'var(--acc)':'var(--line2)'}" stroke-width="1.3"/></svg><b>${esc(a.c)}</b></span><span><span class="bt">${esc(a.t)}</span><span class="bd" style="display:block">${esc(a.d)}</span></span></div>`; }
function insights(){
  const t=todayStr(), start=startDate(), days=[]; for(let d=start,i=0; d<=t && i<400; d=addDays(d,1),i++) days.push(d);
  const out=[];
  const md=days.filter(d=>logOf(d).mood);
  const gm=md.filter(d=>D.woDates.has(d)).map(d=>+logOf(d).mood), rm=md.filter(d=>!D.woDates.has(d)).map(d=>+logOf(d).mood);
  if(gm.length>=3 && rm.length>=3) out.push(['ЗАЛ', `${_L('В дни тренировок настроение в среднем {0}, в остальные — {1}.', avg(gm).toFixed(1), avg(rm).toFixed(1))}`]);
  const sd=md.filter(d=>num(logOf(d).sleep)>0), hi=sd.filter(d=>num(logOf(d).sleep)>=7).map(d=>+logOf(d).mood), lo=sd.filter(d=>num(logOf(d).sleep)<7).map(d=>+logOf(d).mood);
  if(hi.length>=3 && lo.length>=3) out.push(['СОН', `${_L('Когда спишь 7+ часов, настроение {0} против {1} при недосыпе.', avg(hi).toFixed(1), avg(lo).toFixed(1))}`]);
  const past=days.filter(d=>d<t);
  if(past.length>=14){ const by={}; for(const d of past){ const s=dayStats(d); if(!s.total) continue; (by[wdOf(d)] ||= []).push(s.done/s.total); } const arr=Object.entries(by).filter(([,v])=>v.length>=2).map(([k,v])=>[+k,avg(v)]).sort((a,b)=>b[1]-a[1]); if(arr.length>=3) out.push(['НЕДЕЛЯ', `${_L('Лучше всего получается в {0} ({1}%), тяжелее всего — в {2} ({3}%).', WDL[arr[0][0]-1], Math.round(arr[0][1]*100), WDL[arr[arr.length-1][0]-1], Math.round(arr[arr.length-1][1]*100))}`]); }
  if(past.length>=7){ const rates=habitsAll().map(h=>{ let tot=0,dn=0; for(const d of past.slice(-30)) if(scheduled(h,d)&&!skipped(h,d)){ tot++; if(isDone(h,d)) dn++; } return {h, r: tot>=4 ? dn/tot : null}; }).filter(x=>x.r!=null).sort((a,b)=>b.r-a.r); if(rates.length>=2){ out.push(['СИЛЬНОЕ', `${_L('Самая стабильная привычка — «{0}»: {1}% дней.', rates[0].h.name, Math.round(rates[0].r*100))}`]); const w=rates[rates.length-1]; if(w.r<.7) out.push(['СЛАБОЕ', `${_L('«{0}» проседает: {1}% дней. Попробуй уменьшить цель или привязать к другому делу.', w.h.name, Math.round(w.r*100))}`]); } }
  if(!out.length) out.push(['СКОРО', 'Инсайты появятся, когда накопится неделя-другая отметок: настроение, сон, привычки и тренировки.']);
  return out.map(([k,v])=>`<div class="ins"><span class="k">${k}</span><span>${esc(v)}</span></div>`).join('');
}
const VIEWS = {home:vHome, tasks:vTasks, habits:vHabits, gym:vGym, progress:vProgress};

/* ================= charts ================= */
function drawCharts(root){ if(!root) return; root.querySelectorAll('[data-chart]').forEach(el=>{ const fn=CHARTS[el.dataset.chart]; if(!fn) return; const w=Math.max(240, Math.floor(el.clientWidth||300)); el.innerHTML=fn(w, el); }); }
function barsSvg(w, data, o){
  const h=o.h||150, L=34, R=6, T=12, B=22, iw=w-L-R, ih=h-T-B, n=data.length, slot=iw/n, bw=Math.max(3,Math.min(18,slot*.6));
  const max=o.max, y=v=>T+ih-(v/max)*ih;
  let s=`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.label||'')}">`;
  for(const tv of o.ticks){ const yy=y(tv).toFixed(1); s+=`<line x1="${L}" x2="${w-R}" y1="${yy}" y2="${yy}" style="stroke:var(--line)" stroke-width="1"/><text x="${L-6}" y="${(+yy+3.5).toFixed(1)}" text-anchor="end">${tv}${o.unit||''}</text>`; }
  const every=Math.ceil(n/Math.max(1,Math.floor(iw/40)));
  data.forEach((d,i)=>{ if(i) return; if(o.target){ const ty=y(Math.min(o.target,max)).toFixed(1); s+=`<line x1="${L}" x2="${w-R}" y1="${ty}" y2="${ty}" style="stroke:var(--text2)" stroke-width="1" stroke-dasharray="4 4"/><text x="${w-R}" y="${(+ty-5).toFixed(1)}" text-anchor="end">${esc(o.targetLabel||'')}</text>`; } });
  data.forEach((d,i)=>{
    const cx=L+slot*i+slot/2;
    if(d.v!=null && d.v>0){ const top=y(Math.min(d.v,max)), x=cx-bw/2, base=T+ih, r=Math.min(3,bw/2,base-top); s+=`<path d="M${x.toFixed(1)},${base} V${(top+r).toFixed(1)} Q${x.toFixed(1)},${top.toFixed(1)} ${(x+r).toFixed(1)},${top.toFixed(1)} H${(x+bw-r).toFixed(1)} Q${(x+bw).toFixed(1)},${top.toFixed(1)} ${(x+bw).toFixed(1)},${(top+r).toFixed(1)} V${base} Z" style="fill:var(--acc)" fill-opacity="${d.hi?1:.55}"/>`; }
    else if(d.v===0) s+=`<line x1="${(cx-bw/2).toFixed(1)}" x2="${(cx+bw/2).toFixed(1)}" y1="${T+ih-1}" y2="${T+ih-1}" style="stroke:var(--muted)" stroke-width="2"/>`;
    if(i%every===(n-1)%every) s+=`<text x="${cx.toFixed(1)}" y="${h-6}" text-anchor="middle">${esc(d.lab)}</text>`;
    s+=`<rect x="${(L+slot*i).toFixed(1)}" y="${T}" width="${slot.toFixed(1)}" height="${ih}" fill="transparent" data-tip="${esc(d.tip)}"/>`;
  });
  return s+'</svg>';
}
function lineSvg(w, pts, o){
  const h=o.h||150, L=36, R=12, T=16, B=22, iw=w-L-R, ih=h-T-B, n=pts.length;
  const min=o.min, max=o.max, x=i=> L+(n===1?iw/2:iw*i/(n-1)), y=v=>T+ih-((v-min)/(max-min||1))*ih;
  let s=`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.label||'')}">`;
  for(const tv of o.ticks){ const yy=y(tv).toFixed(1); s+=`<line x1="${L}" x2="${w-R}" y1="${yy}" y2="${yy}" style="stroke:var(--line)" stroke-width="1"/><text x="${L-6}" y="${(+yy+3.5).toFixed(1)}" text-anchor="end">${esc(o.fmt?o.fmt(tv):tv)}</text>`; }
  const segs=[]; let cur=[]; pts.forEach((p,i)=>{ if(p.v==null){ if(cur.length) segs.push(cur); cur=[]; } else cur.push([x(i),y(p.v)]); }); if(cur.length) segs.push(cur);
  const base=T+ih;
  for(const sg of segs){ const d=sg.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+','+q[1].toFixed(1)).join(' '); if(sg.length>1) s+=`<path d="${d} L${sg[sg.length-1][0].toFixed(1)},${base} L${sg[0][0].toFixed(1)},${base} Z" style="fill:var(--acc)" fill-opacity=".1"/>`; s+=`<path d="${d}" fill="none" style="stroke:var(--acc)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`; }
  pts.forEach((p,i)=>{ if(p.v!=null && n<=45) s+=`<circle cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="2.6" style="fill:var(--acc);stroke:var(--panel)" stroke-width="1.5"/>`; });
  let li=-1; for(let i=n-1;i>=0;i--) if(pts[i].v!=null){ li=i; break; }
  if(li>=0){ const cx=x(li), cy=y(pts[li].v); s+=`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4.5" style="fill:var(--acc);stroke:var(--panel)" stroke-width="2"/><text class="val" x="${Math.min(cx, w-R-2).toFixed(1)}" y="${(cy-9).toFixed(1)}" text-anchor="${cx>w-60?'end':'middle'}">${esc(o.fmt?o.fmt(pts[li].v):pts[li].v)}</text>`; }
  const every=Math.ceil(n/Math.max(1,Math.floor(iw/46)));
  pts.forEach((p,i)=>{ if(i%every===(n-1)%every) s+=`<text x="${x(i).toFixed(1)}" y="${h-6}" text-anchor="${i===0&&n>1?'start':i===n-1&&n>1?'end':'middle'}">${esc(p.lab)}</text>`; const sw=iw/Math.max(1,n); s+=`<rect x="${(x(i)-sw/2).toFixed(1)}" y="${T}" width="${sw.toFixed(1)}" height="${ih}" fill="transparent" data-tip="${esc(p.tip)}"/>`; });
  return s+'</svg>';
}
function heatSvg(w, getter, weeksMax){
  const cell=12, gap=3, col=cell+gap, L=22, T=16;
  const weeks=Math.max(6, Math.min(weeksMax||26, Math.floor((w-L)/col)));
  const t=todayStr(), endMon=addDays(t,1-wdOf(t)), startMon=addDays(endMon,-7*(weeks-1));
  let s=`<svg width="${L+weeks*col}" height="${T+7*col}" viewBox="0 0 ${L+weeks*col} ${T+7*col}" role="img" aria-label="${_L('Карта по дням')}">`;
  [['Пн',0],['Ср',2],['Пт',4]].forEach(([lb,r])=>{ s+=`<text x="0" y="${T+r*col+cell-2}">${lb}</text>`; });
  let lastM=-1;
  for(let wk=0; wk<weeks; wk++){
    const mDate=parseYmd(addDays(startMon,wk*7)); if(mDate.getMonth()!==lastM){ lastM=mDate.getMonth(); if(wk<weeks-2) s+=`<text x="${L+wk*col}" y="10">${esc(new Intl.DateTimeFormat(LOCALES[LANG]||'ru-RU',{month:'short'}).format(mDate).replace('.',''))}</text>`; }
    for(let dd=0; dd<7; dd++){ const d=addDays(startMon, wk*7+dd); if(d>t) continue; const g=getter(d); s+=`<rect x="${L+wk*col}" y="${T+dd*col}" width="${cell}" height="${cell}" rx="2.5" style="${g.style}" ${g.tip?`data-tip="${esc(g.tip)}"`:''}/>`; }
  }
  return s+'</svg>';
}
const HM = o => `fill:rgba(var(--acc-rgb),${o})`;
const CHARTS = {
  plan14(w){ const t=todayStr(), data=[]; for(let i=13;i>=0;i--){ const d=addDays(t,-i), s=d>=startDate()?dayStats(d):{total:0,done:0,pct:null}; data.push({lab:String(parseYmd(d).getDate()), v:s.pct, hi:i===0, tip:`${dayLabel(d)}\n${s.total?`${_L('{0}% · {1} из {2}', s.pct, s.done, s.total)}`:'нет плана'}`}); } return barsSvg(w,data,{max:100,ticks:[0,50,100],unit:'%',label:'Выполнение плана за 14 дней'}); },
  heat(w){ const st=startDate(); return heatSvg(w, d=>{ if(d<st) return {style:'fill:rgba(var(--line-rgb),.05)', tip:''}; const s=dayStats(d); if(!s.total) return {style:'fill:rgba(var(--line-rgb),.07)', tip:`${_L('{0}: нет плана', shortDate(d))}`}; const p=s.done/s.total; const o= p>=1?1 : p>=.7?.75 : p>=.4?.52 : p>0?.32 : .14; return {style:HM(o), tip:`${shortDate(d)}: ${Math.round(p*100)}% (${s.done}/${s.total})`}; }, 26); },
  hheat(w, el){ const h=S.cols.habits.get(el.dataset.id); if(!h) return ''; const t=todayStr(); return heatSvg(w, d=>{ if(d<(h.since||t)) return {style:'fill:rgba(var(--line-rgb),.04)', tip:''}; if(!scheduled(h,d)) return {style:'fill:rgba(var(--line-rgb),.07)', tip:`${_L('{0}: не по плану', shortDate(d))}`}; if(skipped(h,d)) return {style:'fill:var(--muted);fill-opacity:.55', tip:`${_L('{0}: пропуск', shortDate(d))}`}; const v=hv(h,d); if(isDone(h,d)) return {style:HM(1), tip:`${shortDate(d)}: ${progText(h,d)}`}; if(d===t) return {style:'fill:none;stroke:var(--acc);stroke-opacity:.6', tip:'сегодня'}; if(!h.bad && v>0) return {style:HM(.4), tip:`${shortDate(d)}: ${progText(h,d)}`}; return {style:'fill:rgba(176,74,63,.42)', tip:`${shortDate(d)}: ${h.bad?progText(h,d):'пропущено'}`}; }, 18); },
  mood(w){ const t=todayStr(), pts=[]; for(let i=29;i>=0;i--){ const d=addDays(t,-i), l=logOf(d); pts.push({lab:shortDate(d), v:l.mood?+l.mood:null, tip:`${shortDate(d)}\n${l.mood?`${l.mood} — ${MOOD[l.mood]}`:'нет отметки'}${l.energy?`${_L('\nэнергия {0}/5', l.energy)}`:''}`}); } if(pts.every(p=>p.v==null)) return '<div class="empty">Пока нет отметок. Нажми «Состояние» вверху.</div>'; return lineSvg(w,pts,{min:1,max:5,ticks:[1,3,5],label:'Настроение за 30 дней'}); },
  sleep(w){ const t=todayStr(), data=[]; let any=false; for(let i=29;i>=0;i--){ const d=addDays(t,-i), v=num(logOf(d).sleep); if(v>0) any=true; data.push({lab:shortDate(d), v: v>0?v:null, hi:i===0, tip:`${shortDate(d)}\n${v>0?fmtW(v)+' '+_L('ч'):'нет данных'}`}); } if(!any) return '<div class="empty">Сон появится после первых отметок.</div>'; const mx=Math.max(10, ...data.map(d=>d.v||0)); return barsSvg(w,data,{max:Math.ceil(mx/2)*2, ticks:[0,4,8].filter(x=>x<=mx), unit:'ч', label:'Сон за 30 дней'}); },
  ex(w, el){ const arr=D.exHist[(el&&el.dataset.name)||S.exSel]||[]; if(!arr.length) return ''; const pts=arr.slice(-24).map(e=>{ const bs=e.sets.reduce((a,s)=>setMetric(s)>setMetric(a)?s:a, e.sets[0]); return {lab:shortDate(e.date), v:Math.round(e.v*10)/10, tip:`${_L('{0}\nлучший подход {1}×{2}\nрасчётный максимум {3}', shortDate(e.date), fmtW(bs.w), bs.r, fmtW(Math.round(e.v*10)/10))}`}; }); const vs=pts.map(p=>p.v), lo=Math.min(...vs), hi=Math.max(...vs), padv=Math.max(2,(hi-lo)*.2); const mn=Math.max(0,Math.floor(lo-padv)), mx=Math.ceil(hi+padv); return lineSvg(w,pts,{min:mn,max:mx,ticks:[mn,Math.round((mn+mx)/2),mx],fmt:v=>fmtW(v),label:'Прогресс в упражнении'}); },
  body(w){ const bw=BODY(), ks=Object.keys(bw).sort().slice(-40); if(!ks.length) return ''; const pts=ks.map(k=>({lab:shortDate(k), v:num(bw[k]), tip:`${_L('{0}: {1} кг', shortDate(k), fmtW(bw[k]))}`})); const vs=pts.map(p=>p.v), lo=Math.min(...vs), hi=Math.max(...vs); const mn=Math.floor(lo-1), mx=Math.ceil(hi+1); return lineSvg(w,pts,{min:mn,max:mx,ticks:[mn,Math.round((mn+mx)/2),mx],fmt:v=>fmtW(v),label:'Вес тела',h:130}); }
};

/* ================= modals ================= */
function openModal(type, data){ S.modal={type, ...(data||{})}; renderModal(); }
function closeModal(instant){ if(!S.modal) return; S.modal=null; if(S.previewTheme||S.previewPal){ S.previewTheme=null; S.previewPal=null; themeFade(); renderChrome(); }
  const back=$('#modal .back'); if(!back || instant || REDUCE()){ $('#modal').innerHTML=''; return; }
  back.classList.add('closing'); setTimeout(()=>{ if(!S.modal && back.isConnected) $('#modal').innerHTML=''; }, 260); }
function renderModal(keep){
  const m=S.modal; if(!m){ $('#modal').innerHTML=''; return; }
  const prev=$('#modal .sheet'), st=keep&&prev?prev.scrollTop:0;
  $('#modal').innerHTML=`<div class="back" data-a="back"><div class="sheet" role="dialog" aria-modal="true">${MODALS[m.type](m)}<button class="icon-btn close" type="button" data-a="close" aria-label="${_L('Закрыть')}">${ico('x')}</button></div></div>`;
  drawCharts($('#modal'));
  if(m.type==='settings' && typeof IS_PWA!=='undefined' && IS_PWA) refreshPushUi();
  if(keep){ const sh=$('#modal .sheet'); if(sh){ sh.style.animation='none'; sh.scrollTop=st; } return; }
  const f=$('#modal [data-autofocus]'); if(f && matchMedia('(min-width:700px)').matches) f.focus();
}
const segHtml = (name, val, opts, cls='') => `<div class="seg ${cls}" data-seg="${name}" data-val="${esc(val)}">${opts.map(([v,l])=>`<button type="button" data-a="seg" data-v="${esc(v)}" class="${String(v)===String(val)?'on':''}">${l}</button>`).join('')}</div>`;
const daysHtml = (name, days) => `<div class="days" data-multi="${name}" data-val="${(days||[]).join(',')}">${WD.map((l,i)=>`<button type="button" data-a="multi" data-v="${i+1}" class="${(days||[]).map(Number).includes(i+1)?'on':''}">${l}</button>`).join('')}</div>`;
const segVal = (f,n) => { const e=f.querySelector(`[data-seg="${n}"]`); return e ? e.dataset.val : ''; };
const multiVal = (f,n) => { const e=f.querySelector(`[data-multi="${n}"]`); return e && e.dataset.val ? e.dataset.val.split(',').filter(Boolean).map(Number).sort() : []; };
const delBtn = (a, id, txt='Удалить', conf='Точно удалить?') => `<button class="btn danger sp" type="button" data-a="${a}" data-id="${id}" data-confirm="${conf}">${txt}</button>`;
const MODALS = {
  task(m){ const x=m.id?S.cols.tasks.get(m.id):null; const d=x||{title:'',date:m.date||todayStr(),time:'',prio:0,area:'',note:''};
    return `<h3>${x?'Задача':'Новая задача'}</h3><form class="form" data-f="task" data-id="${x?x.id:''}" autocomplete="off">
    <label class="fld"><span>${_L('Что сделать')}</span><input class="inp" id="f-title" value="${esc(d.title)}" maxlength="200" data-autofocus placeholder="${_L('Например: сдать лабораторную')}"></label>
    <div class="g2"><label class="fld"><span>${_L('Дата')}</span><input class="inp" id="f-date" type="date" value="${esc(d.date)}"></label><label class="fld"><span>${_L('Время')}</span><input class="inp" id="f-time" type="time" value="${esc(d.time||'')}"></label></div>
    <div class="fld"><span>${_L('Приоритет')}</span>${segHtml('prio', d.prio|0, [[0,'Обычный'],[1,'Важно !'],[2,'Срочно !!'],[3,'Критично !!!']])}</div>
    <div class="fld"><span>${_L('Сфера')}</span>${segHtml('area', d.area||'', [['','—'],...AREAS.map(a=>[a,cap(_L(a))])])}</div>
    <label class="fld"><span>${_L('Заметка')}</span><textarea class="inp" id="f-note" rows="2" maxlength="600">${esc(d.note||'')}</textarea></label>
    <div class="actions">${x?delBtn('del-task',x.id):''}<button class="btn" type="button" data-a="close">${_L('Отмена')}</button><button class="btn pri" type="submit">${_L('Сохранить')}</button></div></form>`; },
  habit(m){ const h=m.id?S.cols.habits.get(m.id):null; const d=h||{name:'',icon:'target',kind:'check',target:1,unit:'',days:ALLD,bad:false,cue:''}; const ik=hKey(d);
    return `<h3>${h?'Изменить привычку':'Новая привычка'}</h3><form class="form" data-f="habit" data-id="${h?h.id:''}" autocomplete="off">
    <label class="fld"><span>${_L('Название')}</span><input class="inp" id="h-name" value="${esc(d.name)}" maxlength="60" data-autofocus placeholder="${_L('Например: 10 000 шагов')}"></label>
    <label class="fld"><span>${_L('Когда (после чего)')}</span><input class="inp" id="h-cue" value="${esc(d.cue||'')}" maxlength="40" placeholder="${_L('после завтрака')}"><small>${_L('Привязка к событию помогает привычке стать автоматической.')}</small></label>
    <div class="fld"><span>${_L('Значок')}</span><div class="icons" data-seg="icon" data-val="${ik}">${HKEYS.map(k=>`<button type="button" data-a="seg" data-v="${k}" class="${k===ik?'on':''}" aria-label="${k}">${gly(k)}</button>`).join('')}</div></div>
    <div class="fld"><span>${_L('Тип')}</span>${segHtml('kind', d.bad?'bad':d.kind, [['check','Да / нет'],['count','Количество'],['time','Время'],['bad','Вредная']])}<small id="h-kind-help">${kindHelp(d.bad?'bad':d.kind)}</small></div>
    <div class="g2" id="h-extra" ${(d.kind==='check'||d.bad)?'hidden':''}><label class="fld"><span>${_L('Цель в день')}</span><input class="inp" id="h-target" type="number" inputmode="numeric" min="1" max="1000" value="${esc(d.target||1)}"></label><label class="fld"><span>${_L('Единица')}</span><input class="inp" id="h-unit" value="${esc(d.kind==='time'?'мин':(d.unit||''))}" maxlength="12" placeholder="${_L('стак., стр., шагов')}"></label></div>
    <div class="fld"><span>${_L('Дни')}</span>${daysHtml('days', d.days)}</div>
    <div class="actions">${h?delBtn('del-habit',h.id):''}<button class="btn" type="button" data-a="close">${_L('Отмена')}</button><button class="btn pri" type="submit">${_L('Сохранить')}</button></div></form>`; },
  habitView(m){ const h=S.cols.habits.get(m.id); if(!h) return '<h3>Привычка удалена</h3>'; const t=todayStr(); let tot=0, dn=0; for(let i=1;i<=30;i++){ const d=addDays(t,-i); if(d<(h.since||t)) break; if(scheduled(h,d)&&!skipped(h,d)){ tot++; if(isDone(h,d)) dn++; } }
    return `<h3>${esc(h.name)}</h3><div class="g3">${stat('Серия', D.streak[h.id]||0)}${stat('Рекорд', D.best[h.id]||0)}${stat('30 дней', tot?Math.round(dn/tot*100)+'%':'—')}</div>
    <div class="sec-h" style="margin-top:18px"><h2>${_L('История')}</h2><span class="aside">${esc(daysText(h.days))}</span></div><div class="hm-wrap"><div class="chart" data-chart="hheat" data-id="${h.id}"></div></div>
    <div class="legend"><i style="background:var(--acc)"></i>${_L('выполнено')}<i style="background:rgba(var(--acc-rgb),.4)"></i>${_L('частично')}<i style="background:rgba(176,74,63,.42)"></i>${h.bad?'срыв':'пропущено'}<i style="background:var(--muted);opacity:.55"></i>${_L('пропуск')}</div>
    <p class="dim" style="font-size:13px">${esc(kindLabel(h))}${h.link==='gym'?'. '+_L('Отмечается сама, когда завершаешь тренировку во вкладке «Зал»'):''}</p>
    <div class="actions">${delBtn('del-habit',h.id)}${scheduled(h,t)?`<button class="btn" type="button" data-a="habit-skip" data-id="${h.id}">${skipped(h,t)?'Отменить пропуск':'Пропустить сегодня'}</button>`:''}<button class="btn pri" type="button" data-a="edit-habit" data-id="${h.id}">${_L('Изменить')}</button></div>`; },
  med(m){ const x=m.id?S.cols.meds.get(m.id):null; const d=x||{name:'',dose:'',times:['09:00'],days:ALLD,food:'',stock:'',perDose:1};
    return `<h3>${x?'Препарат':'Новая таблетка или витамин'}</h3><form class="form" data-f="med" data-id="${x?x.id:''}" autocomplete="off">
    <div class="g2"><label class="fld"><span>${_L('Название')}</span><input class="inp" id="m-name" value="${esc(d.name)}" maxlength="60" data-autofocus placeholder="${_L('Витамин C')}"></label><label class="fld"><span>${_L('Доза')}</span><input class="inp" id="m-dose" value="${esc(d.dose||'')}" maxlength="30" placeholder="${_L('1 таб.')}"></label></div>
    <label class="fld"><span>${_L('Время приёма')}</span><input class="inp" id="m-times" value="${esc((d.times||[]).join(', '))}" placeholder="09:00, 21:00"><small>${_L('Несколько приёмов — через запятую')}</small></label>
    <div class="fld"><span>${_L('Дни')}</span>${daysHtml('days', d.days)}</div>
    <div class="fld"><span>${_L('Еда')}</span>${segHtml('food', d.food||'', [['','Неважно'],['до еды','До еды'],['во время еды','Во время'],['после еды','После']])}</div>
    <div class="g2"><label class="fld"><span>${_L('Запас, штук')}</span><input class="inp" id="m-stock" type="number" inputmode="numeric" min="0" value="${esc(d.stock??'')}" placeholder="${_L('не считать')}"></label><label class="fld"><span>${_L('Штук за приём')}</span><input class="inp" id="m-per" type="number" inputmode="numeric" min="1" value="${esc(d.perDose||1)}"></label></div>
    <small class="muted">${_L('Приложение напомнит, когда запас подойдёт к концу. Схему приёма лекарств согласуй с врачом.')}</small>
    <div class="actions">${x?delBtn('del-med',x.id):''}<button class="btn" type="button" data-a="close">${_L('Отмена')}</button><button class="btn pri" type="submit">${_L('Сохранить')}</button></div></form>`; },
  planDay(m){ const w=m.work;
    return `<h3>${m.id?'Тренировочный день':'Новый день'}</h3><form class="form" data-f="planday" autocomplete="off">
    <label class="fld"><span>${_L('Название')}</span><input class="inp" id="pd-name" data-pd="n:name" value="${esc(w.name)}" maxlength="60" placeholder="${_L('Грудь + трицепс')}"></label>
    <div class="fld"><span>${_L('Дни недели')}</span>${daysHtml('wd', w.wd)}</div>
    <div class="fld"><span>${_L('Упражнения · подходы · повторы')}</span><div class="form" style="gap:8px">${w.ex.map((e,i)=>`<div class="pd-ex"><input class="inp" id="pd-${i}-n" data-pd="${i}:name" value="${esc(e.name)}" placeholder="${_L('Упражнение')}" maxlength="80"><select class="inp mus-sel" id="pd-${i}-m" data-pd="${i}:muscle">${MUSCLES.map(x=>`<option ${x===e.muscle?'selected':''}>${x}</option>`).join('')}</select><input class="inp" id="pd-${i}-s" data-pd="${i}:sets" type="number" inputmode="numeric" min="1" max="10" value="${esc(e.sets)}" aria-label="${_L('Подходы')}"><input class="inp" id="pd-${i}-r" data-pd="${i}:reps" value="${esc(e.reps)}" maxlength="10" placeholder="8-12" aria-label="${_L('Повторы')}"><button class="btn sm icon ghost" type="button" data-a="pd-rm" data-i="${i}" aria-label="${_L('Убрать')}">${ico('x','sm')}</button></div>`).join('')}</div>
    <div class="btns"><button class="btn sm" type="button" data-a="pd-add">${ico('plus','sm')}${_L('Упражнение')}</button></div></div>
    <div class="actions">${m.id?delBtn('pd-del',m.id,'Удалить день'):''}<button class="btn" type="button" data-a="close">${_L('Отмена')}</button><button class="btn pri" type="submit">${_L('Сохранить')}</button></div></form>`; },
  exLib(m){ const mine=m&&m.mode==='mine'; return `<h3>${mine?'Моё упражнение':'Добавить упражнение'}</h3><form class="form" data-f="custom-ex" autocomplete="off"><div class="g2"><input class="inp" id="ce-name" placeholder="${_L('Своё упражнение')}" maxlength="80" aria-label="${_L('Название')}"><select class="inp" id="ce-mus" aria-label="${_L('Мышцы')}">${MUSCLES.map(x=>`<option>${x}</option>`).join('')}</select></div><button class="btn" type="submit">${ico('plus','sm')}${_L('Добавить своё')}</button></form>${Object.entries(LIB).map(([mus,arr])=>`<div class="lib-g"><h5>${mus}</h5><div class="lib">${arr.map(n=>`<button class="chip" type="button" data-a="${mine?'ex-view':'wo-pick'}" data-n="${esc(n)}" data-m="${mus}">${esc(n)}</button>`).join('')}</div></div>`).join('')}`; },
  mood(m){ const l=logOf(m.date);
    return `<h3>${_L('Как ты {0}?', m.date===todayStr()?'сегодня':esc(shortDate(m.date)))}</h3><form class="form" data-f="mood" data-d="${m.date}" autocomplete="off">
    <div class="fld"><span>${_L('Настроение')}</span>${segHtml('mood', l.mood||'', [1,2,3,4,5].map(v=>[v,v]), 'full')}<small>${_L('1 — тяжело · 3 — нормально · 5 — отлично')}</small></div>
    <div class="fld"><span>${_L('Энергия')}</span>${segHtml('energy', l.energy||'', [1,2,3,4,5].map(v=>[v,v]), 'full')}</div>
    <label class="fld"><span>${_L('Сон, часов')}</span><input class="inp" id="md-sleep" type="number" inputmode="decimal" step="0.5" min="0" max="16" value="${esc(l.sleep??'')}" placeholder="7.5"></label>
    <label class="fld"><span>${_L('Заметка')}</span><textarea class="inp" id="md-note" rows="3" maxlength="600" placeholder="${_L('Что было главным за день?')}">${esc(l.note||'')}</textarea></label>
    <div class="actions"><button class="btn" type="button" data-a="close">${_L('Отмена')}</button><button class="btn pri" type="submit">${_L('Сохранить')}</button></div></form>`; },
  settings(){ const p=P(); const n=COLS.reduce((a,c)=>a+S.cols[c].size,0); const tts='speechSynthesis' in window;
    return `<h3>${_L('Настройки')}</h3><form class="form" data-f="settings" autocomplete="off">
    <div class="g2"><label class="fld"><span>${_L('Твоё имя')}</span><input class="inp" id="s-name" value="${esc(p.name)}" maxlength="30"></label><label class="fld"><span>${_L('Имя ассистента')}</span><input class="inp" id="s-ai" value="${esc(p.ai)}" maxlength="20"></label></div>
    <label class="fld"><span>${_L('Язык')}</span><select class="inp" id="s-lang" data-notr="1">${LANGS.map(([k,n])=>`<option value="${k}" ${k===LANG?'selected':''}>${n}</option>`).join('')}</select></label>
    <div class="fld"><span>${_L('Тема')}</span>${segHtml('theme', curTheme(), [['light','Светлая'],['dark','Тёмная'],['auto','Как в системе']])}</div>
    <div class="fld"><span>${_L('Палитра')}</span><div class="pals">${PALS.map(x=>`<button type="button" class="pal ${x.id===curPal()?'on':''}" data-a="pal" data-v="${x.id}" aria-label="${esc(x.n)}"><span class="sw" style="background:radial-gradient(circle at 34% 28%, ${x.sw[0]} 0%, ${x.sw[1]} 45%, ${x.sw[2]} 100%)"><i style="background:${document.documentElement.dataset.mode==='dark'?x.dotD:x.dot}"></i></span>${esc(x.n)}</button>`).join('')}</div></div>
    <div class="fld"><span>${_L('Отдых между подходами')}</span>${segHtml('rest', p.rest, [[60,'1:00'],[90,'1:30'],[120,'2:00'],[180,'3:00']])}</div>
    <label class="switch"><span>${_L('Лёгкий режим питания: только калории и белок')}</span><input type="checkbox" id="s-light" ${p.nutriMode==='light'?'checked':''}></label>
    ${tts?`<label class="switch"><span>${_L('Озвучивать ответы ассистента')}</span><input type="checkbox" id="s-voice" ${p.voice?'checked':''}></label>`:''}
    <div class="fld"><span>${_L('Под себя')}</span><div class="btns"><button class="btn sm" type="button" data-a="setup">${ico('spark','sm')}${_L('Старт за 60 секунд')}</button></div></div>
    ${IS_PWA?appSettingsHtml():''}
    <div class="fld"><span>${_L('Данные')}</span><small>${_L('{0} · записей: {1} из 5000', S.mode==='live'?'Синхронизируются между устройствами':IS_PWA?'Хранятся на этом устройстве':'Хранятся только в этом браузере', n)}</small><div class="btns"><button class="btn sm" type="button" data-a="backup">${ico('copy','sm')}${_L('Скачать копию данных')}</button><label class="btn sm ghost" for="imp-file">${_L('Загрузить копию')}</label><input type="file" id="imp-file" accept="application/json,.json" hidden><button class="btn sm ghost" type="button" data-a="copy-data">${_L('Скопировать в буфер')}</button></div></div>
    <div class="actions"><button class="btn" type="button" data-a="close">${_L('Отмена')}</button><button class="btn pri" type="submit">${_L('Сохранить')}</button></div></form>`; },
  woView(m){ const w=S.cols.workouts.get(m.id); if(!w) return '<h3>Тренировка удалена</h3>'; const dur=(Date.parse(w.finishedAt)-Date.parse(w.startedAt))/6e4, prs=D.woPR[w.id]||[];
    return `<h3>${esc(w.name||'Тренировка')}</h3><p class="dim" style="margin:-8px 0 12px;font-size:13px">${_L('{0} · {1} · {2} кг объём', esc(dayLabel(w.date)), fmtDur(dur), nf.format(Math.round(volumeOf(w))))}</p>
    <div class="hud list">${(w.exercises||[]).map(ex=>{ const ds=(ex.sets||[]).filter(s=>s.done); return `<div class="row"><span class="main-t"><span class="ttl">${esc(ex.name)} ${prs.includes(ex.name)?'<span class="tag acc">PR</span>':''}</span><span class="sub mono">${ds.map(s=>`${fmtW(s.w)}×${esc(s.r)}`).join(' · ')||'—'}</span></span></div>`; }).join('')}</div>
    <div class="actions" style="margin-top:14px">${delBtn('wo-del',w.id,'Удалить тренировку')}<button class="btn pri" type="button" data-a="close">${_L('Закрыть')}</button></div>`; },
  woSummary(m){ return `<h3>${_L('Тренировка завершена')}</h3><div class="g3">${stat('Время', fmtDur(m.dur))}${stat('Объём', nf.format(Math.round(m.vol))+' '+_L('кг'))}${stat('Подходов', m.sets)}</div>
    ${m.prs.length?`<div class="sec-h"><h2>${_L('Личные рекорды')}</h2></div><div class="hud list">${m.prs.map(p=>`<div class="row"><span class="tag acc">PR</span><span class="main-t"><span class="ttl">${esc(p.name)}</span><span class="sub mono">${esc(p.txt)}</span></span></div>`).join('')}</div>`:''}
    ${m.recs&&m.recs.length?`<div class="sec-h"><h2>${_L('В следующий раз')}</h2></div><div class="hud list">${m.recs.map(r=>`<div class="row"><span class="main-t"><span class="ttl">${esc(r.name)}</span><span class="sub"><span style="color:var(--acc)">${esc(r.txt)}</span></span></span></div>`).join('')}</div>`:''}
    <p class="dim" style="margin:14px 0 4px">+${m.xp} XP. ${m.prs.length?_L('Новые рекорды — сила растёт.'):_L('Каждая тренировка в копилку.')}</p><div class="actions"><button class="btn pri" type="button" data-a="close">${_L('Отлично')}</button></div>`; }
};
function kindHelp(k){ return k==='check'?'Просто отметка: сделал или нет.':k==='count'?'Счётчик за день: стаканы воды, страницы, подходы.':k==='time'?'Минуты за день: учёба, чтение, медитация.':'Отмечай срывы. День без срывов идёт в серию.'; }

/* ================= forms ================= */
const FORMS = {
  'quick-task'(f){ const inp=$('#qt-title'), title=inp.value.trim(); if(!title){ inp.focus(); return; } const time=validTime($('#qt-time').value)||''; Store.set('tasks', uid(), {title, date:S.selDate, time, prio:0, area:'', note:'', done:false, doneAt:null, createdAt:new Date().toISOString()}); inp.value=''; $('#qt-time').value=''; render(true); },
  task(f){ const title=$('#f-title').value.trim(); if(!title){ toast('Напиши, что нужно сделать','bad'); return; } const id=f.dataset.id||uid(); const cur=S.cols.tasks.get(id);
    Store.set('tasks', id, {...(cur?strip(cur):{done:false, doneAt:null, createdAt:new Date().toISOString()}), title, date:validDate($('#f-date').value)||todayStr(), time:validTime($('#f-time').value)||'', prio:+segVal(f,'prio')||0, area:segVal(f,'area')||'', note:$('#f-note').value.trim()}); closeModal(); render(true); },
  habit(f){ const name=$('#h-name').value.trim(); if(!name){ toast('Назови привычку','bad'); return; } const days=multiVal(f,'days'); if(!days.length){ toast('Выбери хотя бы один день','bad'); return; }
    const k=segVal(f,'kind'), bad=k==='bad', kind=bad?'check':k; const id=f.dataset.id||uid(); const cur=S.cols.habits.get(id);
    const maxOrder=Math.max(0,...[...S.cols.habits.values()].map(h=>h.order||0));
    const data={...(cur?strip(cur):{since:todayStr(), order:maxOrder+1}), name, icon:segVal(f,'icon')||'target', cue:($('#h-cue')?$('#h-cue').value.trim():''), kind, bad, days, target: kind==='check'?1:Math.max(1,clampInt($('#h-target').value,1,1000)), unit: kind==='time'?'мин':(kind==='count'?$('#h-unit').value.trim():'')};
    delete data.ex; Store.set('habits', id, data); closeModal(); render(true); },
  med(f){ const name=$('#m-name').value.trim(); if(!name){ toast('Напиши название','bad'); return; } const times=[...new Set(($('#m-times').value.match(/\d{1,2}[:.]\d{2}/g)||[]).map(s=>validTime(s.replace('.',':'))).filter(Boolean))].sort(); if(!times.length){ toast('Укажи время приёма, например 09:00','bad'); return; } const days=multiVal(f,'days'); if(!days.length){ toast('Выбери дни приёма','bad'); return; }
    const id=f.dataset.id||uid(); const cur=S.cols.meds.get(id); const sv=$('#m-stock').value.trim();
    const data={...(cur?strip(cur):{since:todayStr()}), name, dose:$('#m-dose').value.trim(), times, days, food:segVal(f,'food')||'', stock: sv===''?null:Math.max(0,clampInt(sv,0,100000)), perDose:Math.max(1,clampInt($('#m-per').value,1,100))};
    delete data.ex; Store.set('meds', id, data); closeModal(); render(true); },
  planday(f){ const w=S.modal.work; w.wd=multiVal(f,'wd'); const name=String(w.name||'').trim(); if(!name){ toast('Назови тренировочный день','bad'); return; }
    const ex=w.ex.map(e=>({name:String(e.name||'').trim(), muscle:e.muscle||muscleOf(e.name)||'', sets:clampInt(e.sets,1,10), reps:String(e.reps||'').trim()||'8-12'})).filter(e=>e.name);
    const pl=PLAN(); const days=pl.days.map(d=>clone(d)); const nd={id:S.modal.id||uid(), name, wd:w.wd, ex};
    const i=days.findIndex(d=>d.id===nd.id); if(i>=0) days[i]=nd; else days.push(nd);
    Store.set('meta','plan',{days}); closeModal(); render(true); },
  'custom-ex'(f){ const n=$('#ce-name').value.trim(); if(!n) return; const mus=$('#ce-mus').value; if(S.modal && S.modal.mode==='mine'){ Store.merge('meta','ex',{list:{[keyOf(n)]:{name:n, w:'', r:'', muscle:mus, at:todayStr()}}}); openModal('exView',{name:n}); render(true); return; } Store.merge('meta','ex',{list:{[keyOf(n)]:{name:n, w:'', r:'', muscle:mus, at:todayStr()}}}); addExercise(n, mus); closeModal(); },
  mood(f){ const d=f.dataset.d; const mood=+segVal(f,'mood')||null, energy=+segVal(f,'energy')||null; const sl=num($('#md-sleep').value);
    Store.merge('logs', d, {mood, energy, sleep: isFinite(sl)&&sl>0 ? Math.min(16,sl) : null, note:$('#md-note').value.trim()}); closeModal(); render(true); toast('Состояние записано'); },
  body(f){ const v=num($('#bw-in').value); if(!(v>20&&v<400)){ toast('Введи вес в килограммах, например 74,5','bad'); return; } Store.merge('meta','body',{w:{[todayStr()]:Math.round(v*10)/10}}); $('#bw-in').value=''; render(true); toast('Вес записан'); },
  settings(f){ const theme=segVal(f,'theme')||'light', pal=(f.querySelector('.pal.on')||{dataset:{v:'porcelain'}}).dataset.v; S.previewTheme=null; S.previewPal=null; const v=$('#s-voice');
    const lang=($('#s-lang')||{}).value||LANG; uiSave({lang}); Store.merge('meta','profile',{name:$('#s-name').value.trim(), ai:($('#s-ai').value.trim()||'NOVA').slice(0,20), theme, pal, lang, rest:+segVal(f,'rest')||90, voice: v?v.checked:false, nutriMode: $('#s-light')&&$('#s-light').checked?'light':'full', start:P().start||todayStr()}); closeModal(); render(true); },
  ask(f){},
  'ask-sheet'(f){ const inp=$('#sheet-in'), q=inp.value.trim(), ph=S.photo; if(!q && !ph) return; inp.value=''; inp.style.height=''; S.photo=null; S.photoURL=null; const pp=$('#sheet-photo'); if(pp) pp.innerHTML='';
    const full = ph ? `${q||'Что на фото?'}\n\n[Приложено фото. Если это еда — оцени порцию и КБЖУ и запиши через log_food. Если тренажёр или упражнение — назови его (из каталога, если подходит), дай 2–3 главных пункта техники и мой рекомендованный вес по данным. Если этикетка продукта — запиши с КБЖУ с этикетки, спросив вес порции, если его не видно.]` : q;
    ask(full, {tier: ph?'default':'quick', show: ph ? 'Фото'+(q?' · '+q:'') : q, images: ph?[ph]:undefined}); }
};

/* ================= actions ================= */
function armed(el){ if(el.classList.contains('armed')) return true; el.classList.add('armed'); el.dataset.old=el.innerHTML; el.textContent=el.dataset.confirm||'Точно?'; setTimeout(()=>{ if(el.isConnected && el.classList.contains('armed')){ el.classList.remove('armed'); el.innerHTML=el.dataset.old; } }, 3500); return false; }
function setHabit(h,d,v){ Store.merge('logs', d, {h:{[h.id]:v}}); render(true); }
function toggleDoseAt(key, d){
  const taken=!!((logOf(d).m||{})[key]); Store.merge('logs', d, {m:{[key]: taken?0:1}});
  const m=S.cols.meds.get(key.split('@')[0]);
  if(m && m.stock!==null && m.stock!==undefined && m.stock!==''){ const per=Number(m.perDose)||1; const ns=Math.max(0, Number(m.stock)+(taken?per:-per)); const before=stockInfo(m); Store.merge('meds', m.id, {stock:ns}); const after=stockInfo(S.cols.meds.get(m.id)); if(!taken && after && after.days<7 && before && before.days>=7) toast(`${_L('Заканчивается {0}: запаса примерно на {1} {2}.', esc(m.name), after.days, plural(after.days,'день','дня','дней'))}`); }
}
const A = {
  tab(el){ go(el.dataset.tab); },
  settings(){ openModal('settings'); },
  orb(){ briefing(); },
  chip(el){ const c=CHIPS[+el.dataset.i]; if(!c) return; if(c.a) A[c.a](); else ask(c.q,{tier:c.tier, show:c.l}); },
  'clear-chat'(){ S.chat=[]; renderHero(); },
  stop(){ if(S.ctl) S.ctl.abort(); },
  'toggle-task'(el){ const x=S.cols.tasks.get(el.dataset.id); if(!x) return; Store.merge('tasks', x.id, {done:!x.done, doneAt:!x.done?new Date().toISOString():null}); render(true); },
  'edit-task'(el){ openModal('task',{id:el.dataset.id}); },
  'new-task'(el){ openModal('task',{date: el.dataset.d || (S.tab==='tasks'?S.selDate:todayStr())}); },
  'sel-day'(el){ const d=el.dataset.d; soft(()=>{ S.selDate=d; }, d>=S.selDate?'fwd':'back'); },
  week(el){ const v=+el.dataset.v; soft(()=>{ S.selDate=addDays(S.selDate, v); }, v>0?'fwd':'back'); },
  carry(){ const t=todayStr(), od=overdue(); od.forEach(x=>Store.merge('tasks',x.id,{date:t})); toast(`${_L('Перенесено на сегодня: {0}', od.length)}`); render(true); },
  'habit-toggle'(el){ const h=S.cols.habits.get(el.dataset.id); if(!h) return; const t=todayStr(); setHabit(h,t, hv(h,t)>=1?0:1); },
  'habit-inc'(el){ const h=S.cols.habits.get(el.dataset.id); if(!h) return; const t=todayStr(); const cur=Number((logOf(t).h||{})[h.id]||0); setHabit(h,t, Math.max(0, cur+Number(el.dataset.v))); },
  'habit-fill'(el){ const h=S.cols.habits.get(el.dataset.id); if(!h) return; const t=todayStr(); setHabit(h,t, isDone(h,t)?0:(h.target||1)); },
  'habit-skip'(el){ const h=S.cols.habits.get(el.dataset.id); if(!h) return; const t=todayStr(); Store.merge('logs', t, {sk:{[h.id]: skipped(h,t)?0:1}}); render(true); if(S.modal) renderModal(true); },
  'habit-open'(el){ openModal('habitView',{id:el.dataset.id}); },
  'new-habit'(){ openModal('habit',{}); },
  'edit-habit'(el){ openModal('habit',{id:el.dataset.id}); },
  'del-habit'(el){ if(!armed(el)) return; Store.del('habits', el.dataset.id); closeModal(); render(true); },
  'med-toggle'(el){ toggleDoseAt(el.dataset.k, todayStr()); render(true); },
  'new-med'(){ openModal('med',{}); },
  'edit-med'(el){ openModal('med',{id:el.dataset.id}); },
  'del-med'(el){ if(!armed(el)) return; Store.del('meds', el.dataset.id); closeModal(); render(true); },
  'del-task'(el){ if(!armed(el)) return; Store.del('tasks', el.dataset.id); closeModal(); render(true); },
  'mood-open'(){ openModal('mood',{date:todayStr()}); },
  'gym-start'(el){ if(S.draft){ go('gym'); return; } openPicker(el.dataset.id||''); },
  'wo-set'(el){ const w=S.draft; if(!w) return; const ex=w.exercises[+el.dataset.e], s=ex&&ex.sets[+el.dataset.s]; if(!s) return;
    if(!s.done){ const last=lastFor(ex.name), ls=last?(last.sets[+el.dataset.s]||last.sets[last.sets.length-1]):null;
      if(String(s.w).trim()==='' && ls) s.w=String(ls.w??''); if(String(s.r).trim()===''){ const r = ls ? ls.r : (repsLow(ex.target)!=='повт.'?repsLow(ex.target):''); s.r=String(r||''); }
      if(!(num(s.r)>0)){ toast('Впиши количество повторов','bad'); render(true); return; }
      if(String(s.w).trim()==='') s.w='0';
      s.done=true; s.auto=false; ensureAudio(); startRest(P().rest||90);
      const adv=setAdvice(ex, +el.dataset.s); if(adv){ const nw=Math.max(0, Math.round(((num(s.w)||0)+adv.dw)*10)/10); for(let k=+el.dataset.s+1;k<ex.sets.length;k++){ const nx=ex.sets[k]; if(!nx.done && nx.auto!==false) nx.w=String(nw); } }
      const best=D.bestMetric[ex.name]; if(best!==undefined && setMetric(s)>best+1e-6 && !ex.prToasted){ ex.prToasted=true; toast(`<b>${_L('Новый рекорд')}</b>${esc(ex.name)}: ${fmtW(s.w)} × ${esc(s.r)}`,'big'); }
    } else s.done=false;
    flushWo(true); render(true); },
  'wo-add-set'(el){ const ex=S.draft&&S.draft.exercises[+el.dataset.e]; if(!ex) return; const l=ex.sets[ex.sets.length-1]; ex.sets.push({w:l?l.w:'', r:'', done:false}); flushWo(true); render(true); },
  'wo-del-set'(el){ const ex=S.draft&&S.draft.exercises[+el.dataset.e]; if(!ex) return; ex.sets.splice(+el.dataset.s,1); flushWo(true); render(true); },
  'wo-del-ex'(el){ if(!S.draft) return; const ex=S.draft.exercises[+el.dataset.e]; if(ex && ex.sets.some(s=>s.done) && !armed(el)) return; S.draft.exercises.splice(+el.dataset.e,1); flushWo(true); render(true); },
  'wo-add-ex'(){ openModal('exLib'); },
  'wo-pick'(el){ addExercise(el.dataset.n, el.dataset.m); closeModal(); },
  'wo-finish'(){ finishWorkout(); },
  'wo-cancel'(el){ if(!armed(el)) return; const id=S.draft&&S.draft.id; if(id) S.closedWo.add(id); clearTimeout(S.woT); S.draft=null; stopRest(false); releaseWake(); if(id) Store.del('workouts', id); render(true); toast('Тренировка отменена'); },
  'wo-open'(el){ openModal('woView',{id:el.dataset.id}); },
  'wo-del'(el){ if(!armed(el)) return; Store.del('workouts', el.dataset.id); closeModal(); render(true); },
  'rest-adj'(el){ R.end+=Number(el.dataset.v)*1000; R.total=Math.max(R.total,(R.end-Date.now())/1000); tickRest(); },
  'rest-skip'(){ stopRest(false); },
  'plan-edit'(el){ const d=PLAN().days.find(x=>x.id===el.dataset.id); openModal('planDay',{id:d?d.id:'', work: d ? {name:d.name, wd:[...(d.wd||[])], ex:clone(d.ex||[])} : {name:'', wd:[], ex:[{name:'',muscle:'Грудь',sets:3,reps:'8-12'}]}}); },
  'pd-add'(){ S.modal.work.wd=multiVal($('#modal form'),'wd'); S.modal.work.ex.push({name:'',muscle:'Грудь',sets:3,reps:'8-12'}); renderModal(true); },
  'pd-rm'(el){ S.modal.work.wd=multiVal($('#modal form'),'wd'); S.modal.work.ex.splice(+el.dataset.i,1); renderModal(true); },
  'pd-del'(el){ if(!armed(el)) return; const days=PLAN().days.filter(d=>d.id!==el.dataset.id).map(clone); Store.set('meta','plan',{days}); closeModal(); render(true); },
  'plan-undo'(){ const pl=PLAN(); Store.set('meta','plan',{days: pl.prev||[]}); render(true); toast('Прежняя программа возвращена'); },
  'plan-keep'(){ const pl=PLAN(); Store.set('meta','plan',{days: pl.days}); render(true); },
  'ai-plan'(){ go('home'); ask('Составь мне программу тренировок в зале. Сначала коротко спроси про цель, опыт и сколько дней в неделю я могу ходить. Потом предложи программу и сохрани её только после моего согласия.', {tier:'default', show:'Составь мне программу в зал'}); },
  review(){ go('home'); const c=CHIPS[3]; ask(c.q,{tier:c.tier, show:c.l}); },
  'copy-data'(el){ const o={}; COLS.forEach(c=>{ o[c]=Object.fromEntries([...S.cols[c]].map(([k,v])=>[k,strip(v)])); }); const txt=JSON.stringify(o,null,1); try{ navigator.clipboard.writeText(txt).then(()=>toast('Данные скопированы'),()=>toast('Не удалось скопировать: браузер запретил доступ к буферу','bad')); }catch(e){ toast('Не удалось скопировать','bad'); } },
  close(){ closeModal(); },
  back(el,e){ if(e.target===el) closeModal(); },
  seg(el){ const box=el.closest('[data-seg]'); box.dataset.val=el.dataset.v; box.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b===el));
    if(box.dataset.seg==='kind'){ const k=el.dataset.v; const ex=$('#h-extra'); if(ex) ex.hidden=(k==='check'||k==='bad'); const hl=$('#h-kind-help'); if(hl) hl.textContent=kindHelp(k); const u=$('#h-unit'); if(u){ if(k==='time') u.value='мин'; else if(u.value==='мин') u.value=''; } }
    if(box.dataset.seg==='theme'){ S.previewTheme=el.dataset.v; themeFade(); renderChrome(); }
    if(box.dataset.seg==='build'){ const h=$('#n-build-help'); if(h) h.textContent=BUILD_HELP[el.dataset.v]||''; }
    if(box.dataset.seg==='meal' && S.modal) S.modal.meal=el.dataset.v;
    if(box.dataset.seg==='fmode' && S.modal){ S.modal.mode=el.dataset.v; S.modal.pick=null; renderModal(true); } },
  pal(el){ const box=el.closest('.pals'); if(box) box.querySelectorAll('.pal').forEach(b=>b.classList.toggle('on', b===el)); S.previewPal=el.dataset.v; themeFade(); renderChrome(); },
  multi(el){ const box=el.closest('[data-multi]'); el.classList.toggle('on'); box.dataset.val=[...box.querySelectorAll('button.on')].map(b=>b.dataset.v).join(','); }
};

/* ================= workout logic ================= */
function mkEx(name, muscle, sets, reps){ const e=exInfo(name), last=lastFor(name); const n=Math.max(1, Number(sets)||(last?last.sets.length:3)); const target = reps ? `${n}×${reps}` : `${n}×${defaultReps(name)}`; const rec=recommend(name, target);
  return {name, muscle:muscle||e.m||'', target, sets:Array.from({length:n},()=>({w: rec.w!=null ? String(rec.w) : '', r:'', done:false, auto:true}))}; }
function startWorkout(dayId, names){ const day=PLAN().days.find(d=>d.id===dayId); const id=uid();
  const list = names && names.length ? names : (day ? day.ex.map(e=>e.name) : []);
  const exs = list.map(n=>{ const pe=planEx(n, day); return mkEx(n, pe?pe.muscle:exInfo(n).m, pe?pe.sets:3, pe?pe.reps:defaultReps(n)); });
  S.draft={id, date:todayStr(), dayId:day?day.id:'', name:day?day.name:'Свободная тренировка', startedAt:new Date().toISOString(), finishedAt:null, exercises:exs};
  Store.set('workouts', id, S.draft); S.tab='gym'; wake(); render(true); window.scrollTo({top:0}); }
function addExercise(name, muscle){ if(!S.draft) return; const pe=planEx(name); S.draft.exercises.push(mkEx(name, muscle||exInfo(name).m, pe?pe.sets:3, pe?pe.reps:defaultReps(name))); flushWo(true); render(true); }
function flushWo(now){ clearTimeout(S.woT); const f=(silent)=>{ if(!S.draft) return; S.noTrack=!!silent; try{ Store.set('workouts', S.draft.id, S.draft); } finally{ S.noTrack=false; } }; if(now) f(false); else S.woT=setTimeout(()=>f(true),800); }
function finishWorkout(){
  const w=S.draft; if(!w) return;
  const exs=w.exercises.map(ex=>({name:ex.name, muscle:ex.muscle, target:ex.target, sets:ex.sets.filter(s=>s.done).map(s=>({w:String(s.w), r:String(s.r), done:true}))})).filter(ex=>ex.sets.length);
  if(!exs.length){ toast('Отметь хотя бы один подход галочкой или отмени тренировку','bad'); return; }
  const prs=[]; for(const ex of exs){ const best=D.bestMetric[ex.name]; const top=ex.sets.reduce((a,s)=>setMetric(s)>setMetric(a)?s:a, ex.sets[0]); if(best!==undefined && setMetric(top)>best+1e-6) prs.push({name:ex.name, txt:`${_L('{0} кг × {1}', fmtW(top.w), top.r)}`}); }
  const fin={...w, exercises:exs, finishedAt:new Date().toISOString()};
  const dur=(Date.parse(fin.finishedAt)-Date.parse(fin.startedAt))/6e4, vol=volumeOf(fin), sets=exs.reduce((a,e)=>a+e.sets.length,0);
  clearTimeout(S.woT); S.closedWo.add(w.id); S.draft=null; stopRest(false); releaseWake();
  Store.set('workouts', w.id, fin);
  const recs=exs.map(ex=>({name:ex.name, txt:recText(recommend(ex.name, ex.target))+(exInfo(ex.name).t==='db'?' (гантель)':'')}));
  openModal('woSummary',{dur, vol, sets, prs, recs, xp:50+20*prs.length}); render(true); setTimeout(()=>{ buzz(24); burst($('#modal .g3')); }, 380);
}
function syncDraft(m){
  if(S.draft){ const cur=m.get(S.draft.id); if(cur && cur.finishedAt){ S.closedWo.add(S.draft.id); S.draft=null; } return; }
  const open=[...m.values()].filter(w=>!w.finishedAt && !S.closedWo.has(w.id)).sort((a,b)=>String(b.startedAt).localeCompare(String(a.startedAt)))[0];
  if(open) S.draft=clone(open);
}
const R = {end:0, total:0, int:null};
function startRest(sec){ R.total=sec; R.end=Date.now()+sec*1000; $('#rest').hidden=false; clearInterval(R.int); R.int=setInterval(tickRest,250); tickRest(); }
function tickRest(){ const left=Math.max(0,(R.end-Date.now())/1000); $('#rest-t').textContent=fmtClock(Math.ceil(left)); $('#rest-bar').style.width=(R.total?left/R.total*100:0)+'%'; if(left<=0) stopRest(true); }
function stopRest(done){ clearInterval(R.int); R.int=null; $('#rest').hidden=true; if(done){ beep(); try{ navigator.vibrate && navigator.vibrate([180,90,180]); }catch(e){} toast('<b>Отдых окончен</b>Следующий подход.','big'); } }
let actx=null;
function ensureAudio(){ try{ if(!actx){ const C=window.AudioContext||window.webkitAudioContext; if(C) actx=new C(); } if(actx && actx.state==='suspended') actx.resume(); }catch(e){} }
function beep(){ if(!actx) return; try{ [0,.22].forEach(d=>{ const o=actx.createOscillator(), g=actx.createGain(); o.frequency.value=880; o.type='sine'; g.gain.setValueAtTime(.0001, actx.currentTime+d); g.gain.exponentialRampToValueAtTime(.25, actx.currentTime+d+.02); g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime+d+.16); o.connect(g).connect(actx.destination); o.start(actx.currentTime+d); o.stop(actx.currentTime+d+.18); }); }catch(e){} }
let wakeLock=null;
async function wake(){ try{ if('wakeLock' in navigator) wakeLock=await navigator.wakeLock.request('screen'); }catch(e){ wakeLock=null; } }
function releaseWake(){ try{ wakeLock && wakeLock.release(); }catch(e){} wakeLock=null; }

/* ================= assistant ================= */
let sample=null, sTools=false;
async function initAI(){
  if(IS_PWA){ pwaAI(); return; }
  const c=window.claude;
  if(!c || typeof c.use!=='function'){ S.aiOff='Ассистент работает, когда страница открыта в Claude.'; renderHero(); return; }
  try{ sample=await c.use('sample'); }catch(e){ sample=null; }
  if(!sample){ S.aiOff='Ассистент недоступен в этом окне.'; renderHero(); return; }
  try{ const lim=await sample.limits(); sTools=!!(lim && lim.tools); sImages=!!(lim && lim.images); }catch(e){ sTools=false; }
  renderHero();
}
function briefing(){ const h=new Date().getHours(); if(h<12) ask('Утренний брифинг: что у меня сегодня по задачам, привычкам, таблеткам и залу, что главное и в каком порядке лучше делать. Коротко.',{tier:'quick', show:'Утренний брифинг'}); else if(h<18) ask('Короткая сводка: что осталось сделать сегодня и что важнее всего прямо сейчас.',{tier:'quick', show:'Сводка дня'}); else ask('Вечерний разбор: что я сделал сегодня, что осталось, что разумно перенести на завтра. Если предлагаешь перенос — спроси, перенести ли. Напомни отметить состояние, если я не отметил.',{tier:'quick', show:'Вечерний разбор'}); }
function contextText(){
  const p=P(), t=todayStr(), L=[];
  L.push(`Сейчас: ${fLong.format(new Date())}, ${nowHM()}. Сегодня=${t}, завтра=${addDays(t,1)}. Дни недели в данных: 1=Пн … 7=Вс.`);
  L.push(`Пользователь: ${p.name||'без имени'}. Уровень ${D.level} (ранг ${D.rank.l} — ${D.rank.n}), ${D.xp} XP. Дисциплина за 7 дней: ${D.disc7==null?'нет данных':D.disc7+'%'}. План сегодня выполнен на ${dayStats(t).pct??0}%.`);
  L.push('\nЗАДАЧИ СЕГОДНЯ:'); const tt=tasksOn(t); tt.forEach(x=>L.push(`- [${x.id}] ${x.title}${x.time?' в '+x.time:''}${x.prio?' (приоритет '+x.prio+')':''} — ${x.done?'выполнена':'не выполнена'}`)); if(!tt.length) L.push('- нет');
  const od=overdue(); if(od.length){ L.push('ПРОСРОЧЕНО:'); od.slice(0,15).forEach(x=>L.push(`- [${x.id}] ${x.title} (была на ${x.date})`)); }
  L.push('БЛИЖАЙШИЕ 7 ДНЕЙ (открытые):'); let any=false; for(let i=1;i<=7;i++){ const d=addDays(t,i), ts=tasksOn(d).filter(x=>!x.done); if(ts.length){ any=true; L.push(`- ${d} (${WD[wdOf(d)-1]}): `+ts.map(x=>`[${x.id}] ${x.title}${x.time?' '+x.time:''}`).join('; ')); } } if(!any) L.push('- нет');
  L.push('\nПРИВЫЧКИ:'); habitsAll().forEach(h=>L.push(`- [${h.id}] ${h.icon||''} ${h.name}; тип ${h.bad?'вредная (value = число срывов, 0 = чисто)':h.kind}${!h.bad&&h.kind!=='check'?`, цель ${h.target} ${h.unit||''}`:''}; дни: ${daysText(h.days)}; сегодня: ${scheduled(h,t)?(skipped(h,t)?'пропуск':progText(h,t)+' (value='+hv(h,t)+')'):'не по плану'}; серия ${D.streak[h.id]||0}, рекорд ${D.best[h.id]||0}${h.link==='gym'?'; отмечается тренировкой':''}`));
  L.push('\nТАБЛЕТКИ/ВИТАМИНЫ СЕГОДНЯ (dose_key):'); const ds=dosesOn(t); ds.forEach(x=>L.push(`- [${x.key}] ${x.med.name} ${x.med.dose||''} в ${x.time}${x.med.food?' ('+x.med.food+')':''} — ${x.taken?'принято':'не принято'}`)); if(!ds.length) L.push('- нет');
  medsAll().forEach(m=>{ const si=stockInfo(m); if(si && si.days<10) L.push(`! ${m.name}: запаса примерно на ${si.days} дн.`); });
  const pl=PLAN(); L.push('\nЗАЛ. Программа:'); pl.days.forEach(d=>L.push(`- ${d.name} (${(d.wd||[]).map(x=>WD[x-1]).join(',')||'без дня'}): ${(d.ex||[]).map(e=>`${e.name} ${e.sets}×${e.reps}`).join('; ')}`)); if(!pl.days.length) L.push('- нет программы');
  const day=planDayFor(t); L.push(`Сегодня по плану: ${day?day.name:'отдых'}${D.woDates.has(t)?' — уже сделано':''}${S.draft?' — тренировка идёт сейчас':''}. Тренировок всего: ${D.wos.length}, рекордов: ${D.prCount}.`);
  D.wos.slice(-3).forEach(w=>L.push(`- ${w.date}: ${w.name}, объём ${Math.round(volumeOf(w))} кг${(D.woPR[w.id]||[]).length?', рекорды: '+D.woPR[w.id].join(', '):''}`));
  const TG=targets(); if(TG){ const fs=sumFood(foodItems(t)); L.push(`\nПИТАНИЕ: норма ${TG.kcal} ккал, Б ${TG.p} / Ж ${TG.f} / У ${TG.c} г (цель: ${GOAL_L[TG.n.goal]||'держать форму'}, вес ${TG.w} кг, рост ${TG.h} см, ${BUILD_L[TG.n.build]||''}). Съедено сегодня: ${r0(fs.kcal)} ккал, Б ${r0(fs.p)} / Ж ${r0(fs.f)} / У ${r0(fs.c)}.`); foodItems(t).forEach(x=>L.push(`- ${MEAL_L[x.meal]||''}: ${x.name} ${r0(x.g)} г — ${r0(x.kcal)} ккал`)); } else L.push('\nПИТАНИЕ: норма КБЖУ не рассчитана — предложи заполнить параметры во вкладке «Питание».');
  L.push('\nКАТАЛОГ УПРАЖНЕНИЙ: '+uniq([...Object.keys(EXI), ...Object.keys(EXW())]).join(', '));
  L.push('\nРЕКОМЕНДАЦИИ ПО ВЕСУ В УПРАЖНЕНИЯХ (на следующую тренировку):'); myExercises().slice(0,20).forEach(x=>{ const last=lastFor(x.name); L.push(`- ${x.name}: ${recText(recommend(x.name, planTarget(x.name)))}${last?`; прошлый раз ${last.sets.map(s=>s.w+'×'+s.r).join(', ')}`:''}`); });
  L.push('\nПОСЛЕДНИЕ 7 ДНЕЙ:'); for(let i=6;i>=0;i--){ const d=addDays(t,-i); if(d<startDate()) continue; const s=dayStats(d), l=logOf(d); const w=D.wos.filter(x=>x.date===d).map(x=>x.name).join(', '); L.push(`- ${d} ${WD[wdOf(d)-1]}: план ${s.total?s.pct+'%':'—'}${l.mood?`, настроение ${l.mood}/5`:''}${l.energy?`, энергия ${l.energy}/5`:''}${l.sleep?`, сон ${l.sleep} ч`:''}${w?`, зал: ${w}`:''}`); }
  return L.join('\n');
}
function rules(){ const p=P(), t=todayStr();
  return `Ты — ${p.ai}, личный ИИ-ассистент ${p.name||'пользователя'} в его приложении «Штаб»: задачи, привычки, таблетки и витамины, зал, прогресс с уровнями и опытом.
Характер: спокойный, собранный, чуть ироничный ИИ-помощник из фантастики. Пишешь по-русски, на «ты», коротко: 1–5 предложений или короткий список. Без воды.
Правила:
- Опирайся только на данные ниже, ничего не выдумывай. Если данных не хватает — так и скажи.
- Когда просят что-то сделать (добавить, перенести или выполнить задачу, отметить привычку, приём таблетки, записать еду, записать состояние, составить программу) — ${sTools?'сделай это инструментами и коротко подтверди результат':'объясни, где это сделать в приложении (инструменты сейчас недоступны)'}.
- Даты для инструментов: YYYY-MM-DD, время HH:MM. Сегодня = ${t}, завтра = ${addDays(t,1)}.
- Про лекарства и дозировки ничего не назначай: схему приёма согласуют с врачом.
- Программу тренировок сохраняй только после явного согласия пользователя.
- Часто пишут одной фразой сразу несколько вещей («жим 60 на 8 три подхода, съел шаурму, лёг в час») — разнеси всё нужными инструментами за один ответ, потом одной короткой строкой скажи, что записал. Чек с кнопкой «Отменить» приложение покажет само.
- Подходы в зале записывай через log_workout, еду — через log_food (оцени граммы и КБЖУ, если не указаны), сон и настроение — через log_day.
- Если приложено фото — следуй подсказке в квадратных скобках.${LANG!=='ru' ? `\n\nЯЗЫК: интерфейс пользователя — ${LANG_AI[LANG]}. Отвечай только на этом языке (${LANG_AI[LANG]}), названия из данных переводи. Всё, что создаёшь инструментами (задачи, привычки, еду, заметки), называй на этом же языке.` : ''}

ДАННЫЕ:
${contextText()}`; }
function histRange(from,to){ const out=[]; let d=validDate(from)||addDays(todayStr(),-13); const end=validDate(to)||todayStr(); for(let i=0;i<62 && d<=end;i++,d=addDays(d,1)){ const s=dayStats(d), l=logOf(d); out.push({date:d, plan_pct:s.pct, done:s.done, total:s.total, tasks_done:(D.tbd.get(d)||[]).filter(x=>x.done).map(x=>x.title), habits_done:habitsAll().filter(h=>scheduled(h,d)&&isDone(h,d)&&!h.bad).map(h=>h.name), slips:habitsAll().filter(h=>h.bad&&hv(h,d)>0).map(h=>h.name), mood:l.mood||null, energy:l.energy||null, sleep:l.sleep||null, workout:D.wos.filter(w=>w.date===d).map(w=>w.name).join(', ')||null}); } return out; }
function mkTools(){ return [
  {name:'add_task', description:'Добавить задачу. Возвращает id.', inputSchema:{type:'object', properties:{title:{type:'string'}, date:{type:'string', description:'YYYY-MM-DD, по умолчанию сегодня'}, time:{type:'string', description:'HH:MM или пусто'}, priority:{type:'integer', description:'0 обычная, 1 важно, 2 срочно, 3 критично'}, area:{type:'string', enum:['учёба','работа','личное','здоровье','']}}, required:['title']},
   execute(i){ const title=String(i.title||'').trim().slice(0,200); if(!title) throw new Error('пустое название'); const id=uid(), date=validDate(i.date)||todayStr(); Store.set('tasks', id, {title, date, time:validTime(i.time)||'', prio:clampInt(i.priority??0,0,3), area:AREAS.includes(i.area)?i.area:'', note:'', done:false, doneAt:null, createdAt:new Date().toISOString()}); return {ok:true, id, date}; }},
  {name:'update_task', description:'Изменить задачу по id: выполнить или вернуть (done), перенести (date, time), переименовать (title), приоритет (priority).', inputSchema:{type:'object', properties:{id:{type:'string'}, done:{type:'boolean'}, date:{type:'string'}, time:{type:'string'}, title:{type:'string'}, priority:{type:'integer'}}, required:['id']},
   execute(i){ const x=S.cols.tasks.get(String(i.id)); if(!x) throw new Error('задача не найдена'); const p={}; if(typeof i.done==='boolean'){ p.done=i.done; p.doneAt=i.done?new Date().toISOString():null; } if(i.date!==undefined){ const d=validDate(i.date); if(!d) throw new Error('дата должна быть YYYY-MM-DD'); p.date=d; } if(i.time!==undefined) p.time=validTime(i.time)||''; if(i.title) p.title=String(i.title).trim().slice(0,200); if(i.priority!==undefined) p.prio=clampInt(i.priority,0,3); Store.merge('tasks', x.id, p); return {ok:true}; }},
  {name:'log_habit', description:'Записать значение привычки за день. check: 1 = сделано, 0 = нет. count/time: итоговое значение за день. Вредная: число срывов.', inputSchema:{type:'object', properties:{habit_id:{type:'string'}, value:{type:'number'}, date:{type:'string'}}, required:['habit_id','value']},
   execute(i){ const h=S.cols.habits.get(String(i.habit_id)); if(!h) throw new Error('привычка не найдена'); const d=validDate(i.date)||todayStr(); const v=Math.max(0,Number(i.value)||0); Store.merge('logs', d, {h:{[h.id]:v}}); return {ok:true, done:isDone(h,d)}; }},
  {name:'take_med', description:'Отметить приём таблетки или витамина по dose_key из данных. taken=false снимает отметку.', inputSchema:{type:'object', properties:{dose_key:{type:'string'}, taken:{type:'boolean'}, date:{type:'string'}}, required:['dose_key']},
   execute(i){ const key=String(i.dose_key||''), d=validDate(i.date)||todayStr(); if(!dosesOn(d).some(x=>x.key===key)) throw new Error('такого приёма на эту дату нет'); const want=i.taken!==false, cur=!!((logOf(d).m||{})[key]); if(cur!==want) toggleDoseAt(key,d); return {ok:true}; }},
  {name:'add_habit', description:'Создать привычку.', inputSchema:{type:'object', properties:{name:{type:'string'}, kind:{type:'string', enum:['check','count','time']}, target:{type:'number'}, unit:{type:'string'}, days:{type:'array', items:{type:'integer'}, description:'1=Пн … 7=Вс'}, bad:{type:'boolean'}, icon:{type:'string', enum:HKEYS}, cue:{type:'string', description:'после какого события, например «после завтрака»'}}, required:['name']},
   execute(i){ const name=String(i.name||'').trim().slice(0,60); if(!name) throw new Error('пустое название'); const kind=['check','count','time'].includes(i.kind)?i.kind:'check'; const days=(Array.isArray(i.days)?i.days:ALLD).map(Number).filter(n=>n>=1&&n<=7); const id=uid(); const maxOrder=Math.max(0,...[...S.cols.habits.values()].map(h=>h.order||0)); Store.set('habits', id, {name, icon:HGLYPH[i.icon]?i.icon:'target', cue:String(i.cue||'').slice(0,40), kind: i.bad?'check':kind, bad:!!i.bad, target: kind==='check'||i.bad?1:Math.max(1,Number(i.target)||1), unit: kind==='time'?'мин':String(i.unit||'').slice(0,12), days: days.length?days:ALLD, since:todayStr(), order:maxOrder+1}); return {ok:true, id}; }},
  {name:'add_med', description:'Добавить таблетку или витамин в расписание (только если пользователь сам назвал препарат и время).', inputSchema:{type:'object', properties:{name:{type:'string'}, dose:{type:'string'}, times:{type:'array', items:{type:'string'}}, days:{type:'array', items:{type:'integer'}}, food:{type:'string', enum:['','до еды','во время еды','после еды']}, stock:{type:'number'}, per_dose:{type:'number'}}, required:['name','times']},
   execute(i){ const name=String(i.name||'').trim().slice(0,60); const times=(Array.isArray(i.times)?i.times:[]).map(validTime).filter(Boolean); if(!name||!times.length) throw new Error('нужны название и время HH:MM'); const days=(Array.isArray(i.days)?i.days:ALLD).map(Number).filter(n=>n>=1&&n<=7); const id=uid(); Store.set('meds', id, {name, dose:String(i.dose||'').slice(0,30), times:[...new Set(times)].sort(), days:days.length?days:ALLD, food:['до еды','во время еды','после еды'].includes(i.food)?i.food:'', stock: i.stock==null?null:Math.max(0,Math.round(Number(i.stock)||0)), perDose:Math.max(1,Math.round(Number(i.per_dose)||1)), since:todayStr()}); return {ok:true, id}; }},
  {name:'set_gym_plan', description:'Заменить программу тренировок целиком (после согласия пользователя). Прежнюю можно вернуть кнопкой во вкладке «Зал».', inputSchema:{type:'object', properties:{days:{type:'array', description:'Дни программы. Каждый: {"name": string, "weekdays": [1..7], "exercises": [{"name": string, "muscle": одно из '+MUSCLES.join(', ')+', "sets": число, "reps": "8-12"}]}', items:{type:'object'}}}, required:['days']},
   execute(i){ const days=(Array.isArray(i.days)?i.days:[]).slice(0,7).map(d=>({id:uid(), name:String(d.name||'Тренировка').slice(0,60), wd:(Array.isArray(d.weekdays)?d.weekdays:[]).map(Number).filter(n=>n>=1&&n<=7), ex:(Array.isArray(d.exercises)?d.exercises:[]).slice(0,12).map(e=>({name:String(e.name||'').slice(0,80), muscle:MUSCLES.includes(e.muscle)?e.muscle:(muscleOf(e.name)||''), sets:clampInt(e.sets??3,1,10), reps:String(e.reps||'8-12').slice(0,12)})).filter(e=>e.name)})).filter(d=>d.ex.length); if(!days.length) throw new Error('пустая программа'); const old=PLAN(); Store.set('meta','plan',{days, prev: Array.isArray(old.prev)?old.prev:(old.days||[]).map(clone)}); return {ok:true, days:days.length}; }},
  {name:'log_day', description:'Записать состояние за день: mood 1–5, energy 1–5, sleep в часах, note.', inputSchema:{type:'object', properties:{date:{type:'string'}, mood:{type:'integer'}, energy:{type:'integer'}, sleep:{type:'number'}, note:{type:'string'}}},
   execute(i){ const d=validDate(i.date)||todayStr(); const p={}; if(i.mood!=null) p.mood=clampInt(i.mood,1,5); if(i.energy!=null) p.energy=clampInt(i.energy,1,5); if(i.sleep!=null) p.sleep=Math.max(0,Math.min(16,Number(i.sleep)||0)); if(i.note) p.note=String(i.note).slice(0,600); Store.merge('logs', d, p); return {ok:true}; }},
  {name:'log_food', description:'Записать съеденное в дневник питания. Значения — на всю порцию, не на 100 г. meal: b завтрак, l обед, d ужин, s перекус.', inputSchema:{type:'object', properties:{name:{type:'string'}, grams:{type:'number'}, kcal:{type:'number'}, protein:{type:'number'}, fat:{type:'number'}, carbs:{type:'number'}, meal:{type:'string', enum:['b','l','d','s']}, date:{type:'string'}}, required:['name','kcal']},
   execute(i){ const name=String(i.name||'').trim(); if(!name) throw new Error('пустое название'); const d=validDate(i.date)||todayStr(); addFood(d,{meal:['b','l','d','s'].includes(i.meal)?i.meal:mealNow(), name, g:Math.max(0,Number(i.grams)||0), kcal:Math.max(0,Number(i.kcal)||0), p:Math.max(0,Number(i.protein)||0), f:Math.max(0,Number(i.fat)||0), c:Math.max(0,Number(i.carbs)||0)}); return {ok:true}; }},
  {name:'log_workout', description:'Записать выполненные подходы упражнения. Если тренировка идёт — добавит в неё, иначе в сегодняшнюю быструю запись. Название бери точно из каталога упражнений, если подходит. sets — подходы {w: вес в кг (0 для своего веса), r: повторы}.', inputSchema:{type:'object', properties:{exercise:{type:'string'}, sets:{type:'array', items:{type:'object', properties:{w:{type:'number'}, r:{type:'number'}}}}, date:{type:'string'}}, required:['exercise','sets']},
   execute(i){ return logWorkoutTool(i); }},
  {name:'get_history', description:'История по дням за период (до 62 дней): % выполнения плана, задачи, привычки, срывы, настроение, сон, тренировки.', inputSchema:{type:'object', properties:{from:{type:'string'}, to:{type:'string'}}},
   execute(i){ return histRange(i.from, i.to); }}
]; }
function logDiag(e, stage){
  try{
    const d={code:String((e&&e.code)||'none'), message:String((e&&e.message)||e||'').slice(0,600), stage, tools:sTools, at:new Date().toISOString(), ua:String(navigator.userAgent||'').slice(0,160)};
    console.warn('assistant error', stage, e);
    if(S.mode==='live') Store.set('meta','diag', d);
  }catch(x){}
}
const FATAL=['not_granted','sampling_disabled','not_declared','capability_disabled','capability_removed'];
const USER_ERR=['cancelled','rate_limited','session_expired','refused','prompt_too_large'];
function speak(text){ const p=P(); if(!p.voice || !('speechSynthesis' in window)) return; try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(String(text).replace(/\*\*/g,'').replace(/^\s*[-•*]\s+/gm,'').slice(0,700)); u.lang=LOCALES[LANG]||'ru-RU'; const v=speechSynthesis.getVoices().find(x=>new RegExp('^'+LANG,'i').test(x.lang)); if(v) u.voice=v; u.rate=1.04; speechSynthesis.speak(u); }catch(e){} }

/* ================= catalog: exercises ================= */
const uniq = a => [...new Set(a.filter(Boolean))];
const r0 = v => Math.round(Number(v)||0);
const r1 = v => Math.round((Number(v)||0)*10)/10;
const TYPE_L = {bb:'штанга', db:'гантели', mc:'тренажёр', bw:'свой вес', cardio:'кардио'};
const CARDIO_C = ['Разминка 3–5 минут в лёгком темпе.','Основная часть — темп, при котором можешь говорить короткими фразами.','В поле «кг» ставь 0, в «повт.» — минуты.'];
const EXI = {
  'Жим штанги лёжа':{t:'bb',inc:2.5,r:.5,c:['Лопатки сведены и прижаты к скамье, лёгкий прогиб в пояснице, стопы упираются в пол.','Хват чуть шире плеч. Опускай гриф к низу груди, локти примерно под 45° к корпусу.','Выжимай вверх и немного к лицу, таз не отрывай. Тяжёлые подходы — со страхующим.']},
  'Жим гантелей лёжа':{t:'db',inc:2,r:.18,c:['Лопатки сведены, гантели над грудью, запястья ровные.','Опускай до лёгкого растяжения груди, локти около 45° к корпусу.','Выжимай по дуге вверх, гантели наверху не стукай.']},
  'Жим гантелей на наклонной':{t:'db',inc:2,r:.15,c:['Наклон скамьи 30–45°.','Опускай гантели к верху груди, локти чуть ниже уровня плеч.','Выжимай вверх, сохраняя сведённые лопатки.']},
  'Разводка гантелей':{t:'db',inc:1,r:.07,c:['Руки чуть согнуты в локтях, угол не меняется всё движение.','Разводи до растяжения груди, без боли в плечах.','Своди по дуге, будто обнимаешь бочку. Вес небольшой.']},
  'Отжимания на брусьях':{t:'bw',inc:2.5,c:['Корпус слегка наклонён вперёд — так работает грудь.','Опускайся, пока плечо примерно не станет параллельно полу, без боли в плечах.','Выжимай себя без раскачки. Когда 12+ повторов даются легко — вешай вес на пояс.']},
  'Отжимания':{t:'bw',inc:0,c:['Тело — прямая линия от пяток до головы, пресс напряжён.','Руки чуть шире плеч, локти около 45° к корпусу.','Опускайся почти до касания пола грудью и выжимай вверх полностью.']},
  'Сведения в кроссовере':{t:'mc',inc:2.5,c:['Шаг вперёд, лёгкий наклон корпуса, руки чуть согнуты.','Своди рукояти перед собой по дуге, в конце сожми грудь на секунду.','Возвращай медленно, не давая весу дёргать плечи.']},
  'Подтягивания':{t:'bw',inc:2.5,c:['Хват чуть шире плеч. Начни движение с опускания плеч вниз.','Тянись грудью к перекладине, локти ведёшь вниз и к корпусу.','Опускайся полностью и подконтрольно, без рывков и раскачки.']},
  'Тяга штанги в наклоне':{t:'bb',inc:2.5,r:.4,c:['Наклон корпуса 30–45°, спина прямая, колени слегка согнуты.','Тяни гриф к низу живота, локти идут вдоль корпуса.','Вверху сведи лопатки, опускай подконтрольно. Если тянет поясницу — снизь вес.']},
  'Тяга верхнего блока':{t:'mc',inc:5,r:.45,c:['Сядь плотно, бёдра зафиксированы валиками.','Тяни рукоять к верху груди, слегка отклонившись назад, локти вниз.','Не тяни за голову и не раскачивайся корпусом.']},
  'Тяга гантели одной рукой':{t:'db',inc:2,r:.2,c:['Колено и рука на скамье, спина прямая и параллельна полу.','Тяни гантель к поясу, локоть идёт вдоль корпуса.','Опускай до растяжения спины, корпус не скручивай.']},
  'Горизонтальная тяга блока':{t:'mc',inc:5,r:.45,c:['Спина прямая, ноги слегка согнуты.','Тяни рукоять к животу, в конце сведи лопатки.','Не откидывайся назад, возвращай вес медленно.']},
  'Становая тяга':{t:'bb',inc:5,r:.7,c:['Гриф над серединой стопы, спина нейтральная, плечи чуть впереди грифа.','Толкай пол ногами, гриф скользит вдоль ног, спина не округляется.','Вверху выпрямись без переразгибания. Технику лучше поставить с тренером и начать с лёгкого веса.']},
  'Гиперэкстензия':{t:'bw',inc:2.5,c:['Валик под тазом, корпус свободно опускается вниз.','Поднимайся до прямой линии тела, поясницу не переразгибай.','Темп медленный. Когда 15+ повторов легко — возьми блин к груди.']},
  'Жим штанги стоя':{t:'bb',inc:2.5,r:.3,c:['Хват чуть шире плеч, ягодицы и пресс напряжены.','Выжимай гриф вертикально вверх: голову убираешь назад и возвращаешь под гриф.','Не прогибайся в пояснице — если прогиб появился, вес слишком большой.']},
  'Жим гантелей сидя':{t:'db',inc:2,r:.12,c:['Спинка скамьи почти вертикальна, спина прижата.','Гантели у плеч, локти немного впереди корпуса.','Выжимай вверх без удара гантелей, опускай до уровня ушей.']},
  'Махи в стороны':{t:'db',inc:1,r:.05,c:['Лёгкий наклон вперёд, руки чуть согнуты.','Поднимай гантели через стороны до уровня плеч, движение ведёт локоть.','Без раскачки корпусом. Вес маленький — работает мышца, а не инерция.']},
  'Тяга к лицу':{t:'mc',inc:2.5,c:['Канат на уровне лица, хват сверху.','Тяни к лицу, разводя концы каната, локти высоко.','В конце сведи лопатки и разверни плечи наружу.']},
  'Махи в наклоне':{t:'db',inc:1,r:.04,c:['Наклон почти параллельно полу, спина прямая.','Разводи руки в стороны, локти чуть согнуты.','Сжимай заднюю дельту вверху, без рывков.']},
  'Подъём штанги на бицепс':{t:'bb',inc:2.5,r:.25,min:10,c:['Локти прижаты к корпусу и не уходят вперёд.','Поднимай гриф силой бицепса, без раскачки спиной.','Опускай медленно, почти до прямых рук.']},
  'Молотки':{t:'db',inc:1,r:.1,c:['Нейтральный хват: ладони смотрят друг на друга.','Локти неподвижны у корпуса.','Поднимай до плеча и медленно опускай.']},
  'Подъём гантелей на бицепс':{t:'db',inc:1,r:.1,c:['По ходу подъёма разворачивай ладонь вверх.','Локти не двигаются, корпус неподвижен.','Опускай гантели подконтрольно.']},
  'Сгибания на блоке':{t:'mc',inc:2.5,c:['Стой близко к блоку, локти прижаты.','Сгибай руки до пикового сокращения.','Возвращай медленно, не отпуская натяжение.']},
  'Французский жим':{t:'bb',inc:2.5,r:.2,min:10,c:['Лёжа, гриф над лбом, плечи слегка наклонены к голове.','Сгибай руки только в локтях, опуская гриф ко лбу или чуть за голову.','Локти не разводи. Начни с лёгкого веса — упражнение нагружает локти.']},
  'Разгибания на блоке':{t:'mc',inc:2.5,r:.2,c:['Локти прижаты к бокам и неподвижны.','Разгибай руки до конца, сжимая трицепс.','Возвращай до угла около 90°, локти не поднимай.']},
  'Жим узким хватом':{t:'bb',inc:2.5,r:.4,c:['Хват на ширине плеч, не уже.','Опускай гриф к низу груди, локти идут вдоль корпуса.','Выжимай за счёт трицепса, лопатки сведены.']},
  'Отжимания от скамьи':{t:'bw',inc:0,c:['Руки на скамье за спиной, пальцы смотрят вперёд.','Опускайся до угла в локтях около 90°, плечи вниз.','Если болят плечи — уменьши глубину или замени упражнение.']},
  'Приседания со штангой':{t:'bb',inc:5,r:.6,c:['Гриф на трапециях, стопы на ширине плеч, носки слегка врозь.','Садись назад и вниз, колени идут по линии носков, спина нейтральная.','Глубина — до параллели бедра с полом, если спина не округляется. Вставай, толкая пол всей стопой.']},
  'Жим ногами':{t:'mc',inc:10,r:1.2,c:['Поясница прижата к спинке всё время.','Стопы на ширине плеч посередине платформы.','Опускай до угла около 90° в коленях. Колени наверху до щелчка не выпрямляй.']},
  'Румынская тяга':{t:'bb',inc:5,r:.5,c:['Колени слегка согнуты и почти не меняют угол.','Отводи таз назад, гриф скользит по бёдрам, спина прямая.','Опускай до растяжения задней поверхности бедра и возвращайся движением таза вперёд.']},
  'Выпады':{t:'db',inc:2,r:.1,c:['Шаг достаточно длинный, корпус вертикально.','Опускайся, пока заднее колено почти не коснётся пола.','Толкайся пяткой передней ноги, колено не заваливается внутрь.']},
  'Разгибания ног':{t:'mc',inc:5,r:.35,c:['Валик на нижней части голени, колени на оси тренажёра.','Разгибай почти до прямых ног, наверху задержка на секунду.','Опускай медленно, без рывков.']},
  'Сгибания ног':{t:'mc',inc:5,r:.3,c:['Валик над пятками, таз прижат.','Сгибай ноги до упора, таз не отрывай.','Опускай медленно.']},
  'Подъём на носки':{t:'mc',inc:5,c:['Опусти пятки ниже опоры, чтобы растянуть икры.','Поднимайся на носки максимально высоко, пауза вверху.','Колени почти прямые, темп медленный.']},
  'Ягодичный мост':{t:'bb',inc:5,r:.6,c:['Лопатки на скамье, штанга на тазе через мягкую подушку.','Поставь стопы так, чтобы вверху голени были вертикальны.','Поднимай таз до прямой линии, сжимая ягодицы, без прогиба в пояснице.']},
  'Болгарские выпады':{t:'db',inc:2,r:.08,c:['Задняя нога на скамье, передняя стоит достаточно далеко.','Опускайся вертикально вниз, корпус чуть вперёд.','Толкайся пяткой передней ноги, колено по линии носка.']},
  'Отведение ноги в кроссовере':{t:'mc',inc:2.5,c:['Манжета на щиколотке, держись за стойку.','Отводи ногу назад без прогиба в пояснице.','Сожми ягодицу в крайней точке, возвращай медленно.']},
  'Скручивания':{t:'bw',inc:0,c:['Поясница прижата к полу.','Поднимай плечи, скручивая корпус к тазу. Голову руками не тяни.','Выдох на подъёме.']},
  'Планка':{t:'bw',inc:0,c:['Локти под плечами, тело — прямая линия.','Напряги пресс и ягодицы, таз не проваливается.','Держи время и дыши ровно. В поле «повт.» пиши секунды.']},
  'Подъём ног в висе':{t:'bw',inc:0,c:['Вис на перекладине, без раскачки.','Поднимай ноги, подкручивая таз вверх.','Опускай медленно. Начни с согнутых коленей.']},
  'Ролик для пресса':{t:'bw',inc:0,c:['Начни с колен, пресс напряжён.','Выкатывайся вперёд, пока держишь поясницу без провиса.','Возвращайся силой пресса, а не рук.']},
  'Беговая дорожка':{t:'cardio',inc:0,c:CARDIO_C}, 'Велотренажёр':{t:'cardio',inc:0,c:CARDIO_C}, 'Эллипс':{t:'cardio',inc:0,c:CARDIO_C}, 'Скакалка':{t:'cardio',inc:0,c:CARDIO_C}
};
const keyOf = s => 'x'+[...String(s)].reduce((h,ch)=>((h*31+ch.charCodeAt(0))>>>0),7).toString(36);
const EXW = () => { const l=((S.cols.meta.get('ex')||{}).list)||{}; const o={}; for(const v of Object.values(l)) if(v && v.name) o[v.name]=v; return o; };
function exInfo(name){ const b=EXI[name], mw=EXW()[name]; const m=muscleOf(name) || (mw&&mw.muscle) || ''; return b ? {...b, m} : {t: m==='Кардио'?'cardio':'mc', inc:2.5, c:[], m}; }
const ytUrl = name => 'https://www.youtube.com/results?search_query='+encodeURIComponent(_L('техника {0}', name));
function repRange(target, name){ const m=String(target||'').match(/(\d+)\s*[-–]\s*(\d+)/); if(m) return [+m[1], +m[2]]; const s=String(target||'').match(/×\s*(\d+)\s*$/); if(s) return [+s[1], +s[1]]; const t=exInfo(name).t; return t==='bw'?[8,15]:t==='cardio'?[10,30]:[8,12]; }
const roundInc = (w, inc) => { inc=inc||2.5; return Math.max(0, Math.round(w/inc)*inc); };
function defaultReps(n){ const t=exInfo(n).t; return t==='bw'?'8-15':t==='cardio'?'10-30':'8-12'; }
function planEx(name, day){ const pools = day ? [day, ...PLAN().days] : PLAN().days; for(const d of pools){ const e=(d.ex||[]).find(x=>x.name===name); if(e) return e; } return null; }
function planTarget(name, day){ const pe=planEx(name, day); return pe ? `${pe.sets}×${pe.reps}` : `3×${defaultReps(name)}`; }
function latestWeight(){ const bw=BODY(), ks=Object.keys(bw).sort(); if(ks.length) return num(bw[ks[ks.length-1]]); const n=NUTRI(); return n ? num(n.weight) : NaN; }
function recommend(name, target){
  const e=exInfo(name), [lo,hi]=repRange(target,name), inc=e.inc||2.5, last=lastFor(name);
  if(e.t==='cardio') return {w:0, lo, hi, txt:`${_L('{0}–{1} мин в ровном темпе', lo, hi)}`, why:_L('кардио: держи пульс в комфортной зоне')};
  if(last){
    const ws=last.sets.map(s=>num(s.w)||0), top=Math.max(...ws), atTop=last.sets.filter(s=>(num(s.w)||0)===top), reps=atTop.map(s=>num(s.r)||0);
    if(top===0){ const mn=Math.min(...reps); if(mn>=hi) return {w:0, lo, hi, txt:`${_L('свой вес, {0}+ повторов или отягощение 2,5–5 кг', hi+1)}`, why:_L('прошлый раз все подходы на верх диапазона')}; return {w:0, lo, hi, txt:`${_L('свой вес, цель {0} повторов в каждом подходе', hi)}`, why:`${_L('прошлый раз: {0} повт.', reps.join(', '))}`}; }
    if(reps.every(r=>r>=hi)) return {w:top+inc, lo, hi, why:`${_L('прошлый раз все подходы на {0}+ — прибавь {1} кг', hi, fmtW(inc))}`};
    if(reps.filter(r=>r<lo).length > atTop.length/2) return {w:Math.max(0,top-inc), lo, hi, why:`${_L('прошлый раз не добрал до {0} повторов — сбрось {1} кг', lo, fmtW(inc))}`};
    return {w:top, lo, hi, why:`${_L('держи вес и добирай до {0} повторов во всех подходах', hi)}`};
  }
  const mine=EXW()[name];
  if(mine && mine.w!=='' && isFinite(num(mine.w))) return {w:num(mine.w), lo, hi, why:_L('от твоего рабочего веса')};
  if(e.t==='bw') return {w:0, lo, hi, txt:`${_L('свой вес, {0}–{1} повторов', lo, hi)}`, why:_L('первый раз: найди, сколько повторов делаешь чисто')};
  const bw=latestWeight();
  if(e.r && bw>0){ let w=roundInc(e.r*bw*.8, inc); if(e.t==='bb') w=Math.max(e.min||20, w); if(e.t==='db') w=Math.max(2, w); if(e.t==='mc') w=Math.max(5, w); return {w, lo, hi, why:_L('стартовый ориентир от веса тела — если техника не уверена, начни легче'), start:true}; }
  return {w:null, lo, hi, why:`${_L('первый раз: подбери вес, с которым сделаешь {0} повторов с запасом 2–3', hi)}`, start:true};
}
const recText = r => r.txt ? r.txt : (r.w==null ? _L('подбери вес') : fmtW(r.w)+' '+_L('кг'))+' × '+(r.lo===r.hi ? r.lo : r.lo+'–'+r.hi);
function setAdvice(ex, si){
  const s=ex.sets[si]; if(!s || !s.done) return null;
  const e=exInfo(ex.name), [lo,hi]=repRange(ex.target, ex.name), r=num(s.r)||0, w=num(s.w)||0, inc=e.inc||2.5;
  if(e.t==='cardio') return null;
  if(w===0) return r>hi+3 ? {dw:0, txt:`${_L('Легко ({0} повт.) — можно добавить отягощение', r)}`} : null;
  if(r>hi+1) return {dw:inc, txt:`${_L('Легко ({0} повт.) — следующий подход +{1} кг', r, fmtW(inc))}`};
  if(r<lo-2) return {dw:-2*inc, txt:`${_L('Тяжело ({0} повт.) — сбрось {1} кг', r, fmtW(2*inc))}`};
  if(r<lo) return {dw:-inc, txt:`${_L('Тяжеловато ({0} повт.) — сбрось {1} кг', r, fmtW(inc))}`};
  return {dw:0, txt:`${_L('{0} повт. — в диапазоне, держи {1} кг', r, fmtW(w))}`};
}
function warmupText(e, rec){
  if(rec.w>=30 && (e.t==='bb'||e.t==='mc')){ const inc=e.inc||2.5; return `${_L('Разминка: {0}{1} кг ×8, {2} кг ×3', e.t==='bb'?'пустой гриф ×10, ':'', fmtW(roundInc(rec.w*.5,inc)), fmtW(roundInc(rec.w*.75,inc)))}`; }
  if(e.t==='db' && rec.w>=10) return `${_L('Разминка: 1 подход ×10 с {0} кг', fmtW(roundInc(rec.w*.5,e.inc||2)))}`;
  return '';
}
function techHtml(name){ const e=exInfo(name); const cues=(e.c&&e.c.length)?e.c:['Двигайся подконтрольно, без рывков, в комфортной амплитуде.','Выдох на усилии, вдох на возврате.','Если появилась боль в суставе — остановись и снизь вес.'];
  return `<div class="tech"><ul class="cues">${cues.map(c=>`<li>${esc(c)}</li>`).join('')}</ul><a class="btn sm" href="${ytUrl(name)}" target="_blank" rel="noopener">${ico('video','sm')}${_L('Видео техники на YouTube')}${ico('ext','sm')}</a></div>`; }
function myExercises(){ const names=uniq([...PLAN().days.flatMap(d=>(d.ex||[]).map(e=>e.name)), ...Object.keys(D.exHist), ...Object.keys(EXW())]); return names.map(n=>({name:n, muscle:exInfo(n).m})).sort((a,b)=>(MUSCLES.indexOf(a.muscle)+99)%99-(MUSCLES.indexOf(b.muscle)+99)%99 || a.name.localeCompare(b.name)); }
function openPicker(dayId){ const day=PLAN().days.find(d=>d.id===dayId); openModal('pickEx',{dayId:day?day.id:'', groups: day ? uniq(day.ex.map(e=>e.muscle||exInfo(e.name).m)) : [], sel: day ? day.ex.map(e=>e.name) : []}); }

/* ================= nutrition ================= */
const FOODS = [
  ['Гречка варёная',110,4.2,1.1,21.3],['Рис белый варёный',130,2.7,.3,28],['Овсянка на воде',88,3,1.7,15],['Овсянка на молоке',102,3.2,4.1,14.2],['Макароны варёные',131,5,1.1,25],['Картофель варёный',82,2,.4,17],['Картофельное пюре',106,2.5,4.2,14.7],['Булгур варёный',83,3.1,.2,18.6],['Киноа варёная',120,4.4,1.9,21.3],
  ['Гречка сухая',343,12.6,3.3,62],['Рис сухой',344,6.7,.7,78.9],['Овсяные хлопья',352,12.3,6.2,61.8],['Макароны сухие',344,11,1.3,70.5],
  ['Куриная грудка варёная',137,29.8,1.8,.5],['Куриная грудка сырая',113,23.6,1.9,.4],['Куриное бедро без кожи',185,24,9.5,0],['Индейка филе',114,24,1.5,0],['Говядина варёная',254,25.8,16.8,0],['Фарш говяжий',254,17,20,0],['Свинина нежирная',142,19.4,7.1,0],['Лосось',208,20,13,0],['Треска',78,17.7,.7,0],['Тунец консервированный',96,21,1,0],['Креветки варёные',95,20,1.1,0],['Сосиски',266,11,24,1.6],['Колбаса варёная',257,12,22.8,0],['Пельмени',275,11.9,12.4,29],
  ['Яйцо куриное',157,12.7,11.5,.7,'шт',55],['Яичный белок',48,11,.2,.7],['Творог 0%',71,16.5,0,1.3],['Творог 5%',121,17.2,5,1.8],['Творог 9%',159,16.7,9,2],['Молоко 2,5%',52,2.8,2.5,4.7,'стакан',250],['Кефир 1%',40,3,1,4,'стакан',250],['Йогурт греческий 2%',70,9,2,4],['Сыр твёрдый',360,23,29,0,'ломтик',20],['Сметана 15%',160,2.6,15,3],['Масло сливочное',748,.5,82.5,.8],
  ['Хлеб белый',262,7.5,2.9,51.4,'ломтик',30],['Хлеб ржаной',210,6.6,1.2,41,'ломтик',30],['Лаваш',277,9.1,1.1,56],['Хлебцы',300,10,2,60,'шт',10],
  ['Банан',96,1.5,.2,21.8,'шт',120],['Яблоко',52,.3,.2,13.8,'шт',180],['Апельсин',47,.9,.1,11.8,'шт',160],['Огурец',15,.7,.1,3.6,'шт',120],['Помидор',18,.9,.2,3.9,'шт',120],['Брокколи',34,2.8,.4,6.6],['Салат из свежих овощей',20,1,.2,3.5],['Авокадо',160,2,14.7,8.5,'шт',150],
  ['Масло растительное',899,0,99.9,0,'ст. ложка',17],['Грецкие орехи',654,15.2,65.2,13.7],['Миндаль',579,21.2,49.9,21.6],['Арахисовая паста',588,25,50,20,'ст. ложка',20],
  ['Протеин (сывороточный)',380,75,5,8,'порция',30],['Гейнер',380,20,3,70,'порция',100],
  ['Пицца',266,11,10,33,'кусок',110],['Бургер',250,13,11,25,'шт',220],['Шаурма',200,9,10,18,'шт',350],['Картофель фри',312,3.4,15,41,'порция',110],['Шоколад молочный',535,7.6,29.7,59.4],['Сахар',398,0,0,99.7,'ч. ложка',5],['Мёд',304,.3,0,82,'ч. ложка',10],['Кола',42,0,0,10.6,'банка',330],['Борщ',49,1.1,2.2,6.7,'тарелка',300]
].map(a=>({n:a[0],k:a[1],p:a[2],f:a[3],c:a[4],u:a[5]||'',ug:a[6]||0}));
const ACTS = [[1.2,'Сидячий образ жизни, без тренировок'],[1.375,'Лёгкая: 1–3 тренировки в неделю'],[1.55,'Средняя: 3–5 тренировок в неделю'],[1.725,'Высокая: 6–7 тренировок в неделю'],[1.9,'Очень высокая: тяжёлая физическая работа и спорт']];
const BUILD_HELP = {ecto:'Эктоморф: худощавый, узкие плечи, тонкие запястья, вес набирается с трудом.', meso:'Мезоморф: атлетичный, широкие плечи, мышцы растут легко.', endo:'Эндоморф: широкая кость, мягкие формы, легко набирает жир.'};
const BUILD_L = {ecto:'эктоморф', meso:'мезоморф', endo:'эндоморф'};
const GOAL_L = {cut:'похудеть', keep:'держать форму', bulk:'набрать массу'};
const MEALS = [['b','Завтрак'],['l','Обед'],['d','Ужин'],['s','Перекусы']];
const MEAL_L = {b:'завтрак', l:'обед', d:'ужин', s:'перекус'};
const NUTRI = () => S.cols.meta.get('nutri') || null;
const MYFOODS = () => ((S.cols.meta.get('foods')||{}).list) || {};
const foodItems = d => ((S.cols.food.get(d)||{}).items) || [];
function sumFood(items){ const s={kcal:0,p:0,f:0,c:0}; for(const x of items||[]){ s.kcal+=+x.kcal||0; s.p+=+x.p||0; s.f+=+x.f||0; s.c+=+x.c||0; } return s; }
function mealNow(){ const h=new Date().getHours(); return h<11?'b':h<16?'l':h<21?'d':'s'; }
function addFood(d, it){ const cur=foodItems(d).map(x=>clone(x)); cur.push({id:uid(), meal:it.meal||mealNow(), name:String(it.name).slice(0,60), g:r0(it.g), kcal:r0(it.kcal), p:r1(it.p), f:r1(it.f), c:r1(it.c)}); return Store.merge('food', d, {items:cur}); }
function delFood(d, id){ return Store.merge('food', d, {items: foodItems(d).filter(x=>x.id!==id).map(x=>clone(x))}); }
const bmiCat = b => b<18.5 ? 'недостаток веса' : b<25 ? 'норма' : b<30 ? 'избыток веса' : 'ожирение';
function targets(){
  const n=NUTRI(); if(!n || !n.set) return null;
  const w=latestWeight(), h=num(n.height), a=num(n.age); if(!(w>0 && h>0 && a>0)) return null;
  const bmr=10*w+6.25*h-5*a+(n.sex==='f'?-161:5);
  const af=(ACTS[(n.activity|0)-1]||ACTS[2])[0], tdee=bmr*af;
  const gk = n.goal==='cut' ? -0.15 : n.goal==='bulk' ? (n.build==='ecto'?0.15:n.build==='endo'?0.08:0.10) : 0;
  let kcal=tdee*(1+gk); const floor=Math.max(bmr, n.sex==='f'?1200:1500); if(kcal<floor) kcal=floor; kcal=Math.round(kcal/10)*10;
  const pk=(n.goal==='cut'?2.0:1.8)+(n.build==='endo'?0.2:0), fk=n.build==='ecto'?0.8:n.build==='endo'?1.0:0.9;
  const p=Math.round(w*pk), f=Math.round(w*fk), c=Math.max(0, Math.round((kcal-p*4-f*9)/4));
  const hm=h/100, bmi=w/(hm*hm);
  return {kcal,p,f,c, bmr:Math.round(bmr), tdee:Math.round(tdee), af, gk, pk, fk, w, h, a, bmi, lo:Math.round(18.5*hm*hm), hi:Math.round(24.9*hm*hm), water:Math.round(w*33/100)/10, n};
}
function macroBar(label, v, t){ const pct=t ? Math.min(100, v/t*100) : 0, over=t && v>t*1.1; return `<div class="mac"><div class="mac-h"><span>${label}</span><span class="num"><b>${r0(v)}</b>${t?` ${_L('/ {0} г', r0(t))}`:' г'}</span></div><div class="meter"><i style="width:${pct}%;${over?'background:var(--warn)':''}"></i></div></div>`; }
function vFood(){
  const d=S.foodDate, t=todayStr(), T=targets(), items=foodItems(d), s=sumFood(items), left=T ? T.kcal-s.kcal : null;
  const head=`<div class="page-h"><div><h1>${_L('Питание')}</h1><p>${esc(dayLabel(d))}${d!==t?' · '+esc(fDMY.format(parseYmd(d))):''}</p></div><div class="btns"><button class="btn sm icon" data-a="food-day" data-v="-1" aria-label="${_L('Предыдущий день')}">${ico('left','sm')}</button>${d!==t?`<button class="btn sm" data-a="food-day" data-d="${t}">${_L('Сегодня')}</button>`:''}<button class="btn sm icon" data-a="food-day" data-v="1" aria-label="${_L('Следующий день')}" ${d>=t?'disabled':''}>${ico('right','sm')}</button><button class="btn sm" data-a="nutri-edit">${_L('Параметры')}</button></div></div>`;
  const onboard = T ? '' : `<div class="hud pad onboard" style="margin-top:14px"><div class="t-lbl">${ico('food')}${_L('Норма КБЖУ')}</div><h3 style="margin:6px 0 4px;font:500 18px/1.3 var(--f-disp)">${_L('Рассчитаю, сколько тебе есть')}</h3><p class="dim" style="margin:0 0 12px;font-size:14px">${_L('Нужны пол, возраст, рост, вес, телосложение, активность и цель. По ним посчитаю калории, белки, жиры и углеводы на день.')}</p><button class="btn pri" data-a="nutri-edit">${_L('Рассчитать норму')}</button></div>`;
  const card=`<div class="hud kcal-card"><div><div class="t-lbl">${_L('Калории')}</div><div class="kc-val num"><b>${nf.format(r0(s.kcal))}</b><small>${_L('{0} ккал', T?` / ${nf.format(T.kcal)}`:'')}</small></div><div class="meter big"><i style="width:${T?Math.min(100,s.kcal/T.kcal*100):0}%;${T&&s.kcal>T.kcal*1.1?'background:var(--warn)':''}"></i></div><div class="dim" style="font-size:13.5px">${T ? (left>=0 ? `${_L('Осталось')} <b style="color:var(--text)">${nf.format(r0(left))}</b> ${_L('ккал')}` : `${_L('Больше нормы на')} <b style="color:var(--warn)">${nf.format(r0(-left))}</b> ${_L('ккал')}`) : 'Рассчитай норму, чтобы видеть остаток'}</div></div><div class="macs">${macroBar('Белки',s.p,T&&T.p)}${P().nutriMode==='light'?'':macroBar('Жиры',s.f,T&&T.f)+macroBar('Углеводы',s.c,T&&T.c)}</div></div><div class="btns" style="margin-top:8px"><button class="btn sm ghost" data-a="nutri-light">${P().nutriMode==='light'?'Показать жиры и углеводы':'Лёгкий режим: только калории и белок'}</button></div>`;
  const meals=MEALS.map(([k,l])=>{ const its=items.filter(x=>(x.meal||'s')===k), ms=sumFood(its);
    return `<div class="sec-h"><h2>${l}</h2><span class="aside num">${its.length?nf.format(r0(ms.kcal))+' '+_L('ккал'):''}</span></div><div class="hud list">${its.map(x=>`<div class="row"><span class="main-t"><span class="ttl">${esc(x.name)}</span><span class="sub"><span class="mono">${_L('{0} г', r0(x.g))}</span><span>${_L('{0} ккал', r0(x.kcal))}</span><span class="mono">${_L('Б {0} · Ж {1} · У {2}', r1(x.p), r1(x.f), r1(x.c))}</span></span></span><button class="btn sm icon ghost" data-a="food-del" data-id="${x.id}" aria-label="${_L('Удалить')}">${ico('x','sm')}</button></div>`).join('')}${(()=>{ if(its.length) return ''; const yi=foodItems(addDays(d,-1)).filter(x=>(x.meal||'s')===k); if(!yi.length) return ''; const ys=sumFood(yi); return `<button class="row add-row" data-a="food-repeat" data-meal="${k}">${ico('plus','sm')}<span>${_L('Как вчера: {0}{1} · {2} ккал', esc(yi.map(x=>x.name).slice(0,3).join(', ')), yi.length>3?'…':'', nf.format(r0(ys.kcal)))}</span></button>`; })()}<button class="row add-row" data-a="food-add" data-meal="${k}" data-d="${d}">${ico('plus','sm')}<span>${_L('Добавить в «{0}»', lcf(_L(l)))}</span></button></div>`; }).join('');
  let info='';
  if(T){ const n=T.n, act=ACTS[(n.activity|0)-1]||ACTS[2];
    info=`<div class="sec-h"><h2>${_L('Твоя норма')}</h2><button class="btn sm" data-a="nutri-edit">${_L('Изменить параметры')}</button></div>
    <div class="stats" style="margin-top:0">${stat('Калории', nf.format(T.kcal))}${stat('Белки', T.p+' '+_L('г'))}${stat('Жиры', T.f+' '+_L('г'))}${stat('Углеводы', T.c+' '+_L('г'))}</div>
    <div class="hud pad" style="margin-top:10px"><div class="t-lbl">${_L('Как посчитано')}</div><ul class="calc">
      <li>${_L('{0}, {1} {2}, {3} см, {4} кг, {5}', n.sex==='f'?'Женщина':'Мужчина', T.a, plural(T.a,'год','года','лет'), r0(T.h), fmtW(T.w), BUILD_L[n.build]||'мезоморф')}</li>
      <li>${_L('Базовый обмен по формуле Миффлина — Сан Жеора:')} <b>${_L('{0} ккал', nf.format(T.bmr))}</b></li>
      <li>${_L('С учётом активности (×{0}, {1}):', String(T.af).replace('.',','), esc(lcf(_L(act[1]))))} <b>${_L('{0} ккал', nf.format(T.tdee))}</b></li>
      <li>${_L('Цель «{0}»: {1} →', _L(GOAL_L[n.goal]||'держать форму'), T.gk?(T.gk>0?'+':'−')+Math.round(Math.abs(T.gk)*100)+'%':'без изменений')} <b>${_L('{0} ккал', nf.format(T.kcal))}</b></li>
      <li>${_L('Белок {0} г на кг веса, жиры {1} г на кг, углеводы — остальные калории', String(T.pk).replace('.',','), String(T.fk).replace('.',','))}</li>
      <li>${_L('ИМТ {0} — {1}. Здоровый вес при твоём росте: {2}–{3} кг{4}', String(r1(T.bmi)).replace('.',','), bmiCat(T.bmi), T.lo, T.hi, T.bmi>=25?' (при большой мышечной массе ИМТ завышает)':'')}</li>
      <li>${_L('Вода: около {0} л в день', String(T.water).replace('.',','))}</li></ul>
      <p class="muted" style="font-size:12.5px;margin:0">${_L('Это ориентир, а не медицинская рекомендация. Взвешивайся раз в неделю: если за 2–3 недели вес не двигается в нужную сторону, сдвинь калории на 150–200. Норма пересчитывается сама, когда записываешь новый вес во вкладке «Зал».')}</p></div>`; }
  return head+onboard+card+meals+`<div class="sec-h"><h2>${_L('Калории · 14 дней')}</h2></div><div class="hud chart-card"><div class="chart" data-chart="kcal14"></div></div>`+info;
}
VIEWS.food = vFood;
CHARTS.kcal14 = function(w){ const T=targets(), data=[]; let any=false; for(let i=13;i>=0;i--){ const d=addDays(S.foodDate,-i), s=sumFood(foodItems(d)); if(s.kcal>0) any=true; data.push({lab:String(parseYmd(d).getDate()), v:s.kcal>0?r0(s.kcal):null, hi:d===S.foodDate, tip:`${dayLabel(d)}\n${s.kcal>0?`${_L('{0} ккал · Б {1} Ж {2} У {3}', nf.format(r0(s.kcal)), r0(s.p), r0(s.f), r0(s.c))}`:'нет записей'}`}); }
  if(!any) return '<div class="empty">График появится после первых записей.</div>'; const mx=Math.max(T?T.kcal*1.2:0, ...data.map(x=>x.v||0)), top=Math.ceil(mx/500)*500||500;
  return barsSvg(w,data,{max:top, ticks:[0,top/2,top], label:'Калории за 14 дней', target:T?T.kcal:null, targetLabel:T?_L('норма {0}', nf.format(T.kcal)):''}); };
CHARTS.exn = function(w, el){ return CHARTS.ex(w, el); };

/* food add modal helpers */
function recentFoods(){ const seen=new Map(); const ks=[...S.cols.food.keys()].sort().reverse().slice(0,21); const mine=Object.values(MYFOODS());
  for(const k of ks) for(const it of foodItems(k).slice().reverse()){ if(seen.has(it.name)) continue; const base=FOODS.find(f=>f.n===it.name) || mine.find(f=>f.n===it.name); if(base) seen.set(it.name, {...base, recent:true, lastG:it.g}); else if(it.g>0) seen.set(it.name, {n:it.name, k:it.kcal/it.g*100, p:it.p/it.g*100, f:it.f/it.g*100, c:it.c/it.g*100, recent:true, lastG:it.g}); }
  return [...seen.values()].slice(0,8); }
function foodCandidates(q){ q=String(q||'').trim().toLowerCase(); const mine=Object.values(MYFOODS()).map(x=>({...x, mine:true})); const all=[...mine, ...FOODS];
  if(!q){ const rec=recentFoods(); return [...rec, ...all.filter(x=>!rec.some(r=>r.n===x.n))].slice(0,60); }
  return all.filter(x=>x.n.toLowerCase().includes(q) || (DICT && DICT[x.n] && DICT[x.n].toLowerCase().includes(q))).slice(0,40); }
function foodListHtml(q){ const arr=foodCandidates(q); if(S.modal) S.modal.cands=arr; if(!arr.length) return '<div class="empty">Не нашёл. Добавь через «Своё» или «Описать словами».</div>';
  return arr.map((x,i)=>`<button class="row" type="button" data-a="food-pick" data-i="${i}"><span class="main-t"><span class="ttl">${esc(x.n)}${x.recent?' <span class="tag">недавно</span>':''}${x.mine?' <span class="tag">моё</span>':''}</span><span class="sub mono">${_L('{0} ккал · Б {1} · Ж {2} · У {3} на 100 г', r0(x.k), r1(x.p), r1(x.f), r1(x.c))}</span></span></button>`).join(''); }
function amtHtml(x){ const g=x.lastG || x.ug || 100;
  return `<div class="hud pad" style="margin-top:10px"><div style="font-weight:600">${esc(x.n)}</div><div class="addbar" style="margin-top:8px"><input class="inp" id="food-g" type="number" inputmode="decimal" min="1" value="${r0(g)}" aria-label="${_L('Вес, граммы')}"><span class="unit">${_L('г')}</span>${x.u?`<button class="btn sm" type="button" data-a="food-unit" data-v="1">1 ${esc(x.u)}</button><button class="btn sm" type="button" data-a="food-unit" data-v="2">2</button>`:''}</div><div class="mono dim" id="food-calc" style="margin-top:8px;font-size:12.5px"></div><button class="btn pri" type="button" data-a="food-add-pick" style="margin-top:10px;width:100%">${ico('plus','sm')}${_L('Добавить')}</button></div>`; }
function updCalc(){ const x=S.modal&&S.modal.pick, el=$('#food-calc'), gi=$('#food-g'); if(!x||!el||!gi) return; const k=(num(gi.value)||0)/100; el.textContent=`${_L('{0} ккал · Б {1} · Ж {2} · У {3}', r0(x.k*k), r1(x.p*k), r1(x.f*k), r1(x.c*k))}`; }
MODALS.food = function(m){
  const mode=m.mode||'db', ai=P().ai;
  let body='';
  if(mode==='db') body=`<input class="inp" id="food-q" placeholder="${_L('Поиск: гречка, курица, яйцо…')}" value="${esc(m.q||'')}" autocomplete="off" aria-label="${_L('Поиск продукта')}"><div class="hud list food-list" id="food-list">${foodListHtml(m.q||'')}</div><div id="food-amt">${m.pick?amtHtml(m.pick):''}</div><small class="muted">${_L('Значения примерные, на 100 г продукта.')}</small>`;
  else if(mode==='custom') body=`<form class="form" data-f="food-custom" autocomplete="off"><label class="fld"><span>${_L('Название')}</span><input class="inp" id="fc-name" maxlength="60" placeholder="${_L('Сырники домашние')}"></label>
    <div class="fld"><span>${_L('Значения указаны')}</span>${segHtml('per','100',[['100','на 100 г'],['total','на всю порцию']])}</div>
    <div class="g2"><label class="fld"><span>${_L('Порция, г')}</span><input class="inp" id="fc-g" type="number" inputmode="decimal" value="100"></label><label class="fld"><span>${_L('Калории')}</span><input class="inp" id="fc-k" type="number" inputmode="decimal" placeholder="${_L('ккал')}"></label></div>
    <div class="g3"><label class="fld"><span>${_L('Белки, г')}</span><input class="inp" id="fc-p" type="number" inputmode="decimal" placeholder="0"></label><label class="fld"><span>${_L('Жиры, г')}</span><input class="inp" id="fc-f" type="number" inputmode="decimal" placeholder="0"></label><label class="fld"><span>${_L('Углев., г')}</span><input class="inp" id="fc-c" type="number" inputmode="decimal" placeholder="0"></label></div>
    <label class="switch"><span>${_L('Запомнить в «Мои продукты»')}</span><input type="checkbox" id="fc-save" checked></label><button class="btn pri" type="submit">${ico('plus','sm')}${_L('Добавить')}</button></form>`;
  else { const res=m.aiRes, tot=res?sumFood(res):null;
    body=`<form class="form" data-f="food-ai" autocomplete="off"><textarea class="inp" id="fa-text" rows="3" maxlength="600" placeholder="${_L('Например: 200 г гречки, 150 г куриной грудки и огурец')}">${esc(m.aiText||'')}</textarea>${sImages?`<div class="btns"><label class="btn sm" for="fa-file">${ico('camera','sm')}${m.photo?'Фото прикреплено':'Добавить фото еды'}</label><input type="file" id="fa-file" accept="image/*" hidden>${m.photo?`<button class="btn sm ghost" type="button" data-a="fa-photo-rm">${_L('Убрать фото')}</button>`:''}</div>`:''}<button class="btn pri" type="submit" ${m.aiBusy||S.aiOff||!sample?'disabled':''}>${ico('spark','sm')}${m.aiBusy?'Считаю…':_L('Посчитать с {0}', esc(ai))}</button></form>
    ${m.aiErr?`<div class="banner">${esc(m.aiErr)}</div>`:''}
    ${res&&res.length?`<div class="hud list" style="margin-top:10px">${res.map((x,i)=>`<div class="row"><span class="main-t"><span class="ttl">${esc(x.name)}</span><span class="sub"><span class="mono">${_L('{0} г', r0(x.g))}</span><span>${_L('{0} ккал', r0(x.kcal))}</span><span class="mono">${_L('Б {0} · Ж {1} · У {2}', r1(x.p), r1(x.f), r1(x.c))}</span></span></span><button class="btn sm icon ghost" type="button" data-a="food-ai-rm" data-i="${i}" aria-label="${_L('Убрать')}">${ico('x','sm')}</button></div>`).join('')}</div><div class="actions" style="margin-top:10px"><span class="sp mono dim" style="font-size:12.5px;align-self:center">${_L('Итого {0} ккал · Б {1} Ж {2} У {3}', r0(tot.kcal), r0(tot.p), r0(tot.f), r0(tot.c))}</span><button class="btn pri" type="button" data-a="food-ai-add">${_L('Добавить всё')}</button></div>`:''}
    <small class="muted">${_L('{0} оценит порции и КБЖУ. Это приблизительно — проверь перед добавлением.', esc(ai))}</small>`; }
  return `<h3>${_L('Добавить еду')}</h3><div class="form"><div class="fld"><span>${_L('Приём пищи')}</span>${segHtml('meal', m.meal||mealNow(), MEALS)}</div><div class="fld"><span>${_L('Способ')}</span>${segHtml('fmode', mode, [['db','Из списка'],['custom','Своё'],['ai','Описать словами']])}</div>${body}</div>`;
};
function nutriFields(){ const n=NUTRI()||{}, w=latestWeight(), b=n.build||'meso';
  return `<div class="fld"><span>${_L('Пол')}</span>${segHtml('sex', n.sex||'m', [['m','Мужской'],['f','Женский']])}</div>
  <div class="g3"><label class="fld"><span>${_L('Возраст')}</span><input class="inp" id="n-age" type="number" inputmode="numeric" min="12" max="90" value="${esc(n.age||'')}" placeholder="20"></label><label class="fld"><span>${_L('Рост, см')}</span><input class="inp" id="n-h" type="number" inputmode="numeric" min="120" max="230" value="${esc(n.height||'')}" placeholder="180"></label><label class="fld"><span>${_L('Вес, кг')}</span><input class="inp" id="n-w" inputmode="decimal" value="${isFinite(w)?esc(fmtW(w)):''}" placeholder="75"></label></div>
  <div class="fld"><span>${_L('Телосложение')}</span>${segHtml('build', b, [['ecto','Эктоморф'],['meso','Мезоморф'],['endo','Эндоморф']])}<small id="n-build-help">${BUILD_HELP[b]}</small></div>
  <label class="fld"><span>${_L('Активность')}</span><select class="inp" id="n-act">${ACTS.map((a,i)=>`<option value="${i+1}" ${((n.activity|0)||3)===i+1?'selected':''}>${a[1]}</option>`).join('')}</select></label>
  <div class="fld"><span>${_L('Цель')}</span>${segHtml('goal', n.goal||'keep', [['cut','Похудеть'],['keep','Держать форму'],['bulk','Набрать массу']])}</div>`; }
function readNutri(f, optional){ const sa=$('#n-age').value.trim(), sh=$('#n-h').value.trim(), sw=$('#n-w').value.trim();
  if(optional && !sa && !sh && !sw) return null;
  const age=clampInt(sa,0,200), h=num(sh), w=num(sw);
  if(!(age>=12&&age<=90)) return {err:'Укажи возраст от 12 до 90', sel:'#n-age'};
  if(!(h>=120&&h<=230)) return {err:'Укажи рост в сантиметрах', sel:'#n-h'};
  if(!(w>=30&&w<=300)) return {err:'Укажи вес в килограммах', sel:'#n-w'};
  return {data:{sex:segVal(f,'sex')||'m', age, height:r0(h), weight:r1(w), build:segVal(f,'build')||'meso', activity:+$('#n-act').value||3, goal:segVal(f,'goal')||'keep', set:true}}; }
MODALS.nutri = function(){
  return `<h3>${_L('Параметры для КБЖУ')}</h3><form class="form" data-f="nutri" autocomplete="off">${nutriFields()}
  <div class="actions"><button class="btn" type="button" data-a="close">${_L('Отмена')}</button><button class="btn pri" type="submit">${_L('Рассчитать')}</button></div></form>`; };
MODALS.exView = function(m){ const name=m.name, e=exInfo(name), last=lastFor(name), best=D.bestMetric[name], mine=EXW()[name]||{}, rec=recommend(name, planTarget(name));
  return `<h3>${esc(name)}</h3><div class="btns" style="margin:-6px 0 12px">${e.m?`<span class="tag">${esc(e.m)}</span>`:''}<span class="tag">${TYPE_L[e.t]||'тренажёр'}</span></div>
  <div class="t-lbl">${_L('Техника')}</div>${techHtml(name)}
  <div class="kv"><div><span>${_L('Прошлый раз')}</span><b>${last?esc(last.sets.map(s=>fmtW(s.w)+'×'+s.r).join(' · ')):'—'}</b></div><div><span>${_L('Следующая тренировка')}</span><b style="color:var(--acc)">${esc(recText(rec))}${e.t==='db'&&rec.w?' (каждая гантель)':''}</b></div>${best!==undefined&&best>0&&e.t!=='bw'&&e.t!=='cardio'?`<div><span>${_L('Расчётный максимум на 1 раз')}</span><b>${_L('{0} кг', fmtW(r1(best)))}</b></div>`:''}</div>
  <p class="dim" style="font-size:13px;margin:8px 0 0">${esc(cap(rec.why))}</p>
  ${D.exHist[name]?`<div class="chart" style="margin-top:10px" data-chart="exn" data-name="${esc(name)}"></div>`:''}
  <form class="form" data-f="ex-weight" data-name="${esc(name)}" style="margin-top:14px" autocomplete="off"><div class="fld"><span>${_L('Мой рабочий вес сейчас')}</span><div class="addbar" style="margin:0"><input class="inp" id="xw-w" inputmode="decimal" placeholder="${_L('кг')}" value="${esc(mine.w!=null&&mine.w!==''?fmtW(mine.w):'')}" aria-label="${_L('Вес, кг')}"><input class="inp" id="xw-r" inputmode="numeric" placeholder="${_L('повторы')}" value="${esc(mine.r||'')}" aria-label="${_L('Повторы')}"><button class="btn pri" type="submit">${_L('Сохранить')}</button></div><small>${_L('Пока нет истории в приложении, рекомендации строятся от этого веса.')}</small></div></form>`; };
MODALS.pickEx = function(m){ const day=PLAN().days.find(d=>d.id===m.dayId);
  const blocks=m.groups.map(g=>{ const names=uniq([...(day?day.ex.filter(e=>(e.muscle||exInfo(e.name).m)===g).map(e=>e.name):[]), ...Object.keys(EXW()).filter(n=>exInfo(n).m===g), ...(LIB[g]||[])]);
    return `<div class="sec-h" style="margin-top:14px"><h2>${g}</h2></div><div class="hud list">${names.map(n=>{ const on=m.sel.includes(n), rec=recommend(n, planTarget(n, day)); return `<button class="row" type="button" data-a="pick-toggle" data-n="${esc(n)}"><span class="chk ${on?'on':''}">${ico('check')}</span><span class="main-t"><span class="ttl">${esc(n)}</span><span class="sub"><span>${esc(recText(rec))}</span></span></span></button>`; }).join('')}</div>`; }).join('');
  const other=MUSCLES.filter(g=>!m.groups.includes(g));
  return `<h3>${day?esc(day.name):'Свободная тренировка'}</h3><p class="dim" style="margin:-8px 0 4px;font-size:13.5px">${_L('Отметь, какие упражнения делаешь сегодня. Под каждым — рекомендованный вес.')}</p>${blocks||'<div class="empty">Выбери группы мышц ниже.</div>'}
  <div class="fld" style="margin-top:16px"><span>${_L('Добавить группу мышц')}</span><div class="lib">${other.map(g=>`<button class="chip" type="button" data-a="pick-group" data-g="${g}">+ ${_L(g)}</button>`).join('')}</div></div>
  <div class="actions sticky-actions"><button class="btn" type="button" data-a="close">${_L('Отмена')}</button><button class="btn pri" type="button" data-a="pick-start" id="pick-go">${ico('play','sm')}${_L('Начать · {0}', m.sel.length)}</button></div>`; };
MODALS.quick = function(){ return `<h3>${_L('Добавить')}</h3><div class="quick">${[['new-task','tasks','Задача'],['new-habit','habits','Привычка'],['new-med','pill','Таблетка'],['food-add','food','Еда'],['mood-open','mood','Состояние'],['fab-gym','gym','Тренировка']].map(([a,i,l])=>`<button class="hud qa" type="button" data-a="${a}">${ico(i)}<span>${l}</span></button>`).join('')}</div>`; };

async function aiFood(text, img){
  const m=S.modal; if(!m) return;
  if(!sample || S.aiOff){ toast('Ассистент недоступен в этом окне','bad'); return; }
  m.aiText=text; m.aiBusy=true; m.aiErr=''; m.aiRes=null; renderModal(true);
  try{
    const arr=await sample.json(`Оцени калорийность и БЖУ еды по описанию пользователя. Верни только JSON-массив объектов {"name": string, "grams": number, "kcal": number, "p": number, "f": number, "c": number}, где p — белки, f — жиры, c — углеводы в граммах. Значения — на указанную порцию целиком, не на 100 г. Если вес не указан — возьми типичную порцию и укажи её в grams. Название — коротко, на языке: ${LANG_AI[LANG]||'русский'}. Пример: [{"name":"Гречка варёная","grams":200,"kcal":220,"p":8.4,"f":2.2,"c":42.6}]\n\nОписание: ${text||'(только фото — оцени, что на тарелке)'}`, img ? {modelTier:'default', images:[img]} : {modelTier:'quick'});
    if(S.modal!==m) return;
    const res=(Array.isArray(arr)?arr:[]).map(x=>({name:String((x&&x.name)||'').slice(0,60), g:Math.max(0,num(x&&x.grams)||0), kcal:Math.max(0,num(x&&x.kcal)||0), p:Math.max(0,num(x&&x.p)||0), f:Math.max(0,num(x&&x.f)||0), c:Math.max(0,num(x&&x.c)||0)})).filter(x=>x.name).slice(0,15);
    m.aiRes=res; if(!res.length) m.aiErr='Не удалось разобрать. Опиши подробнее: что и сколько грамм.';
  }catch(e){ if(S.modal!==m) return; logDiag(e,'food'); m.aiErr = (e&&e.code==='not_granted') ? 'Разреши странице использовать Claude и попробуй снова.' : 'Не получилось посчитать. Попробуй ещё раз.'; }
  m.aiBusy=false; renderModal(true);
}

Object.assign(FORMS, {
  nutri(f){ const r=readNutri(f,false); if(r.err){ toast(r.err,'bad'); return; }
    Store.set('meta','nutri',r.data);
    Store.merge('meta','body',{w:{[todayStr()]:r.data.weight}});
    closeModal(); if(S.tab!=='food') S.tab='food'; render(true); const T=targets(); if(T) toast(`<b>${_L('Норма: {0} ккал', nf.format(T.kcal))}</b>${_L('Б {0} · Ж {1} · У {2} г в день', T.p, T.f, T.c)}`,'big'); },
  'food-custom'(f){ const name=$('#fc-name').value.trim(); if(!name){ toast('Напиши название','bad'); return; } const g=num($('#fc-g').value), k=num($('#fc-k').value); if(!(g>0)){ toast('Укажи вес порции','bad'); return; } if(!(k>=0)){ toast('Укажи калории','bad'); return; }
    const p=num($('#fc-p').value)||0, fa=num($('#fc-f').value)||0, c=num($('#fc-c').value)||0, per100=segVal(f,'per')!=='total', m=per100?1:100/g;
    const b={n:name, k:r1(k*m), p:r1(p*m), f:r1(fa*m), c:r1(c*m)};
    addFood(S.modal.date, {meal:segVal($('#modal'),'meal'), name, g, kcal:b.k*g/100, p:b.p*g/100, f:b.f*g/100, c:b.c*g/100});
    if($('#fc-save').checked) Store.merge('meta','foods',{list:{[uid()]:b}});
    toast(`${_L('Добавлено: {0}', esc(name))}`); closeModal(); render(true); },
  'food-ai'(f){ const t=$('#fa-text').value.trim(), img=S.modal&&S.modal.photo; if(!t && !img){ toast('Опиши, что съел, или приложи фото','bad'); return; } if(S.modal) S.modal.meal=segVal($('#modal'),'meal'); aiFood(t, img); },
  'ex-weight'(f){ const name=f.dataset.name, wv=num($('#xw-w').value), rv=clampInt($('#xw-r').value,0,200);
    Store.merge('meta','ex',{list:{[keyOf(name)]:{name, w: isFinite(wv)?String(wv):'', r: rv?String(rv):'', muscle:exInfo(name).m||'', at:todayStr()}}});
    toast('Рабочий вес сохранён'); renderModal(true); render(true); }
});
Object.assign(A, {
  fab(){ openModal('quick'); },
  'fab-gym'(){ closeModal(); if(S.draft){ go('gym'); return; } const d=planDayFor(todayStr()); openPicker(d?d.id:''); },
  'food-add'(el){ openModal('food',{date: el.dataset.d || (S.tab==='food'?S.foodDate:todayStr()), meal: el.dataset.meal || mealNow(), mode:'db', q:''}); },
  'food-del'(el){ delFood(S.foodDate, el.dataset.id); render(true); },
  'food-day'(el){ const nd=el.dataset.d || addDays(S.foodDate, +el.dataset.v); soft(()=>{ S.foodDate = nd>todayStr()?todayStr():nd; }, nd>=S.foodDate?'fwd':'back'); },
  'food-pick'(el){ const x=S.modal && S.modal.cands && S.modal.cands[+el.dataset.i]; if(!x) return; S.modal.pick=x; $('#food-amt').innerHTML=amtHtml(x); updCalc(); const a=$('#food-amt'); if(a && a.scrollIntoView) a.scrollIntoView({block:'nearest', behavior:'smooth'}); },
  'food-unit'(el){ const x=S.modal && S.modal.pick; if(!x) return; $('#food-g').value=r0(x.ug*(+el.dataset.v||1)); updCalc(); },
  'food-add-pick'(){ const m=S.modal, x=m && m.pick; if(!x) return; const g=num($('#food-g').value); if(!(g>0)){ toast('Укажи вес в граммах','bad'); return; }
    addFood(m.date, {meal:segVal($('#modal'),'meal'), name:x.n, g, kcal:x.k*g/100, p:x.p*g/100, f:x.f*g/100, c:x.c*g/100});
    toast(`${_L('Добавлено: {0} · {1} ккал', esc(x.n), r0(x.k*g/100))}`); m.pick=null; m.q=''; $('#food-amt').innerHTML=''; const q=$('#food-q'); if(q) q.value=''; $('#food-list').innerHTML=foodListHtml(''); render(true); },
  'food-ai-rm'(el){ if(S.modal && S.modal.aiRes){ S.modal.aiRes.splice(+el.dataset.i,1); renderModal(true); } },
  'food-ai-add'(){ const m=S.modal; if(!m||!m.aiRes||!m.aiRes.length) return; const meal=segVal($('#modal'),'meal'); m.aiRes.forEach(x=>addFood(m.date,{...x, meal})); toast(`${_L('Добавлено: {0} {1}', m.aiRes.length, plural(m.aiRes.length,'позиция','позиции','позиций'))}`); closeModal(); render(true); },
  'nutri-edit'(){ openModal('nutri'); },
  'ex-view'(el){ openModal('exView',{name:el.dataset.n}); },
  'ex-add-mine'(){ openModal('exLib',{mode:'mine'}); },
  'pick-toggle'(el){ const m=S.modal; if(!m) return; const n=el.dataset.n, i=m.sel.indexOf(n); if(i>=0) m.sel.splice(i,1); else m.sel.push(n); const c=el.querySelector('.chk'); if(c) c.classList.toggle('on', i<0); const b=$('#pick-go'); if(b) b.innerHTML=ico('play','sm')+_L('Начать · {0}', m.sel.length); },
  'pick-group'(el){ const m=S.modal; if(!m) return; m.groups.push(el.dataset.g); renderModal(true); },
  'pick-start'(){ const m=S.modal; if(!m) return; if(!m.sel.length){ toast('Отметь хотя бы одно упражнение','bad'); return; } const day=PLAN().days.find(d=>d.id===m.dayId);
    const order=[...(day?day.ex.map(e=>e.name).filter(n=>m.sel.includes(n)):[]), ...m.sel.filter(n=>!(day&&day.ex.some(e=>e.name===n)))];
    const dayId=m.dayId; closeModal(); startWorkout(dayId, order); },
  'fa-photo-rm'(){ if(S.modal){ S.modal.photo=null; renderModal(true); } },
  tech(el){ const n=el.dataset.n; if(S.techOpen.has(n)) S.techOpen.delete(n); else S.techOpen.add(n); render(true); }
});

/* ================= v3: habit line icons ================= */
const HGLYPH = {
  drop:'<path d="M12 3.5c3 3.6 6 7 6 10.5a6 6 0 0 1-12 0c0-3.5 3-6.9 6-10.5z"/>',
  book:'<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19"/>',
  gym:ICONS.gym,
  moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  cap:'<path d="M2.5 9L12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v4.5c1.5 1.5 3.5 2.2 5.5 2.2s4-.7 5.5-2.2V11M21.5 9v5"/>',
  calm:'<circle cx="12" cy="5.5" r="2"/><path d="M12 8.5v4.5M4.5 19.5c2.5-2.5 5-3.5 7.5-3.5s5 1 7.5 3.5M7.5 12.5l4.5 1 4.5-1"/>',
  walk:'<circle cx="13" cy="4.5" r="1.8"/><path d="M10.5 21l2-6-2.5-3 1-4.5 3 2.5 2.5 1M10.5 8L7.5 10.5 6.5 14M13 15l3 6"/>',
  leaf:'<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19l7-7"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  brain:'<path d="M9.5 4A3 3 0 0 0 6.5 7a3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h1V4zM14.5 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3h-1V4z"/>',
  pen:'<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>',
  tooth:'<path d="M8 3.5c-2.5 0-4.5 1.8-4.5 4.5 0 3 1.5 4.2 2 7 .5 3 1 6 2.5 6s1.8-4.5 4-4.5 2.5 4.5 4 4.5 2-3 2.5-6 2-4 2-7c0-2.7-2-4.5-4.5-4.5-1.8 0-2.5.8-4 .8s-2.2-.8-4-.8z"/>',
  heart:'<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.2 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  nosmoke:'<rect x="3" y="12" width="14" height="4" rx="1"/><path d="M20 12v4M4 4l16 16"/>',
  nophone:'<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M4 4l16 16"/>',
  burger:'<path d="M4 10.5a8 5.5 0 0 1 16 0z"/><path d="M3.5 14h17M5 17.5h14v.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/>',
  target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>'
};
const HKEYS = ['drop','book','gym','moon','cap','calm','walk','leaf','sun','brain','pen','tooth','heart','nosmoke','nophone','burger','target'];
const EMO2KEY = {'💧':'drop','📖':'book','🏋️':'gym','🏋':'gym','🌙':'moon','🎓':'cap','🧘':'calm','🚶':'walk','🥗':'leaf','☀️':'sun','🧠':'brain','✍️':'pen','🦷':'tooth','🚭':'nosmoke','📵':'nophone','🍔':'burger','🎯':'target'};
const hKey = h => { const i=(h&&h.icon)||''; return HGLYPH[i] ? i : (EMO2KEY[i]||'target'); };
const gly = (k, cls='') => `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${HGLYPH[k]||HGLYPH.target}</svg>`;
const habitIco = h => gly(hKey(h));

/* ================= v3: journal (undo) and usage metrics ================= */
function jrec(col,id){ const J=S.journal; if(!J) return; const k=col+'/'+id; if(J.snaps.some(x=>x.k===k)) return; const cur=S.cols[col].get(id); J.snaps.push({k, col, id, prev: cur ? strip(cur) : null}); }
const EVB = {ui:0, ai:0, t:new Set(), timer:null};
function trackW(col){ if(col==='ev' || S.noTrack || S.mode==='loading') return; const src=S.journal?'ai':'ui'; EVB[src]++; EVB.t.add(nowHM()); clearTimeout(EVB.timer); EVB.timer=setTimeout(flushEv, 4000); }
function flushEv(){ const d=todayStr(), cur=S.cols.ev.get(d)||{}; if(!EVB.ui && !EVB.ai) return; const t=[...new Set([...(cur.t||[]), ...EVB.t])].sort().slice(-80); const data={ui:(cur.ui||0)+EVB.ui, ai:(cur.ai||0)+EVB.ai, t}; EVB.ui=0; EVB.ai=0; EVB.t=new Set(); S.noTrack=true; try{ Store.set('ev', d, data); } finally{ S.noTrack=false; } }

/* ================= v3: soft streaks ================= */
function streakInfo(h){
  const t=todayStr(), frozen=new Set(); let d=t, s=0, free=null;
  if(!h.bad && scheduled(h,t) && !skipped(h,t) && !isDone(h,t)) d=addDays(t,-1);
  for(let i=0;i<1200;i++){
    if(d < (h.since||t)) break;
    if(scheduled(h,d) && !skipped(h,d)){
      if(isDone(h,d)) s++;
      else if(!h.bad && (free===null || diffDays(d,free)>=7)){ free=d; frozen.add(d); }
      else break;
    }
    d=addDays(d,-1);
  }
  if(!s) frozen.clear();
  return {s, frozen};
}

/* ================= v3: home «Сейчас» ================= */
function addMin(hm, m){ const [h,mi]=hm.split(':').map(Number); const x=Math.max(0,h*60+mi+m); return pad(Math.floor(x/60))+':'+pad(x%60); }
function nextSet(){ const w=S.draft; if(!w) return null; for(let ei=0;ei<w.exercises.length;ei++){ const ex=w.exercises[ei], si=ex.sets.findIndex(s=>!s.done); if(si>=0) return {ex, ei, si}; } return null; }
function setView(ex, si){ const s=ex.sets[si], rec=recommend(ex.name, ex.target), ls=(lastFor(ex.name)||{sets:[]}).sets, lr=ls[si]||ls[ls.length-1];
  const w = s.w!=='' ? s.w : (lr ? String(lr.w??'') : (rec.w!=null ? String(rec.w) : '0'));
  const rp = repsLow(ex.target); const r = s.r!=='' ? s.r : (lr ? String(lr.r) : (rp!=='повт.' ? rp : String(rec.lo)));
  return {w, r, rec}; }
function nowList(t){
  const hm=nowHM(), H=new Date().getHours(), L=[], l=logOf(t);
  if(S.draft){ const n=nextSet();
    if(n){ const v=setView(n.ex, n.si); L.push({pri:0, icon:'gym', lbl:`${_L('Тренировка · подход {0} из {1}', n.si+1, n.ex.sets.length)}`, title:esc(n.ex.name), sub:`<b style="color:var(--acc)">${num(v.w)>0?esc(fmtW(v.w))+' '+_L('кг'):'свой вес'} × ${esc(v.r)}</b>`, act:`<button class="btn pri" data-a="wo-set" data-e="${n.ei}" data-s="${n.si}">${ico('check','sm')}${_L('Сделал подход')}</button>`, act2:`<button class="btn" data-a="tab" data-tab="gym">${_L('Открыть')}</button>`}); }
    else L.push({pri:0, icon:'gym', lbl:'Тренировка', title:'Все подходы отмечены', act:`<button class="btn pri" data-a="wo-finish">${ico('check','sm')}${_L('Завершить тренировку')}</button>`, act2:`<button class="btn" data-a="tab" data-tab="gym">${_L('Открыть')}</button>`}); }
  for(const x of dosesOn(t)) if(!x.taken && x.time<=addMin(hm,45)){ const late=x.time<=hm; L.push({pri:late?1:2, time:x.time, icon:'pill', lbl:late?(x.time<addMin(hm,-60)?`${_L('Не отмечен приём · {0}', x.time)}`:`${_L('Пора принять · {0}', x.time)}`):`${_L('Скоро приём · {0}', x.time)}`, title:esc(x.med.name)+(x.med.dose?` <span class="muted" style="font-size:.8em">${esc(x.med.dose)}</span>`:''), sub:esc(x.med.food||''), act:`<button class="btn pri" data-a="med-toggle" data-k="${esc(x.key)}">${ico('check','sm')}${_L('Принял')}</button>`, mini:`<button class="chk" data-a="med-toggle" data-k="${esc(x.key)}" aria-label="${_L('Принял')}">${ico('check')}</button>`}); }
  for(const x of tasksOn(t)) if(!x.done && x.time && x.time<=addMin(hm,90)) L.push({pri:x.time<=hm?1:3, time:x.time, icon:'tasks', lbl:`${_L('Задача · {0}', x.time)}`, title:esc(x.title), act:`<button class="btn pri" data-a="toggle-task" data-id="${x.id}">${ico('check','sm')}${_L('Готово')}</button>`, act2:`<button class="btn ghost" data-a="task-later" data-id="${x.id}">${_L('Через час')}</button>`, mini:`<button class="chk" data-a="toggle-task" data-id="${x.id}" aria-label="${_L('Готово')}">${ico('check')}</button>`});
  const day=planDayFor(t);
  if(!S.draft && day && !D.woDates.has(t)) L.push({pri:H>=16?2:8, icon:'gym', lbl:'Зал по плану', title:esc(day.name), sub:`${day.ex.length} ${plural(day.ex.length,'упражнение','упражнения','упражнений')}`, act:`<button class="btn pri" data-a="gym-start" data-id="${day.id}">${ico('play','sm')}${_L('Начать тренировку')}</button>`, mini:`<button class="chk" data-a="gym-start" data-id="${day.id}" aria-label="${_L('Начать')}">${ico('play','sm')}</button>`});
  if(H>=21 && !l.mood) L.push({pri:2, icon:'mood', lbl:'Вечер', title:'Закрыть день', sub:'Настроение, энергия и сон — 20 секунд', act:`<button class="btn pri" data-a="mood-open">${_L('Закрыть день')}</button>`, mini:`<button class="chk" data-a="mood-open" aria-label="${_L('Закрыть день')}">${ico('plus','sm')}</button>`});
  if(H>=5 && H<11 && !l.sleep) L.push({pri:4, icon:'moon', lbl:'Утро', title:'Как спал?', sub:'Отметь сон — по нему видно, откуда берутся плохие дни', act:`<button class="btn" data-a="mood-open">${_L('Отметить сон')}</button>`, mini:`<button class="chk" data-a="mood-open" aria-label="${_L('Сон')}">${ico('plus','sm')}</button>`});
  if(setupNeeded()) L.push({pri:.5, icon:'spark', lbl:'Старт · 60 секунд', title:'Настрой Штаб под себя', sub:'Уберу чужие примеры, посчитаю твою норму КБЖУ и веса в зале — дальше всё будет про тебя.', act:`<button class="btn pri" data-a="setup">${ico('play','sm')}${_L('Начать')}</button>`, act2:`<button class="btn ghost" data-a="setup-later">${_L('Завтра')}</button>`, mini:`<button class="chk" data-a="setup" aria-label="${_L('Настроить')}">${ico('spark','sm')}</button>`});
  const open=tasksOn(t).filter(x=>!x.done && !x.time).sort((a,b)=>(b.prio|0)-(a.prio|0));
  if(open[0]) L.push({pri:5, icon:'tasks', lbl:_L('Задача')+(open[0].prio?' · '+'!'.repeat(open[0].prio):''), title:esc(open[0].title), act:`<button class="btn pri" data-a="toggle-task" data-id="${open[0].id}">${ico('check','sm')}${_L('Готово')}</button>`, act2:`<button class="btn ghost" data-a="task-later" data-id="${open[0].id}">${_L('На завтра')}</button>`, mini:`<button class="chk" data-a="toggle-task" data-id="${open[0].id}" aria-label="${_L('Готово')}">${ico('check')}</button>`});
  const TG=targets();
  if(TG && H>=13){ const fs=sumFood(foodItems(t)); if(fs.kcal < TG.kcal*(H>=19?.6:.3)) L.push({pri:6, icon:'food', lbl:'Питание', title:`${_L('Съедено {0} из {1} ккал', nf.format(r0(fs.kcal)), nf.format(TG.kcal))}`, sub:`${_L('Белок {0} из {1} г', r0(fs.p), TG.p)}`, act:`<button class="btn" data-a="food-add">${ico('plus','sm')}${_L('Записать еду')}</button>`, mini:`<button class="chk" data-a="food-add" aria-label="${_L('Еда')}">${ico('plus','sm')}</button>`}); }
  const hs=habitsAll().filter(h=>scheduled(h,t)&&!skipped(h,t)&&!h.bad&&h.link!=='gym'&&!isDone(h,t));
  if(hs[0]){ const h=hs[0], st=h.kind==='time'?(h.target>=30?10:5):1; const a = h.kind==='check' ? `data-a="habit-toggle" data-id="${h.id}"` : `data-a="habit-inc" data-id="${h.id}" data-v="${st}"`;
    L.push({pri:7, icon:'habits', lbl:_L('Привычка')+(h.cue?' · '+esc(h.cue):''), title:esc(h.name), sub:esc(progText(h,t)), act:`<button class="btn" ${a}>${ico(h.kind==='check'?'check':'plus','sm')}${h.kind==='check'?'Сделано':h.kind==='time'?'+'+st+' '+_L('мин'):'+1'}</button>`, mini:`<button class="chk" ${a} aria-label="${_L('Отметить')}">${ico(h.kind==='check'?'check':'plus','sm')}</button>`}); }
  return L.sort((a,b)=>a.pri-b.pri || String(a.time||'99').localeCompare(String(b.time||'99')));
}
function nowHtml(){
  const t=todayStr(), items=nowList(t), ai=esc(P().ai);
  if(!items.length){ const noMood=!logOf(t).mood; return `<div class="hud now"><div class="t-lbl">${ico('check','sm')}${_L('Сейчас')}</div><h3>${_L('На сегодня всё сделано')}</h3><p class="dim">${noMood?'Остался один шаг — отметить, как прошёл день.':'Можно отдыхать.'}</p><div class="btns">${noMood?`<button class="btn pri" data-a="mood-open">${_L('Закрыть день')}</button>`:''}<button class="btn ghost" data-a="chip" data-i="1">${_L('Разбор дня с {0}', ai)}</button></div></div>`; }
  const a=items[0], rest=items.slice(1,3);
  return `<div class="hud now"><div class="t-lbl">${ico(a.icon||'bolt','sm')}${esc(a.lbl)}</div><h3>${a.title}</h3>${a.sub?`<p class="dim">${a.sub}</p>`:''}<div class="btns">${a.act}${a.act2||''}</div>${rest.length?`<div class="next">${rest.map(x=>`<div class="nx">${x.mini||''}<span class="nx-t">${x.title}</span><span class="mono muted">${esc(x.time||'')}</span></div>`).join('')}</div>`:''}</div>`;
}
function ringSvg(p){ const r=16, C=2*Math.PI*r, v=Math.max(0,Math.min(1,p||0)); return `<svg viewBox="0 0 40 40" class="ring" aria-hidden="true"><circle cx="20" cy="20" r="${r}" style="stroke:var(--line2)" stroke-width="3.5" fill="none"/><circle cx="20" cy="20" r="${r}" style="stroke:var(--acc)" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-dasharray="${(C*v).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 20 20)"/></svg>`; }
function ringsStrip(t){
  const ts=tasksOn(t), td=ts.filter(x=>x.done).length, hs=habitsAll().filter(h=>scheduled(h,t)&&!skipped(h,t)&&!h.bad), hd=hs.filter(h=>isDone(h,t)).length, ds=dosesOn(t), dd=ds.filter(x=>x.taken).length, TG=targets(), fs=sumFood(foodItems(t));
  const it=[{tab:'tasks', l:'Задачи', v:`${td}/${ts.length}`, p:ts.length?td/ts.length:0},{tab:'habits', l:'Привычки', v:`${hd}/${hs.length}`, p:hs.length?hd/hs.length:0},{tab:'habits', l:'Приёмы', v:`${dd}/${ds.length}`, p:ds.length?dd/ds.length:0}, TG?{tab:'food', l:'Ккал', v:nf.format(r0(fs.kcal)), p:fs.kcal/TG.kcal}:{tab:'food', l:'Питание', v:'—', p:0}];
  return `<div class="rings">${it.map(x=>`<button class="rg" data-a="tab" data-tab="${x.tab}" aria-label="${esc(x.l)}">${ringSvg(x.p)}<span class="rg-v num">${x.v}</span><span class="rg-l">${x.l}</span></button>`).join('')}</div>`;
}
function weekStats(end){
  const days=[]; for(let i=6;i>=0;i--) days.push(addDays(end,-i)); const st=startDate(), TG=targets();
  const act=days.filter(d=>S.cols.ev.has(d)||S.cols.logs.has(d)||S.cols.food.has(d)||D.woDates.has(d)||(D.tbd.get(d)||[]).some(x=>x.done)).length;
  const pc=days.filter(d=>d>=st).map(d=>dayStats(d)).filter(s=>s.total).map(s=>s.done/s.total);
  const sl=days.map(d=>num(logOf(d).sleep)).filter(v=>v>0), md=days.map(d=>+logOf(d).mood).filter(v=>v>0);
  return {from:days[0], to:end, act, wos:D.wos.filter(w=>days.includes(w.date)).length, plan:pc.length?Math.round(avg(pc)*100):null, sleep:sl.length?r1(avg(sl)):null, mood:md.length?r1(avg(md)):null,
    norm: TG ? days.filter(d=>{ const s=sumFood(foodItems(d)); return s.kcal>0 && Math.abs(s.kcal-TG.kcal)<=TG.kcal*.1; }).length : null, tasks:days.reduce((a,d)=>a+(D.tbd.get(d)||[]).filter(x=>x.done).length,0)};
}
function weekCard(t, homeOnly){
  const wd=wdOf(t); if(homeOnly && !(wd===7||wd===1)) return '';
  const w=weekStats(wd===1 ? addDays(t,-1) : t), dec=v=>String(v).replace('.',',');
  const cells=[['Активных дней', w.act+'/7'],['План', w.plan==null?'—':w.plan+'%'],['Тренировок', w.wos],['Задач', w.tasks],['Сон', w.sleep==null?'—':dec(w.sleep)+' '+_L('ч')],['Настроение', w.mood==null?'—':dec(w.mood)+'/5'],...(w.norm!=null?[['В норме КБЖУ', w.norm+'/7']]:[])];
  return `<div class="hud pad week-card"><div class="t-lbl">${ico('stats','sm')}${_L('Итоги недели · {0} — {1}', esc(shortDate(w.from)), esc(shortDate(w.to)))}</div><div class="wk">${cells.map(([k,v])=>`<div><b class="num">${v}</b><span>${k}</span></div>`).join('')}</div><button class="btn" data-a="review">${ico('spark','sm')}${_L('Разбор недели с {0}', esc(P().ai))}</button></div>`;
}
function dayList(t){
  const st=dayStats(t), od=overdue(), open=!!S.dayOpen;
  return `${od.length?`<div class="hud overdue" style="margin-top:14px"><div class="overdue-h" style="border-bottom:0"><span>${_L('Просрочено: {0} {1}', od.length, plural(od.length,'задача','задачи','задач'))}</span><button class="btn sm" data-a="carry">${_L('Перенести на сегодня')}</button></div></div>`:''}
  <button class="daybar" data-a="day-toggle" aria-expanded="${open}"><span>${_L('Весь день по порядку')}</span><span class="mono dim num">${st.done}/${st.total}</span>${ico(open?'up':'down','sm')}</button>${open?agenda(t):''}`;
}
function vHome(){ const t=todayStr(); if(isLoading()) return `<div class="skel-wrap">${SKEL(3)}</div>`; return ringsStrip(t)+weekCard(t,true)+dayList(t); }
function renderHero(){
  if(S.tab!=='home') return;
  const t=todayStr(), s=dayStats(t), H=new Date().getHours(), exp=Math.max(0,Math.min(100,(H-8)/14*100));
  const state = S.thinking ? 'think' : s.pct==null ? 'idle' : s.pct>=100 ? 'done' : (H>=14 && s.pct<exp-30) ? 'behind' : 'ok';
  const core=$('#core'); if(core.dataset.state!==state) core.dataset.state=state;
  if(S.thinking) $('#core-pct').textContent='···'; else setOrbPct(isLoading()?null:s.pct);
  core.style.setProperty('--lvl', (isLoading()?0:Math.max(0,Math.min(100,s.pct||0)))+'%');
  $('#core-lbl').textContent = S.thinking ? 'думаю' : state==='done' ? 'день закрыт' : state==='behind' ? 'догоняем' : 'план дня';
  const C=2*Math.PI*89; $('#core-ring').setAttribute('stroke-dasharray', `${(C*(s.pct||0)/100).toFixed(1)} ${C.toFixed(1)}`);
  const sum=summaryHtml(); if($('#summary').innerHTML!==sum) $('#summary').innerHTML=sum;
  const nh=isLoading()?SKEL(1):nowHtml(); if($('#now').innerHTML!==nh) $('#now').innerHTML=nh;
}
function setOrbPct(v){ const el=$('#core-pct'); cancelAnimationFrame(S.orbRaf);
  if(v==null){ el.textContent='—'; S.orbShown=null; return; }
  const from = S.orbShown==null ? 0 : S.orbShown; S.orbShown=v;
  const put = x => { el.innerHTML = `${x}<small>%</small>`; };
  if(from===v || matchMedia('(prefers-reduced-motion: reduce)').matches){ put(v); return; }
  const t0=performance.now(), dur=750; const step=t=>{ const k=Math.min(1,(t-t0)/dur), e=1-Math.pow(1-k,3); put(Math.round(from+(v-from)*e)); if(k<1) S.orbRaf=requestAnimationFrame(step); }; S.orbRaf=requestAnimationFrame(step); }
function subnav(kind){ const tabs = kind==='plan' ? [['tasks','Задачи'],['habits','Привычки']] : [['gym','Зал'],['food','Питание']]; return `<div class="subnav">${tabs.map(([k,l])=>`<button class="${S.tab===k?'on':''}" data-a="tab" data-tab="${k}">${l}</button>`).join('')}</div>`; }
VIEWS.home=vHome;
const _vT=VIEWS.tasks, _vH=VIEWS.habits, _vG=VIEWS.gym, _vF=VIEWS.food;
VIEWS.tasks=()=>subnav('plan')+_vT(); VIEWS.habits=()=>subnav('plan')+_vH(); VIEWS.gym=()=>(S.draft?'':subnav('body'))+_vG(); VIEWS.food=()=>subnav('body')+_vF();

/* ================= v3: command core (sheet) ================= */
let sImages=false, dls=null;
function quickGrid(){ return `<div class="quick">${[['new-task','tasks','Задача'],['new-habit','habits','Привычка'],['new-med','pill','Таблетка'],['food-add','food','Еда'],['mood-open','mood','Состояние'],['fab-gym','gym','Тренировка']].map(([a,i,l])=>`<button class="hud qa" type="button" data-a="${a}">${ico(i)}<span>${l}</span></button>`).join('')}</div>`; }
function photoChip(){ return S.photoURL ? `<div class="photo-chip"><img src="${S.photoURL}" alt="${_L('Прикреплённое фото')}"><span>${_L('Фото прикреплено')}</span><button type="button" class="btn sm icon ghost" data-a="photo-rm" aria-label="${_L('Убрать фото')}">${ico('x','sm')}</button></div>` : ''; }
MODALS.core = function(){ const ai=esc(P().ai);
  return `<h3>${ai}</h3>
  <div class="log sheet-log" id="sheet-log" aria-live="polite">${S.chat.map(msgHtml).join('')}</div>
  ${S.chat.length?'':`<p class="dim" style="margin:0 0 12px;font-size:14px;line-height:1.5">${_L('Пиши одной фразой всё сразу — я разнесу по разделам. Например: «жим 60 на 8, три подхода, съел шаурму, лёг в час».{0} Голосом — через микрофон на клавиатуре телефона.', sImages?' Можно прислать фото еды, тренажёра или этикетки.':'')}</p>`}
  <form class="ask" data-f="ask-sheet" autocomplete="off">
    ${sImages?`<label class="btn icon" for="sheet-file" aria-label="${_L('Прикрепить фото')}">${ico('camera')}</label><input type="file" id="sheet-file" accept="image/*" hidden>`:''}
    <textarea class="inp" id="sheet-in" rows="1" maxlength="800" placeholder="${_L('Скажи, что сделать…')}" enterkeyhint="send" aria-label="${_L('Сообщение для {0}', ai)}" data-autofocus></textarea>
    <button class="btn pri icon" type="submit" id="sheet-send" aria-label="${_L('Отправить')}" ${S.thinking?'hidden':''}>${ico('send')}</button>
    <button class="btn icon" type="button" data-a="stop" id="sheet-stop" aria-label="${_L('Остановить')}" ${S.thinking?'':'hidden'}>${ico('stop')}</button>
  </form>
  <div id="sheet-photo">${photoChip()}</div>
  <div class="chips" style="margin-top:10px">${CHIPS.map((c,i)=>`<button class="chip" type="button" data-a="chip" data-i="${i}" ${S.thinking||S.aiOff?'disabled':''}>${esc(c.l)}</button>`).join('')}${S.chat.length?'<button class="chip" type="button" data-a="clear-chat">Очистить</button>':''}</div>
  ${S.aiOff?`<div class="banner">${esc(S.aiOff)}</div>`:''}
  <div class="sec-h"><h2>${_L('Добавить вручную')}</h2></div>${quickGrid()}`; };
MODALS.quick = function(){ return `<h3>${_L('Добавить')}</h3>${quickGrid()}`; };
function syncSheet(){ const s=$('#sheet-send'), st=$('#sheet-stop'); if(s) s.hidden=S.thinking; if(st) st.hidden=!S.thinking; $$('#modal .chip[data-a="chip"]').forEach(b=>b.disabled=S.thinking||!!S.aiOff); }
function msgHtml(m){
  if(m.role==='user') return `<div class="msg user">${esc(m.show||m.content)}</div>`;
  const rc = m.receipt ? `<div class="receipt ${m.receipt.undone?'undone':''}"><div class="t-lbl">${m.receipt.undone?'Отменено':'Записал'}</div><ul>${m.receipt.labels.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>${m.receipt.undone?'':`<button class="btn sm" type="button" data-a="undo" data-mid="${m.id}">${_L('Отменить всё')}</button>`}</div>` : '';
  return `<div class="msg ai" data-mid="${m.id}"><span class="who">${esc(P().ai)}</span><div class="body">${m.pending ? '<span class="typing"><i></i><i></i><i></i></span>' : mdLite(m.content)}</div>${rc}${m.note?`<span class="note">${esc(m.note)}</span>`:''}</div>`;
}
function renderChat(){ const log=$('#sheet-log'); if(!log) return; const h=S.chat.map(msgHtml).join(''); if(log.innerHTML!==h){ log.innerHTML=h; log.scrollTop=log.scrollHeight; } }
function updateBubble(m){ const els=$$(`[data-mid="${m.id}"] .body`); if(!els.length){ renderChat(); return; } els.forEach(el=>el.innerHTML=mdLite(m.content)); const log=$('#sheet-log'); if(log) log.scrollTop=log.scrollHeight; }
const TOOL_LABEL = {
  add_task:(i,r)=>`${_L('Задача «{0}»{1}', i.title, r&&r.date&&r.date!==todayStr()?' '+_L('на {0}', shortDate(r.date)):'')}`,
  update_task:(i)=>{ const x=S.cols.tasks.get(String(i.id)); const n=x?x.title:'задача'; return i.done===true?`${_L('Выполнено: «{0}»', n)}`:i.done===false?`${_L('Вернул в работу: «{0}»', n)}`:i.date?`${_L('Перенёс «{0}» на {1}', n, shortDate(i.date))}`:`${_L('Изменил «{0}»', n)}`; },
  log_habit:(i)=>{ const h=S.cols.habits.get(String(i.habit_id)); return `${_L('Привычка «{0}»: {1}', h?h.name:'?', h&&h.kind==='check'&&!h.bad?(Number(i.value)?'сделано':'снята отметка'):i.value)}`; },
  take_med:(i)=>{ const m=S.cols.meds.get(String(i.dose_key||'').split('@')[0]); return `${i.taken===false?'Снял отметку приёма':'Принято'}: ${m?m.name:''}`; },
  add_habit:(i)=>`${_L('Новая привычка «{0}»', i.name)}`, add_med:(i)=>`${_L('В расписании: {0}', i.name)}`, set_gym_plan:()=>'Программа в зал обновлена',
  log_day:(i)=>_L('Состояние:')+' '+([i.mood?_L('настроение {0}/5', i.mood):'', i.energy?_L('энергия {0}/5', i.energy):'', i.sleep!=null?_L('сон {0} ч', i.sleep):''].filter(Boolean).join(', ')||_L('записано')),
  log_food:(i)=>`${_L('Еда: {0}{1} · {2} ккал', i.name, i.grams?' '+Math.round(i.grams)+' '+_L('г'):'', Math.round(Number(i.kcal)||0))}`,
  log_workout:(i)=>`${_L('Зал: {0} — {1}', normalizeEx(i.exercise), (Array.isArray(i.sets)?i.sets:[]).map(s=>`${fmtW(s&&s.w||0)}×${s&&s.r}`).join(', '))}`
};
function wrapTools(tools, J){ return tools.map(t=>({name:t.name, description:t.description, inputSchema:t.inputSchema, execute(input, ctx){ S.journal=J; try{ const r=t.execute(input||{}, ctx); const lf=TOOL_LABEL[t.name]; if(lf) J.labels.push(lf(input||{}, r)); return r; } finally{ S.journal=null; } }})); }
function normalizeEx(n){ const s=String(n||'').trim(); if(!s) return ''; const all=uniq([...Object.keys(EXI), ...Object.keys(EXW()), ...PLAN().days.flatMap(d=>(d.ex||[]).map(e=>e.name))]); const lo=s.toLowerCase().replace(/ё/g,'е'); return all.find(x=>x.toLowerCase().replace(/ё/g,'е')===lo) || cap(s); }
function logWorkoutTool(i){
  const name=normalizeEx(i.exercise); const sets=(Array.isArray(i.sets)?i.sets:[]).map(s=>({w:String(Math.max(0,Number(s&&s.w)||0)), r:String(Math.max(0,Math.round(Number(s&&s.r)||0))), done:true})).filter(s=>+s.r>0).slice(0,20);
  if(!name || !sets.length) throw new Error('нужны упражнение и хотя бы один подход с повторами');
  if(S.draft && (!i.date || i.date===S.draft.date)){ let ex=S.draft.exercises.find(e=>e.name===name); if(!ex){ ex={name, muscle:exInfo(name).m||'', target:planTarget(name), sets:[]}; S.draft.exercises.push(ex); }
    const undone=ex.sets.filter(s=>!s.done); ex.sets=[...ex.sets.filter(s=>s.done), ...sets, ...undone.slice(sets.length)]; flushWo(true); return {ok:true, into:'текущая тренировка'}; }
  const d=validDate(i.date)||todayStr(), qid='q'+d.replace(/-/g,''), cur=S.cols.workouts.get(qid), now=new Date().toISOString();
  const w=cur ? strip(cur) : {date:d, dayId:'', name:'Быстрая запись', startedAt:now, finishedAt:now, exercises:[]};
  let ex=w.exercises.find(e=>e.name===name); if(!ex){ ex={name, muscle:exInfo(name).m||'', target:planTarget(name), sets:[]}; w.exercises.push(ex); }
  ex.sets.push(...sets); w.finishedAt=w.finishedAt||now; Store.set('workouts', qid, w); return {ok:true, into:'сегодняшняя запись'};
}
function aiCall(q, o, msg, ctl, withTools, J){
  const hist=S.chat.filter(m=>m!==msg && m.content && m.content.trim()).slice(-12).map(m=>({role:m.role, content:m.content}));
  while(hist.length && hist[0].role!=='user') hist.shift();
  const turns=[{role:'user', content:rules()}, ...hist];
  const opts={signal:ctl.signal, modelTier:o.tier||'quick', onText:({text})=>{ msg.content=text; msg.pending=false; updateBubble(msg); }};
  if(withTools) opts.tools=wrapTools(mkTools(), J); else opts.cache=false;
  if(o.images) opts.images=o.images;
  return sample(turns, opts);
}
async function ask(q, o){
  o=o||{};
  if(!S.modal || S.modal.type!=='core') openModal('core');
  if(S.aiOff || !sample){ toast(esc(S.aiOff||'Ассистент ещё подключается, попробуй через пару секунд'),'bad'); return; }
  if(S.thinking) return;
  S.chat.push({role:'user', content:q, show:o.show});
  const msg={role:'assistant', content:'', pending:true, id:uid()}; S.chat.push(msg);
  S.thinking=true; orbSpeed(true); renderHero(); renderChat(); syncSheet();
  const ctl=new AbortController(); S.ctl=ctl; const J={snaps:[], labels:[]};
  let res=null, err=null;
  try{ res=await aiCall(q,o,msg,ctl,sTools,J); }
  catch(e){ err=e; const c=e&&e.code;
    if(sTools && !(e&&e.text) && !J.labels.length && !FATAL.includes(c) && !USER_ERR.includes(c)){ logDiag(e,'with-tools'); sTools=false; S.toolsBroken=true; msg.pending=true; msg.content=''; try{ res=await aiCall(q,o,msg,ctl,false,J); err=null; }catch(e2){ err=e2; } } }
  if(J.labels.length) msg.receipt={labels:J.labels, snaps:J.snaps};
  if(res){ msg.content=res.text; msg.pending=false; if(res.truncated) msg.note='Ответ обрезан — спроси короче.'; speak(res.text); }
  else if(err){ const e=err, c=e&&e.code; msg.pending=false; msg.content=(e&&e.text)||'';
    if(c==='cancelled'){ if(!msg.content) msg.content='Остановлено.'; }
    else if(FATAL.includes(c)){ S.aiOff='Нет доступа к ассистенту: разреши странице использовать Claude и обнови её.'; msg.content=msg.content||'Нет доступа к ассистенту в этом окне.'; }
    else if(c==='tools_unavailable'){ sTools=false; msg.note='Действия сейчас недоступны. Повтори вопрос.'; }
    else if(c==='rate_limited'){ msg.note='Слишком много запросов. Попробуй через минуту.'; }
    else if(c==='session_expired'){ msg.note='Сессия истекла: войди в Claude заново.'; }
    else if(c==='refused'){ msg.content=''; msg.note='На это я не отвечу. Спроси иначе.'; }
    else if(c==='prompt_too_large'){ msg.note='Слишком много данных для одного запроса. Очисти диалог.'; }
    else if(c==='image_rejected'){ msg.note='Фото не подошло: попробуй другое (JPG или PNG).'; }
    else { logDiag(e,'plain'); msg.note=`${_L('Ошибка {0}: {1}', c||'без кода', String((e&&e.message)||e||'').slice(0,140))}`; }
    if(!msg.content && !msg.note && !msg.receipt) msg.note='Нет ответа.';
    if(!msg.content && msg.receipt) msg.content='Готово.'; }
  if(res && S.toolsBroken && !msg.note) msg.note='Сейчас отвечаю без действий с данными: изменения делай в приложении.';
  S.thinking=false; S.ctl=null; orbSpeed(false); renderHero(); renderChat(); syncSheet(); schedule();
}

/* ================= v3: gym focus mode and plates ================= */
function platesText(name, w){ const e=exInfo(name); if(e.t!=='bb' || !(w>20)) return ''; const bar=(e.min&&e.min<20)?10:20; let side=(w-bar)/2; if(side<=0) return ''; const out=[]; for(const p of [25,20,15,10,5,2.5,1.25]) while(side>=p-1e-9){ out.push(p); side-=p; } return out.length ? `${_L('Блины на каждую сторону: {0} (гриф {1} кг){2}', out.map(fmtW).join(' + '), bar, side>0.01?' — точнее не собрать':'')}` : ''; }
function vFocus(){
  const w=S.draft, n=nextSet(), el=(Date.now()-Date.parse(w.startedAt))/1000;
  const bar=`<div class="hud wo-bar"><div><div class="t-lbl">${ico('gym')}${_L('Фокус')}</div><h3 style="margin:3px 0 0;font:500 16px/1.25 var(--f-disp)">${esc(w.name)}</h3></div><span class="clock" data-elapsed>${fmtClock(el)}</span><div class="btns"><button class="btn sm" data-a="focus">${_L('Список')}</button><button class="btn pri sm" data-a="wo-finish">${_L('Завершить')}</button></div></div>`;
  if(!n) return bar+`<div class="hud pad" style="margin-top:12px"><h3 style="margin:0 0 10px;font:500 18px var(--f-disp)">${_L('Все подходы отмечены')}</h3><div class="btns"><button class="btn" data-a="wo-add-ex">${ico('plus','sm')}${_L('Ещё упражнение')}</button><button class="btn pri" data-a="wo-finish">${ico('check','sm')}${_L('Завершить тренировку')}</button></div></div>`;
  const ex=n.ex, e=exInfo(ex.name), v=setView(ex, n.si), inc=e.inc||2.5, pt=platesText(ex.name, num(v.w));
  const ld=ex.sets.map((x,i)=>x.done?i:-1).filter(i=>i>=0).pop(), adv=ld!=null?setAdvice(ex,ld):null;
  const up=w.exercises.map((x,i)=>({x,i})).filter(o=>o.i!==n.ei && o.x.sets.some(z=>!z.done)).slice(0,4);
  const stp=(k,d,lbl)=>`<button class="btn icon" data-a="f-adj" data-e="${n.ei}" data-s="${n.si}" data-k="${k}" data-v="${d}" aria-label="${lbl}">${ico(d<0?'minus':'plus')}</button>`;
  return bar+`<div class="hud focus"><div class="t-lbl" style="justify-content:center">${_L('{0} · подход {1} из {2}', esc(ex.muscle||''), n.si+1, ex.sets.length)}</div><h2 class="f-name">${esc(ex.name)}</h2>
  <div class="f-grid"><div class="f-cell"><span>${_L('вес, кг{0}', e.t==='db'?' (гантель)':'')}</span><div class="f-step">${stp('w',-inc,'Меньше вес')}<b class="num">${esc(fmtW(v.w))}</b>${stp('w',inc,'Больше вес')}</div></div><div class="f-cell"><span>${_L('повторы')}</span><div class="f-step">${stp('r',-1,'Меньше повторов')}<b class="num">${esc(v.r)}</b>${stp('r',1,'Больше повторов')}</div></div></div>
  ${pt?`<div class="rec muted">${esc(pt)}</div>`:''}
  ${adv?`<div class="adv">${esc(adv.txt)}</div>`:`<div class="rec">${_L('Цель:')} <b>${esc(recText(v.rec))}</b></div>`}
  <button class="btn pri f-go" data-a="wo-set" data-e="${n.ei}" data-s="${n.si}">${ico('check')}${_L('Сделал подход')}</button>
  <div class="btns" style="justify-content:center"><button class="btn sm ghost" data-a="tech" data-n="${esc(ex.name)}">${ico('video','sm')}${S.techOpen.has(ex.name)?'Скрыть технику':'Техника'}</button><button class="btn sm ghost" data-a="wo-skip-set" data-e="${n.ei}" data-s="${n.si}">${_L('Пропустить подход')}</button></div>
  ${S.techOpen.has(ex.name)?`<div style="text-align:left">${techHtml(ex.name)}</div>`:''}</div>
  ${up.length?`<div class="sec-h"><h2>${_L('Дальше')}</h2></div><div class="hud list">${up.map(o=>`<div class="row"><span class="main-t"><span class="ttl">${esc(o.x.name)}</span><span class="sub"><span>${_L('{0} подх. осталось', o.x.sets.filter(z=>!z.done).length)}</span><span>${esc(recText(recommend(o.x.name,o.x.target)))}</span></span></span></div>`).join('')}</div>`:''}`;
}

/* ================= v3: actions ================= */
Object.assign(A, {
  tab(el){ let t=el.dataset.tab; if(t==='plan') t=S.planSub||'tasks'; if(t==='body') t=S.bodySub||'gym'; if(t==='tasks'||t==='habits') S.planSub=t; if(t==='gym'||t==='food') S.bodySub=t; go(t); },
  'core-open'(){ if(S.lpUntil && Date.now()<S.lpUntil) return; openModal('core'); },
  fab(){ openModal('core'); },
  orb(){ openModal('core'); if(!S.thinking && !S.aiOff && sample) briefing(); },
  'photo-rm'(){ S.photo=null; S.photoURL=null; const p=$('#sheet-photo'); if(p) p.innerHTML=''; },
  undo(el){ const m=S.chat.find(x=>x.id===el.dataset.mid); if(!m||!m.receipt||m.receipt.undone) return;
    for(const sn of [...m.receipt.snaps].reverse()){ if(sn.col==='workouts' && S.draft && sn.id===S.draft.id) S.draft = sn.prev ? {...clone(sn.prev), id:sn.id} : null; if(sn.prev) Store.set(sn.col, sn.id, sn.prev); else Store.del(sn.col, sn.id); }
    m.receipt.undone=true; renderChat(); render(true); toast('Отменено'); },
  'day-toggle'(){ soft(()=>{ S.dayOpen=!S.dayOpen; }, 'fade'); },
  'task-later'(el){ const x=S.cols.tasks.get(el.dataset.id); if(!x) return; if(x.time){ const nt=addMin(nowHM(),60); Store.merge('tasks',x.id, nt<'24:00'?{time:nt}:{time:'', date:addDays(todayStr(),1)}); toast('Сдвинул на час'); } else { Store.merge('tasks',x.id,{date:addDays(todayStr(),1)}); toast('Перенёс на завтра'); } render(true); },
  focus(){ soft(()=>{ S.focus=!S.focus; window.scrollTo({top:0}); }, S.focus?'back':'fwd'); },
  'f-adj'(el){ const ex=S.draft&&S.draft.exercises[+el.dataset.e]; if(!ex) return; const si=+el.dataset.s, s=ex.sets[si]; if(!s) return; const v=setView(ex, si), d=Number(el.dataset.v);
    if(el.dataset.k==='w'){ s.w=String(Math.max(0, Math.round(((num(v.w)||0)+d)*100)/100)); s.auto=false; } else s.r=String(Math.max(0, (num(v.r)||0)+d));
    flushWo(false); render(true); },
  'wo-skip-set'(el){ const ex=S.draft&&S.draft.exercises[+el.dataset.e]; if(!ex) return; ex.sets.splice(+el.dataset.s,1); if(!ex.sets.length) S.draft.exercises.splice(+el.dataset.e,1); flushWo(true); render(true); },
  'food-repeat'(el){ const d=S.foodDate, y=addDays(d,-1), k=el.dataset.meal; const its=foodItems(y).filter(x=>(x.meal||'s')===k); if(!its.length) return; const cur=foodItems(d).map(x=>clone(x)); its.forEach(x=>cur.push({...clone(x), id:uid()})); Store.merge('food', d, {items:cur}); toast(`${_L('Добавлено как вчера: {0} {1}', its.length, plural(its.length,'позиция','позиции','позиций'))}`); render(true); },
  'nutri-light'(){ Store.merge('meta','profile',{nutriMode: P().nutriMode==='light'?'full':'light'}); render(true); },
  backup(){ const o={}; COLS.forEach(c=>{ o[c]=Object.fromEntries([...S.cols[c]].map(([k,v])=>[k,strip(v)])); }); const txt=JSON.stringify(o,null,1);
    if(!dls){ if(IS_PWA){ saveFile(`shtab-${todayStr()}.json`, txt); return; } A['copy-data'](); return; }
    dls.save({filename:`shtab-${todayStr()}.json`, data:txt}).then(r=>{ if(r&&r.status==='saved') toast('Копия сохранена'); }, e=>{ if(e&&e.code==='declined') return; toast('Файл сохранить не вышло — копирую данные в буфер','bad'); A['copy-data'](); }); }
});
(async()=>{ try{ if(window.claude && typeof window.claude.use==='function') dls=await window.claude.use('downloads'); }catch(e){ dls=null; } })();

/* ================= v7: «Старт за 60 секунд» ================= */
const SEED_TASKS = ['t_s1','t_s2','t_s3','t_s4'];
function normTime(v){ v=String(v||'').trim().replace(/[.,\-\s]/g,':'); if(/^\d{3,4}$/.test(v)) v=v.slice(0,-2)+':'+v.slice(-2); else if(/^\d{1,2}$/.test(v)) v+=':00'; return validTime(v); }
function setupItems(){
  const L=[];
  habitsAll().filter(h=>h.ex).forEach(h=>L.push({k:'habits/'+h.id, icon:habitIco(h), name:h.name, sub:uniq([kindLabel(h), daysText(h.days)]).join(' · '), on:true}));
  medsAll().filter(m=>m.ex).forEach(m=>L.push({k:'meds/'+m.id, id:m.id, icon:ico('pill'), name:m.name, sub:[m.dose, m.food].filter(Boolean).join(' · ')||daysText(m.days), time:(m.times||[]).length===1?m.times[0]:'', on:true}));
  const pl=PLAN(); if(pl.demo && pl.days.length) L.push({k:'meta/plan', icon:ico('gym'), name:'Программа зала', sub:pl.days.map(d=>`${(d.wd||[]).map(x=>WD[x-1]).join(' ')} ${_L(d.name)}`.trim()).join(' · '), on:true});
  const st=SEED_TASKS.map(id=>S.cols.tasks.get(id)).filter(x=>x && !x.done);
  if(st.length) L.push({k:'tasks/seed', icon:ico('tasks'), name:'Стартовые задачи-подсказки', sub:`${_L('{0} {1} про настройку — после этого экрана не нужны', st.length, plural(st.length,'задача','задачи','задач'))}`, on:false});
  return L;
}
function setupNeeded(){ const p=P(); if(p.setup || p.setupSnooze===todayStr()) return false; return setupItems().some(x=>x.k!=='tasks/seed') || !NUTRI(); }
function setupExercises(){
  const ok=n=>{ const t=exInfo(n).t; return t!=='bw' && t!=='cardio'; }, cols=PLAN().days.map(d=>(d.ex||[]).map(e=>e.name).filter(ok)), out=[];
  for(let i=0; out.length<4 && cols.some(c=>c.length>i); i++) for(const c of cols) if(c[i] && !out.includes(c[i]) && out.length<4) out.push(c[i]);
  for(const n of ['Жим штанги лёжа','Приседания со штангой','Становая тяга','Тяга верхнего блока']) if(out.length<4 && !out.includes(n)) out.push(n);
  return out;
}
MODALS.setup = function(){
  const items=setupItems(), exs=setupExercises(), W=EXW(); let n=0; const h2=(t,a)=>`<div class="sec-h"><h2>${++n} · ${t}</h2><span class="aside">${a}</span></div>`;
  const rows=items.map(x=>`<div class="row ${x.on?'':'done'}"><button class="chk ${x.on?'on':''}" type="button" data-a="setup-tog" data-k="${esc(x.k)}" aria-pressed="${x.on}" aria-label="${_L('Оставить: {0}', esc(x.name))}">${ico('check')}</button><span class="h-ico">${x.icon}</span><span class="main-t"><span class="ttl">${esc(x.name)}</span><span class="sub"><span>${esc(x.sub)}</span><span class="st-l">${x.on?'оставлю':'уберу'}</span></span></span>${x.time?`<input class="inp su-t" inputmode="numeric" maxlength="5" data-st="${esc(x.id)}" value="${esc(x.time)}" placeholder="09:00" ${x.on?'':'disabled'} aria-label="${_L('Время приёма: {0}', esc(x.name))}">`:''}</div>`).join('');
  const wrows=exs.map((nm,i)=>{ const mw=W[nm]||{}, e=exInfo(nm), pe=planEx(nm); return `<div class="row"><span class="main-t"><span class="ttl">${esc(nm)}</span><span class="sub">${e.m?`<span>${esc(e.m)}</span>`:''}${e.t==='db'?'<span>вес одной гантели</span>':''}</span></span><input class="inp su-n" id="sw-${i}-w" data-sw="${esc(nm)}" inputmode="decimal" placeholder="${_L('кг')}" value="${esc(mw.w!=null&&mw.w!==''?fmtW(mw.w):'')}" aria-label="${_L('{0}: вес, кг', esc(nm))}"><span class="su-x">×</span><input class="inp su-n" id="sw-${i}-r" data-sr="1" inputmode="numeric" placeholder="${esc(pe?String(pe.reps).split('-')[0]:'повт.')}" value="${esc(mw.r||'')}" aria-label="${_L('{0}: повторы', esc(nm))}"></div>`; }).join('');
  return `<h3>${_L('Старт за 60 секунд')}</h3><p class="dim" style="margin:-6px 0 4px;font-size:14px;line-height:1.5">${_L('Три шага — и процент дня, норма КБЖУ и веса в зале будут считаться по тебе, а не по примерам.')}</p>
  <form class="form" data-f="setup" autocomplete="off">
  ${items.length?`${h2('Это твоё?','сними галочку с чужого')}<div class="hud list">${rows}</div><small class="muted">${_L('У таблеток можно сразу поправить время. Остальное меняется потом в «Плане».')}</small>`:''}
  ${h2('Тело','для нормы КБЖУ')}${nutriFields()}
  ${h2('Рабочие веса','сколько поднимаешь сейчас')}<div class="hud list">${wrows}</div><small class="muted">${_L('Не делаешь упражнение — оставь пустым. От этих весов посчитаю рекомендацию на первую тренировку.')}</small>
  <div class="actions sticky-actions"><button class="btn" type="button" data-a="close">${_L('Позже')}</button><button class="btn pri" type="submit">${ico('check','sm')}${_L('Готово')}</button></div></form>`;
};
FORMS.setup = function(f){
  const badT=[...f.querySelectorAll('[data-st]')].find(i=>!i.disabled && !normTime(i.value)); if(badT){ toast('Время приёма напиши так: 09:00','bad'); badT.focus(); return; }
  const nd=readNutri(f, true); if(nd && nd.err){ toast(nd.err,'bad'); const el=$(nd.sel); if(el) el.focus(); return; }
  const t=todayStr(); let removed=0, kept=0;
  f.querySelectorAll('[data-a="setup-tog"]').forEach(b=>{ const [col,id]=b.dataset.k.split('/'), keep=b.classList.contains('on');
    if(col==='tasks'){ if(!keep) for(const tid of SEED_TASKS){ const x=S.cols.tasks.get(tid); if(x && !x.done) Store.del('tasks', tid); } return; }
    keep ? kept++ : removed++;
    if(col==='meta'){ if(keep) Store.merge('meta','plan',{demo:false}); else Store.set('meta','plan',{days:[]}); return; }
    const cur=S.cols[col].get(id); if(!cur) return;
    if(!keep){ Store.del(col,id); return; }
    const patch={ex:false}; if((cur.since||t)<t) patch.since=t;
    if(col==='meds'){ const ti=f.querySelector(`[data-st="${CSS.escape(id)}"]`), tv=ti&&normTime(ti.value); if(tv && (cur.times||[]).length===1 && tv!==cur.times[0]) patch.times=[tv]; }
    Store.merge(col,id,patch); });
  if(nd && nd.data){ Store.set('meta','nutri',nd.data); Store.merge('meta','body',{w:{[t]:nd.data.weight}}); }
  let wn=0; f.querySelectorAll('[data-sw]').forEach(inp=>{ const name=inp.dataset.sw, wv=num(inp.value), ri=inp.parentElement.querySelector('[data-sr]'), rv=clampInt(ri?ri.value:'',0,200); if(!(wv>0 && wv<1000)) return;
    Store.merge('meta','ex',{list:{[keyOf(name)]:{name, w:String(r1(wv)), r: rv?String(rv):'', muscle:exInfo(name).m||'', at:t}}}); wn++; });
  Store.merge('meta','profile',{setup:t});
  closeModal(); if(S.tab!=='home') S.tab='home'; render(true);
  const T=targets(), bits=[removed?`${_L('убрано примеров: {0}', removed)}`:'', kept?`${_L('оставлено: {0}', kept)}`:'', T?`${_L('норма {0} ккал', nf.format(T.kcal))}`:'', wn?`${_L('весов: {0}', wn)}`:''].filter(Boolean);
  toast(`<b>${_L('Штаб настроен под тебя')}</b>${bits.join(' · ')}`,'big');
};
Object.assign(A, {
  setup(){ openModal('setup'); },
  'setup-later'(){ Store.merge('meta','profile',{setupSnooze:todayStr()}); render(true); },
  'setup-tog'(el){ const on=!el.classList.contains('on'); el.classList.remove('pop'); el.classList.toggle('on',on); el.setAttribute('aria-pressed',String(on)); const row=el.closest('.row'); row.classList.toggle('done',!on); const l=row.querySelector('.st-l'); if(l) l.textContent=on?'оставлю':'уберу'; const ti=row.querySelector('input'); if(ti) ti.disabled=!on; }
});
/* activity-gated sections of «Прогресс» */
const GATE_DAYS = 14;
function activeDays(){ const st=startDate(), t=todayStr(), s=new Set(), add=d=>{ if(typeof d==='string' && d>=st && d<=t) s.add(d); };
  for(const d of S.cols.ev.keys()) add(d); for(const d of S.cols.logs.keys()) add(d); for(const d of S.cols.food.keys()) add(d); D.woDates.forEach(add); for(const x of S.cols.tasks.values()) if(x.done) add(x.date);
  return s.size; }
function gatedProgress(){ const n=activeDays();
  if(n>=GATE_DAYS) return `<div class="sec-h"><h2>${_L('Инсайты')}</h2></div><div class="hud insights">${insights()}</div>
  <div class="sec-h"><h2>${_L('Достижения')}</h2><span class="aside num">${D.ach.size}/${ACH.length}</span></div><div class="ach">${ACH.map(badge).join('')}</div>`;
  const left=GATE_DAYS-n;
  return `<div class="sec-h"><h2>${_L('Инсайты и достижения')}</h2><span class="aside num">${n}/${GATE_DAYS}</span></div><div class="hud pad soon"><p class="dim" style="margin:0 0 12px;font-size:14px;line-height:1.5">${_L('Откроются, когда наберётся {0} дней с отметками — раньше выводы были бы случайными. Осталось {1} {2}: достаточно отметить что-нибудь за день.', GATE_DAYS, left, plural(left,'день','дня','дней'))}</p><div class="soon-bar"><i style="width:${Math.round(n/GATE_DAYS*100)}%"></i></div></div>`; }

/* ================= v10: phone-native layer ================= */
let hapL=null;
function buzz(ms){ try{ if(navigator.vibrate && matchMedia('(pointer:coarse)').matches){ navigator.vibrate(ms||8); return; }
  if(!hapL){ hapL=document.createElement('label'); hapL.setAttribute('aria-hidden','true'); hapL.style.cssText='position:fixed;left:-200px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none'; const i=document.createElement('input'); i.type='checkbox'; i.setAttribute('switch',''); i.tabIndex=-1; hapL.appendChild(i); document.body.appendChild(hapL); }
  hapL.click(); }catch(e){} }
function burst(el){ if(REDUCE()) return; const r0=el && el.getBoundingClientRect(); const r = r0 && r0.width>0 && r0.bottom>0 && r0.top<innerHeight ? r0 : {left:innerWidth/2-80, top:innerHeight/2-80, width:160, height:160};
  const pad=140, w=r.width+pad*2, h=r.height+pad*2, dpr=Math.min(2, devicePixelRatio||1), c=document.createElement('canvas');
  c.width=w*dpr; c.height=h*dpr; c.style.cssText=`position:fixed;left:${r.left-pad}px;top:${r.top-pad}px;width:${w}px;height:${h}px;pointer-events:none;z-index:95`; document.body.appendChild(c);
  const x=c.getContext('2d'); x.scale(dpr,dpr); const cs=getComputedStyle(document.documentElement); const cols=['--ring1','--ring2','--gold','--ring3'].map(v=>cs.getPropertyValue(v).trim()||'#C9A36A').concat(['#FFFFFF']);
  const cx=w/2, cy=h/2, R=Math.min(r.width,r.height)/2, P=[];
  for(let i=0;i<54;i++){ const a=Math.random()*Math.PI*2, sp=2.2+Math.random()*5; P.push({x:cx+Math.cos(a)*R*.7, y:cy+Math.sin(a)*R*.7, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-1.4, s:1.4+Math.random()*2.6, c:cols[i%cols.length], star:Math.random()<.4, rot:Math.random()*3}); }
  const t0=performance.now(), dur=1500;
  const f=t=>{ const k=Math.min(1,(t-t0)/dur); x.clearRect(0,0,w,h);
    for(const p of P){ p.x+=p.vx; p.y+=p.vy; p.vx*=.955; p.vy=p.vy*.955+.11; p.rot+=.08; x.globalAlpha=Math.max(0,1-k*k); x.fillStyle=p.c;
      if(p.star){ const s=p.s*2.2; x.save(); x.translate(p.x,p.y); x.rotate(p.rot); x.beginPath(); for(let j=0;j<8;j++){ const rr=j%2?s*.28:s; const aa=j*Math.PI/4; x.lineTo(Math.cos(aa)*rr, Math.sin(aa)*rr); } x.closePath(); x.fill(); x.restore(); }
      else { x.beginPath(); x.arc(p.x,p.y,p.s,0,Math.PI*2); x.fill(); } }
    if(k<1) requestAnimationFrame(f); else c.remove(); };
  requestAnimationFrame(f); }
function celebrate(){ buzz(30); const core=$('#core'); burst(S.tab==='home' && core ? core : null); if(core){ core.classList.remove('flash'); void core.offsetWidth; core.classList.add('flash'); } }
/* swipe a row: right = done, left = later/skip */
const SWR_OK = ['toggle-task','habit-toggle','med-toggle','habit-fill','habit-inc'];
function swTarget(row){ const b=row.querySelector('[data-swr]') || row.querySelector('button.chk[data-a]'); return b && SWR_OK.includes(b.dataset.a) && !b.disabled ? b : null; }
(function(){ let row=null, R=null, Lx=null, sx=0, sy=0, dx=0, mode=0, bg=null, over=0;
  const TH=76;
  const reset=(r,b)=>{ r.classList.add('sw-rel'); r.style.setProperty('--sx','0px'); if(b) b.style.setProperty('--sw','0px'); setTimeout(()=>{ r.classList.remove('sw-on','sw-rel'); if(b) b.remove(); }, 320); };
  document.addEventListener('touchstart', e=>{ row=null; if(e.touches.length!==1) return; if(matchMedia('(min-width:900px)').matches) return; const r=e.target.closest('.row'); if(!r || !r.closest('#view') || e.target.closest('input,textarea,select')) return;
    R=swTarget(r); Lx=r.dataset.swl||null; if(!R && !Lx) return; row=r; sx=e.touches[0].clientX; sy=e.touches[0].clientY; dx=0; mode=0; over=0; bg=null; }, {passive:true});
  document.addEventListener('touchmove', e=>{ if(!row) return; const t=e.touches[0], mx=t.clientX-sx, my=t.clientY-sy;
    if(mode===0){ if(Math.abs(mx)<9 && Math.abs(my)<9) return; if(Math.abs(my)>=Math.abs(mx)*.8){ row=null; return; } if((mx>0 && !R) || (mx<0 && !Lx)){ row=null; return; } mode=1; row.classList.add('sw-on'); bg=document.createElement('div'); bg.className='sw-bg'; row.appendChild(bg); }
    e.preventDefault();
    let d=mx; if(!R) d=Math.min(0,d); if(!Lx) d=Math.max(0,d); const a=Math.abs(d); if(a>TH+30) d=Math.sign(d)*(TH+30+(a-TH-30)*.25); dx=d;
    row.style.setProperty('--sx', dx+'px'); bg.style.setProperty('--sw', Math.abs(dx)+'px');
    const right=dx>0; bg.classList.toggle('r', right); bg.classList.toggle('l', !right);
    const lbl = right ? (R.dataset.a==='habit-inc' ? (R.dataset.v>1?'+'+R.dataset.v:'+1') : R.classList.contains('on') ? _L('Вернуть') : _L('Готово')) : (row.dataset.swlT||'');
    const html = right ? `${ico(R.dataset.a==='habit-inc'?'plus':'check','sm')}<span>${esc(lbl)}</span>` : `<span>${esc(lbl)}</span>${ico(row.dataset.swl==='habit-skip'?'right':'right','sm')}`;
    if(bg.dataset.h!==html){ bg.innerHTML=html; bg.dataset.h=html; }
    const go=Math.abs(dx)>=TH; if(go!==!!over){ over=go?1:0; bg.classList.toggle('go', go); if(go) buzz(6); } }, {passive:false});
  const end=()=>{ if(!row) return; const r=row, b=bg, d=dx, m=mode; row=null; if(m!==1){ return; } reset(r,b);
    if(Math.abs(d)>=TH){ if(d>0 && R){ R.click(); } else if(d<0 && Lx && A[Lx]){ buzz(10); A[Lx]({dataset:{id:r.dataset.swlId}}); } } };
  document.addEventListener('touchend', end, {passive:true}); document.addEventListener('touchcancel', ()=>{ if(row && mode===1) reset(row,bg); row=null; }, {passive:true});
})();
/* long-press the centre button = quick add */
(function(){ let t=null, fired=false;
  document.addEventListener('touchstart', e=>{ if(!e.target.closest('.core-tab')) return; fired=false; clearTimeout(t); t=setTimeout(()=>{ fired=true; S.lpUntil=Date.now()+900; buzz(18); openModal('quick'); }, 420); }, {passive:true});
  document.addEventListener('touchmove', ()=>clearTimeout(t), {passive:true});
  document.addEventListener('touchend', e=>{ clearTimeout(t); if(fired && e.target.closest('.core-tab')){ e.preventDefault(); fired=false; } }, {passive:false});
  document.addEventListener('contextmenu', e=>{ if(e.target.closest('.core-tab')) e.preventDefault(); });
})();
/* hide the tab bar while typing (phone) */
document.addEventListener('focusin', e=>{ const t=e.target; if(t.matches && t.matches('input:not([type=checkbox]):not([type=radio]):not([type=file]),textarea') && !t.closest('#modal')) document.body.classList.add('kb'); });
document.addEventListener('focusout', ()=>setTimeout(()=>{ const a=document.activeElement; if(!a || !a.matches || !a.matches('input,textarea') || a.closest('#modal')) document.body.classList.remove('kb'); }, 60));
function isLoading(){ return S.mode==='loading' || (S.mode==='live' && S.ready.size<COLS.length); }
const SKEL = n => Array.from({length:n},(_,i)=>`<div class="skel" style="height:${[74,120,58][i%3]}px"></div>`).join('');

/* ================= toast / tooltip ================= */
function toast(html, kind){ const el=document.createElement('div'); el.className='toast '+(kind||''); el.innerHTML=html; $('#toasts').appendChild(el); const life=kind==='big'?3800:2600; setTimeout(()=>{ el.style.transition='opacity .3s'; el.style.opacity='0'; setTimeout(()=>el.remove(),320); }, life); while($('#toasts').children.length>2) $('#toasts').firstChild.remove(); if(kind==='big' && S.tab==='home'){ const c=$('#core'); if(c){ c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash'); } } }
function xpPop(n){ const chip=$('#lvl-chip'); if(!chip) return; const s=document.createElement('span'); s.className='xp-pop'; s.textContent='+'+n+' XP'; chip.appendChild(s); setTimeout(()=>s.remove(),1500); }
const tip=$('#tip');
function showTip(t,e){ const s=t.getAttribute('data-tip'); if(!s){ tip.hidden=true; return; } tip.textContent=DICT ? s.split('\n').map(x=>{ const r=trText(x); return r==null?x:r; }).join('\n') : s; tip.hidden=false; posTip(e); }
function posTip(e){ const w=tip.offsetWidth, h=tip.offsetHeight; let x=e.clientX+12, y=e.clientY-h-10; if(x+w>innerWidth-8) x=e.clientX-w-12; if(x<8) x=8; if(y<8) y=e.clientY+16; tip.style.left=x+'px'; tip.style.top=y+'px'; }

/* ================= events ================= */
function tapSel(el){ const d=el.dataset; let s=`[data-a="${CSS.escape(d.a)}"]`; for(const k of ['id','k','e','s']) if(d[k]!=null) s+=`[data-${k}="${CSS.escape(d[k])}"]`; return s; }
document.addEventListener('click', e=>{ const el=e.target.closest('[data-a]'); if(!el) return; const fn=A[el.dataset.a]; if(!fn) return; if(el.disabled) return; if(el.classList.contains('chk')){ S.tapSel=tapSel(el); buzz(); } fn(el,e); popTap(); });
function popTap(){ if(!S.tapSel) return; S.popSel=S.tapSel; S.popAt=Date.now(); S.tapSel=null; applyPop(); }
function applyPop(){ if(!S.popSel || Date.now()-S.popAt>400 || REDUCE()) return; const n=document.querySelector(S.popSel); if(n && n.classList.contains('on') && !n.classList.contains('pop')) n.classList.add('pop'); }
/* compact header on scroll (phone) */
const TITLES={home:'Сегодня', tasks:'Задачи', habits:'Привычки', food:'Питание', gym:'Зал', progress:'Прогресс'};
function updMini(){ const m=$('#minibar'); if(!m) return; const t = S.tab==='gym'&&S.draft ? 'Тренировка' : TITLES[S.tab]||''; if(m.firstChild && m.firstChild.textContent!==t) m.firstChild.textContent=t; m.classList.toggle('on', window.scrollY>90); }
window.addEventListener('scroll', ()=>{ updMini(); }, {passive:true});
/* swipe between sections (phone) */
(function(){ let sx=0, sy=0, st=0, ok=false;
  document.addEventListener('touchstart', e=>{ if(e.touches.length!==1 || S.modal){ ok=false; return; } const t=e.touches[0]; sx=t.clientX; sy=t.clientY; st=Date.now();
    ok = sx>24 && sx<innerWidth-24 && !e.target.closest('input,textarea,select,.chips,.hm-wrap,.week,.sets,.rest,.f-step,.subnav,.tabbar,.chart,.lib,.days,.seg,.row'); }, {passive:true});
  document.addEventListener('touchend', e=>{ if(!ok) return; ok=false; const t=e.changedTouches[0], dx=t.clientX-sx, dy=t.clientY-sy; if(Date.now()-st>600 || Math.abs(dx)<70 || Math.abs(dy)>45) return; if(matchMedia('(min-width:900px)').matches) return;
    if(S.tab==='gym' && S.draft) return; const i=TAB_ORDER.indexOf(S.tab), j=i+(dx<0?1:-1); if(j<0||j>=TAB_ORDER.length) return; const to=TAB_ORDER[j]; if(to==='tasks'||to==='habits') S.planSub=to; if(to==='gym'||to==='food') S.bodySub=to; go(to); }, {passive:true});
})();
/* drag the sheet down to close (phone) */
(function(){ let y0=0, dy=0, sheet=null;
  document.addEventListener('touchstart', e=>{ const s=e.target.closest('.sheet'); if(!s || matchMedia('(min-width:700px)').matches) return; if(e.target.closest('input,textarea,select,.chips,.log,.food-list,.lib,.icons,.days')) return; if(s.scrollTop>0) return; sheet=s; y0=e.touches[0].clientY; dy=0; }, {passive:true});
  document.addEventListener('touchmove', e=>{ if(!sheet) return; dy=Math.max(0, e.touches[0].clientY-y0); if(sheet.scrollTop>0 && dy<4){ sheet=null; return; } sheet.style.transition='none'; sheet.style.transform=`translateY(${dy}px)`; }, {passive:true});
  document.addEventListener('touchend', ()=>{ if(!sheet) return; const s=sheet; sheet=null; s.style.transition='transform .25s cubic-bezier(.2,.8,.2,1)'; if(dy>110){ s.style.transform=`translateY(100%)`; setTimeout(()=>closeModal(true), 200); } else s.style.transform=''; });
})();
/* keyboard shortcuts (laptop) */
document.addEventListener('keydown', e=>{ const tg=e.target; if(tg && /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)) return;
  if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); openModal('core'); return; }
  if(e.metaKey||e.ctrlKey||e.altKey) return;
  if(e.key==='/'){ e.preventDefault(); openModal('core'); return; }
  const n=parseInt(e.key,10); if(n>=1 && n<=6 && !S.modal){ const to=['home','tasks','habits','food','gym','progress'][n-1]; if(to==='tasks'||to==='habits') S.planSub=to; if(to==='gym'||to==='food') S.bodySub=to; go(to); } });
document.addEventListener('submit', e=>{ const f=e.target.closest('form[data-f]'); if(!f) return; e.preventDefault(); const fn=FORMS[f.dataset.f]; if(fn) fn(f); });
document.addEventListener('input', e=>{ const t=e.target;
  if(t.dataset.wi && S.draft){ const [ei,si,k]=t.dataset.wi.split(':'); const s=S.draft.exercises[+ei]&&S.draft.exercises[+ei].sets[+si]; if(s){ s[k]=t.value.replace(',','.').slice(0,8); if(k==='w') s.auto=false; flushWo(false); } }
  else if(t.id==='food-q' && S.modal){ S.modal.q=t.value; S.modal.pick=null; $('#food-amt').innerHTML=''; $('#food-list').innerHTML=foodListHtml(t.value); }
  else if(t.id==='food-g'){ updCalc(); }
  else if(t.id==='sheet-in'){ t.style.height='auto'; t.style.height=Math.min(140,t.scrollHeight)+'px'; }
  else if(t.dataset.pd && S.modal && S.modal.work){ const [i,k]=t.dataset.pd.split(':'); if(i==='n') S.modal.work.name=t.value; else if(S.modal.work.ex[+i]) S.modal.work.ex[+i][k]=t.value; }
});
document.addEventListener('change', e=>{ const t=e.target;
  if(t.id==='ex-sel'){ S.exSel=t.value; drawCharts($('#view')); }
  else if(t.id==='sheet-file' && t.files && t.files[0]){ S.photo=t.files[0]; try{ S.photoURL=URL.createObjectURL(t.files[0]); }catch(x){ S.photoURL=null; } const p=$('#sheet-photo'); if(p) p.innerHTML=photoChip()||'<div class="photo-chip">Фото прикреплено</div>'; }
  else if(t.id==='fa-file' && t.files && t.files[0] && S.modal){ S.modal.photo=t.files[0]; renderModal(true); } });
document.addEventListener('focusout', e=>{ if(!$('#view').contains(e.target)) return; setTimeout(()=>{ if(dirty && !editingEl()) render(false); }, 320); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && S.modal) closeModal(); if(e.key==='Enter' && !e.shiftKey && !e.isComposing && e.target && e.target.id==='sheet-in'){ e.preventDefault(); const f=e.target.form; if(f) (f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit',{cancelable:true, bubbles:true}))); } });
document.addEventListener('pointerover', e=>{ const t=e.target.closest && e.target.closest('[data-tip]'); if(t) showTip(t,e); else tip.hidden=true; });
document.addEventListener('pointermove', e=>{ if(!tip.hidden) posTip(e); });
document.addEventListener('pointerdown', e=>{ const t=e.target.closest && e.target.closest('[data-tip]'); if(t) showTip(t,e); else tip.hidden=true; });
let rsT=null; window.addEventListener('resize', ()=>{ clearTimeout(rsT); rsT=setTimeout(()=>{ drawCharts($('#view')); drawCharts($('#modal')); },150); });
setInterval(()=>{ if(S.draft){ const s=(Date.now()-Date.parse(S.draft.startedAt))/1000; $$('[data-elapsed]').forEach(n=>n.textContent=fmtClock(s)); } }, 1000);
setInterval(()=>{ if(todayStr()!==S.today){ if(S.selDate===S.today) S.selDate=todayStr(); changed(); } else renderChrome(); }, 60000);
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible'){ if(todayStr()!==S.today) changed(); if(S.draft && !wakeLock) wake(); } });

/* ================= v11: standalone app (PWA) — sync, NOVA key, import/export ================= */
const IS_PWA = !(window.claude && typeof window.claude.use==='function');
if(IS_PWA) document.documentElement.classList.add('pwa');
const AIK_KEY='shtab-ai-key';
function subscribeAll(){ COLS.forEach(col=>{ try{
  db.collection(col).onSnapshot(snap=>{ const m=new Map(); snap.docs.forEach(doc=>{ if(doc.exists) m.set(doc.id, {...doc.data(), id:doc.id}); }); S.cols[col]=m; if(col==='workouts') syncDraft(m); S.ready.add(col); changed(); },
    err=>{ console.warn('subscription', col, err); S.ready.add(col); if(err && (err.code==='revoked'||err.code==='not_granted'||err.code==='permission-denied')) S.mode='revoked'; changed(); });
  }catch(e){ console.warn(e); S.ready.add(col); } }); }
function localSnapshot(){ const raw=lsGet(LS_KEY); if(!raw) return null; try{ return JSON.parse(raw); }catch(e){ return null; } }
/* ================= v12: sync through the user's private GitHub repo ================= */
const GH_KEY='shtab-gh';
const ghCfg = () => { try{ const o=JSON.parse(lsGet(GH_KEY)||'null'); return o && o.token && o.repo ? o : null; }catch(e){ return null; } };
const ghDefaultRepo = () => { const m=location.hostname.match(/^([a-z0-9-]+)\.github\.io$/i); return m ? m[1]+'/shtab-data' : ''; };
const GHAPI = () => lsGet('shtab-gh-api') || 'https://api.github.com';
const SYNC_FILES = COLS.map(c=>`data/${c}.json`);
const EXTRA_FILES = ['push/vapid.json','push/subs.json'];
const SY = {cfg:null, branch:'main', head:null, tree:null, files:{}, remote:{}, extra:{}, queue:[], listeners:{}, etag:null, busy:false, ftimer:null, ptimer:null, last:0, err:null, empty:false, loaded:false};
function ghErr(code, msg){ const e=new Error(msg||code); e.code=code; return e; }
async function ghFetch(path, o={}){ const c=o.cfg||SY.cfg; const h={'Accept':'application/vnd.github+json','Authorization':'Bearer '+c.token,'X-GitHub-Api-Version':'2022-11-28', ...(o.headers||{})};
  let body=o.body; if(body!=null && typeof body!=='string'){ h['Content-Type']='application/json'; body=JSON.stringify(body); }
  try{ return await fetch(GHAPI()+path, {method:o.method||'GET', headers:h, body, cache:'no-store'}); }catch(e){ throw ghErr('network'); } }
async function ghJson(path, o){ const r=await ghFetch(path, o); if(!r.ok) throw await ghHttpErr(r); return r.json(); }
async function ghHttpErr(r){ let m=''; try{ m=(await r.json()).message||''; }catch(e){} const code = r.status===401?'bad_token' : (r.status===403 && r.headers.get('x-ratelimit-remaining')==='0')?'rate' : r.status===403?'forbidden' : r.status===404?'not_found' : r.status===409&&/empty/i.test(m)?'empty' : 'http_'+r.status; const e=ghErr(code, m||('HTTP '+r.status)); e.status=r.status; return e; }
const enc = new TextEncoder(), dec = new TextDecoder();
function b64utf8(b64){ const bin=atob(String(b64).replace(/\s/g,'')); const u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return dec.decode(u); }
function utf8b64(s){ const u=enc.encode(s); let bin=''; for(let i=0;i<u.length;i+=0x8000) bin+=String.fromCharCode.apply(null, u.subarray(i,i+0x8000)); return btoa(bin); }
async function gitSha(s){ const b=enc.encode(s), h=enc.encode(`blob ${b.length}\0`), all=new Uint8Array(h.length+b.length); all.set(h); all.set(b,h.length); const d=await crypto.subtle.digest('SHA-1', all); return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join(''); }
/* local persistence (IndexedDB, falls back to localStorage) */
const KV = { db:null,
  open(){ if(!this.db) this.db=new Promise((res,rej)=>{ try{ const r=indexedDB.open('shtab',1); r.onupgradeneeded=()=>r.result.createObjectStore('kv'); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }catch(e){ rej(e); } }); return this.db; },
  async get(k){ try{ const d=await this.open(); return await new Promise((res,rej)=>{ const q=d.transaction('kv').objectStore('kv').get(k); q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error); }); }catch(e){ try{ return JSON.parse(localStorage.getItem('kv:'+k)||'null'); }catch(x){ return null; } } },
  async set(k,v){ try{ const d=await this.open(); await new Promise((res,rej)=>{ const tx=d.transaction('kv','readwrite'); tx.objectStore('kv').put(v,k); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); }); }catch(e){ try{ localStorage.setItem('kv:'+k, JSON.stringify(v)); }catch(x){} } } };
let sySaveT=null;
function sySave(now){ clearTimeout(sySaveT); const f=()=>KV.set('sync', {repo:SY.cfg&&SY.cfg.repo, branch:SY.branch, head:SY.head, tree:SY.tree, files:SY.files, remote:SY.remote, extra:SY.extra, queue:SY.queue, last:SY.last}); if(now) return f(); sySaveT=setTimeout(f, 300); }
async function syLoad(){ const o=await KV.get('sync'); if(o && o.repo===SY.cfg.repo){ Object.assign(SY, {branch:o.branch||'main', head:o.head, tree:o.tree, files:o.files||{}, remote:o.remote||{}, extra:o.extra||{}, queue:o.queue||[], last:o.last||0}); SY.loaded=true; } }
/* the view the app sees: remote docs + queued local ops */
function applyOp(docs, o){ if(o.op==='delete') delete docs[o.id]; else if(o.op==='set') docs[o.id] = (o.fresh && docs[o.id]) ? deepMerge(docs[o.id], o.data||{}) : clone(o.data); else docs[o.id]=deepMerge(docs[o.id]||{}, o.data||{}); }
function syView(col){ const docs=clone(SY.remote[col]||{}); for(const o of SY.queue) if(o.col===col) applyOp(docs,o); return docs; }
function syEmit(cols){ for(const col of cols){ const v=syView(col); const snap={docs:Object.entries(v).map(([id,d])=>({id, exists:true, data:()=>d}))}; (SY.listeners[col]||[]).forEach(cb=>{ try{ cb(snap); }catch(e){ console.warn(e); } }); } }
const ghDb = {
  collection:col=>({ onSnapshot(cb){ (SY.listeners[col] ||= []).push(cb); setTimeout(()=>syEmit([col]),0); return ()=>{ SY.listeners[col]=(SY.listeners[col]||[]).filter(x=>x!==cb); }; } }),
  doc:path=>{ const i=path.indexOf('/'), col=path.slice(0,i), id=path.slice(i+1); const q=o=>{ SY.queue.push({...o, col, id, t:Date.now()}); sySave(); syFlushSoon(); return Promise.resolve(); };
    const known=()=> (SY.remote[col]||{})[id]!==undefined || SY.queue.some(o=>o.col===col && o.id===id && o.op!=='delete');
    return { set:b=>q({op:'set', data:b, fresh:!known()}), update:p=>q({op:'update', data:p}), delete:()=>q({op:'delete'}) }; } };
/* pull: cheap ETag check of the branch, then only changed files */
async function syPull(){
  const r=await ghFetch(`/repos/${SY.cfg.repo}/git/ref/heads/${SY.branch}`, {headers: SY.etag?{'If-None-Match':SY.etag}:{}});
  if(r.status===304) return false;
  if(r.status===404 || r.status===409){ SY.empty=true; SY.head=null; SY.tree=null; return false; }
  if(!r.ok) throw await ghHttpErr(r);
  SY.etag=r.headers.get('ETag'); const sha=(await r.json()).object.sha; SY.empty=false;
  if(sha===SY.head) return false;
  const cm=await ghJson(`/repos/${SY.cfg.repo}/git/commits/${sha}`); const tr=await ghJson(`/repos/${SY.cfg.repo}/git/trees/${cm.tree.sha}?recursive=1`);
  const changed=new Set();
  for(const e of (tr.tree||[])){ if(e.type!=='blob') continue; const isData=SYNC_FILES.includes(e.path), isExtra=EXTRA_FILES.includes(e.path); if(!isData && !isExtra) continue; if(SY.files[e.path]===e.sha) continue;
    const b=await ghJson(`/repos/${SY.cfg.repo}/git/blobs/${e.sha}`); let v={}; try{ v=JSON.parse(b64utf8(b.content)); }catch(x){ console.warn('bad json', e.path); }
    if(isData){ const col=e.path.slice(5,-5); SY.remote[col]=v; changed.add(col); } else SY.extra[e.path]=v;
    SY.files[e.path]=e.sha; }
  SY.head=sha; SY.tree=cm.tree.sha; SY.last=Date.now(); sySave();
  if(changed.size) syEmit([...changed]);
  return true; }
/* commit several files atomically; build() is re-run after a rebase */
async function syCommit(build, message){
  for(let attempt=0; attempt<5; attempt++){
    if(!SY.head && !SY.empty) await syPull();
    if(SY.empty){ const r=await ghFetch(`/repos/${SY.cfg.repo}/contents/README.md`, {method:'PUT', body:{message:'init', content:utf8b64('# Штаб — данные\n\nЗдесь приложение хранит твои задачи, привычки и прочее. Не удаляй этот репозиторий.\n'), branch:SY.branch}});
      if(!r.ok && r.status!==422) throw await ghHttpErr(r); SY.empty=false; SY.etag=null; await syPull(); continue; }
    const files=build(); const paths=Object.keys(files); if(!paths.length) return true;
    const t=await ghJson(`/repos/${SY.cfg.repo}/git/trees`, {method:'POST', body:{base_tree:SY.tree, tree:paths.map(p=>({path:p, mode:'100644', type:'blob', content:files[p]}))}});
    const c=await ghJson(`/repos/${SY.cfg.repo}/git/commits`, {method:'POST', body:{message:message||'sync', tree:t.sha, parents:[SY.head]}});
    const r=await ghFetch(`/repos/${SY.cfg.repo}/git/refs/heads/${SY.branch}`, {method:'PATCH', body:{sha:c.sha, force:false}});
    if(r.ok){ for(const p of paths){ SY.files[p]=await gitSha(files[p]); const v=JSON.parse(files[p]); if(p.startsWith('data/')) SY.remote[p.slice(5,-5)]=v; else SY.extra[p]=v; } SY.head=c.sha; SY.tree=t.sha; SY.etag=null; SY.last=Date.now(); return true; }
    if(r.status===422 || r.status===409){ SY.etag=null; await syPull(); continue; }
    throw await ghHttpErr(r); }
  throw ghErr('conflict'); }
function syFlushSoon(ms){ clearTimeout(SY.ftimer); SY.ftimer=setTimeout(syFlush, ms==null?1200:ms); }
async function syFlush(){
  if(SY.busy || !SY.queue.length) return; if(!navigator.onLine){ syStatus(); return; }
  SY.busy=true; const ops=SY.queue.slice();
  try{
    await syCommit(()=>{ const cols=[...new Set(ops.map(o=>o.col))], out={}; for(const col of cols){ const docs=clone(SY.remote[col]||{}); for(const o of ops) if(o.col===col) applyOp(docs,o); out[`data/${col}.json`]=JSON.stringify(docs); } return out; }, 'sync '+new Date().toISOString().slice(0,16));
    SY.queue.splice(0, ops.length); SY.err=null; sySave(true);
    const cols=[...new Set(ops.map(o=>o.col))]; syEmit(cols);
  }catch(e){ SY.err=e; console.warn('sync push', e); if(e.code==='bad_token') syTokenBad(); }
  finally{ SY.busy=false; syStatus(); if(SY.queue.length) syFlushSoon(SY.err?15000:800); } }
async function syTick(){ if(!SY.cfg || document.visibilityState==='hidden' || !navigator.onLine) return; try{ if(SY.queue.length && !SY.busy) await syFlush(); else if(!SY.busy) await syPull(); SY.err=null; }catch(e){ SY.err=e; if(e.code==='bad_token') syTokenBad(); } syStatus(); }
function syTokenBad(){ if(S.tokenWarned) return; S.tokenWarned=true; toast(_L('Токен GitHub не работает — обнови его в настройках.'),'bad'); }
function syStatus(){ const n=$('#sync'), m=$('#sync2'); const cls = !SY.cfg ? 'local' : SY.err ? 'err' : SY.queue.length ? 'pending' : 'live'; [n,m].forEach(x=>{ if(x) x.className='sync '+cls; }); const l=$('#sync-lbl'); if(l && SY.cfg) l.textContent = SY.err ? _L('нет связи') : SY.queue.length ? _L('сохраняю…') : _L('синхронизация'); if(S.modal && S.modal.type==='settings'){ const st=$('#sy-state'); if(st) st.textContent=syStateText(); } }
function syStateText(){ if(!SY.cfg) return ''; if(SY.err) return SY.err.code==='bad_token' ? _L('Токен не подходит или истёк') : SY.err.code==='network' ? _L('Нет интернета — изменения сохранятся позже') : _L('Ошибка: {0}', SY.err.message); const t=SY.last ? new Date(SY.last).toTimeString().slice(0,5) : '—'; return SY.queue.length ? _L('Сохраняю изменения: {0}', SY.queue.length) : _L('Всё сохранено · {0}', t); }
function pairDecode(v){ const m=String(v||'').match(/shtab1:([A-Za-z0-9_-]+)/); if(!m) return null; try{ let b=m[1].replace(/-/g,'+').replace(/_/g,'/'); while(b.length%4) b+='='; const o=JSON.parse(b64utf8(b)); return o && o.t && o.r ? o : null; }catch(e){ return null; } }
function pairEncode(){ return 'shtab1:'+utf8b64(JSON.stringify({r:SY.cfg.repo, t:SY.cfg.token, k:aiKey()})).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
async function pwaConnect(){
  const hp=(location.hash||'').match(/pair=(shtab1:[A-Za-z0-9_-]+)/);
  if(hp){ try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){} const o=pairDecode(hp[1]);
    if(o){ startLocal(); if(o.k) lsSet(AIK_KEY, o.k); try{ await syConnect(o.t, o.r); }catch(e){ toast(esc((e&&e.message)||_L('Не получилось подключиться')),'bad'); return; } location.reload(); return; } }
  const cfg=ghCfg(); if(!cfg){ startLocal(); return; }
  SY.cfg=cfg; SY.branch=cfg.branch||'main'; await syLoad();
  COLS.forEach(c=>{ S.cols[c]=new Map(); }); S.ready=new Set(); baseline=null; db=ghDb; S.mode='live';
  if(SY.loaded){ subscribeAll(); changed(); }
  try{ await syPull(); }catch(e){ SY.err=e; if(e.code==='bad_token') syTokenBad(); }
  if(!SY.loaded){ SY.loaded=true; subscribeAll(); }
  changed(); syStatus(); if(SY.queue.length) syFlushSoon(200);
  clearInterval(SY.ptimer); SY.ptimer=setInterval(syTick, 20000);
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') syTick(); });
  window.addEventListener('online', ()=>syTick()); window.addEventListener('focus', ()=>syTick());
  if(IS_PWA) pushSyncTz(); }
/* connect from settings: check access, then upload this device's data if the repo is new */
async function syConnect(token, repo){
  token=String(token||'').trim(); repo=String(repo||'').trim().replace(/^https?:\/\/github\.com\//,'').replace(/\.git$/,'').replace(/\/$/,'');
  if(!token) throw ghErr('need_token', _L('Вставь токен GitHub')); if(!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw ghErr('need_repo', _L('Укажи репозиторий в виде логин/shtab-data'));
  const cfg={token, repo};
  const r=await ghFetch(`/repos/${repo}`, {cfg}); if(r.status===401) throw ghErr('bad_token', _L('Токен не подходит — проверь, что скопировал его целиком'));
  if(r.status===404) throw ghErr('not_found', _L('Не вижу репозиторий {0}: проверь имя и что токену дан доступ к нему', repo)); if(!r.ok) throw await ghHttpErr(r);
  const info=await r.json(); if(info.permissions && info.permissions.push===false) throw ghErr('forbidden', _L('У токена нет права записи: Contents → Read and write'));
  if(info.private===false) toast(_L('Внимание: репозиторий {0} публичный — сделай его приватным в настройках GitHub.', repo),'bad');
  SY.cfg={...cfg, branch:info.default_branch||'main'}; SY.branch=SY.cfg.branch; SY.head=null; SY.tree=null; SY.files={}; SY.remote={}; SY.extra={}; SY.queue=[]; SY.etag=null;
  await syPull();
  const hasData = Object.values(SY.remote).some(v=>v && Object.keys(v).length);
  let uploaded=0;
  if(!hasData){ const loc=localSnapshot(); const src=loc || Object.fromEntries(COLS.map(c=>[c, Object.fromEntries([...S.cols[c]].map(([k,v])=>[k,strip(v)]))]));
    for(const c of COLS) for(const [id,v] of Object.entries(src[c]||{})){ if(!v || typeof v!=='object') continue; const b=clone(v); delete b.id; SY.queue.push({op:'set', col:c, id, data:b, t:Date.now()}); uploaded++; }
    if(uploaded) await syCommit(()=>{ const out={}; for(const col of COLS){ const docs=clone(SY.remote[col]||{}); for(const o of SY.queue) if(o.col===col) applyOp(docs,o); out[`data/${col}.json`]=JSON.stringify(docs); } return out; }, 'first upload');
    SY.queue=[]; }
  else { try{ const loc=localSnapshot(); if(loc) lsSet('shtab-before-sync', JSON.stringify(loc)); }catch(e){} }
  lsSet(GH_KEY, JSON.stringify(SY.cfg)); await sySave(true);
  return {uploaded, hasData}; }
/* ================= v12: push reminders (sent by GitHub Actions from the public repo) ================= */
const PUSH_DEF = {morning:'08:50', meds:true, evening:'21:45'};
const pushPrefs = () => ({...PUSH_DEF, ...((P().push)||{})});
const isStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone===true;
const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
function b64u(bytes){ let s=''; const u=new Uint8Array(bytes); for(let i=0;i<u.length;i++) s+=String.fromCharCode(u[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function unb64u(s){ s=String(s).replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4) s+='='; const b=atob(s), u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return u; }
async function genVapid(){ const kp=await crypto.subtle.generateKey({name:'ECDSA', namedCurve:'P-256'}, true, ['sign','verify']); const jwk=await crypto.subtle.exportKey('jwk', kp.privateKey); const raw=await crypto.subtle.exportKey('raw', kp.publicKey);
  return {publicKey:b64u(raw), jwk:{kty:'EC', crv:'P-256', d:jwk.d, x:jwk.x, y:jwk.y}, subject:location.origin.startsWith('http')?location.origin:'mailto:shtab@users.noreply.github.com', created:new Date().toISOString()}; }
async function pushState(){ if(!pushSupported()) return 'unsupported'; if(Notification.permission==='denied') return 'denied'; try{ const reg=await navigator.serviceWorker.getRegistration(); const sub=reg && await reg.pushManager.getSubscription(); return sub ? 'on' : 'off'; }catch(e){ return 'off'; } }
async function pushEnable(){
  if(!SY.cfg){ toast(_L('Сначала подключи синхронизацию с GitHub — через неё приходят напоминания.'),'bad'); return; }
  if(isIOS() && !isStandalone()){ toast(_L('На iPhone уведомления работают, когда Штаб открыт с экрана «Домой».'),'bad'); return; }
  if(!pushSupported()){ toast(_L('Этот браузер не поддерживает уведомления.'),'bad'); return; }
  const perm=await Notification.requestPermission(); if(perm!=='granted'){ toast(_L('Уведомления запрещены — разреши их в настройках телефона.'),'bad'); return; }
  try{
    const reg=await navigator.serviceWorker.ready;
    if(!SY.extra['push/vapid.json']) { try{ await syPull(); }catch(e){} }
    let vapid=SY.extra['push/vapid.json'];
    if(!vapid || !vapid.publicKey){ vapid=await genVapid(); await syCommit(()=>({'push/vapid.json':JSON.stringify(vapid,null,1)}), 'push keys'); }
    let sub=await reg.pushManager.getSubscription();
    if(sub && sub.options && sub.options.applicationServerKey && b64u(sub.options.applicationServerKey)!==vapid.publicKey){ try{ await sub.unsubscribe(); }catch(e){} sub=null; }
    if(!sub) sub=await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:unb64u(vapid.publicKey)});
    const j=sub.toJSON(); const id=(await gitSha(j.endpoint)).slice(0,16);
    await syCommit(()=>{ const subs={...(SY.extra['push/subs.json']||{})}; subs[id]={endpoint:j.endpoint, keys:j.keys, device:(isIOS()?'iPhone':/Mac/.test(navigator.userAgent)?'Mac':'device'), at:new Date().toISOString()}; return {'push/subs.json':JSON.stringify(subs,null,1)}; }, 'push subscribe');
    Store.merge('meta','profile',{push:pushPrefs(), tz:Intl.DateTimeFormat().resolvedOptions().timeZone});
    try{ await reg.showNotification(_L('Штаб'), {body:_L('Уведомления включены. Первое напоминание придёт по расписанию.'), icon:'icons/icon-192.png', tag:'shtab-test'}); }catch(e){}
    toast(_L('Уведомления включены')); if(S.modal && S.modal.type==='settings') renderModal(true);
  }catch(e){ console.warn(e); toast(_L('Не получилось включить уведомления: {0}', esc((e&&e.message)||'')),'bad'); } }
async function pushDisable(){ try{ const reg=await navigator.serviceWorker.getRegistration(); const sub=reg && await reg.pushManager.getSubscription(); if(sub){ const id=(await gitSha(sub.endpoint)).slice(0,16); await sub.unsubscribe(); if(SY.cfg) await syCommit(()=>{ const subs={...(SY.extra['push/subs.json']||{})}; delete subs[id]; return {'push/subs.json':JSON.stringify(subs,null,1)}; }, 'push unsubscribe'); } }catch(e){ console.warn(e); } toast(_L('Уведомления на этом устройстве выключены')); if(S.modal) renderModal(true); }
function pushSyncTz(){ setTimeout(()=>{ try{ const tz=Intl.DateTimeFormat().resolvedOptions().timeZone; if(tz && P().tz!==tz && S.ready.size===COLS.length) Store.merge('meta','profile',{tz}); }catch(e){} }, 4000); }

/* NOVA through the Anthropic API (own key, stays on this device) */
const aiKey = () => (lsGet(AIK_KEY)||'').trim();
async function imgBlock(file){ const url=URL.createObjectURL(file); try{ const im=await new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=url; });
  const k=Math.min(1, 1568/Math.max(im.naturalWidth, im.naturalHeight)); const c=document.createElement('canvas'); c.width=Math.round(im.naturalWidth*k); c.height=Math.round(im.naturalHeight*k); c.getContext('2d').drawImage(im,0,0,c.width,c.height);
  const data=c.toDataURL('image/jpeg',.85).split(',')[1]; return {type:'image', source:{type:'base64', media_type:'image/jpeg', data}}; } finally{ URL.revokeObjectURL(url); } }
function apiErr(code, msg, text){ const e=new Error(msg||code); e.code=code; if(text) e.text=text; return e; }
function apiSample(key){
  const MODEL={quick:'claude-haiku-4-5-20251001', default:'claude-sonnet-5'};
  const call=async (body, signal)=>{ let r; try{ r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST', signal, headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'}, body:JSON.stringify(body)}); }
    catch(e){ if(e && e.name==='AbortError') throw apiErr('cancelled'); throw apiErr('network', _L('Нет связи с API Anthropic. Проверь интернет (из РФ нужен VPN).')); }
    if(!r.ok){ let j=null; try{ j=await r.json(); }catch(e){} const m=(j&&j.error&&j.error.message)||('HTTP '+r.status);
      throw apiErr(r.status===401?'bad_key':r.status===403?'forbidden':r.status===429?'rate_limited':r.status===413?'prompt_too_large':r.status===529?'overloaded':'api_error', r.status===401?_L('Ключ API не подходит — проверь его в настройках.'):m); }
    return r.json(); };
  const s=async (turns, o={})=>{
    const msgs=[]; for(const t of turns){ const last=msgs[msgs.length-1]; const c=typeof t.content==='string'?[{type:'text', text:t.content}]:t.content; if(last && last.role===t.role) last.content=last.content.concat(c); else msgs.push({role:t.role, content:c.slice()}); }
    if(o.images && o.images.length){ const lu=[...msgs].reverse().find(m=>m.role==='user'); if(lu){ const blocks=await Promise.all(o.images.map(imgBlock)); lu.content=blocks.concat(lu.content); } }
    const tools=(o.tools||[]).map(t=>({name:t.name, description:t.description, input_schema:t.inputSchema}));
    const model=MODEL[o.modelTier]||MODEL.quick; let text='';
    for(let i=0;i<8;i++){ if(o.signal && o.signal.aborted) throw apiErr('cancelled','',text);
      const j=await call({model, max_tokens:o.modelTier==='default'?2000:1200, messages:msgs, ...(tools.length?{tools}:{})}, o.signal);
      const t=(j.content||[]).filter(c=>c.type==='text').map(c=>c.text).join('').trim(); if(t){ text=t; if(o.onText) o.onText({text}); }
      if(j.stop_reason!=='tool_use') return {text, truncated:j.stop_reason==='max_tokens'};
      msgs.push({role:'assistant', content:j.content}); const res=[];
      for(const c of j.content.filter(c=>c.type==='tool_use')){ const tool=(o.tools||[]).find(x=>x.name===c.name); let out, bad=false;
        try{ out=tool ? await tool.execute(c.input||{}, {}) : 'unknown tool'; }catch(e){ out=String((e&&e.message)||e); bad=true; }
        res.push({type:'tool_result', tool_use_id:c.id, content: typeof out==='string'?out:JSON.stringify(out??{ok:true}), ...(bad?{is_error:true}:{})}); }
      msgs.push({role:'user', content:res}); }
    return {text};
  };
  s.json=async (prompt, o={})=>{ const r=await s([{role:'user', content:prompt}], {modelTier:o.modelTier, images:o.images, signal:o.signal}); const m=String(r.text||'').match(/[\[{][\s\S]*[\]}]/); return JSON.parse(m?m[0]:r.text); };
  s.limits=async ()=>({tools:true, images:true});
  return s; }
function pwaAI(){ const k=aiKey(); if(!k){ sample=null; S.aiOff=_L('NOVA в приложении работает с твоим ключом Anthropic API — добавь его в настройках.'); renderHero(); return; }
  sample=apiSample(k); sTools=true; sImages=true; S.aiOff=null; S.toolsBroken=false; renderHero(); }
/* files: export and import */
function saveFile(name, txt){ const blob=new Blob([txt],{type:'application/json'});
  try{ const file=new File([blob], name, {type:'application/json'}); if(navigator.canShare && navigator.canShare({files:[file]})){ navigator.share({files:[file], title:name}).catch(()=>{}); return; } }catch(e){}
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
async function importFile(file){ let o=null; try{ o=JSON.parse(await file.text()); }catch(e){ toast(_L('Это не файл копии Штаба.'),'bad'); return; }
  if(!o || typeof o!=='object' || !COLS.some(c=>o[c] && typeof o[c]==='object')){ toast(_L('Это не файл копии Штаба.'),'bad'); return; }
  try{ const cur={}; COLS.forEach(c=>{ cur[c]=Object.fromEntries([...S.cols[c]].map(([k,v])=>[k,strip(v)])); }); lsSet('shtab-before-import', JSON.stringify(cur)); }catch(e){}
  let n=0; for(const c of COLS){ const inc=o[c]||{}; for(const id of [...S.cols[c].keys()]) if(!(id in inc)) Store.del(c, id); for(const [id,v] of Object.entries(inc)){ if(!v || typeof v!=='object') continue; const b=clone(v); delete b.id; Store.set(c, id, b); n++; } }
  closeModal(); render(true); toast(`<b>${_L('Копия загружена')}</b>${_L('записей: {0}', n)}`,'big'); }
/* ================= v12: settings for the standalone app ================= */
function appSettingsHtml(){ const k=aiKey(), pp=pushPrefs();
  const sync = !SY.cfg
    ? `<small>${_L('Подключи свой приватный репозиторий на GitHub — телефон и ноутбук будут видеть одно и то же, а GitHub сможет присылать напоминания.')}</small>
       <input class="inp" id="gh-token" type="password" autocomplete="off" placeholder="${_L('Код подключения или github_pat_…')}" data-notr="1" aria-label="${_L('Токен GitHub')}">
       <input class="inp" id="gh-repo" autocomplete="off" value="${esc(ghDefaultRepo())}" placeholder="login/shtab-data" data-notr="1" aria-label="${_L('Репозиторий с данными')}">
       <div class="btns"><button class="btn sm pri" type="button" data-a="gh-connect">${_L('Подключить')}</button><button class="btn sm ghost" type="button" data-a="gh-help">${_L('Где взять токен')}</button></div>`
    : `<small><span data-notr="1">${esc(SY.cfg.repo)}</span> · <span id="sy-state">${esc(syStateText())}</span></small>
       <div class="btns"><button class="btn sm pri" type="button" data-a="gh-pair-copy">${ico('copy','sm')}${_L('Код для телефона')}</button><button class="btn sm" type="button" data-a="gh-sync">${ico('check','sm')}${_L('Синхронизировать')}</button><button class="btn sm ghost" type="button" data-a="gh-off" data-confirm="${_L('Отключить синхронизацию на этом устройстве?')}">${_L('Отключить')}</button></div>`;
  const push = `<div class="fld"><span>${_L('Напоминания')}</span><small id="push-state">${_L('Проверяю…')}</small>
    <div class="g3"><label class="fld"><span>${_L('Утро')}</span><input class="inp" id="pp-m" type="time" value="${esc(pp.morning||'')}"></label><label class="fld"><span>${_L('Вечер')}</span><input class="inp" id="pp-e" type="time" value="${esc(pp.evening||'')}"></label><label class="switch" style="align-self:end"><span>${_L('Таблетки')}</span><input type="checkbox" id="pp-meds" ${pp.meds?'checked':''}></label></div>
    <div class="btns" id="push-btns"></div></div>`;
  return `<div class="fld"><span>${_L('Синхронизация')}</span>${sync}</div>${push}
  <div class="fld"><span>NOVA</span><small>${k?_L('Ключ сохранён на этом устройстве.'):_L('Вставь ключ Anthropic API (console.anthropic.com → API Keys). Он хранится только на этом устройстве, оплата — по использованию.')} ${_L('Из России NOVA работает только с включённым VPN.')}</small><div class="addbar" style="margin:0"><input class="inp" id="ai-key" type="password" autocomplete="off" placeholder="${k?'••••••••'+esc(k.slice(-4)):'sk-ant-…'}" data-notr="1"><button class="btn sm" type="button" data-a="ai-key-save">${_L('Сохранить')}</button></div>${k?`<div class="btns"><button class="btn sm ghost" type="button" data-a="ai-key-test">${_L('Проверить ключ')}</button><button class="btn sm ghost" type="button" data-a="ai-key-del">${_L('Удалить ключ')}</button></div>`:''}</div>`; }
async function refreshPushUi(){ const st=$('#push-state'), bt=$('#push-btns'); if(!st || !bt) return; const s=await pushState();
  const txt = !SY.cfg ? _L('Работают после подключения синхронизации.') : s==='unsupported' ? (isIOS() ? _L('На iPhone: открой Штаб с экрана «Домой», тогда появятся уведомления.') : _L('Этот браузер не поддерживает уведомления.')) : s==='denied' ? _L('Уведомления запрещены в настройках телефона.') : s==='on' ? _L('Включены на этом устройстве. Приходят примерно в указанное время (GitHub может задержать на 5–15 минут).') : (isIOS() && !isStandalone()) ? _L('На iPhone: открой Штаб с экрана «Домой», тогда их можно включить.') : _L('Выключены на этом устройстве.');
  st.textContent=txt; bt.innerHTML = !SY.cfg || s==='unsupported' ? '' : s==='on' ? `<button class="btn sm ghost" type="button" data-a="push-off">${_L('Выключить здесь')}</button>` : `<button class="btn sm pri" type="button" data-a="push-on">${ico('bell','sm')}${_L('Включить уведомления')}</button>`; }
MODALS.ghhelp = function(){ const owner=(ghDefaultRepo().split('/')[0])||'login';
  return `<h3>${_L('Синхронизация за 3 минуты')}</h3><ol class="steps">
  <li>${_L('Открой на ноутбуке github.com → аватар → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.')}</li>
  <li>${_L('Token name: shtab. Expiration: самый долгий срок.')}</li>
  <li>${_L('Repository access → Only select repositories → {0}/shtab-data.', esc(owner))}</li>
  <li>${_L('Permissions → Repository permissions → Contents → Read and write.')}</li>
  <li>${_L('Generate token → скопируй (начинается с github_pat_) и вставь в Штаб на ноутбуке и на телефоне. На iPhone удобно: скопировал на Mac — вставил на телефоне.')}</li>
  <li>${_L('Для напоминаний: репозиторий {0}/shtab → Settings → Secrets and variables → Actions → New repository secret. Name: DATA_TOKEN, Secret: тот же токен.', esc(owner))}</li></ol>
  <div class="btns"><a class="btn sm" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">${_L('Открыть GitHub')}</a><button class="btn sm pri" type="button" data-a="settings">${_L('Назад в настройки')}</button></div>`; };
Object.assign(A, {
  'gh-help'(){ openModal('ghhelp'); },
  async 'gh-connect'(el){ let t=($('#gh-token')||{}).value, r=($('#gh-repo')||{}).value; const pc=pairDecode(t); if(pc){ t=pc.t; r=pc.r; if(pc.k) lsSet(AIK_KEY, pc.k); } el.disabled=true; const old=el.innerHTML; el.textContent=_L('Подключаю…');
    try{ const res=await syConnect(t, r); toast(res.hasData ? `<b>${_L('Синхронизация включена')}</b>${_L('Загружаю данные из репозитория…')}` : `<b>${_L('Синхронизация включена')}</b>${_L('Данные этого устройства сохранены в репозиторий: {0}', res.uploaded)}`,'big'); setTimeout(()=>location.reload(), 900); }
    catch(e){ toast(esc((e&&e.message)||_L('Не получилось подключиться')),'bad'); el.disabled=false; el.innerHTML=old; } },
  async 'gh-sync'(){ try{ if(SY.queue.length) await syFlush(); await syPull(); toast(_L('Синхронизировано')); }catch(e){ toast(esc(syStateText()||e.message),'bad'); } syStatus(); },
  'gh-off'(el){ if(!armed(el)) return; try{ localStorage.removeItem(GH_KEY); }catch(e){} KV.set('sync', null).then(()=>location.reload()); },
  'gh-pair-copy'(){ const code=pairEncode(); const done=()=>toast(`<b>${_L('Код скопирован')}</b>${_L('На iPhone открой Штаб → Настройки → Синхронизация и вставь код в первое поле.')}`,'big');
    try{ navigator.clipboard.writeText(code).then(done, ()=>{ toast(_L('Не получилось скопировать — разреши доступ к буферу обмена.'),'bad'); }); }catch(e){ toast(_L('Не получилось скопировать — разреши доступ к буферу обмена.'),'bad'); } },
  'push-on'(){ pushEnable(); },
  'push-off'(){ pushDisable(); }
});
document.addEventListener('change', e=>{ const t=e.target; if(!['pp-m','pp-e','pp-meds'].includes(t.id)) return; const m=validTime(($('#pp-m')||{}).value)||'', ev=validTime(($('#pp-e')||{}).value)||'', md=!!($('#pp-meds')||{}).checked; Store.merge('meta','profile',{push:{morning:m, evening:ev, meds:md}}); toast(_L('Напоминания обновлены')); });
Object.assign(A, {
  'ai-key-save'(){ const v=(($('#ai-key')||{}).value||'').trim(); if(!/^sk-ant-/.test(v)){ toast(_L('Ключ начинается с sk-ant-'),'bad'); return; } lsSet(AIK_KEY, v); pwaAI(); toast(_L('Ключ сохранён')); renderModal(true); },
  'ai-key-del'(){ try{ localStorage.removeItem(AIK_KEY); }catch(e){} pwaAI(); renderModal(true); },
  async 'ai-key-test'(){ if(!sample){ pwaAI(); } try{ const r=await sample([{role:'user', content:'Ответь одним словом: ок'}],{modelTier:'quick'}); toast(`<b>${_L('Ключ работает')}</b>NOVA: ${esc(String(r.text||'').slice(0,40))}`,'big'); }catch(e){ toast(esc((e&&e.message)||_L('Не получилось')),'bad'); } },
  'import-pick'(){ const i=$('#imp-file'); if(i) i.click(); }
});
document.addEventListener('change', e=>{ const t=e.target; if(t.id==='imp-file' && t.files && t.files[0]){ importFile(t.files[0]); t.value=''; } });

/* ================= boot ================= */
function startLocal(){
  S.mode='local';
  let loaded=false; const raw=lsGet(LS_KEY);
  if(raw){ try{ const o=JSON.parse(raw); COLS.forEach(c=>{ S.cols[c]=new Map(Object.entries(o[c]||{}).map(([k,v])=>[k,{...v,id:k}])); }); loaded=true; }catch(e){} }
  if(!loaded && STARTER){ const t=todayStr(); COLS.forEach(c=>{ const src=STARTER[c]||{}; S.cols[c]=new Map(Object.entries(src).map(([k,v])=>{ const o=clone(v); if('since' in o) o.since=t; if(c==='tasks') o.date=t; return [k,{...o,id:k}]; })); }); const pr=S.cols.meta.get('profile'); if(pr) pr.start=t; }
  COLS.forEach(c=>S.ready.add(c)); syncDraft(S.cols.workouts); changed();
}
async function connect(){
  if(IS_PWA){ pwaConnect(); return; }
  const c=window.claude;
  if(!c || typeof c.use!=='function'){ startLocal(); return; }
  let d=null; try{ d=await c.use('db'); }catch(e){ d=null; }
  if(!d){ startLocal(); return; }
  db=d; S.mode='live'; changed();
  COLS.forEach(col=>{
    try{
      db.collection(col).onSnapshot(snap=>{ const m=new Map(); snap.docs.forEach(doc=>{ if(doc.exists) m.set(doc.id, {...doc.data(), id:doc.id}); }); S.cols[col]=m; if(col==='workouts') syncDraft(m); S.ready.add(col); changed(); },
        err=>{ console.warn('subscription', col, err); S.ready.add(col); if(err && (err.code==='revoked'||err.code==='not_granted')) S.mode='revoked'; changed(); });
    }catch(e){ console.warn(e); S.ready.add(col); }
  });
}
function init(){
  { const u=uiLoad(); applyTheme(u.theme, u.pal); }
  { const f=()=>{ if((S.previewTheme||curTheme())==='auto'){ themeFade(); renderChrome(); } }; try{ new MutationObserver(f).observe(document.documentElement,{attributes:true, attributeFilter:['data-theme']}); }catch(e){} }
  if(DARKQ){ const f=()=>{ if((S.previewTheme||curTheme())==='auto'){ themeFade(); renderChrome(); } }; if(DARKQ.addEventListener) DARKQ.addEventListener('change', f); else if(DARKQ.addListener) DARKQ.addListener(f); }
  const TABS={home:['home','Сегодня'], plan:['tasks','План'], body:['gym','Тело'], tasks:['tasks','Задачи'], habits:['habits','Привычки'], food:['food','Питание'], gym:['gym','Зал'], progress:['stats','Прогресс']};
  $$('.tab').forEach(b=>{ const t=TABS[b.dataset.tab]; if(!t) return; b.innerHTML=ico(t[0])+'<span>'+t[1]+'</span>'; });
  $('#gear').innerHTML=ico('gear'); const mb=$('#minibar'); if(mb) mb.innerHTML='<span></span>'; const rc=$('#rail-cmd'); if(rc) rc.innerHTML=ico('spark','sm')+'<span>Команда</span>';
  $('#lvl-chip').innerHTML='<span class="rk" id="lv-rk">E</span><span id="lv-t">УР 1</span><span class="bar"><i id="lv-bar"></i></span>';
  const h=(location.hash||'').slice(1); if(VIEWS[h]) S.tab=h;
  derive(); render(true);
  connect(); initAI();
}
init();
})();
