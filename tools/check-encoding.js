// Vérifie qu'aucun caractère non latin (chinois, coréen, japonais, russe, arabe…)
// ne s'est glissé dans les fichiers du projet.
//
//   node tools/check-encoding.js
//
// Ces caractères apparaissent quand un texte est collé depuis une autre source :
// ils sont invisibles pour un relecteur francophone et signalent une phrase
// traduite à moitié. Les émojis, les flèches et les symboles utilisés par le
// site sont explicitement exclus.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', '_site', 'backup', 'fonts', 'vendor']);
const EXT = new Set(['.html', '.css', '.js', '.json', '.md', '.yml', '.yaml', '.txt', '.xml', '.toml', '.svg', '']);
const SELF = path.basename(__filename);

/**
 * Un caractère est suspect s'il appartient à un système d'écriture non latin
 * et qu'il n'est pas un symbole employé par le site.
 */
function isSuspect(cp) {
  if (cp < 0x00A0) return false;                 // ASCII
  if (cp <= 0x024F) return false;                // Latin-1 et Latin étendu
  if (cp >= 0x1F000 && cp <= 0x1FAFF) return false; // émojis
  if (cp >= 0x2600 && cp <= 0x27BF) return false;   // symboles et puces
  if (cp >= 0x2B00 && cp <= 0x2BFF) return false;   // symboles et flèches
  if (cp >= 0x2190 && cp <= 0x21FF) return false;   // flèches
  if (cp >= 0xFE00 && cp <= 0xFE0F) return false;   // sélecteurs de variante
  if (cp >= 0x2000 && cp <= 0x206F) return false;   // ponctuation générale
  if (cp >= 0x20A0 && cp <= 0x20BF) return false;   // symboles monétaires
  return (cp >= 0x3000 && cp <= 0x303F) ||   // ponctuation CJK
    (cp >= 0x3040 && cp <= 0x30FF) ||   // hiragana et katakana
    (cp >= 0x3400 && cp <= 0x4DBF) ||   // CJK étendu A
    (cp >= 0x4E00 && cp <= 0x9FFF) ||   // idéogrammes CJK
    (cp >= 0xF900 && cp <= 0xFAFF) ||   // idéogrammes de compatibilité
    (cp >= 0xAC00 && cp <= 0xD7AF) ||   // hangul
    (cp >= 0x1100 && cp <= 0x11FF) ||   // jamo
    (cp >= 0x0400 && cp <= 0x04FF) ||   // cyrillique
    (cp >= 0x0590 && cp <= 0x05FF) ||   // hébreu
    (cp >= 0x0600 && cp <= 0x06FF) ||   // arabe
    (cp >= 0x0900 && cp <= 0x097F) ||   // devanagari
    (cp >= 0x0E00 && cp <= 0x0E7F) ||   // thaï
    (cp >= 0x0370 && cp <= 0x03FF);     // grec
}

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (EXT.has(path.extname(e.name).toLowerCase())) acc.push(p);
  }
  return acc;
}

let problems = 0;
for (const file of walk(root)) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  if (rel === SELF) continue;              // ce fichier contient les plages de caractères
  const text = fs.readFileSync(file, 'utf8');
  text.split('\n').forEach((line, i) => {
    const bad = [...line].filter(c => isSuspect(c.codePointAt(0)));
    if (!bad.length) return;
    problems++;
    const unique = [...new Set(bad)].map(c => c + ' (U+' + c.codePointAt(0).toString(16).toUpperCase() + ')').join(', ');
    console.error(`  ${rel}:${i + 1}  ${unique}`);
    console.error(`      ${line.trim().slice(0, 110)}`);
  });
}

if (problems) {
  console.error(`\n${problems} ligne(s) à corriger.`);
  process.exit(1);
}
console.log('Encodage : aucun caractère non latin détecté.');
