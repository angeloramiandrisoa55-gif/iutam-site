// Génère mg/index.html (version malagasy) à partir de index.html (version française, source unique)
// et du dictionnaire tools/mg.json  { "texte français exact": "traduction malagasy" }.
// Usage : node tools/build-mg.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const dict = JSON.parse(fs.readFileSync(path.join(__dirname, 'mg.json'), 'utf8'));
const keys = Object.keys(dict).sort((a, b) => b.length - a.length);   // les phrases longues d'abord
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const used = new Set();

// 1. Le lien de langue est remplacé AVANT la traduction du texte : les deux
//    pages ne contiennent pas le même lien (la française propose le
//    malagache, la malagache propose le français) et il ne doit donc jamais
//    passer par le dictionnaire.
html = html.replace(
  /<a class="lang" href="mg\/"[^>]*>MG<\/a>/,
  '<a class="lang" href="../" hreflang="fr" lang="fr" title="Frantsay">FR</a>'
);

// 2. Traduction du texte
html = html.replace(new RegExp(keys.map(esc).join('|'), 'g'), m => { used.add(m); return dict[m]; });

// 2b. Barre de navigation malagasy : libellés COURTS (les intitulés officiels sont
//     trop longs : la barre débordait). Ne touche ni mg.json ni les titres de
//     sections, qui gardent leur traduction officielle. [libellé court, intitulé
//     officiel affiché en infobulle quand il diffère]
const NAV_MG = {
  '#about':      ['Momba ny IUTAM',  "Ny Ivontoeram-pampianarana"],
  '#vie':        ['Fiainana',        "Fiainan'ny mpianatra"],
  '#formations': ['Fiofanana',       ''],
  '#debouches':  ['Fahafahana asa',  "Sehatra arak'asa sy fahafahana miasa"],
  '#admission':  ['Hisoratra anarana', 'Fidirana'],
  '#frais':      ['Saram-pianarana', ''],
  '#faq':        ['Fanontaniana',    'Fanontaniana apetraka matetika'],
  '#actus':      ['Vaovao',          ''],
  '#contact':    ['Fifandraisana',   '']
};
const CTA_MG = 'Hisoratra izao';
html = html.replace(/<nav id="nav"[\s\S]*?<\/nav>/, nav => nav.replace(
  /<a href="(#[a-z]+)">[^<]*<\/a>/g,
  (m, h) => NAV_MG[h] ? `<a href="${h}"${NAV_MG[h][1] ? ` title="${NAV_MG[h][1]}"` : ''}>${NAV_MG[h][0]}</a>` : m
));
html = html.replace(/(<a class="cta (?:hd|nav)-cta"[^>]*>)[^<]*(<\/a>)/g, `$1${CTA_MG}$2`);

// 2c. Cartes de chiffres (« À propos ») : intitulés abrégés pour que les 4 cartes
//     gardent la même hauteur (les intitulés officiels, repris ailleurs dans la page,
//     tiennent sur 3 lignes dans une carte).
html = html.replace(/<div class="stats rv">[\s\S]*?\n  <\/div>/, bloc => bloc
  .replace("Diplaoma Injeniera amin'ny ambaratonga Mastera", 'Injeniera (Mastera)')
  .replace("Hetsika aseho ao amin'ny toerana fampirantiana", 'Hetsika aseho'));

// 3. Ajustements propres à la version malgache
html = html
  .replace('<html lang="fr">', '<html lang="mg" data-root="../">')
  .replace('fr_MG', 'mg_MG')
  .replace('<link rel="canonical" href="https://iutam.univ.mg/">', '<link rel="canonical" href="https://iutam.univ.mg/mg/">')
  .replace('<meta property="og:url" content="https://iutam.univ.mg/">', '<meta property="og:url" content="https://iutam.univ.mg/mg/">')
  .replace(/(src|href)="(css|js|images|favicon|data|mentions-legales)/g, '$1="../$2')
  // chemins d'images utilisés dans des styles en ligne (fonds des bandeaux)
  .replace(/(url\(\s*["']?)images\//g, '$1../images/');

fs.mkdirSync(path.join(root, 'mg'), { recursive: true });
fs.writeFileSync(path.join(root, 'mg', 'index.html'), html);
const unused = keys.filter(k => !used.has(k));
console.log(`mg/index.html généré : ${used.size}/${keys.length} traductions appliquées.`);
if (unused.length) { console.warn('⚠ Entrées de mg.json absentes de index.html (texte modifié ?) :'); unused.forEach(k => console.warn(' - ' + k)); }
