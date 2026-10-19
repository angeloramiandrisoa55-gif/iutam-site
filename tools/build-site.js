// Prépare le dossier _site/ : uniquement les fichiers publics (sans docs, tools, .github).
//   node tools/build-site.js                       -> Cloudflare Pages / Netlify / GitHub Pages
//   node tools/build-site.js --univ                -> serveur de l'Université (Apache .htaccess + IIS web.config, sans admin/)
//   node tools/build-site.js --univ --domain=iutam.mahajanga-univ.mg   -> remplace aussi l'adresse du site (SEO)
const fs = require('fs'), path = require('path'), cp = require('child_process');
const univ = process.argv.includes('--univ');
const domArg = process.argv.find(a => a.startsWith('--domain='));
const domain = domArg ? domArg.split('=')[1] : null;
const root = path.join(__dirname, '..'), out = path.join(root, '_site');
cp.execFileSync(process.execPath, [path.join(__dirname, 'build-mg.js')], { stdio: 'inherit' });
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
const common = ['index.html', 'mentions-legales.html', '404.html', 'css', 'js', 'fonts', 'images', 'data', 'mg',
  'favicon.ico', 'favicon.png', 'robots.txt', 'sitemap.xml', '.well-known'];
const items = common.concat(univ ? ['.htaccess', 'web.config'] : ['admin', '_headers', 'CNAME']);
let n = 0;
for (const i of items) { const s = path.join(root, i); if (fs.existsSync(s)) { fs.cpSync(s, path.join(out, i), { recursive: true }); n++; } }
if (domain) {
  for (const f of ['index.html', 'mg/index.html', 'robots.txt', 'sitemap.xml', '.well-known/security.txt']) {
    const p = path.join(out, f); fs.writeFileSync(p, fs.readFileSync(p, 'utf8').split('www.VOTRE-DOMAINE.mg').join(domain));
  }
}
console.log(`_site/ prêt (${univ ? 'serveur Université' : 'hébergeur cloud'}${domain ? ', domaine ' + domain : ''}) : ${n} éléments copiés.`);
