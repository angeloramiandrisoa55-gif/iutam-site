// Vérifie la syntaxe de tous les fichiers JavaScript du projet.
//   node tools/check-syntax.js
//
// Un caractère parasite (octets nuls, guillemet mal fermé) passe parfois
// inaperçu ; ce contrôle arrête la publication avant la mise en ligne.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const SKIP = new Set(['.git', 'node_modules', '_site', 'backup', 'vendor']);

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.js')) acc.push(p);
  }
  return acc;
}

let ko = 0;
for (const file of walk(root)) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  // caractères de contrôle inattendus
  const raw = fs.readFileSync(file);
  const ctrl = [...raw].filter(c => {
    const k = c;
    return (k < 32 && k !== 9 && k !== 10 && k !== 13) || k === 127;
  });
  if (ctrl.length) {
    console.error('  ' + rel + ' : ' + ctrl.length + ' caractère(s) de contrôle parasites');
    ko++;
  }
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (e) {
    console.error('  ' + rel + ' : ' + String(e.stderr || e.message).split('\n').slice(0, 3).join(' '));
    ko++;
  }
}

if (ko) {
  console.error('\n' + ko + ' fichier(s) en erreur.');
  process.exit(1);
}
console.log('Syntaxe JavaScript : tout est correct.');
