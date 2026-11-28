// Compare la page malgache générée avec la page malgache officielle.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const OFF = process.argv[2] || path.join(process.env.TEMP, 'opencode', 'officiel-mg.html');
if (!fs.existsSync(OFF)) { console.error('Page malgache officielle introuvable : ' + OFF); process.exit(1); }

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
        if (m && m[1].trim()) out.push(a + ' | ' + m[1]);
      }
      continue;
    }
    if (skip) continue;
    const t = part.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    if (t) out.push(t);
  }
  return out;
}

const mien = unites(fs.readFileSync(path.join(root, 'mg', 'index.html'), 'utf8'));
const off = unites(fs.readFileSync(OFF, 'utf8'));

console.log('générée : ' + mien.length + ' unités | officielle : ' + off.length + ' unités\n');

const max = Math.max(mien.length, off.length);
let ecarts = 0;
for (let i = 0; i < max; i++) {
  const a = mien[i], b = off[i];
  if (a === b) continue;
  // tolerant : on ignore les differences de ponctuation/espaces
  const norm = s => String(s || '').replace(/[«»"'’‘.,;:·]/g, '').replace(/\s+/g, ' ').trim();
  if (norm(a) === norm(b)) continue;
  ecarts++;
  if (ecarts <= 25) {
    console.log('#' + i);
    console.log('  officiel  : ' + String(b).slice(0, 100));
    console.log('  générée   : ' + String(a).slice(0, 100));
  }
}
console.log('\n' + ecarts + ' écart(s) sur ' + max + ' unités');
