const sharp=require('/home/claude/.npm-global/lib/node_modules/sharp'); const fs=require('fs');
function art(W,H,scale,opt={}){ // scale: orb radius relative to min side
  const cx=W/2, cy=H/2, m=Math.min(W,H), R=m*scale, ring=R*1.28, tick=R*1.43;
  const C=2*Math.PI*ring, arc=C*0.72;
  let ticks=''; for(let i=0;i<60;i++){ const a=i/60*Math.PI*2-Math.PI/2, big=i%5===0, r1=tick-(big?R*.07:R*.035), r2=tick; ticks+=`<line x1="${cx+Math.cos(a)*r1}" y1="${cy+Math.sin(a)*r1}" x2="${cx+Math.cos(a)*r2}" y2="${cy+Math.sin(a)*r2}" stroke="#3C2C1C" stroke-opacity="${big?.42:.2}" stroke-width="${big?R*.022:R*.012}" stroke-linecap="round"/>`; }
  const lv=cy+R*0.22; // liquid level
  const wave=`M ${cx-R*1.2} ${lv} C ${cx-R*.6} ${lv-R*.09}, ${cx-R*.2} ${lv+R*.09}, ${cx+R*.3} ${lv} S ${cx+R*.9} ${lv-R*.08}, ${cx+R*1.2} ${lv} L ${cx+R*1.2} ${cy+R*1.3} L ${cx-R*1.2} ${cy+R*1.3} Z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FAF6EF"/><stop offset=".6" stop-color="#F2EADD"/><stop offset="1" stop-color="#EADFCC"/></linearGradient>
<radialGradient id="glow" cx="50%" cy="38%" r="60%"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".9"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
<radialGradient id="pearl" cx="${cx-R*.36}" cy="${cy-R*.48}" r="${R*1.55}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".2" stop-color="#FBF6EE"/><stop offset=".52" stop-color="#EFE2CE"/><stop offset=".78" stop-color="#DCC4A2"/><stop offset="1" stop-color="#C4A177"/></radialGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EAD7B3"/><stop offset=".5" stop-color="#C29A5F"/><stop offset="1" stop-color="#8A6436"/></linearGradient>
<linearGradient id="liq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ECD4A6"/><stop offset=".5" stop-color="#C0985E"/></linearGradient>
<radialGradient id="hi" cx="${cx-R*.32}" cy="${cy-R*.42}" r="${R*.5}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
<clipPath id="orbc"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>
<filter id="sh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${R*.12}"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="${opt.dark?'#141210':'url(#bg)'}"/>
${opt.dark?'':`<rect width="${W}" height="${H}" fill="url(#glow)"/>`}
${opt.bezel===false?'':ticks}
<circle cx="${cx}" cy="${cy}" r="${ring}" fill="none" stroke="#3C2C1C" stroke-opacity=".07" stroke-width="${R*.03}"/>
<circle cx="${cx}" cy="${cy}" r="${ring}" fill="none" stroke="url(#gold)" stroke-width="${R*.055}" stroke-linecap="round" stroke-dasharray="${arc} ${C}" transform="rotate(-90 ${cx} ${cy})"/>
<ellipse cx="${cx}" cy="${cy+R*.78}" rx="${R*.78}" ry="${R*.2}" fill="#78542A" opacity=".28" filter="url(#sh)"/>
<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#pearl)"/>
<g clip-path="url(#orbc)"><path d="${wave}" fill="url(#liq)" opacity=".62"/></g>
<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#hi)"/>
</svg>`; }
(async()=>{
  const out='/home/claude/shtab/pwa/';
  const master=await sharp(Buffer.from(art(1024,1024,.3))).png().toBuffer();
  fs.writeFileSync(out+'icons/master.png', master);
  for(const [n,s] of [['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512],['favicon-32.png',32]]) await sharp(master).resize(s,s).png({compressionLevel:9}).toFile(out+'icons/'+n);
  await sharp(Buffer.from(art(1024,1024,.24))).resize(512,512).png({compressionLevel:9}).toFile(out+'icons/maskable-512.png');
  const splash=[[1320,2868,440,956,3],[1206,2622,402,874,3],[1290,2796,430,932,3],[1179,2556,393,852,3],[1284,2778,428,926,3],[1170,2532,390,844,3],[1125,2436,375,812,3],[1242,2688,414,896,3],[828,1792,414,896,2],[750,1334,375,667,2]];
  const links=[];
  for(const [w,h,dw,dh,r] of splash){ const f=`splash/splash-${w}x${h}.png`; await sharp(Buffer.from(art(w,h,.17))).png({compressionLevel:9, palette:false}).toFile(out+f);
    links.push(`<link rel="apple-touch-startup-image" media="(device-width: ${dw}px) and (device-height: ${dh}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)" href="${f}">`); }
  fs.writeFileSync('/home/claude/shtab/pwa_splash_links.html', links.join('\n'));
  fs.unlinkSync(out+'icons/master.png');
  console.log('done');
})();
