// Minimal in-memory GitHub REST mock (git data + contents APIs) for testing sync.
import http from 'node:http'; import crypto from 'node:crypto';
const TOKEN = process.env.TOKEN || 'github_pat_test';
const repos = {}; // "o/r" -> {ref, commits, trees, blobs, calls}
const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');
const blobSha = (c) => { const b = Buffer.from(c, 'utf8'); return sha1(Buffer.concat([Buffer.from(`blob ${b.length}\0`), b])); };
function repo(k) { return repos[k] ||= { ref: null, commits: {}, trees: {}, blobs: {}, calls: 0, patches: 0, conflicts: 0 }; }
function putTree(R, files) { const s = sha1(JSON.stringify(files) + Math.random()); R.trees[s] = files; return s; }
function commit(R, tree, parents, message) { const s = sha1(tree + parents.join() + message + Math.random()); R.commits[s] = { tree, parents, message }; return s; }
const srv = http.createServer(async (q, res) => {
  const send = (st, obj, h = {}) => { res.writeHead(st, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'ETag', ...h }); res.end(obj == null ? '' : JSON.stringify(obj)); };
  if (q.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE', 'Access-Control-Allow-Headers': 'Authorization,Content-Type,If-None-Match,X-GitHub-Api-Version,Accept', 'Access-Control-Max-Age': '600' }); return res.end(); }
  let body = ''; for await (const ch of q) body += ch; const B = body ? JSON.parse(body) : {};
  const u = new URL(q.url, 'http://x'); const p = u.pathname.split('/').filter(Boolean);
  if (u.pathname === '/__state') { return send(200, Object.fromEntries(Object.entries(repos).map(([k, R]) => [k, { calls: R.calls, patches: R.patches, conflicts: R.conflicts, files: R.ref ? Object.fromEntries(Object.entries(R.trees[R.commits[R.ref].tree]).map(([f, s]) => [f, f.endsWith('.json') ? JSON.parse(R.blobs[s] || 'null') : R.blobs[s]])) : null }]))); }
  if ((q.headers.authorization || '') !== 'Bearer ' + TOKEN) return send(401, { message: 'Bad credentials' });
  if (p[0] !== 'repos') return send(404, { message: 'Not Found' });
  const R = repo(p[1] + '/' + p[2]); R.calls++; const rest = p.slice(3);
  if (!rest.length) return send(200, { full_name: p[1] + '/' + p[2], private: true, default_branch: 'main', permissions: { push: true } });
  if (rest[0] === 'git') {
    if (rest[1] === 'ref' && q.method === 'GET') { if (!R.ref) return send(409, { message: 'Git Repository is empty.' }); const et = `W/"${R.ref}"`; if (q.headers['if-none-match'] === et) return send(304, null, { ETag: et }); return send(200, { ref: 'refs/heads/main', object: { sha: R.ref, type: 'commit' } }, { ETag: et }); }
    if (rest[1] === 'commits' && q.method === 'GET') { const c = R.commits[rest[2]]; return c ? send(200, { sha: rest[2], tree: { sha: c.tree }, parents: c.parents.map((s) => ({ sha: s })) }) : send(404, { message: 'Not Found' }); }
    if (rest[1] === 'trees' && q.method === 'GET') { const t = R.trees[rest[2]]; return t ? send(200, { sha: rest[2], tree: Object.entries(t).map(([path, sha]) => ({ path, type: 'blob', mode: '100644', sha })) }) : send(404, { message: 'Not Found' }); }
    if (rest[1] === 'blobs' && q.method === 'GET') { const c = R.blobs[rest[2]]; return c != null ? send(200, { sha: rest[2], encoding: 'base64', content: Buffer.from(c).toString('base64').replace(/(.{60})/g, '$1\n') }) : send(404, { message: 'Not Found' }); }
    if (rest[1] === 'trees' && q.method === 'POST') { const base = B.base_tree ? R.trees[B.base_tree] : {}; if (B.base_tree && !base) return send(422, { message: 'base_tree not found' }); const files = { ...base }; for (const e of B.tree) { const s = blobSha(e.content); R.blobs[s] = e.content; files[e.path] = s; } const s = putTree(R, files); return send(201, { sha: s, tree: [...new Set(Object.keys(files).map((f) => f.split('/')[0]))].map((n) => ({ path: n })) }); }
    if (rest[1] === 'commits' && q.method === 'POST') { return send(201, { sha: commit(R, B.tree, B.parents || [], B.message) }); }
    if (rest[1] === 'refs' && q.method === 'PATCH') { R.patches++; const c = R.commits[B.sha]; if (!c) return send(422, { message: 'Object does not exist' }); if (!B.force && R.ref && c.parents[0] !== R.ref) { R.conflicts++; return send(422, { message: 'Update is not a fast forward' }); } R.ref = B.sha; return send(200, { object: { sha: B.sha } }); }
  }
  if (rest[0] === 'contents') {
    const path = rest.slice(1).join('/'); const files = R.ref ? R.trees[R.commits[R.ref].tree] : {};
    if (q.method === 'GET') { const s = files[path]; return s ? send(200, { path, sha: s, encoding: 'base64', content: Buffer.from(R.blobs[s]).toString('base64') }) : send(404, { message: 'Not Found' }); }
    if (q.method === 'PUT') { const cur = files[path]; if (cur && B.sha !== cur) return send(409, { message: 'sha mismatch' }); if (!cur && B.sha) return send(422, { message: 'sha wasn\'t supplied' }); const content = Buffer.from(B.content, 'base64').toString('utf8'); const s = blobSha(content); R.blobs[s] = content; const t = putTree(R, { ...files, [path]: s }); R.ref = commit(R, t, R.ref ? [R.ref] : [], B.message); return send(R.ref ? 200 : 201, { content: { path, sha: s }, commit: { sha: R.ref } }); }
  }
  send(404, { message: 'Not Found' });
});
srv.listen(+process.env.PORT || 8790, () => console.log('mock github on', srv.address().port));
