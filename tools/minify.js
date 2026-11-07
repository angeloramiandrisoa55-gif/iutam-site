// Minification des fichiers statiques (CSS, JS, HTML) — sans dépendance externe.
//   node tools/minify.js <dossier>
// Utilisé par tools/build-site.js --min et par le pipeline GitHub Actions.
//
// Choix de prudence : aucune transformation de code, uniquement des suppressions
// de commentaires, de blancs et de caractères manifestement inutiles. Le JS est
// réécrit ligne par ligne (jamais de « minification » de type Closure) : les
// retours à la ligne sont conservés, ce qui supprime tout risque lié à
// l'insertion automatique de points-virgules.
const fs = require('fs');
const path = require('path');

/* ------------------------------------------------------------------- CSS */

/** Minification CSS : retire commentaires et blancs superflus, en ignorant les chaînes. */
function minifyCss(css) {
  let out = '';
  let i = 0;
  const n = css.length;
  while (i < n) {
    const c = css[i];
    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    if (c === '"' || c === "'") {
      const quote = c;
      out += c; i++;
      while (i < n) {
        if (css[i] === '\\') { out += css[i] + (css[i + 1] || ''); i += 2; continue; }
        out += css[i];
        if (css[i] === quote) { i++; break; }
        i++;
      }
      continue;
    }
    out += c; i++;
  }
  return out
    .replace(/\s*([{}:;,>~+])\s*/g, '$1')
    .replace(/;}/g, '}')
    .replace(/\s+/g, ' ')
    .replace(/ ?!important/g, '!important')
    .trim();
}

/* ------------------------------------------------------------------- JS */

/**
 * Minification « sûre » du JavaScript : suppression des lignes de commentaire,
 * des lignes vides et de l'indentation. Les retours à la ligne sont conservés,
 * donc aucun risque d'insertion automatique de point-virgule (ASI), et aucune
 * analyse d'expression régulière n'est nécessaire (ce qui évite de casser
 * `/^\d+$/` ou les URL `https://…`).
 */
function minifyJs(js) {
  return js.split('\n')
    .map(line => {
      const t = line.trim();
      // ligne entièrement composée d'un commentaire « // »
      if (t.startsWith('//')) return '';
      // ligne entièrement composée d'un commentaire de bloc « /* … */ »
      if (t.startsWith('/*') && t.endsWith('*/')) return '';
      return t;
    })
    .filter(l => l.length > 0)
    .join('\n');
}

/* ------------------------------------------------------------------ HTML */

/**
 * Minification HTML prudente : retire les commentaires et les espaces qui séparent
 * deux balises. Les espaces à l'intérieur des attributs ou du texte ne sont pas
 * touchés, ce qui évite de modifier le contenu affiché.
 */
function minifyHtml(html) {
  return html
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}(?=>)/g, '')
    .trim();
}

/* ------------------------------------------------------------------- run */

function minifyFile(file) {
  const ext = path.extname(file).toLowerCase();
  const src = fs.readFileSync(file, 'utf8');
  let out;
  if (ext === '.css') out = minifyCss(src);
  else if (ext === '.js') out = minifyJs(src);
  else if (ext === '.html') out = minifyHtml(src);
  else return null;
  if (out === src) return { file, before: src.length, after: out.length, changed: false };
  fs.writeFileSync(file, out);
  return { file, before: src.length, after: out.length, changed: true };
}

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const target = process.argv[2];
if (!target) {
  console.error('Usage : node tools/minify.js <dossier>');
  process.exit(1);
}
if (!fs.existsSync(target)) {
  console.error('Dossier introuvable : ' + target);
  process.exit(1);
}

const files = walk(target).filter(f => ['.css', '.js', '.html'].includes(path.extname(f).toLowerCase()));
let before = 0, after = 0, n = 0;
for (const f of files) {
  const r = minifyFile(f);
  if (!r) continue;
  before += r.before; after += r.after; n++;
}
const pct = before ? Math.round((1 - after / before) * 100) : 0;
console.log(`minification : ${n} fichiers, ${(before / 1024).toFixed(1)} Ko → ${(after / 1024).toFixed(1)} Ko (−${pct} %)`);
