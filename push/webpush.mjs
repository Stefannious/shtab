// Dependency-free Web Push: RFC 8291 (aes128gcm) payload encryption + RFC 8292 VAPID.
import crypto from 'node:crypto';
const b64u = b => Buffer.from(b).toString('base64url');
const unb64u = s => Buffer.from(String(s), 'base64url');
const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest();

export function encrypt(payload, p256dh, auth, opts = {}) {
  const uaPublic = unb64u(p256dh), authSecret = unb64u(auth);
  const ecdh = crypto.createECDH('prime256v1');
  if (opts.senderPrivate) ecdh.setPrivateKey(unb64u(opts.senderPrivate)); else ecdh.generateKeys();
  const asPublic = ecdh.getPublicKey();
  const shared = ecdh.computeSecret(uaPublic);
  const salt = opts.salt ? unb64u(opts.salt) : crypto.randomBytes(16);
  const prkKey = hmac(authSecret, shared);
  const keyInfo = Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic]);
  const ikm = hmac(prkKey, Buffer.concat([keyInfo, Buffer.from([1])])).subarray(0, 32);
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.from('Content-Encoding: aes128gcm\0\x01')).subarray(0, 16);
  const nonce = hmac(prk, Buffer.from('Content-Encoding: nonce\0\x01')).subarray(0, 12);
  const plain = Buffer.concat([Buffer.from(payload), Buffer.from([2])]);
  const c = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const ct = Buffer.concat([c.update(plain), c.final(), c.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPublic.length]), asPublic, ct]);
}

export function vapidJwt(endpoint, vapid, now = Math.floor(Date.now() / 1000)) {
  const aud = new URL(endpoint).origin;
  const header = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const body = b64u(JSON.stringify({ aud, exp: now + 12 * 3600, sub: vapid.subject || 'mailto:shtab@users.noreply.github.com' }));
  const key = crypto.createPrivateKey({ key: { kty: 'EC', crv: 'P-256', d: vapid.jwk.d, x: vapid.jwk.x, y: vapid.jwk.y }, format: 'jwk' });
  const sig = crypto.sign('sha256', Buffer.from(header + '.' + body), { key, dsaEncoding: 'ieee-p1363' });
  return header + '.' + body + '.' + b64u(sig);
}

export async function send(sub, payload, vapid, { ttl = 3 * 3600, urgency = 'high', topic } = {}) {
  const body = encrypt(typeof payload === 'string' ? payload : JSON.stringify(payload), sub.keys.p256dh, sub.keys.auth);
  const headers = { 'Content-Type': 'application/octet-stream', 'Content-Encoding': 'aes128gcm', TTL: String(ttl), Urgency: urgency,
    Authorization: `vapid t=${vapidJwt(sub.endpoint, vapid)}, k=${vapid.publicKey}` };
  if (topic) headers.Topic = topic.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32);
  const r = await fetch(sub.endpoint, { method: 'POST', headers, body });
  return { status: r.status, ok: r.ok, text: r.ok ? '' : (await r.text()).slice(0, 200) };
}
