// Génère l'API REST statique (api/*.json) à partir des fichiers de données (data/*.json).
//   node tools/build-api.js
//
// Pourquoi des fichiers statiques ? Le site est hébergé sans serveur : l'API est donc
// en lecture seule, servie en JSON avec les en-têtes CORS définis dans _headers.
// Les champs bilingues sont exposés sous la forme { "fr": "...", "mg": "..." }.
// Les requêtes d'écriture (contact, newsletter) sont traitées par api/worker.js
// (Cloudflare Worker) — voir docs/API.md.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'api');
const VERSION = '2.1.0';

const read = f => JSON.parse(fs.readFileSync(path.join(root, 'data', f), 'utf8'));
const has = f => fs.existsSync(path.join(root, 'data', f));

// Découpe un objet en paires bilingues {fr, mg} pour les champs suffixés _mg.
function bilingual(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const out = {};
  const mgs = Object.keys(obj).filter(k => k.endsWith('_mg'));
  const base = Object.keys(obj).filter(k => !k.endsWith('_mg'));
  for (const k of base) {
    const mk = k + '_mg';
    if (mgs.includes(mk)) {
      out[k] = { fr: obj[k] == null ? '' : obj[k], mg: obj[mk] == null ? '' : obj[mk] };
    } else {
      out[k] = obj[k];
    }
  }
  // Conserver aussi les champs _mg orphelins (non appariés)
  for (const mk of mgs) {
    const k = mk.slice(0, -3);
    if (!(k in out)) out[k] = { fr: '', mg: obj[mk] };
  }
  return out;
}

function meta(endpoint, count, extra) {
  return Object.assign({
    endpoint,
    version: VERSION,
    generated: new Date().toISOString(),
    count,
    licence: "Contenu de l'IUTAM — Université de Mahajanga"
  }, extra || {});
}

// Ne supprime que les fichiers générés : api/ contient aussi worker.js,
// qui est une source et ne doit jamais être effacé par une génération.
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) {
  if (f.endsWith('.json')) fs.rmSync(path.join(out, f), { force: true });
}

const endpoints = [];

// --- Formations -----------------------------------------------------------------
if (has('formations.json')) {
  const d = read('formations.json');
  const items = (d.parcours || []).map(p => {
    const o = bilingual(p);
    o.niveau = p.niveau;
    o.debouches = (p.debouches || []).map(d2 => bilingual(d2));
    o.objectifs = (p.objectifs || []).map((t, i) => ({ fr: t, mg: (p.objectifs_mg || [])[i] || '' }));
    o.competences = (p.competences || []).map((t, i) => ({ fr: t, mg: (p.competences_mg || [])[i] || '' }));
    o.stages = (p.stages || []).map(s => bilingual(s));
    return o;
  });
  const body = { meta: meta('/api/formations.json', items.length, { ressource: 'formations' }), items };
  fs.writeFileSync(path.join(out, 'formations.json'), JSON.stringify(body, null, 2));
  endpoints.push({ path: '/api/formations.json', description: 'Liste des parcours de formation', count: items.length });
}

// --- Admissions -----------------------------------------------------------------
if (has('formations.json')) {
  const d = read('formations.json');
  const items = [];
  for (const p of d.parcours || []) {
    const n = (d.niveaux || []).find(x => x.id === p.niveau) || {};
    items.push({
      id: p.id,
      parcours: { fr: p.nom, mg: p.nom_mg || '' },
      niveau: { id: p.niveau, fr: n.nom || '', mg: n.nom_mg || '' },
      duree: { fr: p.duree || '', mg: p.duree || '' },
      condition: { fr: n.condition || '', mg: n.condition_mg || '' },
      selection: { fr: n.selection || '', mg: n.selection_mg || '' },
      diplome: { fr: n.diplome || '', mg: n.diplome_mg || '' },
      bac_requis: { fr: p.bac || '', mg: p.bac || '' },
      bac_series: p.bac_series || [],
      stages: (n.stages || []).map(s => ({ niveau: s.niveau, titre: { fr: s.titre, mg: s.titre_mg || '' } })),
      image: p.image || ''
    });
  }
  const body = { meta: meta('/api/admissions.json', items.length, { ressource: 'admissions' }), items };
  fs.writeFileSync(path.join(out, 'admissions.json'), JSON.stringify(body, null, 2));
  endpoints.push({ path: '/api/admissions.json', description: 'Conditions d\'admission par parcours', count: items.length });
}

// --- Frais ----------------------------------------------------------------------
if (has('frais.json')) {
  const d = read('frais.json');
  const body = {
    meta: meta('/api/frais.json', (d.niveaux || []).length, { ressource: 'frais', annee: d.annee || '' }),
    annee: d.annee || '',
    communs: (d.communs || []).map(c => bilingual(Object.assign({}, c, { montant: +c.montant || 0 }))),
    tranches: (d.tranches || []).map(t => bilingual(t)),
    niveaux: (d.niveaux || []).map(n => Object.assign(bilingual(n), { tranche: +n.tranche || 0 }))
  };
  fs.writeFileSync(path.join(out, 'frais.json'), JSON.stringify(body, null, 2));
  endpoints.push({ path: '/api/frais.json', description: 'Grille des frais de scolarité', count: (d.niveaux || []).length });
}

