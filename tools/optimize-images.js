// Optimisation des images du site (redimensionnement, conversion WebP, recadrage).
//
//   node tools/optimize-images.js [dossier]                    -> redimensionne tout
//   node tools/optimize-images.js <fichier> --crop-bottom=12   -> recadre le bas (filigrane)
//   node tools/optimize-images.js <fichier> --webp             -> crée aussi une version .webp
//
// Nécessite « sharp » (installé à la demande) :
//   npm install --no-save sharp
//
// Le site n'a AUCUNE dépendance de production : sharp n'est utile que le temps
// de préparer les photos. Sans sharp, le script explique comment faire à la main.
//
// Bonnes pratiques pour les photos du site :
//   - largeur 1200 px maximum, qualité JPEG 78-82
//   - recadrer les filigranes de l'appareil photo avant la mise en ligne
//   - ne pas photographs les personnes sans leur accord (voir README)

const fs = require('fs');
const path = require('path');

let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('Le module « sharp » n\'est pas installé.');
  console.error('Pour traiter les images :');
  console.error('  npm install --no-save sharp');
  console.error('');
  console.error('Sans lui, utilisez l\'outil en ligne squoosh.app :');
  console.error('  - largeur maximale 1200 px');
  console.error('  - qualité 78-82');
  console.error('  - recadrez le filigrane de l\'appareil photo');
  process.exit(1);
}

const args = process.argv.slice(2);
const opt = n => {
  const a = args.find(x => x.startsWith('--' + n + '='));
  return a ? parseFloat(a.split('=')[1]) : null;
};
const largeur = opt('width') || 1200;
const qualite = Math.round((opt('quality') || 80));
const cropBottom = opt('crop-bottom');
const wantWebp = args.includes('--webp');

function listImages(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listImages(p, acc);
    else if (/\.(jpe?g|png)$/i.test(e.name)) acc.push(p);
  }
  return acc;
}

async function treat(file) {
  const before = fs.statSync(file).size;
  let img = sharp(file);
  const meta = await img.metadata();
  let pipeline = img.rotate();

  if (cropBottom) {
    // on retire le pourcentage indiqué du bas (filigrane de l'appareil photo)
    const cut = Math.round((meta.height || 0) * (cropBottom / 100));
    if (cut > 0) pipeline = pipeline.extract({ left: 0, top: 0, width: meta.width, height: (meta.height || 0) - cut });
  }
  if ((meta.width || 0) > largeur) {
    pipeline = pipeline.resize({ width: largeur, withoutEnlargement: true });
  }
  const out = file.replace(/\.(jpe?g|png)$/i, '.jpg');
  await pipeline.jpeg({ quality: qualite, mozjpeg: true }).toFile(out);
  if (out !== file) fs.unlinkSync(file);

  let extra = '';
  if (wantWebp) {
    const webp = out.replace(/\.jpg$/i, '.webp');
    await sharp(out).webp({ quality: qualite }).toFile(webp);
    extra = ' + WebP ' + Math.round(fs.statSync(webp).size / 1024) + ' Ko';
  }
  const after = fs.statSync(out).size;
  console.log('  ' + path.basename(out) + ' : ' + Math.round(before / 1024) + ' → ' + Math.round(after / 1024) + ' Ko' + extra);
  return after;
}

(async () => {
  const cible = args.find(a => !a.startsWith('--'));
  if (!cible) {
    console.error('Usage : node tools/optimize-images.js <fichier ou dossier> [--width=1200] [--quality=80] [--crop-bottom=12] [--webp]');
    process.exit(1);
  }
  const fichiers = fs.statSync(cible).isDirectory()
    ? listImages(cible)
    : [cible];
  if (!fichiers.length) { console.error('Aucune image trouvée.'); process.exit(1); }
  console.log('Optimisation de ' + fichiers.length + ' image(s) :');
  for (const f of fichiers) {
    try { await treat(f); } catch (e) { console.error('  ' + path.basename(f) + ' : échec — ' + e.message); }
  }
  console.log('Terminé. Contrôlez le rendu avant de publier.');
})();
