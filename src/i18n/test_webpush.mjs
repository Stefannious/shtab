import { encrypt, vapidJwt } from '../../push/webpush.mjs';
import crypto from 'node:crypto';
// RFC 8291 Appendix A test vector
const v = {
  plaintext: 'When I grow up, I want to be a watermelon',
  auth: 'BTBZMqHH6r4Tts7J_aSIgg',
  uaPublic: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
  asPrivate: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
  salt: 'DGv6ra1nlYgDCS1FRnbzlw',
  expected: 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN'
};
const out = encrypt(v.plaintext, v.uaPublic, v.auth, { senderPrivate: v.asPrivate, salt: v.salt }).toString('base64url');
console.log('RFC8291 vector match:', out === v.expected);
if (out !== v.expected) { console.log(out); console.log(v.expected); }
// VAPID JWT: sign with a WebCrypto-generated key (as the app does), verify with WebCrypto
const kp = await crypto.webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const jwk = await crypto.webcrypto.subtle.exportKey('jwk', kp.privateKey);
const raw = Buffer.from(await crypto.webcrypto.subtle.exportKey('raw', kp.publicKey)).toString('base64url');
const vapid = { publicKey: raw, jwk: { kty: 'EC', crv: 'P-256', d: jwk.d, x: jwk.x, y: jwk.y }, subject: 'https://stefannious.github.io' };
const t = vapidJwt('https://web.push.apple.com/abc', vapid);
const [h, b, s] = t.split('.');
const ok = await crypto.webcrypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, kp.publicKey, Buffer.from(s, 'base64url'), Buffer.from(h + '.' + b));
console.log('VAPID JWT verifies:', ok, JSON.parse(Buffer.from(b, 'base64url')).aud);
