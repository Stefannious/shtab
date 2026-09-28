// usage: node validate.js <lang>   — checks i18n/<lang>.json against keys.json
const fs=require('fs'); const lang=process.argv[2];
const keys=JSON.parse(fs.readFileSync(__dirname+'/keys.json','utf8'));
let tr; try{ tr=JSON.parse(fs.readFileSync(__dirname+'/'+lang+'.json','utf8')); }catch(e){ console.log('JSON ERROR', e.message); process.exit(1); }
const errs=[]; let missing=0;
for(const [k,ctx] of Object.entries(keys)){
  const v=tr[k]; if(v==null || v===''){ missing++; if(missing<=15) errs.push('MISSING: '+JSON.stringify(k)); continue; }
  if(typeof v!=='string'){ errs.push('NOT STRING: '+k); continue; }
  const ph=s=>(s.match(/\{\d+\}/g)||[]).sort().join(',');
  if(ph(k)!==ph(v)) errs.push('PLACEHOLDERS: '+JSON.stringify(k)+' => '+JSON.stringify(v));
  if(/[<>"]/.test(v)) errs.push('FORBIDDEN CHAR (< > "): '+JSON.stringify(v));
  if(k.startsWith('#')){ const n=v.split('|').length, want=lang==='uk'?3:2; if(n!==want) errs.push(`PLURAL needs ${want} forms: ${k} => ${v}`); }
  if(lang!=='uk' && /[А-Яа-яЁё]/.test(v) && !/Штаб/.test(v)) errs.push('CYRILLIC LEFT: '+JSON.stringify(k)+' => '+JSON.stringify(v));
}
const extra=Object.keys(tr).filter(k=>!(k in keys)); if(extra.length) errs.push('EXTRA KEYS (not in keys.json): '+extra.length+' e.g. '+JSON.stringify(extra.slice(0,3)));
console.log(`${lang}: ${Object.keys(keys).length} keys, missing ${missing}, problems ${errs.length-Math.min(missing,15)}`); errs.slice(0,60).forEach(e=>console.log(' - '+e));
process.exit(errs.length?1:0);