// --- Actualités ------------------------------------------------------------------
if (has('actualites.json')) {
  const d = read('actualites.json');
  const items = (d.items || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .map(x => bilingual(x));
  const body = { meta: meta('/api/actualites.json', items.length, { ressource: 'actualites' }), items };
  fs.writeFileSync(path.join(out, 'actualites.json'), JSON.stringify(body, null, 2));
  endpoints.push({ path: '/api/actualites.json', description: 'Actualités de l\'IUTAM (ordre antéchronologique)', count: items.length });
}

// --- Sites ----------------------------------------------------------------------
if (has('sites.json')) {
  const d = read('sites.json');
  const items = (d.sites || []).map(s => {
    const o = bilingual(s);
    o.photos = (s.photos || []).map(p => bilingual(p));
    return o;
  });
  const body = { meta: meta('/api/sites.json', items.length, { ressource: 'sites' }), items };
  fs.writeFileSync(path.join(out, 'sites.json'), JSON.stringify(body, null, 2));
  endpoints.push({ path: '/api/sites.json', description: 'Sites de l\'IUTAM (Mahajanga, Antsohihy, Maevatanana)', count: items.length });
}

// --- FAQ -------------------------------------------------------------------------
if (has('faq.json')) {
  const d = read('faq.json');
  const items = (d.groupes || []).map(g => ({
    id: g.id,
    titre: bilingual(g),
    questions: (g.questions || []).map(q => bilingual(q))
  }));
  const q = items.reduce((n, g) => n + g.questions.length, 0);
  const body = { meta: meta('/api/faq.json', q, { ressource: 'faq' }), items };
  fs.writeFileSync(path.join(out, 'faq.json'), JSON.stringify(body, null, 2));
  endpoints.push({ path: '/api/faq.json', description: 'Questions fréquentes (admission, frais, formation)', count: q });
}

// --- Contacts --------------------------------------------------------------------
if (has('contact.json')) {
  const d = read('contact.json');
  const body = {
    meta: meta('/api/contacts.json', 1, { ressource: 'contacts' }),
    institut: bilingual(d.institut || {}),
    siege: bilingual(d.siege || {}),
    reseaux: d.reseaux || {},
    messages: bilingual(d.messages || {})
  };
  fs.writeFileSync(path.join(out, 'contacts.json'), JSON.stringify(body, null, 2));
  endpoints.push({ path: '/api/contacts.json', description: 'Coordonnées de contact de l\'IUTAM', count: 1 });
}

// --- Index ------------------------------------------------------------------------
const index = {
  meta: meta('/api/index.json', endpoints.length, { ressource: 'index' }),
  base: '/api',
  endpoints: endpoints,
  documentation: '/docs/API.md'
};
fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(index, null, 2));

// --- Spécification OpenAPI 3.1 ----------------------------------------------------
function schemaOf(items) {
  if (!items.length) return { type: 'object' };
  return { type: 'object', properties: {} };
}
const paths = {};
for (const e of endpoints) {
  const p = e.path.replace(/^\/api\//, '');
  paths['/' + p] = {
    get: {
      summary: e.description,
      operationId: 'get' + p.replace(/\.json$/, '').replace(/[^a-z0-9]/gi, ''),
      tags: [e.path.replace('/api/', '').replace('.json', '')],
      responses: {
        200: {
          description: 'Succès',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  meta: {
                    type: 'object',
                    properties: {
                      endpoint: { type: 'string' },
                      version: { type: 'string' },
                      generated: { type: 'string', format: 'date-time' },
                      count: { type: 'integer' }
                    }
                  },
                  items: { type: 'array', items: schemaOf([]) }
                }
              }
            }
          }
        }
      }
    }
  };
}
const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'API IUTAM Mahajanga',
    version: VERSION,
    description: 'API en lecture seule des contenus publics de l\'Institut Universitaire de Technologie et d\'Agronomie de Mahajanga. ' +
      'Servie en JSON statique (CORS ouvert). Les écritures passent par api/worker.js — voir docs/API.md.',
    license: { name: 'Usage institutionnel', url: 'https://iutam.univ.mg/' }
  },
  servers: [{ url: 'https://iutam.univ.mg', description: 'Production' }],
  tags: endpoints.map(e => ({ name: e.path.replace('/api/', '').replace('.json', ''), description: e.description })),
  paths
};
fs.writeFileSync(path.join(out, 'openapi.json'), JSON.stringify(openapi, null, 2));

console.log(`api/ générée : ${endpoints.length + 2} fichiers (${endpoints.map(e => e.path).join(', ')}).`);
