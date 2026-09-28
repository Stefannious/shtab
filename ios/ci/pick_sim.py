# prints the UDID of an available iPhone simulator on the newest iOS runtime
import json, re, subprocess
d = json.loads(subprocess.check_output(['xcrun', 'simctl', 'list', 'devices', 'available', '-j']))['devices']
best = None
for rt, devs in d.items():
    m = re.search(r'iOS-(\d+)-(\d+)', rt)
    if not m:
        continue
    v = (int(m.group(1)), int(m.group(2)))
    for x in devs:
        if x.get('isAvailable', True) and re.match(r'^iPhone \d+( Pro)?$', x['name']):
            if best is None or v > best[0]:
                best = (v, x['udid'], x['name'])
print(best[1])
