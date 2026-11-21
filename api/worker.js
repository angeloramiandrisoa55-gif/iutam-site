/**
 * IUTAM Mahajanga — API backend (Cloudflare Workers)
 * =============================================================================
 * Le site public est statique (hébergé sur GitHub Pages / Cloudflare Pages).
 * Ce Worker fournit ce que le statique ne peut pas faire :
 *
 *   POST /api/contact      envoi d'un message du formulaire de contact
 *   POST /api/newsletter   inscription à la lettre d'information
 *   POST /api/auth/login   authentification (JSON Web Token HS256)
 *   GET  /api/me           profil de l'utilisateur authentifié
 *   GET  /api/health       sonde de disponibilité (monitoring)
 *
 * Le reste (formations, admissions, frais, actualités, sites, FAQ) est servi en
 * lecture seule par les fichiers statiques de /api/*.json — voir docs/API.md.
 *
 * -----------------------------------------------------------------------------
 * Variables d'environnement (wrangler.toml ou dashboard Cloudflare)
 * -----------------------------------------------------------------------------
 *   ALLOWED_ORIGINS  origine(s) autorisées, séparées par des virgules.
 *                    Ex. : https://www.iutam.mahajanga-univ.mg   (OBLIGATOIRE)
 *   JWT_SECRET       secret HMAC-SHA256 de signature des jetons (OBLIGATOIRE, 32 octets+)
 *   IUTAM_KV         espace de clé/valeur (KV namespace) pour les inscriptions,
 *                    les utilisateurs et le compteur de débit. Optionnel.
 *   IUTAM_EMAIL      Email Workers binding : reçoit les messages du formulaire.
 *                    Optionnel (sinon NOTIFY_WEBHOOK est utilisé).
 *   NOTIFY_WEBHOOK   URL d'un webhook (Slack, Discord, Google Apps Script…)
 *                    qui reçoit les messages du formulaire. Optionnel.
 *   RATE_LIMIT       nombre maximal de requêtes par fenêtre (défaut : 5)
 *   RATE_WINDOW      durée de la fenêtre en secondes (défaut : 600)
 *
 * -----------------------------------------------------------------------------
 * Sécurité appliquée
 * -----------------------------------------------------------------------------
 *   - CORS strict : seule l'origine du site est acceptée, jamais « * » avec credentials.
 *   - Vérification d'origine (anti-CSRF) sur toutes les requêtes d'écriture.
 *   - Limitation de débit par adresse IP (IPGel + fenêtre glissante).
 *   - Validation stricte des entrées, longueurs bornées, suppression des caractères
 *     de contrôle et des chevauchements de balises.
 *   - Pot de miel (honeypot) + champ de soumission à durée minimale (anti-bot).
 *   - Mots de passe hachés en PBKDF2-HMAC-SHA256 (120 000 itérations, sel aléatoire).
 *     Workers ne dispose ni de bcrypt ni d'argon2 : PBKDF2 via WebCrypto est la
 *     solution la plus forte disponible ici. Pour argon2, il faut un backend dédié.
 *   - Jetons JWT HS256 signés, expiration courte, vérifiée à chaque requête.
 *   - Aucune donnée sensible renvoyée dans les réponses d'erreur.
 *   - En-têtes de sécurité sur toutes les réponses.
 *
 * Déploiement :
 *   npx wrangler deploy
 *   npx wrangler kv:namespace create IUTAM_KV   (puis lier dans wrangler.toml)
 *   npx wrangler secret put JWT_SECRET
 *   npx wrangler secret put ALLOWED_ORIGINS
 */

const VERSION = '2.1.0';

/* ------------------------------------------------------------------ utilitaires */

const enc = new TextEncoder();

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'strict-transport-security': 'max-age=31536000',
      ...headers
    }
  });
}

const ok = (data, headers) => json(data, 200, headers);
const bad = (code, message, extra = {}) => json({ error: message, ...extra }, code);

function text(str, max = 200) {
  if (str == null) return '';
  return String(str)
    .replace(/[\x00-\x1F\x7F]/g, ' ')   // caractères de contrôle
    .replace(/[<>]/g, '')              // empêche l'injection de balises
    .trim()
    .slice(0, max);
}

function isEmail(v) {
  return typeof v === 'string' && v.length <= 254 && /^[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}$/i.test(v.trim());
}

