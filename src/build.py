import json, os, re
seed=json.load(open('seed.json'))
starter={c:seed.get(c,{}) for c in ['tasks','habits','meds','logs','workouts','meta']}
i18n={}
for lang in ['en','uk','es','de']:
    p=f'i18n/{lang}.json'
    if os.path.exists(p):
        d=json.load(open(p))
        # merge extra hand-made keys if present
        px=f'i18n/{lang}.extra.json'
        if os.path.exists(px): d.update(json.load(open(px)))
        i18n[lang]={k:v for k,v in d.items() if isinstance(v,str) and v}
if os.environ.get('PSEUDO'):
    keys=json.load(open('i18n/keys.json'))
    def ps(k,ctx):
        if k.startswith('#'): return 'žž|žžž'
        return re.sub(r'[А-Яа-яЁё]','ž',k)
    i18n['xx']={k:ps(k,c) for k,c in keys.items()}
js=open('app.js').read().replace('/*STARTER*/null', json.dumps(starter, ensure_ascii=False)).replace('/*I18N*/{}', json.dumps(i18n, ensure_ascii=False, separators=(',',':')))
html=open('head.html').read()+'\n<script>\n'+js+'\n</script>\n'
open('shtab.html','w').write(html)
open('preview.html','w').write('<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'+html+'</body></html>')
print(len(html), 'langs:', list(i18n))

# ---------- standalone app (PWA) ----------
import hashlib, shutil
ver = hashlib.sha1(html.encode()).hexdigest()[:10]
splash = open('pwa_splash_links.html').read()
pwa_head = f'''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Штаб">
<meta name="application-name" content="Штаб">
<meta name="theme-color" content="#F4EEE4">
<meta name="color-scheme" content="light dark">
<meta name="format-detection" content="telephone=no">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" type="image/png" href="icons/favicon-32.png">
{splash}
</head>
<body>
'''
sw_reg = "<script>if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost')) addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));</script>\n"
open('pwa/index.html','w').write(pwa_head + open('head.html').read() + '\n<script>\n' + js + '\n</script>\n' + sw_reg + '</body>\n</html>\n')
manifest = {
  "name": "Штаб", "short_name": "Штаб", "description": "Задачи, привычки, таблетки, питание и зал — с ассистентом NOVA",
  "id": "./", "start_url": "./", "scope": "./", "display": "standalone", "orientation": "portrait",
  "background_color": "#F4EEE4", "theme_color": "#F4EEE4", "lang": "ru", "categories": ["health", "productivity", "fitness"],
  "icons": [
    {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
    {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
    {"src": "icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
  ]
}
json.dump(manifest, open('pwa/manifest.webmanifest','w'), ensure_ascii=False, indent=1)
sw = open('sw.template.js').read().replace('__VER__', ver)
open('pwa/sw.js','w').write(sw)
open('pwa/.nojekyll','w').write('')
print('pwa', ver, os.path.getsize('pwa/index.html'))
