const sharp=require('/home/claude/.npm-global/lib/node_modules/sharp'); const fs=require('fs');
const src=fs.readFileSync(__dirname+'/gen_icons.js','utf8'); const artSrc=src.slice(src.indexOf('function art('), src.indexOf('(async()=>{'));
const art=new Function(artSrc+'; return art;')();
const A='/home/claude/shtab-site/ios/Shtab/Assets.xcassets/';
const w=(p,o)=>{ fs.mkdirSync(require('path').dirname(A+p),{recursive:true}); fs.writeFileSync(A+p, JSON.stringify(o,null,2)); };
(async()=>{
  w('Contents.json',{info:{author:'xcode',version:1}});
  // app icon: light + dark, 1024, no alpha
  const light=await sharp(Buffer.from(art(1024,1024,.3))).flatten({background:'#F4EEE4'}).removeAlpha().png().toBuffer();
  const dark=await sharp(Buffer.from(art(1024,1024,.3,{dark:true}))).flatten({background:'#141210'}).removeAlpha().png().toBuffer();
  fs.mkdirSync(A+'AppIcon.appiconset',{recursive:true});
  fs.writeFileSync(A+'AppIcon.appiconset/AppIcon.png', light); fs.writeFileSync(A+'AppIcon.appiconset/AppIcon-dark.png', dark);
  w('AppIcon.appiconset/Contents.json',{images:[{filename:'AppIcon.png',idiom:'universal',platform:'ios',size:'1024x1024'},{appearances:[{appearance:'luminosity',value:'dark'}],filename:'AppIcon-dark.png',idiom:'universal',platform:'ios',size:'1024x1024'}],info:{author:'xcode',version:1}});
  // launch background: same as the app's --bg (porcelain light / dark)
  const col=(r,g,b)=>({'color-space':'srgb',components:{alpha:'1.000',red:'0x'+r,green:'0x'+g,blue:'0x'+b}});
  w('LaunchBackground.colorset/Contents.json',{colors:[{idiom:'universal',color:col('F4','EE','E4')},{appearances:[{appearance:'luminosity',value:'dark'}],idiom:'universal',color:col('14','12','10')}],info:{author:'xcode',version:1}});
  // launch logo: the orb on a transparent background, 120pt
  const orbSvg=o=>art(360,360,.3,o).replace(/<rect [^>]*\/>\n?/g,'');
  fs.mkdirSync(A+'LaunchLogo.imageset',{recursive:true});
  const imgs=[];
  for(const [sfx,px] of [['',120],['@2x',240],['@3x',360]]){
    await sharp(Buffer.from(orbSvg({}))).resize(px,px).png().toFile(A+`LaunchLogo.imageset/LaunchLogo${sfx}.png`);
    imgs.push({filename:`LaunchLogo${sfx}.png`, idiom:'universal', scale:(sfx?sfx.slice(1):'1x')});
  }
  w('LaunchLogo.imageset/Contents.json',{images:imgs,info:{author:'xcode',version:1}});
  await sharp(light).resize(256,256).toFile('/home/claude/shtab/ios_icon_preview.png');
  await sharp(dark).resize(256,256).toFile('/home/claude/shtab/ios_icon_dark_preview.png');
  console.log('assets ok');
})();
