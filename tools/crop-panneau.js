// Recadre la photo du panneau Antsohihy sur le panneau lui-même (le texte
// « IUTAM — Annexe ANTSOHIHY — 60 m » devient lisible) et garde la photo
// complète sous un autre nom, pour la galerie.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const img = path.join(root, 'images');

(async () => {
  const src = path.join(img, 'antsohihy-panneau.jpg');

  // 1. la photo complète, redimensionnée (elle reste consultable en galerie)
  await sharp(src).resize({ width: 900, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(img, '_stand.jpg'));

  // 2. le panneau recadré : le texte devient lisible dans le cadre du carrousel
  await sharp(src).extract({ left: 228, top: 78, width: 404, height: 242 })
    .jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(img, '_panneau.jpg'));

  const f = await sharp(path.join(img, '_panneau.jpg')).metadata();
  const g = await sharp(path.join(img, '_stand.jpg')).metadata();
  console.log('panneau recadré : ' + f.width + 'x' + f.height);
  console.log('photo complète : ' + g.width + 'x' + g.height);
})();