/** Comparaison à temps constant (évite les attaques temporelles). */
function timingSafeEqual(a, b) {
  const ab = enc.encode(a), bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length);
  for (let i = 0; i < len; i++) diff |= (ab[i] || 0) ^ (bb[i] || 0);
  return diff === 0;
}

/* ------------------------------------------------------------ origine et CORS */

/**
 * Renvoie l'origine autorisée ou null.
 * La liste ALLOWED_ORIGINS est obligatoire : sans elle, aucune écriture n'est acceptée.
 */
function allowedOrigin(env, request) {
  const raw = (env.ALLOWED_ORIGINS || '').trim();
  const list = raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
  const origin = request.headers.get('origin');
  if (!origin) return null;                    // requêtes sans origine : refusées en écriture
  if (list.includes('*')) return origin;
  return list.includes(origin) ? origin : null;
}

function corsHeaders(origin) {
  if (!origin) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization, x-requested-with',
    'access-control-max-age': '86400',
    vary: 'Origin'
  };
}

/* ------------------------------------------------------- limitation de débit */

const MEMORY_LIMITS = new Map(); // repli si KV n'est pas lié

async function rateLimit(env, request, bucket) {
  const limit = parseInt(env.RATE_LIMIT || '5', 10);
  const windowSec = parseInt(env.RATE_WINDOW || '600', 10);
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'inconnu';
  const key = `rl:${bucket}:${ip}`;
  const now = Date.now();

  if (env.IUTAM_KV) {
    const raw = await env.IUTAM_KV.get(key);
    const rec = raw ? JSON.parse(raw) : { n: 0, t: now };
    if (now - rec.t > windowSec * 1000) { rec.n = 0; rec.t = now; }
    rec.n += 1;
    await env.IUTAM_KV.put(key, JSON.stringify(rec), { expirationTtl: windowSec + 60 });
    return { ok: rec.n <= limit, remaining: Math.max(0, limit - rec.n), limit };
  }

  const rec = MEMORY_LIMITS.get(key) || { n: 0, t: now };
  if (now - rec.t > windowSec * 1000) { rec.n = 0; rec.t = now; }
  rec.n += 1;
  MEMORY_LIMITS.set(key, rec);
  // nettoyage périodique pour éviter la fuite de mémoire
  if (MEMORY_LIMITS.size > 5000) {
    for (const [k, v] of MEMORY_LIMITS) if (now - v.t > windowSec * 1000) MEMORY_LIMITS.delete(k);
  }
  return { ok: rec.n <= limit, remaining: Math.max(0, limit - rec.n), limit };
}

/* ------------------------------------------------------------------- hachage */

async function pbkdf2Hash(password, saltB64) {
  const salt = saltB64 ? base64ToBytes(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' },
    key, 256
  );
  return { hash: bytesToBase64(new Uint8Array(bits)), salt: bytesToBase64(salt) };
}

async function pbkdf2Verify(password, saltB64, expectedB64) {
  const { hash } = await pbkdf2Hash(password, saltB64);
  return timingSafeEqual(hash, expectedB64);
}

function bytesToBase64(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function base64UrlEncode(bytes) {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return base64ToBytes(s);
}

/* --------------------------------------------------------------------- JWT HS256 */

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = Object.assign({}, payload, { iat: now, exp: now + 3600 });
  const part = base64UrlEncode(enc.encode(JSON.stringify(header))) + '.' +
    base64UrlEncode(enc.encode(JSON.stringify(body)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(part));
  return part + '.' + base64UrlEncode(new Uint8Array(sig));
}

async function verifyJwt(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const part = parts[0] + '.' + parts[1];
  const key = await hmacKey(secret);
  const expected = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(part)));
  const given = base64UrlDecode(parts[2]);
  if (!timingSafeEqual(bytesToBase64(expected), bytesToBase64(given))) return null;
  let payload;
  try { payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1]))); } catch { return null; }
  if (!payload.exp || payload.exp * 1000 < Date.now()) return null;
  return payload;
}

