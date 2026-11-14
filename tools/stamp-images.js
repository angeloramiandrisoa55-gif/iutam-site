// Ajoute une empreinte aux URL d'images dans le site construit.
//
// Les images sont servies avec « max-age=1 an, immutable » : si une photo est
// remplacée sans changer son nom, le navigateur garde l'ancienne pendant un an.
// En ajoutant l'empreinte du fichier à l'URL, toute photo modifiée est
// rechargée immédiatement — et le cache long reste valable pour les autres.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const out = process.argv[2];
if (!out) { console.error('Usage : node tools/stamp-images.js <dossier construit>'); process.exit(1); }

const imgDir = path.join(out, 'images');
if (!fs.existsSync(imgDir)) { console.error('dossier images introuvable'); process.exit(1); }

// 1. empreinte par fichier image
const empreintes = new Map();
for (const f of fs.readdirSync(imgDir)) {
  const p = path.join(imgDir, f);
  if (!fs.statSync(p).isFile()) continue;
  const h = crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex').slice(0, 8);
  empreintes.set(f, h);
}

// 2. remplacement dans les pages et les données
const cibles = [];
for (const f of fs.readdirSync(out)) {
  if (f.endsWith('.html') || f.endsWith('.json')) cibles.push(path.join(out, f));
}
for (const d of ['data', 'api', 'mg']) {
  const dir = path.join(out, d);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith('.html') || f.endsWith('.json')) cibles.push(path.join(dir, f));
  }
}

let n = 0;
for (const file of cibles) {
  let s = fs.readFileSync(file, 'utf8');
  const avant = s;
  s = s.replace(/images\/([A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp|svg))(?![?])/g, (m, nom) => {
    const h = empreintes.get(nom);
    return h ? 'images/' + nom + '?v=' + h : m;
  });
  if (s !== avant) { fs.writeFileSync(file, s, 'utf8'); n++; }
}

console.log('Empreintes d\'images : ' + empreintes.size + ' fichiers, ' + n + ' page(s) ou donnée(s) mise(s) à jour.');
