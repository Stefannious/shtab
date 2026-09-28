const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const APP='http://localhost:8765/';
(async()=>{
  const b=await chromium.launch(); const errs=[];
  const ctx=await b.newContext({viewport:{width:390,height:844}, hasTouch:true, isMobile:true});
  await ctx.addInitScript(()=>{ window.__nat=[]; let perm='notDetermined';
    window.webkit={messageHandlers:{shtab:{postMessage(m){ window.__nat.push(JSON.parse(JSON.stringify(m)));
      if(m.cmd==='notif.status') return Promise.resolve(perm);
      if(m.cmd==='notif.request'){ perm='granted'; return Promise.resolve(perm); }
      if(m.cmd==='notif.set') return Promise.resolve(m.items.length);
      return Promise.resolve(true); }}}}; });
  const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('console: '+m.text()); });
  await p.goto(APP); await p.waitForTimeout(6500);
  const r=await p.evaluate(()=>({native: document.documentElement.classList.contains('native'), cmds: window.__nat.map(m=>m.cmd), theme: window.__nat.find(m=>m.cmd==='theme'), set: (window.__nat.filter(m=>m.cmd==='notif.set').pop()||{}).items}));
  console.log('native class', r.native, '\ncmds', r.cmds.join(','), '\ntheme', JSON.stringify(r.theme));
  console.log('scheduled', (r.set||[]).length); (r.set||[]).slice(0,8).forEach(i=>console.log('  ', i.date, i.time, '|', i.title, '|', i.body));
  // settings UI
  await p.click('#gear'); await p.waitForTimeout(800);
  console.log('push-state:', await p.textContent('#push-state'), '| btn:', await p.textContent('#push-btns'));
  await p.screenshot({path:'/home/claude/shtab/n_native_settings.png'});
  // toggle off
  await p.click('[data-a="push-off"]'); await p.waitForTimeout(600);
  console.log('after off:', await p.textContent('#push-state'), '| last cmd:', await p.evaluate(()=>window.__nat.slice(-1)[0].cmd));
  await p.click('[data-a="push-on"]'); await p.waitForTimeout(3500);
  console.log('after on:', await p.textContent('#push-state'), '| sets:', await p.evaluate(()=>window.__nat.filter(m=>m.cmd==='notif.set').length));
  // theme switch -> dark
  await p.evaluate(()=>{ window.__nat.length=0; }); 
  const darkBtn=await p.$('[data-a="theme"][data-v="dark"], [data-theme-set="dark"]'); if(darkBtn){ await darkBtn.click(); await p.waitForTimeout(600); }
  console.log('theme after dark click:', JSON.stringify(await p.evaluate(()=>window.__nat.filter(m=>m.cmd==='theme'))));
  console.log(errs.join('\n')||'no errors'); await b.close();
})();