function bearer(request) {
  const h = request.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

/* -------------------------------------------------------------------- anti-bot */

/**
 * Détecte un robot : pot de miel rempli ou soumission trop rapide.
 * BOT_MIN_MS fixe la durée minimale de remplissage (défaut : 2000 ms).
 * Une durée inférieure est considérée comme automatique ; les robots « habillés »
 * sont de toute façon arrêtés par le pot de miel.
 */
function looksLikeBot(data, startedAt, env) {
  if (data && typeof data.company === 'string' && data.company.trim() !== '') return true;
  if (data && typeof data.website === 'string' && data.website.trim() !== '') return true;
  if (data && typeof data.url === 'string' && data.url.trim() !== '') return true;
  const min = parseInt((env && env.BOT_MIN_MS) || '2000', 10);
  if (!min) return false;
  const elapsed = Date.now() - (startedAt || Date.now());
  return elapsed < min;
}

/* --------------------------------------------------------------------- KV utils */

async function kvGet(env, key) {
  if (!env.IUTAM_KV) return null;
  return env.IUTAM_KV.get(key);
}

async function kvPut(env, key, value, ttl) {
  if (!env.IUTAM_KV) return false;
  await env.IUTAM_KV.put(key, value, ttl ? { expirationTtl: ttl } : undefined);
  return true;
}

/* ------------------------------------------------------------ notification */

/** Transmet un message du formulaire : binding Email Worker ou webhook. */
async function notify(env, payload) {
  const subject = `[IUTAM] ${payload.subject || 'Nouveau message'}`;
  if (env.IUTAM_EMAIL && typeof env.IUTAM_EMAIL.send === 'function') {
    await env.IUTAM_EMAIL.send({
      from: env.MAIL_FROM || 'site@iutam.mahajanga-univ.mg',
      to: env.MAIL_TO || 'iutamumg@gmail.com',
      subject,
      text: payload.text
    });
    return true;
  }
  if (env.NOTIFY_WEBHOOK) {
    const r = await fetch(env.NOTIFY_WEBHOOK, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ subject, text: payload.text, ...payload.extra })
    });
    return r.ok;
  }
  return false;
}

/* ------------------------------------------------------------------- handlers */

async function handleContact(env, request, startedAt) {
  const rl = await rateLimit(env, request, 'contact');
  if (!rl.ok) return bad(429, 'Trop de demandes. Merci de réessayer plus tard.', { retry_after: rl.limit });

  const data = await request.json().catch(() => null);
  if (!data || typeof data !== 'object') return bad(400, 'Requête invalide.');

  if (looksLikeBot(data, startedAt, env)) {
    // Réponse identique à un succès : le robot ne doit pas apprendre qu'il est détecté.
    return ok({ ok: true, message: 'Message reçu.' });
  }

  const nom = text(data.nom, 120);
  const email = text(data.email, 254);
  const sujet = text(data.sujet, 150) || 'Message depuis le site';
  const message = text(data.message, 4000);
  const consent = data.consent === true || data.consent === 'true';

  const erreurs = {};
  if (nom.length < 2) erreurs.nom = 'Le nom est obligatoire (2 caractères minimum).';
  if (!isEmail(email)) erreurs.email = 'Adresse e-mail invalide.';
  if (message.length < 10) erreurs.message = 'Le message doit contenir au moins 10 caractères.';
  if (!consent) erreurs.consent = 'Votre accord est nécessaire pour traiter la demande.';
  if (Object.keys(erreurs).length) return bad(422, 'Certains champs sont invalides.', { erreurs });

  const body = `Nom : ${nom}\nE-mail : ${email}\nSujet : ${sujet}\n\n${message}\n\n— Envoyé depuis le site de l'IUTAM`;

  const sent = await notify(env, {
    subject: sujet,
    text: body,
    extra: { nom, email, sujet }
  });

  if (!sent) {
    // Aucun canal de notification configuré : on journalise pour ne rien perdre.
    console.warn('IUTAM: message de contact non transmis (aucun binding IUTAM_EMAIL ni NOTIFY_WEBHOOK) — ' + body);
  }

  return ok({
    ok: true,
    message: sent
      ? 'Merci ! Votre message a bien été envoyé, nous revenons vers vous rapidement.'
      : 'Message enregistré. Merci de contacter aussi le secrétariat par téléphone ou par e-mail.'
  });
}

