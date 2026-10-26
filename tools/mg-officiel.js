// Applique le texte malagasy officiel transmis par l'IUTAM.
//
// Chaque entrée est [texte français exact dans index.html, texte malagasy officiel].
// Le script vérifie que le texte français existe bien dans la page : une clé
// introuvable est signalée (le texte a peut-être changé).
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const mgPath = path.join(root, 'tools', 'mg.json');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const d = JSON.parse(fs.readFileSync(mgPath, 'utf8'));

const P = [
  // --- en-tête, navigation -----------------------------------------------------
  ["L'Institut", "Ny Ivontoeram-pampianarana"],
  ["Formations", "Lalam-piofanana"],
  ["Débouchés", "Sehatra arak'asa sy fahafahana miasa"],
  ["FAQ", "Fanontaniana apetraka matetika"],
  ["Rechercher dans le site", "Fikarohana ao amin'ny tranonkala"],
  ["Rechercher (Ctrl + K)", "Hikaroka (Ctrl + K)"],
  ["Menu", "Menio"],
  ["Navigation principale", "Menio lehibe"],
  ["– accueil", "– fandraisana"],

  // --- hero --------------------------------------------------------------------
  ["Université de Mahajanga · MESUPRES · Système LMD", "Oniversiten'i Mahajanga · MESupReS · Rafitra LMD"],
  ["Le savoir-faire au service du ", "Ny fahaiza-manao ho fanompoana ny "],
  ["<span>développement durable</span>", "<span>fampandrosoana maharitra</span>"],
  ["Institut Universitaire de Technologie et d'Agronomie de Mahajanga : une formation professionnelle en Sciences Agronomiques, de la Licence Pro à l'Ingéniorat (grade de Master).",
   "Institiota Oniversitera momba ny Teknolojia sy ny Agronomia ao Mahajanga: fanofanana matihanina amin'ny Siansa Agronomika, manomboka amin'ny Laisansa Matihanina ka hatramin'ny Injeniera amin'ny ambaratonga Mastera."],
  ["Logo de l'IUTAM", "Famantarana (logo) ny IUTAM"],
  ["Logo IUTAM animé en 3D", "Famantarana (logo) ny IUTAM mihetsika amin'ny endrika 3D"],
  ["Nos formations", "Jereo ny fanofanana"],
  ["Conditions d'admission", "Fepetra fidirana"],
  ["Descendre", "Midina"],

  // --- section « L'Institut » ----------------------------------------------------
  ["Établissement à vocation professionnelle dans le domaine des Sciences de l'Ingénieur (Sciences Agronomiques), suivant le système L.M.D. et délivrant la Licence Professionnelle et l'Ingéniorat.",
   "Sekoly ambony mifantoka amin'ny fanofanana arak'asa eo amin'ny sehatry ny siansa momba ny fambolena sy ny fiompiana, ao anatin'ny rafitra LMD (Laisansa–Mastera–Doktora). Manolotra fiofanana mitondra mankany amin'ny diplaoma Laisansa Matihanina sy ny diplaoma Injeniera amin'ny ambaratonga Mastera izy."],
  ["Ingéniorat (Master)", "Diplaoma Injeniera amin'ny ambaratonga Mastera"],
  ["Bac + 3 requis", "Bakalorea + 5"],
  ["Parcours", "Lalam-piofanana 6"],
  ["4 : Niveau Licence", "4 : Laisansa"],
  ["2 : Niveau Master", "2 : Mastera"],
  ["Activités en vitrine", "Hetsika aseho ao amin'ny toerana fampirantiana"],
  ["Les 6 parcours selon le système L.M.D.", "Lalam-piofanana enina ao anatin'ny rafitra LMD"],
  ["Licence Professionnelle", "LAISANSA MATIHANINA"],
  ["L1 · L2 · L3", "L1 – L2 – L3"],
  ["Bac + 3 — 3 ans après le baccalauréat, mention Biologie Appliquée",
   "Bakalorea + 3: telo taona aorian'ny Bakalorea. Taranja iombonana: Biolojia Ampiharina."],
  ["Ingéniorat au grade de Master", "DIPLAOMA INJENIERA AMIN'NY AMBARATONGA MASTERA"],
  ["M1 · M2", "M1 – M2"],
  ["Bac + 3 requis — 2 ans supplémentaires, soit Bac + 5, mention Agro-biodiversité et Environnement",
   "Bakalorea + 5: roa taona aorian'ny Laisansa. Taranja: Agro-biodiversita sy Tontolo iainana."],
  ["P.A.D.D. — Production Animale et Développement Durable", "P.A.D.D. — Famokarana biby sy fampandrosoana maharitra"],
  ["P.V.T.D.D. — Production Végétale Tropicale et Développement Durable", "P.V.T.D.D. — Famokarana zavamaniry tropikaly sy fampandrosoana maharitra"],
  ["Nos atouts", "NY TOMBONTSOA ATO AMIN'NY IUTAM"],
  ["Laboratoires et terrains de pratiques", "Laboratoara sy toeram-pampiharana"],
  ["Familiarisation des étudiants avec le monde professionnel.",
   "Mampahafantatra ny mpianatra ny tontolon'ny asa sy ny fomba fiasa arak'asa."],
  ["Vitrine de démonstration", "Toerana fampirantiana"],
  ["Une vingtaine d'activités présentées aux étudiants et aux visiteurs.",
   "Hetsika sy santionany manodidina ny roapolo no aseho amin'ny mpianatra sy ny mpitsidika."],
  ["Ferme école", "Toeram-pambolena fampiharana"],
  ["Recherche et production, au cœur de la formation pratique.",
   "Toerana anaovana fikarohana sy famokarana, izay ivon'ny fampianarana mifototra amin'ny fampiharana."],
  ["Salles équipées", "Efitrano sy fitaovana fampianarana"],
  ["Cours par vidéo projection et salle d'informatique avec connexion WiFi, aux normes LMD.",
   "Fampianarana ampiasana fitaovana fampisehoana sary sy feo, ary efitrano informatika misy Wi-Fi, araka ny rafitra LMD."],

  // --- direction ---------------------------------------------------------------
  ["Portrait du directeur de l'IUTAM", "Sarin'ny talen'ny IUTAM"],
  ["La Direction", "NY FITARIHANA"],
  ["Institut Universitaire de Technologie et d'Agronomie de Mahajanga",
   "Ivontoeram-pampianarana eny amin'ny Anjerimanontolo momba ny Teknolojia sy ny Agronomia ao Mahajanga."],
  ["L'IUTAM, votre passerelle vers les métiers de l'agronomie et de l'environnement",
   "IUTAM: lalana mankany amin'ny asa eo amin'ny sehatry ny agronomia sy ny tontolo iainana"],
  ["Situé à Mahajanga, l'Institut Universitaire de Technologie et d'Agronomie est rattaché à l'Université de Mahajanga. Établissement à vocation professionnelle, il forme des techniciens et des ingénieurs en Sciences Agronomiques, de la Licence Professionnelle à l'Ingéniorat.",
   "Ao Mahajanga no misy ny Ivontoeram-pampianarana eny amin'ny Anjerimanontolo momba ny Teknolojia sy ny Agronomia (IUTAM), izay mifandray amin'ny Anjerimanontolon'i Mahajanga. Sekoly ambony mifantoka amin'ny fanofanana arak'asa izy, ka manofana teknisianina sy injeniera eo amin'ny sehatry ny siansa momba ny fambolena sy ny fiompiana, manomboka amin'ny Laisansa Matihanina ka hatramin'ny diplaoma Injeniera amin'ny ambaratonga Mastera."],

  // --- vie étudiante -----------------------------------------------------------
  ["Vie étudiante", "FIAINAN'NY MPIANATRA"],
  ["Au-delà des salles de classe : pratique, rencontres et réussite.",
   "Tsy ao an-dakilasy ihany no ianarana: fampiharana, fifanakalozana ary fahombiazana."],
  ["Vie Étudiante Dynamique&nbsp;:", "Fiainan'ny mpianatra mavitrika"],
  ["L'expérience à l'IUTAM va au-delà des salles de classe. Des travaux pratiques aux stages en milieu professionnel, notre institut est un terrain fertile pour cultiver des passions, tisser des liens et construire un avenir au service du développement durable.",
   "Tsy voafetra ao an-dakilasy ny traikefa iainan'ny mpianatra ao amin'ny IUTAM. Manomboka amin'ny asa fampiharana ka hatramin'ny fiofanana anaty toeram-piasana, ny ivontoeram-pampianarana dia manome tontolo iray ahafahan'ny mpianatra mampivelatra ny fahaizany, manamafy ny fifandraisana ary manomana hoavy mifanaraka amin'ny fampandrosoana maharitra."],
  ["🌱 Pratique et terrain", "Fampiharana sy toeram-pampiharana"],
  ["Des cérémonies qui récompensent l'effort :", "Lanonana fankalazana ny fahombiazana"],
  ["La remise des diplômes réunit étudiants, familles et enseignants autour d'un même moment : celui de la réussite. Licence Professionnelle ou Ingéniorat au grade de Master, votre parcours mène à un diplôme.",
   "Ny lanonana fanolorana diplaoma dia mampivondrona ny mpianatra, ny fianakaviany ary ny mpampianatra mba hiara-mankalaza ny fahombiazana. Na Laisansa Matihanina izany na diplaoma Injeniera amin'ny ambaratonga Mastera, ny fahazoana diplaoma no tanjona iray lehibe amin'ny lalam-piofanana."],
  ["🎓 Licence Pro · Ingéniorat", "Laisansa Matihanina · Diplaoma Injeniera amin'ny ambaratonga Mastera"],
  ["Laboratoires et terrains de pratiques :", "Laboratoara sy toeram-pampiharana"],
  ["Familiarisation des étudiants avec le monde professionnel. Microscopes, travaux pratiques, vitrine d'activités et ferme école : à l'IUTAM, la théorie se vérifie toujours sur le terrain.",
   "Mampahafantatra ny mpianatra ny tontolon'ny asa arak'asa. Mikraoskaopy, asa fampiharana, toerana fampirantiana ary toeram-pambolena fampiharana: ao amin'ny IUTAM, ampifandraisina amin'ny fampiharana eny an-kianja ny fahalalana ara-teôria."],
  ["Étudiants en blouse blanche devant les microscopes du laboratoire",
   "Mpianatra manao akanjo fotsy eo anoloan'ny mikraoskaopy ao amin'ny laboratoara"],
  ["🔬 Laboratoire", "Laboratoara"],
  ["Travaux pratiques au microscope", "Asa fampiharana amin'ny mikraoskaopy"],
  ["🐟 Terrain", "Toeram-pampiharana"],
  ["Pêche et Aquaculture", "Jono sy Fiompiana anaty rano"],
  ["🧪 Séance pratique", "Fotoam-pampiharana"],
  ["Observer, décrire, classer", "Fandinihana, famaritana ary fanasokajiana"],
  ["Rejoignez l'IUTAM", "MIARAHA AMIN'NY IUTAM"],
  ["Le savoir-faire au service du développement durable", "Ny fahaiza-manao ho fanompoana ny fampandrosoana maharitra."],
  ["Découvrir l'admission", "Fantaro ny fepetra fidirana"],
  ["Suspendre le défilement des messages", "Ajanony ny fihodinan'ny hafatra"],
  ["Suspendre / reprendre", "Ajanony / ataovy tohizana"],

  // --- formations --------------------------------------------------------------
  ["Domaine : Sciences de l'Ingénieur.", "Sehatra: Siansa momba ny fambolena sy ny fiompiana."],
  ["Licence", "LAISANSA MATIHANINA"],
  ["Licence Professionnelle", "Laisansa Matihanina"],
  ["3 ans après le Bac", "Faharetany: 3 taona aorian'ny Bakalorea"],
  ["Mention", "Taranja"],
  ["Biologie Appliquée", "Biolojia Ampiharina"],
  ["Acquérir des bases scientifiques puis des techniques et technologies dans les domaines agronomiques et environnementaux.",
   "Mahazo fototra ara-tsiansa ny mpianatra, ary mianatra ireo teknika sy teknolojia ampiharina eo amin'ny sehatry ny fambolena sy ny fiompiana ary ny tontolo iainana."],
  ["Les parcours", "Lalam-piofanana"],
  ["Bac : C, D, S, OSE et Agricole", "Sokajin'ny Bakalorea ekena: C, D, S, OSE ary Agricole."],
  ["Bac : A2, C, D, S, OSE et Agricole", "Sokajin'ny Bakalorea ekena: A2, C, D, S, OSE ary Agricole."],
  ["Conditions d'admission →", "Jereo ny fepetra fidirana →"],
  ["Stages en milieux professionnels", "FIOFANANA ANATY TOERAM-PIASANA"],
  ["L1 · Stage d'imprégnation", "L1 · Fiofanana fampidirana amin'ny tontolon'ny asa"],
  ["L2 · Stage ouvrier", "L2 · Fiofanana arak'asa"],
  ["L3 · Stage de mémoire de Licence", "L3 · Fiofanana ho fanomanana ny asa soratra famaranana ny Laisansa"],
  ["Voir les frais de scolarité →", "Jereo ny saram-pianarana →"],
  ["Après la Licence", "AORIAN'NY LAISANSA"],
  ["Master", "MASTERA"],
  ["2 ans après la Licence", "Faharetany: 2 taona aorian'ny Laisansa"],
  ["Former des ingénieurs spécialisés en sciences et technologies du vivant, biotechnologie, sciences du sol, agroalimentaire, recherche, innovation et développement durable.",
   "Manofana injeniera manam-pahaizana momba ny siansa sy ny teknolojian'ny zavamananaina, ny bioteknolojia, ny siansan'ny tany, ny indostrian'ny sakafo, ny fikarohana, ny fanavaozana ary ny fampandrosoana maharitra."],
  ["Production Animale et Développement Durable.", "Famokarana biby sy fampandrosoana maharitra."],
  ["Licence requise : Élevage, Environnement, Pêche et Aquaculture et équivalents",
   "Laisansa takiana: Fiompiana, Tontolo iainana, Jono sy Fiompiana anaty rano, na lalam-piofanana mitovy lenta."],
  ["Production Végétale Tropicale et Développement Durable.", "Famokarana zavamaniry tropikaly sy fampandrosoana maharitra."],
  ["Licence requise : Agriculture, Environnement et équivalents",
   "Laisansa takiana: Fambolena, Tontolo iainana, na lalam-piofanana mitovy lenta."],
  ["M2 · Stage de mémoire d'ingéniorat", "M2 · Fiofanana ho fanomanana ny asa soratra famaranana ny diplaoma Injeniera amin'ny ambaratonga Mastera"],

  // --- panneau des parcours ---------------------------------------------------
  ["Parcelles de cultures étiquetées et étudiants sur le terrain",
   "Sarin'ny tanimboly misy marika sy mpianatra manao asa eny an-kianja"],
  ["📄 Voir l'affiche des formations", "Jereo ny takelaka fampahafantarana momba ny lalam-piofanana"],
  ["Affiche « Nos formations » : Licence Professionnelle et Ingéniorat au grade de Master",
   "Afisy « Ireo lalam-piofanana atolotray »: Laisansa Matihanina sy Diplaoma Injeniera amin'ny ambaratonga Mastera"],

  // --- débouchés --------------------------------------------------------------
  ["Débouchés et insertion professionnelle", "SEHATRA ARAK'ASA SY FAHAFAHANA MIDITRA AMIN'NY ASA"],
  ["Les métiers visés par chaque formation et les secteurs qui recrutent nos diplômés. Les intitulés exacts des postes sont à confirmer avec le secrétariat.",
   "Ireto avy ny asa azo kendrena arakaraka ny lalam-piofanana sy ny sehatra afaka mandray ireo nahazo diplaoma. Tokony hohamafisin'ny sekreteria ny anarana ofisialin'ny asa tsirairay."],
  ["Filtrer les débouchés par formation", "Sivana ireo fivoahana amin'ny asa araka ny fanofanana"],
  ["Votre insertion professionnelle", "FANOMANANA NY FIDIRANA AMIN'NY ASA"],
  ["Le service d'orientation du secrétariat vous accompagne dans la recherche de stage, la rédaction de votre CV et vos candidatures.",
   "Manampy ny mpianatra amin'ny fitadiavana toeram-piofanana anaty toeram-piasana, ny fanomanana ny fandaharam-piainana arak'asa (CV) ary ny fangatahana asa ny sampana mpanolo-tsaina ao amin'ny sekreteria."],
  ["Parler à l'orientation", "Mifandraisa amin'ny sampana mpanolo-tsaina →"],

  // --- admission --------------------------------------------------------------
  ["Sélection de dossiers (Licence), puis sélection de dossiers et entretien (Ingéniorat).",
   "Ny fidirana amin'ny Laisansa dia mifototra amin'ny fandinihana ny antontan-taratasy. Ny fidirana amin'ny diplaoma Injeniera amin'ny ambaratonga Mastera kosa dia mifototra amin'ny fandinihana ny antontan-taratasy sy ny dinidinika."],
  ["Licence Professionnelle · Baccalauréat requis", "LAISANSA MATIHANINA · TAKIANA NY BAKALOREA"],
  ["Parcours", "Lalam-piofanana"],
  ["Séries de Bacc admises", "Sokajin'ny Bakalorea ekena"],
  ["Ingéniorat au grade de Master · Licence requise", "DIPLAOMA INJENIERA AMIN'NY AMBARATONGA MASTERA · TAKIANA NY LAISANSA"],
  ["Licence en", "Laisansa takiana"],
  ["Élevage, Environnement, Pêche et Aquaculture et équivalents",
   "Fiompiana, Tontolo iainana, Jono sy Fiompiana anaty rano, na lalam-piofanana mitovy lenta."],
  ["Agriculture, Environnement et équivalents",
   "Fambolena, Tontolo iainana, na lalam-piofanana mitovy lenta."],
  ["Guides pratiques", "TOROLALANA AZO AMPIHARINA"],
  ["Les démarches à connaître, étape par étape.", "Ireo dingana tokony harahina, hazavaina tsikelikely."],

  // --- frais ------------------------------------------------------------------
  ["Frais d'inscription et de formation", "SARAM-PISORATANA ANARANA SY SARAM-PIANARANA"],
  ["Grille tarifaire officielle de l'IUTAM selon le niveau (montants en Ariary).",
   "Tabilao ofisialin'ny saram-pianarana ao amin'ny IUTAM, arakaraka ny ambaratonga; aseho amin'ny Ariary."],
  ["💰 Voir le détail de la grille tarifaire", "Jereo ny antsipirian'ny saram-pianarana"],
  ["dès 610 100 Ar / an", "Manomboka amin'ny 610 100 Ar isan-taona."],
  ["Désignation", "Famaritana"],
  ["Montant", "Vola"],
  ["Droit d'inscription", "Saram-pisoratana anarana"],
  ["Frais généraux", "Saram-pitantanana ankapobeny"],
  ["Assurance scolaire / étudiante", "Fiantohana ho an'ny mpianatra"],
  ["Tenue vestimentaire (Polo)", "Fitafiana (Polo)"],
  ["1ère tranche de frais de formation", "Fandoavam-bola voalohany amin'ny saram-pianarana"],
  ["2ème tranche de frais de formation", "Fandoavam-bola faharoa amin'ny saram-pianarana"],
  ["3ème tranche de frais de formation", "Fandoavam-bola fahatelo amin'ny saram-pianarana"],
  ["Total annuel", "Totalin'ny taona"],

  // --- FAQ --------------------------------------------------------------------
  ["Questions fréquentes", "FANONTANIANA APETRAKA MATETIKA"],
  ["Admission, frais, formation, stages : les réponses aux questions les plus posées.",
   "Fepetra fidirana, saram-pianarana, lalam-piofanana ary fiofanana anaty toeram-piasana: valin'ireo fanontaniana apetraka matetika."],
  ["Catégories de questions", "Sokajin'ny fanontaniana"],
  ["Votre question n'est pas là ?", "Tsy hitanao ato ve ny valin'ny fanontanianao?"],
  ["Le secrétariat de l'IUTAM répond à toutes les questions sur l'admission et la scolarité.",
   "Vonona hamaly ny fanontaniana rehetra momba ny fidirana sy ny fisoratana anarana ny sekreterian'ny IUTAM."],
  ["Poser la question", "Mametraha fanontaniana →"],

  // --- actualités --------------------------------------------------------------
  ["Actualités", "VAOVAO"],
  ["Les dernières informations de l'IUTAM.", "Ireo vaovao farany avy amin'ny IUTAM."],

  // --- contact ----------------------------------------------------------------
  ["Contact", "FIFANDRAISANA"],
  ["📍 Campus d'Ambondrona · Université de Mahajanga · BP 652<br>Mahajanga (401) · Madagascar<br>📞 +261 32 05 580 06<br>✉️ benjaiba@yahoo.fr",
   "📍 Toerana: Toeram-pianarana Ambondrona · Anjerimanontolon'i Mahajanga · BP 652<br>Mahajanga (401) · Madagasikara<br>Telefaonina: +261 32 05 580 06<br>Mailaka: benjaiba@yahoo.fr"],
  ["🗺️ Voir sur la carte", "Jereo amin'ny sarintany"],
  ["🏛️ Site de l'Université", "Tranonkalan'ny Anjerimanontolo"],
  ["Nom et prénom", "Anarana sy fanampin'anarana"],
  ["Adresse e-mail", "Adiresy mailaka"],
  ["Sujet", "Antony ifandraisana"],
  ["Message", "Hafatra"],
  ["Admission, frais, stage…", "Fepetra fidirana, saram-pianarana, fiofanana anaty toeram-piasana…"],
  ["Ne pas remplir ce champ", "Aza fenoina ity saha ity."],
  ["J'accepte que mes données soient utilisées pour répondre à ma demande.",
   "Manaiky aho fa hampiasaina ny angon-drakitra omeko mba handinihana sy hamaliana ny fangatahako."],
  ["Envoyer le message", "Alefaso ny hafatra"],
  ["Lettre d'information", "TARATASY FAMPITAM-BAOVAO"],
  ["Recevez les dates d'inscription, les résultats et les nouvelles de l'IUTAM, une fois par mois. Désinscription possible à tout moment.",
   "Raiso indray mandeha isam-bolana ny daty fisoratana anarana, ny valim-panadinana na valin'ny fangatahana, ary ny vaovao momba ny IUTAM. Azonao atsahatra amin'ny fotoana rehetra ny fandraisana izany."],
  ["S'inscrire", "Hisoratra anarana"],

  // --- pied de page -----------------------------------------------------------
  ["© <span id=\"y\"></span> IUTAM – Institut Universitaire de Technologie et d'Agronomie de Mahajanga. Tous droits réservés. · ",
   "© <span id=\"y\"></span> IUTAM – Ivontoeram-pampianarana eny amin'ny Anjerimanontolo momba ny Teknolojia sy ny Agronomia ao Mahajanga. Zo rehetra voatokana. · "],
  ["Mentions légales", "Fampahafantarana ara-dalàna"]
];

let poses = 0, absents = [];
const nouvelles = {};
for (const [fr, mg] of P) {
  if (!html.includes(fr)) { absents.push(fr); continue; }
  nouvelles[fr] = mg;
  poses++;
}
for (const [fr, mg] of Object.entries(nouvelles)) d[fr] = mg;
fs.writeFileSync(mgPath, JSON.stringify(d, null, 1), 'utf8');

console.log(poses + '/' + P.length + ' textes officiels appliqués.');
if (absents.length) {
  console.log('\nTextes français introuvables dans index.html :');
  absents.forEach(a => console.log('  - ' + a.slice(0, 90)));
}
console.log('\nentrées : ' + Object.keys(d).length);
