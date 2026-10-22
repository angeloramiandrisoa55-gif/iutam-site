// Reconstruit tools/mg.json à partir d'une page malgache officielle.
//
//   node tools/align-mg.js <page-malgache-officielle.html>
//
// Méthode :
//   1. on découpe index.html (français) et mg/index.html (malgache actuel) en
//      unités : ces deux pages ont exactement la même structure, donc les
//      unités se correspondent position par position ;
//   2. on aligne mg/index.html avec la page officielle (deux malgaches : le
//      rapprochement est fiable) ;
//   3. on reporte la traduction officielle sur la clé française correspondante.
//
// L'alignement par programmation dynamique (Needleman-Wunsch) gère les
// légères différences de structure entre les deux versions.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const OFF = process.argv[2] || path.join(process.env.TEMP, 'opencode', 'officiel-mg.html');
if (!fs.existsSync(OFF)) {
  console.error('Page malgache officielle introuvable : ' + OFF);
  console.error('Usage : node tools/align-mg.js <fichier.html>');
  process.exit(1);
}
const ATTRS = ['alt', 'title', 'aria-label', 'placeholder'];

function unites(src) {
  const out = [];
  let skip = 0;
  for (const part of src.split(/(<[^>]+>)/)) {
    if (!part) continue;
    if (part[0] === '<') {
      const tag = /^<\/?\s*([a-zA-Z0-9-]+)/.exec(part);
      const name = tag ? tag[1].toLowerCase() : '';
      const closing = part[1] === '/';
      if ((name === 'script' || name === 'style') && !closing) skip++;
      else if ((name === 'script' || name === 'style') && closing) skip = Math.max(0, skip - 1);
      if (skip || part.startsWith('<!--') || part.startsWith('<!') || closing) continue;
      for (const a of ATTRS) {
        const m = new RegExp('\\b' + a + '="([^"]*)"').exec(part);
        if (m && m[1].trim()) out.push({ type: 'attr:' + a, value: m[1] });
      }
      continue;
    }
    if (skip) continue;
    // Le texte est conservé tel quel (espaces significatifs compris) : la
    // clé doit correspondre littéralement à ce qui figure dans index.html.
    const t = part.replace(/\s+/g, ' ').replace(/^\s+/, '');
    if (t.trim()) out.push({ type: 'text', value: t.trim(), raw: t });
  }
  return out;
}

const mots = s => new Set(String(s).toLowerCase().replace(/[^\p{L}\p{N}']+/gu, ' ').split(' ').filter(w => w.length > 2));

/** Similarité entre deux textes malgaches. */
function similarite(a, b) {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  if (a === b) return 1;
  const ma = mots(a), mb = mots(b);
  let communs = 0;
  for (const w of ma) if (mb.has(w)) communs++;
  const jac = communs / Math.max(1, ma.size + mb.size - communs);
  const lr = Math.min(a.length, b.length) / Math.max(a.length, b.length);
  return 0.75 * jac + 0.25 * lr;
}

const fr = unites(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
const moi = unites(fs.readFileSync(path.join(root, 'mg', 'index.html'), 'utf8'));
const off = unites(fs.readFileSync(OFF, 'utf8'));

console.log('unités : FR ' + fr.length + ' | malgache actuel ' + moi.length + ' | officiel ' + off.length);
if (fr.length !== moi.length) { console.error('la page malgache actuelle ne correspond plus au français'); process.exit(2); }

// --- alignement par programmation dynamique ------------------------------------
const n = moi.length, m = off.length;
const dp = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
for (let i = 1; i <= n; i++) dp[i][0] = dp[i - 1][0] - 0.6;
for (let j = 1; j <= m; j++) dp[0][j] = dp[0][j - 1] - 0.6;
for (let i = 1; i <= n; i++) {
  for (let j = 1; j <= m; j++) {
    const s = similarite(moi[i - 1].value, off[j - 1].value);
    dp[i][j] = Math.max(dp[i - 1][j - 1] + s, dp[i - 1][j] - 0.6, dp[i][j - 1] - 0.6);
  }
}
const back = [];
let i = n, j = m;
while (i > 0 || j > 0) {
  if (i > 0 && j > 0) {
    const s = similarite(moi[i - 1].value, off[j - 1].value);
    if (Math.abs(dp[i][j] - (dp[i - 1][j - 1] + s)) < 1e-9) { back.push([i - 1, j - 1, s]); i--; j--; continue; }
  }
  if (i > 0 && Math.abs(dp[i][j] - (dp[i - 1][j] - 0.6)) < 1e-9) { back.push([i - 1, -1, 0]); i--; continue; }
  back.push([-1, j - 1, 0]); j--;
}
back.reverse();

// --- application -----------------------------------------------------------------
const dict = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'mg.json'), 'utf8'));
let appliques = 0, ignores = 0;
const faible = [];
const rapport = [];

for (const [ai, bi, score] of back) {
  if (ai < 0 || bi < 0) { ignores++; continue; }
  // La clé doit être le texte FRANÇAIS BRUT (avec &nbsp; etc.) : le
  // remplacement dans build-mg.js est littéral.
  const cle = (fr[ai].raw !== undefined ? fr[ai].raw : fr[ai].value);
  const officiel = off[bi].value;
  if (!cle || !officiel || cle === officiel) { ignores++; continue; }
  if (score < 0.45) { faible.push(cle + ' ⟵ ' + officiel + ' (' + score.toFixed(2) + ')'); }
  if (dict[cle] !== officiel) {
    rapport.push((cle in dict ? '~ ' : '+ ') + cle + '  ⟵  ' + officiel);
    dict[cle] = officiel;
    appliques++;
  }
}

fs.writeFileSync(path.join(root, 'tools', 'mg.json'), JSON.stringify(dict, null, 1), 'utf8');
console.log('\n' + appliques + ' chaîne(s) mise(s) à jour avec le texte officiel, ' + ignores + ' inchangée(s)');
if (faible.length) {
  console.log('\nÀ vérifier (' + faible.length + ') :');
  faible.forEach(f => console.log('  ' + f));
}
fs.writeFileSync(path.join(process.env.TEMP, 'opencode', 'rapport-mg.txt'), rapport.join('\n'), 'utf8');
console.log('\nrapport : ' + path.join(process.env.TEMP, 'opencode', 'rapport-mg.txt'));
