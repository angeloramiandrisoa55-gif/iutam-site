// Vérifie que tout le texte visible de index.html est traduit en malagasy.
//   node tools/check-i18n.js
//
// Compare le texte visible de la page française et de la page malagasy
// (mg/index.html) : un texte identique dans les deux versions signale une
// traduction manquante dans tools/mg.json.

const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const dict = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'mg.json'), 'utf8'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// --- texte visible de index.html ------------------------------------------------
function visibleText(src) {
  // on retire script, style, comments et attributs
  let s = src
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const out = [];
  // texte des balises
  for (const m of s.matchAll(/>([^<>]+)</g)) {
    const t = m[1].replace(/\s+/g, ' ').trim();
    if (t) out.push(t);
  }
  // attributs accessibles (title, aria-label, placeholder, alt)
  for (const m of s.matchAll(/\b(?:title|aria-label|placeholder|alt)="([^"]+)"/gi)) {
    const t = m[1].replace(/\s+/g, ' ').trim();
    if (t) out.push(t);
  }
  return out;
}

const texts = [...new Set(visibleText(html))];

// --- chaînes couvertes par le dictionnaire -------------------------------------
const keys = Object.keys(dict).map(k => k.trim()).filter(Boolean).sort((a, b) => b.length - a.length);
const covered = new Set();
for (const t of texts) {
  for (const k of keys) {
    if (t.includes(k)) { covered.add(t); break; }
  }
}

// --- chaînes non traduites ---------------------------------------------------------
const missing = texts.filter(t => !covered.has(t) && t.length > 1);

// Noms propres, sigles, montants et termes identiques en malagache : à ne pas traduire.
const WHITELIST = new Set([
  'IUTAM', 'Mahajanga', 'Antsohihy', 'Maevatanana', 'MG', 'FR', 'FAQ',
  'P.A.D.D.', 'P.V.T.D.D.', 'Licence', 'Master', 'Mention', 'Annexe',
  'Ingéniorat', 'Tous', 'toutes', 'Contact', 'Admission', 'Frais', 'Formations',
  'Teny malagasy', 'Version malgache', 'L\'Institut', 'Actualités', 'Vie étudiante', 'Faculté',
  'licence', 'Innovation', 'Plateforme',
  // identiques en malagasy (déjà traduits par une balise plus longue)
  'développement durable', 'Licence Pro', 'Ingéniorat (Master)',
  // lignes d'un bloc traduit d'un seul tenant (adresse, mentions légales)
  'Mahajanga (401) · Madagascar',
  'L1', 'L2', 'L3', 'M1', 'M2',
  '🎓 Licence Pro · Ingéniorat', 'Licence Professionnelle',
  '✉️ iutamumg@gmail.com', '✉️ benjaiba@yahoo.fr', 'iutamumg@gmail.com', 'benjaiba@yahoo.fr'
]);
const noise = /^[0-9\s\W]*$/;
const real = missing.filter(t => !noise.test(t) && !WHITELIST.has(t.trim()) && !/^[\d\s., ]+(Ar|%)?$/.test(t.trim()));

console.log(`Textes visibles distincts : ${texts.length}`);
console.log(`Couverts par tools/mg.json : ${covered.size}`);
console.log(`À traduire : ${real.length}\n`);
real.forEach(t => console.log('  • ' + t));
console.log('');
console.log(real.length ? 'Traduction manquante : OUI' : 'Traduction complète : OK');
process.exit(real.length ? 1 : 0);
