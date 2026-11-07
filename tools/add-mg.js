// Ajoute ou met à jour des traductions dans tools/mg.json.
//   node tools/add-mg.js
const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'mg.json');
const dict = JSON.parse(fs.readFileSync(p, 'utf8'));

const NEW = {
  'Débouchés': 'Asa sy azo alaina',
  'développement durable': 'fandrosoana maharitra',
  'Débouchés et insertion professionnelle': 'Asa sy azo alaina sy fanatrehana ara-kasa',
  "Les métiers visés par chaque formation et les secteurs qui recrutent nos diplômés. Les intitulés exacts des postes sont à confirmer avec le secrétariat.":
    "Ny asa tiana ho an'ny lilan-tanana tsirairay ary ny sehatra mampiasa ny mp-graduat. Ny anarana marina ny laharan'asa dia tokony hamafisina amin'ny sekretaria.",
  'Votre insertion professionnelle': 'Ny fanatrehana ara-kasa anao',
  "Le service d'orientation du secrétariat vous accompagne dans la recherche de stage, la rédaction de votre CV et vos candidatures.":
    "Ny sampana fanatrehana ao amin'ny sekretaria dia manampy anao amin'ny fitadiavana toerana fanatramana, ny fanoratana ny CV-nao ary ny fangatahanao.",
  "Parler à l'orientation": 'Miresaka amin’ny fanatrehana',
  'Guides pratiques': 'Fitantanana azo ampiharina',
  'Les démarches à connaître, étape par étape.': 'Ny dingana tokony ho fantatra, dingana tsirairay.',
  'Questions fréquentes': 'Fanontaniana matetika',
  "Votre question n'est pas là ?": 'Tsy ao ny fanontanianao ?',
  "Le secrétariat de l'IUTAM répond à toutes les questions sur l'admission et la scolarité.":
    "Ny sekretaria ny IUTAM dia mamaly ny fanontaniana rehetra momba ny fidirana sy ny fisoratana anarana.",
  'Poser la question': 'Manontany',
  'Nom et prénom': 'Anarana sy fanampin’anarana',
  'Adresse e-mail': 'Adiresy mailaka',
  'Sujet': 'Lohahevitra',
  'Message': 'Hafatra',
  'Ne pas remplir ce champ': 'Aza fenoina ity saha ity',
  "J'accepte que mes données soient utilisées pour répondre à ma demande.":
    'Ekeko fa ampiasaina ny angon-drindrinao hamaly ny fangatahanao.',
  "Lettre d'information": 'Gazety fampandrosoana',
  "Recevez les dates d'inscription, les résultats et les nouvelles de l'IUTAM, une fois par mois. Désinscription possible à tout moment.":
    "Mahazoa ny daty fisoratana anarana, ny valiny ary ny vaovao momba ny IUTAM, indray mandeha isam-bolana. Azo atafahatra ny fandefasana azy amin'ny fotoana rehetra.",
  "S'inscrire": 'Hisoratra anarana',
  'Rechercher dans le site': 'Hitady ao amin’ny tranokala',
  'Rechercher (Ctrl + K)': 'Hitady (Ctrl + K)',
  'Filtrer les débouchés par formation': 'Sivana ny asa azo alaina araka ny lilan-tanana',
  'Catégories de questions': 'Sokajy fanontaniana'
};

let added = 0, updated = 0;
for (const k of Object.keys(NEW)) {
  if (!(k in dict)) { dict[k] = NEW[k]; added++; }
  else if (dict[k] !== NEW[k]) { dict[k] = NEW[k]; updated++; }
}
fs.writeFileSync(p, JSON.stringify(dict, null, 1), 'utf8');
console.log(`mg.json : ${added} traduction(s) ajoutée(s), ${updated} mise(s) à jour, ${Object.keys(dict).length} entrées au total.`);
