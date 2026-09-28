// Wrap Cyrillic text runs inside template literals with _L('pattern', ...args)
const fs=require('fs'); const acorn=require('/opt/node-tools/node_modules/acorn'); const walk=require('/opt/node-tools/node_modules/acorn-walk');
const src=fs.readFileSync(process.argv[2],'utf8'); const out=process.argv[3];
const ast=acorn.parse(src,{ecmaVersion:'latest', sourceType:'script', locations:false});
const CYR=/[А-Яа-яЁё]/;
const EXCL_FN=new Set(['contextText','rules','mkTools','histRange','logWorkoutTool','briefing','logDiag','aiCall']);
const EXCL_KEY=new Set(['ask-sheet','ai-plan']);
const EXCL_CALL=new Set(['ask','sample','console.warn','console.log','logDiag','Error']);
const TR_ATTRS=new Set(['placeholder','aria-label','title','data-tip','data-confirm','alt']);
const MARKUP=/^(ico|gly|habitIco|ringSvg|segHtml|daysHtml|delBtn|stat|badge|taskRow|habitRow|doseRow)\(/;
function calleeName(c){ if(!c) return ''; if(c.type==='Identifier') return c.name; if(c.type==='MemberExpression') return calleeName(c.object)+'.'+(c.property.name||c.property.value); return ''; }
function keyName(k){ return k ? (k.name ?? k.value) : ''; }
function excluded(anc){
  for(const a of anc){
    if(a.type==='FunctionDeclaration' && a.id && EXCL_FN.has(a.id.name)) return true;
    if((a.type==='Property'||a.type==='MethodDefinition') && EXCL_KEY.has(keyName(a.key))) return true;
    if((a.type==='CallExpression'||a.type==='NewExpression') && EXCL_CALL.has(calleeName(a.callee))) return true;
    if(a.type==='CallExpression' && calleeName(a.callee)==='sample.json') return true;
    if(a.type==='TaggedTemplateExpression') return true;
  }
  return false;
}
const edits=[]; const patterns=new Map();
function isLetterish(ch){ return /[A-Za-zА-Яа-яЁё0-9«(!?"']/.test(ch); }
function handle(node){
  // units: {t:'txt', s, e, text} | {t:'exp', node}
  const units=[];
  node.quasis.forEach((q,i)=>{ const raw=q.value.raw; for(let k=0;k<raw.length;k++) units.push({t:'ch', ch:raw[k], pos:q.start+k}); if(i<node.expressions.length) units.push({t:'exp', node:node.expressions[i]}); });
  // scan states
  let state='TEXT', quote='', attr='', run=[], runKind='text';
  const runs=[];
  const flush=()=>{ if(run.length) runs.push({kind:runKind, attr, units:run}); run=[]; };
  for(let i=0;i<units.length;i++){ const u=units[i];
    if(state==='TEXT'){
      if(u.t==='ch' && u.ch==='<'){ const nx=units[i+1]; if(nx && nx.t==='ch' && /[A-Za-z\/!]/.test(nx.ch)){ flush(); state='TAG'; continue; } }
      runKind='text'; run.push(u); continue; }
    if(state==='TAG'){
      if(u.t==='ch' && u.ch==='>'){ state='TEXT'; runKind='text'; attr=''; continue; }
      if(u.t==='ch' && (u.ch==='"'||u.ch==="'")){ // find attr name before '='
        let j=i-1; while(j>=0 && units[j].t==='ch' && /\s/.test(units[j].ch)) j--; let nm='';
        if(j>=0 && units[j].t==='ch' && units[j].ch==='='){ j--; while(j>=0 && units[j].t==='ch' && /[\w-]/.test(units[j].ch)){ nm=units[j].ch+nm; j--; } }
        state='ATTR'; quote=u.ch; attr=nm; runKind='attr'; run=[]; continue; }
      continue; }
    if(state==='ATTR'){
      if(u.t==='ch' && u.ch===quote){ if(TR_ATTRS.has(attr)) flush(); else run=[]; state='TAG'; attr=''; continue; }
      run.push(u); continue; }
  }
  if(state==='TEXT') flush();
  for(const r of runs) processRun(r, node);
}
function isMarkupExp(n){ const s=src.slice(n.start,n.end); return MARKUP.test(s); }
function processRun(r){
  const us=r.units; const sig=u=> u.t==='exp' ? !isMarkupExp(u.node) : !/\s/.test(u.ch) && u.ch!=='·';
  let a=0; while(a<us.length && !sig(us[a])) a++; let b=us.length-1; while(b>=0 && !sig(us[b])) b--;
  if(a>b) return; const core=us.slice(a,b+1);
  if(!core.some(u=>u.t==='ch' && CYR.test(u.ch))) return;
  if(core.some(u=>u.t==='ch' && (u.ch==='{'||u.ch==='}'||u.ch==='\`'))) return;
  // build key
  let key=''; const exps=[]; for(const u of core){ if(u.t==='exp'){ key+='{'+exps.length+'}'; exps.push(u.node); } else key+=u.ch; }
  key=key.replace(/\s*\n\s*/g,' ');
  const lit="'"+key.replace(/\\(?![n'`$\\])/g,'\\\\').replace(/'/g,"\\'")+"'";
  let cooked; try{ cooked=eval(lit); }catch(e){ console.error('bad key', key); return; }
  patterns.set(cooked,(patterns.get(cooked)||0)+1);
  // positions
  const first=core[0], last=core[core.length-1];
  const dollarBefore=n=>{ let p=n.start-1; while(/\s/.test(src[p])) p--; if(src[p]!=='{'||src[p-1]!=='$') throw new Error('no ${ at '+n.start); return p-1; };
  const braceAfter=n=>{ let p=n.end; while(/\s/.test(src[p])) p++; if(src[p]!=='}') throw new Error('no } at '+n.end+' '+src.slice(n.end,n.end+20)); return p+1; };
  const cs = first.t==='exp' ? dollarBefore(first.node) : first.pos;
  const ce = last.t==='exp' ? braceAfter(last.node) : last.pos+1;
  if(!exps.length){ edits.push([cs,ce,'${_L('+lit+')}']); return; }
  edits.push([cs, exps[0].start, '${_L('+lit+', ']);
  for(let i=0;i+1<exps.length;i++) edits.push([exps[i].end, exps[i+1].start, ', ']);
  edits.push([exps[exps.length-1].end, ce, ')}']);
}
walk.ancestor(ast,{ TemplateLiteral(node, anc){ if(excluded(anc)) return; handle(node); } });
edits.sort((x,y)=>x[0]-y[0]); for(let i=1;i<edits.length;i++) if(edits[i][0]<edits[i-1][1]) throw new Error('overlap '+JSON.stringify([edits[i-1],edits[i]]));
let res=src; for(let i=edits.length-1;i>=0;i--){ const [s,e,t]=edits[i]; res=res.slice(0,s)+t+res.slice(e); }
fs.writeFileSync(out,res); fs.writeFileSync(process.argv[4], JSON.stringify([...patterns.keys()],null,1));
console.log('edits',edits.length,'patterns',patterns.size);
