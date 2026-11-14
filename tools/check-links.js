// Vérifie les liens internes et les ressources référencées par les pages.
//   node tools/check-links.js
//
// Contrôle : fichiers internes existants, ancres présentes, images déclarées
// (avec leurs attributs width/height et un texte alternatif), liens externes
// bien formés. Sortie : code 1 si une erreur bloquante est détectée.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pages = ['index.html', 'mg/index.html', 'mentions-legales.html', '404.html', '503.html'];

let errors = 0, warnings = 0;
const err = m => { console.error('  ERREUR  ' + m); errors++; };
const warn = m => { console.log('  avert. ' + m); warnings++; };

for (const page of pages) {
  const file = path.join(root, page);
  if (!fs.existsSync(file)) { err(`${page} : fichier absent`); continue; }
  const html = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);
  console.log(`\n${page}`);

  // --- ressources (src, href) -------------------------------------------------
  const attrs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]);
  for (const a of attrs) {
    if (/^(https?:|mailto:|tel:|data:|#|javascript:)/i.test(a)) {
      if (/^javascript:/i.test(a)) err(`lien javascript: interligne — ${a}`);
      if (/^http:\/\//i.test(a) && !/^http:\/\/localhost/i.test(a)) {
        warn(`ressource en HTTP non chiffré : ${a}`);
      }
      continue;
    }
    const clean = a.split('#')[0].split('?')[0];
    if (!clean) continue;
    // chemin absolu (« /foo ») : relatif à la racine du site
    // chemin relatif (« ../foo ») : relatif au dossier de la page
    const target = clean.startsWith('/')
      ? path.join(root, clean)
      : path.resolve(dir, clean);
    if (!fs.existsSync(target)) err(`ressource manquante : ${a}`);
  }

  // --- ancres internes ---------------------------------------------------------
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    if (!ids.has(m[1])) err(`ancre interne introuvable : #${m[1]}`);
  }

  // --- images : attributs obligatoires -------------------------------------------
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const src = (/\ssrc="([^"]*)"/.exec(tag) || [])[1] || '';
    if (!src) { err('image sans attribut src'); continue; }
    if (!/\salt="/.test(tag)) err(`image sans texte alternatif : ${src}`);
    if (!/\swidth="/.test(tag) || !/\sheight="/.test(tag)) {
      warn(`image sans dimensions (décalage de mise en page) : ${src}`);
    }
    if (!/loading="lazy"/.test(tag) && !/fetchpriority/.test(tag) && !/logo\.jpg/.test(src)) {
      warn(`image sans chargement différé : ${src}`);
    }
  }

  // --- liens externes -----------------------------------------------------------
  for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    const u = m[1];
    if (!/^https:\/\//i.test(u)) warn(`lien externe non chiffré : ${u}`);
    if (/^https?:\/\/(www\.)?VOTRE-DOMAINE/i.test(u)) warn(`domaine non remplacé : ${u}`);
  }

  // --- balises de base -----------------------------------------------------------
  const isErrorPage = /^(404|503)\.html$/.test(page);
  for (const tag of ['<title>', 'name="description"']) {
    if (!html.includes(tag)) err(`balise manquante : ${tag}`);
  }
  // Les pages d'erreur ne sont pas indexées : pas de canonique.
  if (!isErrorPage && !html.includes('rel="canonical"')) err('balise manquante : rel="canonical"');
  if (isErrorPage && !/name="robots"[^>]*noindex/.test(html)) err('page d\'erreur sans balise noindex');
  if (!/lang="(fr|mg)"/.test(html)) err('attribut lang absent ou incorrect');
}

console.log(`\n${errors} erreur(s), ${warnings} avertissement(s).`);
if (errors) {
  console.error('Vérification des liens : ÉCHEC');
  process.exit(1);
}
console.log('Vérification des liens : OK');
