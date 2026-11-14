// Sauvegarde locale du site (hors ligne, sans dépendance externe).
//   node tools/backup.js                 -> crée une archive dans backup/
//   node tools/backup.js --list          -> liste les sauvegardes existantes
//   node tools/backup.js --restore=xxx   -> restaure une sauvegarde (réécrit le site)
//
// L'archive contient le site construit (_site) et les sources, à l'exclusion
// des fichiers temporaires. Voir docs/SECURITE.md pour la procédure complète.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const backupDir = path.join(root, 'backup');
const EXCLUDE = new Set(['.git', 'node_modules', 'backup', '.cache']);

function stamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

function collect(dir, acc = [], base = dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) collect(p, acc, base);
    else if (e.isFile()) acc.push({ path: path.relative(base, p).split(path.sep).join('/'), full: p });
  }
  return acc;
}

/**
 * Archive au format tar (sans dépendance). Un seul fichier est produit :
 * l'archive est ensuite compressée avec gzip (zlib, fourni par Node).
 */
function createTar(files) {
  const chunks = [];
  const push = buf => chunks.push(buf);
  const header = (name, size, mtime, type) => {
    const h = Buffer.alloc(512);
    h.write(name.slice(0, 100), 0, 100, 'utf8');
    h.write('000644 \0', 100, 8, 'utf8');
    h.write('000000 \0', 108, 8, 'utf8');
    h.write('000000 \0', 116, 8, 'utf8');
    h.write(size.toString(8).padStart(11, '0') + ' ', 124, 12, 'utf8');
    h.write(mtime.toString(8).padStart(11, '0') + ' ', 136, 12, 'utf8');
    h.write('        ', 148, 8, 'utf8');
    h.write(type, 156, 1, 'utf8');
    h.write('ustar\0', 257, 6, 'utf8');
    h.write('00', 263, 2, 'utf8');
    let sum = 0;
    for (const b of h) sum += b;
    h.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'utf8');
    return h;
  };

  for (const f of files) {
    const data = fs.readFileSync(f.full);
    push(header(f.path, data.length, Math.floor(Date.now() / 1000), '0'));
    push(data);
    const pad = (512 - (data.length % 512)) % 512;
    if (pad) push(Buffer.alloc(pad));
  }
  push(Buffer.alloc(1024));
  return Buffer.concat(chunks);
}

function listBackups() {
  if (!fs.existsSync(backupDir)) return [];
  return fs.readdirSync(backupDir)
    .filter(f => f.endsWith('.tar.gz'))
    .sort()
    .reverse();
}

const args = process.argv.slice(2);

if (args.includes('--list')) {
  const list = listBackups();
  if (!list.length) console.log('Aucune sauvegarde dans backup/.');
  for (const f of list) {
    const s = fs.statSync(path.join(backupDir, f));
    console.log(`${f}  ${(s.size / 1024 / 1024).toFixed(2)} Mo  ${s.mtime.toISOString().slice(0, 16).replace('T', ' ')}`);
  }
  process.exit(0);
}

const restoreArg = args.find(a => a.startsWith('--restore='));
if (restoreArg) {
  const name = restoreArg.split('=')[1];
  const file = path.join(backupDir, name.endsWith('.tar.gz') ? name : name + '.tar.gz');
  if (!fs.existsSync(file)) {
    console.error('Sauvegarde introuvable : ' + file);
    console.error('Disponibles :\n' + listBackups().join('\n'));
    process.exit(1);
  }
  console.log('⚠ Cette opération REMPLACE les fichiers actuels du site.');
  console.log('  Archive : ' + path.basename(file));
  console.log('  Cible   : ' + root);
  const proceed = args.includes('--yes');
  if (!proceed) {
    console.log('\nRelancez avec --yes pour confirmer, après avoir fait une sauvegarde manuelle.');
    process.exit(2);
  }
  // Extraction : le format tar est relu ici, sans dépendance externe.
  const buf = zlib.gunzipSync(fs.readFileSync(file));
  let off = 0, count = 0;
  while (off + 512 <= buf.length) {
    const hdr = buf.slice(off, off + 512);
    if (hdr.every(b => b === 0)) break;
    const name = hdr.slice(0, 100).toString('utf8').replace(/\0.*$/, '');
    const size = parseInt(hdr.slice(124, 136).toString('utf8').replace(/\0.*$/, '').trim(), 8) || 0;
    off += 512;
    const data = buf.slice(off, off + size);
    off += size + ((512 - (size % 512)) % 512);
    if (!name || name.includes('..')) continue;
    const target = path.join(root, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, data);
    count++;
  }
  console.log(`Restauration terminée : ${count} fichier(s) restaurés depuis ${path.basename(file)}.`);
  process.exit(0);
}

// --- création -------------------------------------------------------------------
fs.mkdirSync(backupDir, { recursive: true });
const files = collect(root);
const tar = createTar(files);
const gz = zlib.gzipSync(tar, { level: 9 });
const name = `iutam-site-${stamp()}.tar.gz`;
const out = path.join(backupDir, name);
fs.writeFileSync(out, gz);
const sha = crypto.createHash('sha256').update(gz).digest('hex');
fs.writeFileSync(out + '.sha256', sha + '  ' + name + '\n');

console.log(`Sauvegarde créée : backup/${name}`);
console.log(`Taille : ${(gz.length / 1024 / 1024).toFixed(2)} Mo (${files.length} fichiers)`);
console.log(`SHA-256 : ${sha}`);

// Conservation des 10 dernières sauvegardes
const list = listBackups();
for (const old of list.slice(10)) {
  fs.rmSync(path.join(backupDir, old), { force: true });
  fs.rmSync(path.join(backupDir, old + '.sha256'), { force: true });
  console.log('Supprimée (trop ancienne) : ' + old);
}
