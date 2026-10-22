const fs = require('fs');
const path = require('path');
const src = path.join(process.env.TEMP, 'opencode', 'officiel-mg.html');

const ATTRS = ['alt', 'title', 'aria-label', 'placeholder'];
function unites(s) {
  const out = [];
  let skip = 0;
  for (const part of s.split(/(<[^>]+>)/)) {
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
    const t = part.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    if (t) out.push({ type: 'text', value: t });
  }
  return out;
}

const mg = unites(fs.readFileSync(src, 'utf8'));
const fr = unites(fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8'));
console.log('FR', fr.length, 'MG', mg.length);

// trouver la première zone de divergence : là où les longueurs s'écartent
for (let i = 0; i < Math.min(fr.length, mg.length); i++) {
  const a = fr[i].value, b = mg[i].value;
  const ratio = Math.abs(a.length - b.length) / Math.max(a.length, b.length);
  if (ratio > 0.55) {
    console.log('\ndivergence probable à l\'unité ' + i);
    for (let j = Math.max(0, i - 3); j < Math.min(fr.length, mg.length, i + 4); j++) {
      console.log('  ' + j + ' FR: ' + fr[j].value.slice(0, 80));
      console.log('    MG: ' + mg[j].value.slice(0, 80));
    }
    break;
  }
}