async function handleNewsletter(env, request, startedAt) {
  const rl = await rateLimit(env, request, 'newsletter');
  if (!rl.ok) return bad(429, 'Trop de demandes. Merci de réessayer plus tard.', { retry_after: rl.limit });

  const data = await request.json().catch(() => null);
  if (!data || typeof data !== 'object') return bad(400, 'Requête invalide.');

  if (looksLikeBot(data, startedAt, env)) return ok({ ok: true, message: 'Inscription enregistrée.' });

  const email = text(data.email, 254);
  if (!isEmail(email)) return bad(422, 'Adresse e-mail invalide.', { erreurs: { email: 'Adresse e-mail invalide.' } });

  const key = 'nl:' + email.toLowerCase();
  const existing = await kvGet(env, key);
  if (existing) return ok({ ok: true, message: 'Cette adresse est déjà inscrite.' });

  const record = JSON.stringify({ email, date: new Date().toISOString() });
  const stored = await kvPut(env, key, record);
  if (!stored) {
    console.warn('IUTAM: inscription newsletter non persistée (KV IUTAM_KV non lié) — ' + email);
    return ok({ ok: true, message: 'Inscription enregistrée.' });
  }
  return ok({ ok: true, message: 'Merci ! Vous êtes inscrit à la lettre d’information.' });
}

async function handleLogin(env, request) {
  const rl = await rateLimit(env, request, 'login');
  if (!rl.ok) return bad(429, 'Trop de tentatives. Réessayez dans quelques minutes.', { retry_after: rl.limit });

  const data = await request.json().catch(() => null);
  if (!data || typeof data !== 'object') return bad(400, 'Requête invalide.');

  const email = text(data.email, 254).toLowerCase();
  const password = typeof data.password === 'string' ? data.password : '';
  if (!isEmail(email) || password.length < 8) return bad(422, 'Identifiants invalides.');

  const raw = await kvGet(env, 'user:' + email);
  if (!raw) {
    // Hachage factice pour que le temps de réponse ne révèle pas l'existence du compte.
    await pbkdf2Hash(password, 'AAAAAAAAAAAAAAAAAAAAAA==');
    return bad(401, 'Identifiants invalides.');
  }

  const user = JSON.parse(raw);
  const valid = await pbkdf2Verify(password, user.salt, user.hash);
  if (!valid) return bad(401, 'Identifiants invalides.');

  const token = await signJwt({
    sub: user.id || email,
    email: user.email,
    role: user.role || 'etudiant',
    nom: user.nom || ''
  }, env.JWT_SECRET);

  return ok({
    token,
    token_type: 'Bearer',
    expires_in: 3600,
    profil: { email: user.email, nom: user.nom || '', role: user.role || 'etudiant' }
  });
}

async function handleMe(env, request) {
  const token = bearer(request);
  if (!token) return bad(401, 'Authentification requise.');
  if (!env.JWT_SECRET) return bad(500, 'Service d’authentification non configuré.');
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return bad(401, 'Session expirée ou invalide.');
  return ok({
    profil: { email: payload.email, nom: payload.nom, role: payload.role },
    expire_le: payload.exp * 1000
  });
}

/* ------------------------------------------------------------------- routeur */

// Export CommonJS : compatible avec l'exécution Cloudflare (module worker) et
// avec les tests automatisés (tools/test-worker.js) lancés sous Node.
module.exports = {
  async fetch(request, env, ctx) {
    const startedAt = Date.now();
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const origin = allowedOrigin(env, request);

    // Requêtes intersites non autorisées : bloquées avant tout traitement.
    if (request.method === 'OPTIONS') {
      if (!origin) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (path === '/api/health' || path === '/health') {
      return ok({ ok: true, service: 'iutam-api', version: VERSION, time: new Date().toISOString() });
    }

    if (path === '/api/me' && request.method === 'GET') {
      if (!origin && request.headers.get('origin')) return bad(403, 'Origine non autorisée.');
      return handleMe(env, request);
    }

    const writeRoutes = ['/api/contact', '/api/newsletter', '/api/auth/login'];
    if (writeRoutes.includes(path) && request.method === 'POST') {
      if (!origin) return bad(403, 'Origine non autorisée.');
      const ctype = request.headers.get('content-type') || '';
      if (!ctype.includes('application/json')) return bad(415, 'Le contenu doit être au format JSON.');

      let result;
      if (path === '/api/contact') result = await handleContact(env, request, startedAt);
      else if (path === '/api/newsletter') result = await handleNewsletter(env, request, startedAt);
      else result = await handleLogin(env, request);

      const headers = corsHeaders(origin);
      const body = await result.json();
      return json(body, result.status, headers);
    }

    return bad(404, 'Ressource introuvable.', { documentation: '/docs/API.md' });
  }
};
