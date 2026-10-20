// Répare et vérifie les fichiers de données (data/*.json).
//   node tools/fix-data.js        -> applique les corrections connues
//   node tools/fix-data.js --check-> signale seulement les problèmes
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'data');
const apply = !process.argv.includes('--check');

const REPLACEMENTS = [
  ['Y a-t-il-il y a-t-il un nombre de places limité ?', 'Le nombre de places est-il limité ?'],
  ['un critère de mérite academicIEL.', 'un critère de mérite académique.'],
  ['Puis-je ' + '\uBC29\uBB38' + ' l\'IUTAM sans rendez-vous ?', 'Puis-je visiter l\'IUTAM sans rendez-vous ?'],
  ['des_FRAMEworks_\n            services', 'des services'],
  ['et les/device capacity\n            capacités', 'et les capacités'],
  ['voasigned amin\'ny rafitra mpitantana ny fanatramana sy fanamarihana.', 'sonian\'ny rafitra mpitantana ny fanatramana sy fanamarihana.'],
  ['le lien officiel serasoon indiqué ici', 'le lien officiel sera indiqué ici'],
  ['a-t-il-il', 'a-t-il']
];

// Mots qui n'appartiennent à aucune langue du projet : signalement automatique.
// Les termes latins sont recherchés par frontière de mot (sinon « iel » trouvé
// dans « officiel ») ; les caractères asiatiques sont recherchés tels quels.
const SUSPECT = [
  'Frameworks', 'device capacity', 'serasoon', 'voasigned', 'academicIEL',
  'a-t-il-il'
];
const SUSPECT_CJK = /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/;

let problems = 0;

for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
  const full = path.join(dir, file);
  let text = fs.readFileSync(full, 'utf8');
  const original = text;

  for (const [from, to] of REPLACEMENTS) {
    if (text.includes(from)) {
      text = text.split(from).join(to);
      if (!apply) console.log(`  ${file} : « ${from.slice(0, 40)}… » → « ${to.slice(0, 40)}… »`);
    }
  }

  // Nettoyage des sauts de ligne résiduels à l'intérieur des chaînes JSON
  text = text.replace(/:\s*\n\s*"/g, ': "').replace(/"\s*\n\s*"/g, ' "');

  if (apply && text !== original) {
    fs.writeFileSync(full, text);
    console.log(`corrigé : data/${file}`);
  }

  // Validation JSON
  try {
    JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (e) {
    console.error(`  ERREUR  data/${file} : JSON invalide — ${e.message}`);
    problems++;
    continue;
  }

  // Recherche de termes suspects (hors clés techniques)
  const data = JSON.parse(fs.readFileSync(full, 'utf8'));
  const hits = [];
  (function walk(o, p) {
    if (typeof o === 'string') {
      for (const s of SUSPECT) {
        if (new RegExp('(^|[^\\p{L}\\p{N}])' + s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^\\p{L}\\p{N}]|$)', 'iu').test(o)) {
          hits.push(`${p} : « ${o.slice(0, 80)} » (contient « ${s} »)`);
        }
      }
      if (SUSPECT_CJK.test(o)) {
        hits.push(`${p} : « ${o.slice(0, 80)} » (contient des caractères non latins)`);
      }
    } else if (o && typeof o === 'object') {
      for (const k in o) walk(o[k], p ? `${p}.${k}` : k);
    }
  })(data, '');

  for (const h of hits) {
    console.error(`  SUSPECT  data/${file} → ${h}`);
    problems++;
  }
}

if (problems) {
  console.error(`\n${problems} problème(s) détecté(s).`);
  process.exit(1);
}
console.log('Données : tout est correct.');
