// Prépare le dossier _site/ : uniquement les fichiers publics (sans docs, tools, .github).
//   node tools/build-site.js                       -> Cloudflare Pages / Netlify / GitHub Pages
//   node tools/build-site.js --univ                -> serveur de l'Université (Apache .htaccess + IIS web.config, sans admin/)
//   node tools/build-site.js --univ --domain=iutam.mahajanga-univ.mg   -> remplace aussi l'adresse du site (SEO)
//   node tools/build-site.js --min                 -> minifie CSS, JS et HTML (réduction du poids)
const fs = require('fs'), path = require('path'), cp = require('child_process');
const univ = process.argv.includes('--univ');
const min = process.argv.includes('--min');
const domArg = process.argv.find(a => a.startsWith('--domain='));
const domain = domArg ? domArg.split('=')[1] : null;
const root = path.join(__dirname, '..'), out = path.join(root, '_site');
cp.execFileSync(process.execPath, [path.join(__dirname, 'build-mg.js')], { stdio: 'inherit' });
cp.execFileSync(process.execPath, [path.join(__dirname, 'build-api.js')], { stdio: 'inherit' });
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
const common = ['index.html', 'mentions-legales.html', '404.html', '503.html', 'css', 'js', 'fonts', 'images', 'data', 'mg',
  'favicon.ico', 'favicon.png', 'robots.txt', 'sitemap.xml', '.well-known'];
const items = common.concat(univ ? ['.htaccess', 'web.config'] : ['admin', '_headers', 'CNAME']);
let n = 0;
for (const i of items) { const s = path.join(root, i); if (fs.existsSync(s)) { fs.cpSync(s, path.join(out, i), { recursive: true }); n++; } }
// L'API publiée ne contient que les fichiers JSON générés : le code du Worker
// (api/worker.js) reste une source interne et n'est pas exposé sur le web.
fs.mkdirSync(path.join(out, 'api'), { recursive: true });
for (const f of fs.readdirSync(path.join(root, 'api'))) {
  if (f.endsWith('.json')) { fs.copyFileSync(path.join(root, 'api', f), path.join(out, 'api', f)); n++; }
}
if (domain) {
  for (const f of ['index.html', 'mg/index.html', 'robots.txt', 'sitemap.xml', '.well-known/security.txt', 'api/openapi.json']) {
    const p = path.join(out, f); fs.writeFileSync(p, fs.readFileSync(p, 'utf8').split('www.VOTRE-DOMAINE.mg').join(domain));
  }
}
if (min) {
  cp.execFileSync(process.execPath, [path.join(__dirname, 'minify.js'), out], { stdio: 'inherit' });
}
console.log(`_site/ prêt (${univ ? 'serveur Université' : 'hébergeur cloud'}${domain ? ', domaine ' + domain : ''}${min ? ', minifié' : ''}) : ${n} éléments copiés.`);
