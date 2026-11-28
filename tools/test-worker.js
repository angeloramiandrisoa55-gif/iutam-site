// Tests de sécurité de l'API Worker (api/worker.js).
//   node tools/test-worker.js
//
// Vérifie les comportements critiques : origine refusée, validation des
// entrées, pot de miel, limitation de débit, authentification JWT, CORS.
// Aucune connexion réseau : le gestionnaire KV est simulé en mémoire.

const assert = require('assert');
const path = require('path');

(async () => {
  const worker = require(path.join(__dirname, '..', 'api', 'worker.js'));
  const handler = worker.default || worker;

  // --- environnement de test ---------------------------------------------------
  const kv = new Map();
  const IUTAM_KV = {
    async get(k) { return kv.has(k) ? kv.get(k) : null; },
    async put(k, v) { kv.set(k, v); },
    async delete(k) { kv.delete(k); }
  };

  const env = {
    ALLOWED_ORIGINS: 'https://www.iutam.mahajanga-univ.mg',
    JWT_SECRET: 'secret-de-test-suffisamment-long-pour-hmac-sha256',
    IUTAM_KV,
    RATE_LIMIT: '3',
    RATE_WINDOW: '60',
    BOT_MIN_MS: '0',          // les tests ne simulent pas un temps de saisie
    NOTIFY_WEBHOOK: null,
    IUTAM_EMAIL: null
  };

  let passed = 0, failed = 0;
  const results = [];

  async function test(name, fn) {
    try {
      await fn();
      passed++;
      results.push('  OK    ' + name);
    } catch (e) {
      failed++;
      results.push('  ÉCHEC ' + name + ' — ' + e.message);
    }
  }

  function post(path, body, origin, headers) {
    return new Request('https://api.iutam.test' + path, {
      method: 'POST',
      headers: Object.assign({ 'content-type': 'application/json', origin: origin || '' }, headers || {}),
      body: JSON.stringify(body)
    });
  }

  // --- tests ---------------------------------------------------------------------
  await test('POST /api/contact refusé sans origine', async () => {
    const r = await handler.fetch(post('/api/contact', { nom: 'A' }), env, {});
    assert.strictEqual(r.status, 403);
  });

  await test('POST /api/contact refusé depuis une origine inconnue', async () => {
    const r = await handler.fetch(post('/api/contact', { nom: 'A' }, 'https://pirate.example'), env, {});
    assert.strictEqual(r.status, 403);
  });

  await test('POST /api/contact refusé sans type JSON', async () => {
    const r = await handler.fetch(new Request('https://api.iutam.test/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'text/plain', origin: env.ALLOWED_ORIGINS },
      body: 'x'
    }), env, {});
    assert.strictEqual(r.status, 415);
  });

  await test('POST /api/contact rejette les champs invalides', async () => {
    const r = await handler.fetch(post('/api/contact', {
      nom: 'A', email: 'pas-un-email', message: 'court', consent: false
    }, env.ALLOWED_ORIGINS), env, {});
    assert.strictEqual(r.status, 422);
    const b = await r.json();
    assert.ok(b.erreurs.nom && b.erreurs.email && b.erreurs.message && b.erreurs.consent,
      'toutes les erreurs de champ doivent être signalées');
  });

  await test('POST /api/contact accepte un message valide', async () => {
    const r = await handler.fetch(post('/api/contact', {
      nom: 'Rakoto', email: 'rakoto@example.mg', message: 'Bonjour, je souhaite des informations sur les inscriptions.', consent: true
    }, env.ALLOWED_ORIGINS), env, {});
    assert.strictEqual(r.status, 200);
    const b = await r.json();
    assert.strictEqual(b.ok, true);
  });

  await test('le pot de miel ne révèle pas sa présence', async () => {
    const r = await handler.fetch(post('/api/contact', {
      nom: 'Robot', email: 'bot@example.mg', message: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      consent: true, company: 'SpamCorp'
    }, env.ALLOWED_ORIGINS), env, {});
    assert.strictEqual(r.status, 200);
    const b = await r.json();
    assert.strictEqual(b.ok, true);
    assert.ok(!/robot|spam/i.test(JSON.stringify(b)), 'la réponse ne doit pas mentionner le robot');
  });

  await test('la limitation de débit bloque après RATE_LIMIT requêtes', async () => {
    const e2 = Object.assign({}, env, { RATE_LIMIT: '2', IUTAM_KV: undefined });
    let last = null;
    for (let i = 0; i < 4; i++) {
      last = await handler.fetch(post('/api/contact', {
        nom: 'Test', email: 'a@b.mg', message: 'Message suffisamment long pour passer.', consent: true
      }, env.ALLOWED_ORIGINS), e2, {});
    }
    assert.strictEqual(last.status, 429, 'la 4e requête doit être refusée');
  });

  await test('CORS : l\'origine autorisée est renvoyée', async () => {
    const r = await handler.fetch(post('/api/newsletter', { email: 'a@b.mg' }, env.ALLOWED_ORIGINS), env, {});
    assert.strictEqual(r.headers.get('access-control-allow-origin'), env.ALLOWED_ORIGINS);
  });

  await test('OPTIONS renvoie les en-têtes CORS', async () => {
    const r = await handler.fetch(new Request('https://api.iutam.test/api/contact', {
      method: 'OPTIONS', headers: { origin: env.ALLOWED_ORIGINS }
    }), env, {});
    assert.strictEqual(r.status, 204);
    assert.strictEqual(r.headers.get('access-control-allow-origin'), env.ALLOWED_ORIGINS);
  });

  await test('inscription à la lettre d\'information', async () => {
    await handler.fetch(post('/api/newsletter', { email: 'lettre@example.mg' }, env.ALLOWED_ORIGINS), env, {});
    assert.ok(kv.has('nl:lettre@example.mg'), 'l\'adresse doit être enregistrée');
  });

  await test('newsletter : adresse invalide refusée', async () => {
    const r = await handler.fetch(post('/api/newsletter', { email: 'nope' }, env.ALLOWED_ORIGINS), env, {});
    assert.strictEqual(r.status, 422);
  });

  await test('connexion : identifiants erronés refusés', async () => {
    kv.set('user:etudiant@example.mg', JSON.stringify({
      id: 'u1', email: 'etudiant@example.mg', nom: 'Etudiant', role: 'etudiant',
      salt: 'c2FsdHNhbHRzYWx0c2FsdA==', hash: 'x'
    }));
    const r = await handler.fetch(post('/api/auth/login', {
      email: 'etudiant@example.mg', password: 'mauvais-mot-de-passe'
    }, env.ALLOWED_ORIGINS), env, {});
    assert.strictEqual(r.status, 401);
  });

  await test('connexion et profil : jeton JWT valide', async () => {
    const PASSWORD = 'mot-de-passe-2026!';
    // le mot de passe est haché en PBKDF2 (120 000 itérations)
    const { hash, salt } = await (async () => {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey('raw', enc.encode(PASSWORD), 'PBKDF2', false, ['deriveBits']);
      const s = crypto.getRandomValues(new Uint8Array(16));
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: s, iterations: 120000, hash: 'SHA-256' }, key, 256);
      const b64 = b => Buffer.from(b).toString('base64');
      return { hash: b64(new Uint8Array(bits)), salt: b64(s) };
    })();
    kv.set('user:etudiant@example.mg', JSON.stringify({
      id: 'u1', email: 'etudiant@example.mg', nom: 'Etudiant', role: 'etudiant', salt, hash
    }));

    const r = await handler.fetch(post('/api/auth/login', {
      email: 'etudiant@example.mg', password: PASSWORD
    }, env.ALLOWED_ORIGINS), env, {});
    assert.strictEqual(r.status, 200);
    const b = await r.json();
    assert.ok(b.token && b.token.split('.').length === 3, 'jeton à trois segments');
    const payload = JSON.parse(Buffer.from(b.token.split('.')[1], 'base64url').toString());
    assert.strictEqual(payload.role, 'etudiant');
    assert.ok(payload.exp > Math.floor(Date.now() / 1000), 'le jeton doit avoir une date d\'expiration');

    // /api/me avec le jeton
    const r2 = await handler.fetch(new Request('https://api.iutam.test/api/me', {
      headers: { authorization: 'Bearer ' + b.token, origin: env.ALLOWED_ORIGINS }
    }), env, {});
    assert.strictEqual(r2.status, 200);
    const me = await r2.json();
    assert.strictEqual(me.profil.email, 'etudiant@example.mg');
  });

  await test('GET /api/me refuse un jeton falsifié', async () => {
    const r = await handler.fetch(new Request('https://api.iutam.test/api/me', {
      headers: { authorization: 'Bearer aaa.bbb.ccc', origin: env.ALLOWED_ORIGINS }
    }), env, {});
    assert.strictEqual(r.status, 401);
  });

  await test('GET /api/me refuse l\'absence de jeton', async () => {
    const r = await handler.fetch(new Request('https://api.iutam.test/api/me', {
      headers: { origin: env.ALLOWED_ORIGINS }
    }), env, {});
    assert.strictEqual(r.status, 401);
  });

  await test('GET /api/health répond sans authentification', async () => {
    const r = await handler.fetch(new Request('https://api.iutam.test/api/health'), env, {});
    assert.strictEqual(r.status, 200);
    const b = await r.json();
    assert.strictEqual(b.ok, true);
  });

  await test('route inconnue renvoie 404', async () => {
    const r = await handler.fetch(new Request('https://api.iutam.test/api/inconnu'), env, {});
    assert.strictEqual(r.status, 404);
  });

  await test('les réponses portent les en-têtes de sécurité', async () => {
    const r = await handler.fetch(new Request('https://api.iutam.test/api/health'), env, {});
    assert.strictEqual(r.headers.get('x-content-type-options'), 'nosniff');
    assert.strictEqual(r.headers.get('x-frame-options'), 'DENY');
    assert.ok(r.headers.get('strict-transport-security'));
  });

  console.log('Tests de l\'API Worker');
  console.log(results.join('\n'));
  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
