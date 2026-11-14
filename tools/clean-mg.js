// Nettoyage du dictionnaire de traduction.
//
// Deux cas :
//  1. une clé n'apparaît plus dans index.html (texte modifié ou supprimé)
//     → elle est retirée ;
//  2. une clé est masquée par une autre qui ne diffère que par des espaces
//     (par exemple « Formation… » et «␣Formation… ») : c'est la plus longue
//     qui est appliquée. On transpose donc la traduction sur la clé
//     réellement utilisée, puis on retire la doublon.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.join(__dirname, '..');
const mgPath = path.join(root, 'tools', 'mg.json');

// 1. les clés inutilisées, selon le générateur
const res = spawnSync(process.execPath, [path.join(root, 'tools', 'build-mg.js')], { encoding: 'utf8' });
const sortie = String(res.stdout || '') + String(res.stderr || '');
const inutiles = [];
const bloc = sortie.split('absentes de index.html')[1] || '';
for (const ligne of bloc.split('\n')) {
  const m = /^\s*-\s(.+)$/.exec(ligne);
  if (m) inutiles.push(m[1].replace(/\s+$/, ''));
}

const d = JSON.parse(fs.readFileSync(mgPath, 'utf8'));
const norm = s => String(s).replace(/\s+/g, ' ').trim();
let retirees = 0, transposes = 0;

for (const k of inutiles) {
  // la clé réellement utilisée : même texte, mais avec un espace en tête
  const candidates = Object.keys(d).filter(c => c !== k && norm(c) === norm(k));
  if (candidates.length === 1 && k in d) {
    d[candidates[0]] = d[k];       // on garde la traduction officielle
    transposes++;
  }
  if (k in d) { delete d[k]; retirees++; }
}

// 2. les clés réellement absentes de index.html
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let absentes = 0;
for (const k of Object.keys(d)) {
  if (!html.includes(k)) { delete d[k]; absentes++; }
}

fs.writeFileSync(mgPath, JSON.stringify(d, null, 1), 'utf8');
console.log(retirees + ' clé(s) retirée(s), ' + transposes + ' transposée(s), ' + absentes + ' absente(s) retirée(s)');
console.log('entrées restantes : ' + Object.keys(d).length);
