// Contrôle de la lisibilité des textes posés sur les photos.
//   node tools/check-contraste.js
//
// Le texte blanc du panneau des parcours est posé sur une photo : sa
// lisibilité ne dépend pas du contraste « CSS » (que Lighthouse ne peut pas
// évaluer sur une image de fond), mais de l'opacité du voile posé dessus.
//
// On calcule le contraste garanti dans le pire cas : un pixel blanc de la
// photo. Le voile a deux couches (horizontale et verticale) ; on les compose.
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');

const regles = [...css.matchAll(/\.ps-ov\{([^}]*)\}/gs)].map(m => m[1]);
const pertinent = regles.filter(r => r.includes('rgba(3,14,10'));
if (!pertinent.length) { console.error('voile du carrousel introuvable'); process.exit(1); }
const regle = pertinent[pertinent.length - 1];

function couche(angle) {
  // On découpe la règle en deux gradients (les rgba() contiennent des parenthèses)
  const marqueur = 'linear-gradient(' + angle + 'deg';
  const i = regle.indexOf(marqueur);
  if (i < 0) return [];
  // début du segment, jusqu'au gradient suivant ou à la fin de la règle
  const suite = regle.indexOf('linear-gradient(', i + marqueur.length);
  const segment = regle.slice(i + marqueur.length, suite < 0 ? regle.length : suite);
  return [...segment.matchAll(/rgba\(3,14,10,([\d.]+)\)\s*([\d.]+)%/g)]
    .map(e => ({ opacite: parseFloat(e[1]), jusqua: parseFloat(e[2]) }));
}
const H = couche(90);
const V = couche(180);

const lum = v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const L = (r, g, b) => 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
const contraste = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
const BLANC = L(255, 255, 255);
const VOILE = [3, 14, 10];

/** Opacité du voile sur un pixel blanc de la photo. */
function contrastePour(opacite) {
  const r = opacite * VOILE[0] + (1 - opacite) * 255;
  const g = opacite * VOILE[1] + (1 - opacite) * 255;
  const b = opacite * VOILE[2] + (1 - opacite) * 255;
  return contraste(BLANC, L(r, g, b));
}

console.log('Lisibilité du texte blanc posé sur les photos');
console.log('pire cas : pixel blanc de la photo\n');
console.log('  couche horizontale (largeur de la zone de texte)');
console.log('  position   opacité   contraste   exigence 4,5:1');

let ok = true;
let debut = 0;
for (const e of H) {
  const c = contrastePour(e.opacite);
  const passe = c >= 4.5;
  // la zone de texte s'arrête là où la colonne de texte se termine
  if (passe || e.jusqua >= 62) {
    if (!passe && e.jusqua < 62) ok = false;
    console.log('  ' + String(debut).padStart(3) + ' → ' + String(e.jusqua).padStart(3) + '%   ' +
      e.opacite.toFixed(2).padStart(7) + '    ' + c.toFixed(1).padStart(6) + '×    ' + (passe ? 'OK' : 'ÉCHEC'));
  }
  debut = e.jusqua;
}

console.log('\n  couche verticale (haut et bas de la diapositive) :');
for (const e of V) {
  console.log('  ' + String(e.jusqua).padStart(3) + '%   opacité ' + e.opacite.toFixed(2) +
    '   contraste ' + contrastePour(e.opacite).toFixed(1) + '×');
}

// La colonne de texte occupe environ 62 % de la largeur du panneau.
const couverture = H.filter(e => e.jusqua <= 62);
const garantie = Math.min.apply(null, couverture.map(e => contrastePour(e.opacite)));
console.log('\n  Zone de texte (0 à 62 % de la largeur) : contraste garanti minimal ' + garantie.toFixed(1) + '×');
if (garantie < 4.5) ok = false;

console.log('\n' + (ok ? 'Contraste suffisant sur toute la zone de texte.' : 'ATTENTION : contraste insuffisant.'));
process.exit(ok ? 0 : 1);
