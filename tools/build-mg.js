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
html = html.replace(new RegExp(keys.map(esc).join('|'), 'g'), m => { used.add(m); return dict[m]; });
html = html
  .replace('<html lang="fr">', '<html lang="mg" data-root="../">')
  .replace('fr_MG', 'mg_MG')
  .replace('<a class="lang" href="mg/" hreflang="mg" lang="mg" title="Teny malagasy">MG</a>',
           '<a class="lang" href="../" hreflang="fr" lang="fr" title="Français">FR</a>')
  .replace('<link rel="canonical" href="https://www.VOTRE-DOMAINE.mg/">', '<link rel="canonical" href="https://www.VOTRE-DOMAINE.mg/mg/">')
  .replace('<meta property="og:url" content="https://www.VOTRE-DOMAINE.mg/">', '<meta property="og:url" content="https://www.VOTRE-DOMAINE.mg/mg/">')
  .replace(/(src|href)="(css|js|images|favicon|data|mentions-legales)/g, '$1="../$2');
fs.mkdirSync(path.join(root, 'mg'), { recursive: true });
fs.writeFileSync(path.join(root, 'mg', 'index.html'), html);
const unused = keys.filter(k => !used.has(k));
console.log(`mg/index.html généré : ${used.size}/${keys.length} traductions appliquées.`);
if (unused.length) { console.warn('⚠ Entrées de mg.json absentes de index.html (texte modifié ?) :'); unused.forEach(k => console.warn(' - ' + k.slice(0, 90))); }
