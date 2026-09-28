const fs=require('fs'); const acorn=require('/opt/node-tools/node_modules/acorn'); const walk=require('/opt/node-tools/node_modules/acorn-walk');
const src=fs.readFileSync('/home/claude/shtab/app.js','utf8');
const ast=acorn.parse(src,{ecmaVersion:'latest'});
const CYR=/[А-Яа-яЁё]/;
const EXCL_FN=new Set(['contextText','rules','mkTools','histRange','logWorkoutTool','briefing','logDiag','aiCall']);
const EXCL_KEY=new Set(['ask-sheet','ai-plan','q','description']);
const EXCL_CALL=new Set(['ask','sample','console.warn','console.log','logDiag','Error','plural','sample.json']);
function calleeName(c){ if(!c) return ''; if(c.type==='Identifier') return c.name; if(c.type==='MemberExpression') return calleeName(c.object)+'.'+(c.property.name||c.property.value); return ''; }
function keyName(k){ return k ? (k.name ?? k.value) : ''; }
function excluded(anc, node){
  for(let i=0;i<anc.length;i++){ const a=anc[i];
    if(a.type==='FunctionDeclaration' && a.id && EXCL_FN.has(a.id.name)) return true;
    if(a.type==='VariableDeclarator' && a.id && ['LANGS','LANG_AI'].includes(a.id.name)) return true;
    if((a.type==='Property'||a.type==='MethodDefinition') && EXCL_KEY.has(keyName(a.key)) && a.value && anc.includes(a.value)) return true;
    if((a.type==='CallExpression'||a.type==='NewExpression') && EXCL_CALL.has(calleeName(a.callee))) return true;
  }
  return false;
}
const keys=new Map(); const plur=new Map();
const add=(k,ctx)=>{ k=k.replace(/\s+/g,' ').trim(); if(!k || !CYR.test(k) || k.length<2) return; if(!keys.has(k)) keys.set(k,ctx||''); };
function addLit(v){ if(v.includes('<')){ v.replace(/<[^>]*>/g, m=>{ m.replace(/(placeholder|aria-label|title)="([^"]*)"/g,(x,a,b)=>{ add(b); return x; }); return '\u0000'; }).split('\u0000').forEach(t=>add(t)); } else add(v); }
walk.ancestor(ast,{
  Literal(node, anc){ if(typeof node.value!=='string' || !CYR.test(node.value)) return; const par=anc[anc.length-2]; if(par && par.type==='CallExpression' && calleeName(par.callee)==='_L' && par.arguments[0]===node){ if(!keys.has(node.value)) keys.set(node.value,'pattern'); return; } if(excluded(anc,node)) return; addLit(node.value); },
  TemplateLiteral(node, anc){ if(excluded(anc,node)) return; node.quasis.forEach(q=>{ /* static templates without expressions not wrapped? */ }); },
  CallExpression(node, anc){ if(calleeName(node.callee)==='plural' && node.arguments.length===4 && node.arguments.slice(1).every(a=>a.type==='Literal')){ const f=node.arguments.slice(1).map(a=>a.value); plur.set('#'+f[0], f.join('|')); } }
});
const pats=JSON.parse(fs.readFileSync('/home/claude/shtab/i18n/patterns.json','utf8'));
pats.forEach(p=>{ if(!keys.has(p)) keys.set(p,'pattern'); });
// seed
const seed=JSON.parse(fs.readFileSync('/home/claude/shtab/seed.json','utf8'));
(function rec(o){ if(typeof o==='string'){ add(o,'seed'); return; } if(Array.isArray(o)) return o.forEach(rec); if(o && typeof o==='object') Object.entries(o).forEach(([k,v])=>{ if(['id','date','createdAt','since','start','time','times','icon','link','area'].includes(k)) return; rec(v); }); })(seed);
// head.html
const head=fs.readFileSync('/home/claude/shtab/head.html','utf8').replace(/<style>[\s\S]*?<\/style>/,'');
head.replace(/>([^<]+)</g,(m,t)=>{ add(t,'head'); return m; }); head.replace(/(placeholder|aria-label|title)="([^"]*)"/g,(m,a,b)=>{ add(b,'head'); return m; });
const out={}; for(const [k,c] of keys) out[k]=c; for(const [k,f] of plur) out[k]='plural:'+f;
fs.writeFileSync('/home/claude/shtab/i18n/keys.json', JSON.stringify(out,null,1));
console.log('keys', keys.size, 'plurals', plur.size, 'chars', [...keys.keys()].join('').length);
