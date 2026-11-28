// Applique le texte malagasy officiel aux fichiers de données.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const lire = f => JSON.parse(fs.readFileSync(path.join(root, 'data', f), 'utf8'));
const ecrire = (f, d) => fs.writeFileSync(path.join(root, 'data', f), JSON.stringify(d, null, 2) + '\n', 'utf8');

// --------------------------------------------------------------- formations
{
  const d = lire('formations.json');
  const M = {
    agriculture: {
      resume_mg: "Mahazo fototra ara-tsiansa, ara-teknika ary ara-teknolojia momba ny famokarana ara-pambolena ny mpianatra. Ahitana asa fampiharana eny an-kianja sy ao amin'ny laboratoara izany, ary arahin'ny fiofanana anaty toeram-piasana.",
      objectifs_mg: [], competences_mg: [],
      metiers: ["Teknisianina momba ny fambolena", "Tompon'andraikitra amin'ny famokarana zavamaniry", "Mpanolo-tsaina ara-pambolena", "Asa hafa mifandraika amin'ny sehatry ny fambolena"],
      mention_mg: "Laisansa · Biolojia Ampiharina", duree_mg: "3 taona"
    },
    elevage: {
      resume_mg: "",
      objectifs_mg: [], competences_mg: [],
      metiers: ["Teknisianina momba ny fiompiana", "Tompon'andraikitra amin'ny fiompiana sy ny fitantanana ny biby fiompy", "Mpiasa manam-pahaizana momba ny fiompiana", "Injeniera momba ny agronomia rehefa vita ny fiofanana mifanaraka amin'izany"],
      mention_mg: "Laisansa · Biolojia Ampiharina", duree_mg: "3 taona"
    },
    environnement: {
      resume_mg: "",
      objectifs_mg: [], competences_mg: [],
      metiers: ["Teknisianina momba ny tontolo iainana", "Mpiandraikitra ny fitantanana ny rano sy ny fanadiovana", "Mpiandraikitra ny faritra arovana", "Tompon'andraikitra amin'ny fitantanana ny fako sy ny fahadiovana"],
      mention_mg: "Laisansa · Biolojia Ampiharina", duree_mg: "3 taona"
    },
    peche: {
      resume_mg: "",
      objectifs_mg: [], competences_mg: [],
      metiers: ["Teknisianina momba ny fiompiana trondro", "Mpiasa eo amin'ny sehatry ny jono", "Mpanentana ny fampandrosoana ny jono", "Tompon'andraikitra amin'ny fanodinana ny vokatra"],
      mention_mg: "Laisansa · Biolojia Ampiharina", duree_mg: "3 taona"
    },
    padd: {
      resume_mg: "",
      objectifs_mg: [], competences_mg: [],
      metiers: ["Injeniera momba ny famokarana biby", "Tompon'andraikitra amin'ny fikarohana sy ny fanohanana ara-teknika", "Tompon'andraikitra amin'ny kalitao sy ny fanarahana fenitra", "Mpanolo-tsaina momba ny fampandrosoana ny tontolo ambanivohitra"],
      mention_mg: "Diplaoma Injeniera amin'ny ambaratonga Mastera · Agro-biodiversité sy Tontolo iainana", duree_mg: "2 taona"
    },
    pvtdd: {
      resume_mg: "",
      objectifs_mg: [], competences_mg: [],
      metiers: ["Injeniera momba ny famokarana zavamaniry", "Manam-pahaizana momba ny karazan-javamaniry", "Tompon'andraikitra amin'ny kalitao", "Mpanolo-tsaina momba ny fampandrosoana maharitra"],
      mention_mg: "Diplaoma Injeniera amin'ny ambaratonga Mastera · Agro-biodiversité sy Tontolo iainana", duree_mg: "2 taona"
    }
  };
  for (const p of d.parcours) {
    const m = M[p.id];
    if (!m) continue;
    p.resume_mg = m.resume_mg || p.resume_mg;
    p.mention_mg = m.mention_mg;
    p.duree_mg = m.duree_mg;
    p.niveau_mg = p.niveau === 'ingeniorat' ? 'Mastera' : 'Laisansa';
    p.metiers_mg = m.metiers;
    p.objectifs_mg = m.objectifs_mg;
    p.competences_mg = m.competences_mg;
    (p.debouches || []).forEach((dd, i) => {
      if (m.metiers[i]) {
        dd.metier_mg = m.metiers[i];
        dd.secteur_mg = '';
        dd.detail_mg = '';
      }
    });
  }
  ecrire('formations.json', d);
  console.log('formations.json : 6 parcours');
}

// ---------------------------------------------------------------------/faq
{
  const d = lire('faq.json');
  const G = {
    admission: {
      titre_mg: "FEPETRA FIDIRANA",
      q: [
        ["Qui peut candidater à la Licence Professionnelle ?", "Iza avy no afaka mangataka hiditra amin'ny Laisansa Matihanina?"],
        ["Quelles sont les conditions d'admission à l'Ingéniorat (grade de Master) ?", "Inona avy ny fepetra fidirana amin'ny diplaoma Injeniera amin'ny ambaratonga Mastera?"],
        ["Comment déposer mon dossier d'admission ?", "Ahoana no fomba fanolorana ny antontan-taratasy fangatahana fidirana?"],
        ["Le nombre de places est-il limité ?", "Voafetra ve ny isan'ny mpianatra raisina?"]
      ],
      r: [
        "Iza avy no afaka mangataka hiditra amin'ny Laisansa Matihanina?",
        "Inona avy ny fepetra fidirana amin'ny diplaoma Injeniera amin'ny ambaratonga Mastera?",
        "Ahoana no fomba fanolorana ny antontan-taratasy fangatahana fidirana?",
        "Voafetra ve ny isan'ny mpianatra raisina?"
      ]
    },
    frais: {
      titre_mg: "SARAM-PIANARANA SY VATSIM-PIANARANA",
      q: [
        ["Quels sont les frais de scolarité ?", "Ohatrinona ny saram-pianarana?"],
        ["Les frais sont-ils payables en plusieurs tranches ?", "Azo aloa tsikelikely ve ny saram-pianarana?"],
        ["Existe-t-il des bourses ou des aides financières ?", "Misy vatsim-pianarana na fanampiana ara-bola ve?"],
        ["Le logement est-il assuré sur le campus ?", "Misy toeram-pisakafoana ve ao amin'ny toeram-pianarana?"]
      ]
    },
    formation: {
      titre_mg: "LALAM-PIOFANANA SY FIOFANANA ANATY TOERAM-PIASANA",
      q: [
        ["Comment la formation est-elle organisée ?", "Ahoana ny fandaminana ny lalam-piofanana?"],
        ["Les stages sont-ils obligatoires ?", "Tsy maintsy manao fiofanana anaty toeram-piasana ve ny mpianatra?"],
        ["Peut-on suivre une formation en cours d'emploi ou à distance ?", "Afaka manaraka ny fiofanana sady miasa ve ny mpianatra, na mianatra lavitra?"],
        ["Quels diplômes sont délivrés ?", "Inona avy ny diplaoma omena?"]
      ]
    },
    contact: {
      titre_mg: "NY IVONTOERAM-PAMPIANARANA SY NY FIFANDRAISANA",
      q: [
        ["Où se trouve l'IUTAM ?", "Aiza no misy ny IUTAM?"],
        ["Comment contacter le secrétariat ?", "Ahoana no fomba hifandraisana amin'ny sekreteria?"],
        ["Puis-je visiter l'IUTAM sans rendez-vous ?", "Afaka manatona ny IUTAM ve ny olona iray raha tsy mbola naka fotoana mialoha?"],
        ["Le site existe-t-il en malagasy et sur les réseaux sociaux ?", "Misy tranonkala amin'ny teny malagasy sy tambajotra sosialy ve ny IUTAM?"]
      ]
    }
  };
  for (const g of d.groupes) {
    const o = G[g.id];
    if (!o) continue;
    g.titre_mg = o.titre_mg;
    (g.questions || []).forEach((q, i) => {
      if (o.q && o.q[i]) q.q_mg = o.q[i][1];
    });
  }
  ecrire('faq.json', d);
  console.log('faq.json : 4 groupes, 16 questions');
}

// ------------------------------------------------------------------guides
{
  const d = lire('guides.json');
  const G = {
    inscription: {
      titre_mg: "Fanomanana ny antontan-taratasy fisoratana anarana",
      resume_mg: "Fanazavana momba ireo antontan-taratasy ilaina sy ny dingana arahina mba hahafahana manolotra antontan-taratasy feno, ka hampihenana ny mety hiverenan'ny fangatahana noho ny tsy fahampiana.",
      duree_mg: "Fotoana ilaina: manodidina ny iray volana.",
      etapes: [
        ["1. Vérifier l'éligibilité", "Fanomanana ny antontan-taratasy fisoratana anarana", "Fotoana ilaina: manodidina ny iray volana."],
      ]
    },
    bourse: {
      titre_mg: "Fangatahana vatsim-pianarana na fanampiana ara-bola",
      resume_mg: "Fanazavana momba ny vatsim-pianarana omen'ny Fanjakana sy ny fanampiana amin'ny saram-pianarana: iza no afaka mangataka, ahoana ny fomba fangatahana ary rahoviana no tokony hanaovana izany.",
      duree_mg: "Fotoana ilaina: iray ka hatramin'ny telo volana, arakaraka ny rafitra misahana izany.",
      etapes: []
    },
    stages: {
      titre_mg: "Fanomanana ny fiofanana anaty toeram-piasana",
      resume_mg: "Fitadiavana toeram-pandraisana, fanaovan-tsonia ny fifanarahana ary fanomanana ny tatitra momba ny fiofanana.",
      duree_mg: "Fotoana ilaina: iray ka hatramin'ny roa volana alohan'ny hanombohan'ny fiofanana.",
      etapes: []
    }
  };
  for (const g of d.guides) {
    const o = G[g.id];
    if (!o) continue;
    g.titre_mg = o.titre_mg;
    g.resume_mg = o.resume_mg;
    g.duree_mg = o.duree_mg;
  }
  ecrire('guides.json', d);
  console.log('guides.json : 3 guides');
}

// ---------------------------------------------------------------------pub
{
  const d = lire('pub.json');
  const M = {
    "Rejoignez l'IUTAM": ["MIARAHA AMIN'NY IUTAM", "Ny fahaiza-manao ho fanompoana ny fampandrosoana maharitra.", "Fantaro ny fepetra fidirana"],
    "6 parcours, 2 diplômes": ["Lalam-piofanana 6 · diplaoma 2", "Ao anatin'ny rafitra LMD, ny lalam-piofanana enina dia mitondra any amin'ny diplaoma Laisansa Matihanina (Bakalorea + 3) na Diplaoma Injeniera amin'ny ambaratonga Mastera (Bakalorea + 5).", "Jereo ny lalam-piofanana"],
    "Une antenne à Maevatanana": ["IUTAM MAEVATANANA", "Misy annexe ao Maevatanana: ny IUTAM dia mampianatra koa lavitra ny Mahajanga, amin'ny fambolena, ny fiompiana ary ny tontolo iainana.", "Jereo ny annexe"],
    "Des débouchés concrets": ["SEHATRA ARAK'ASA SY FAHAFAHANA MIDITRA AMIN'NY ASA", "Ireto avy ny asa azo kendrena arakaraka ny lalam-piofanana sy ny sehatra afaka mandray ireo nahazo diplaoma.", "Jereo ny asa azo alaina"],
    "Bourses et aides financières": ["VATSIM-PIANARANA SY FANAMPIANA ARA-BOLA", "Fanazavana momba ireo vatsim-pianarana sy fanampiana, ny antontan-taratasy ilaina sy ny kalandrie.", "Jereo ny fitantanana"],
    "Vos questions, nos réponses": ["FANONTANIANA APETRAKA MATETIKA", "Valin'ireo fanontaniana apetraka matetika momba ny fidirana, ny saram-pianarana ary ny fiofanana.", "Jereo ny fanontaniana"]
  };
  for (const m of d.messages) {
    const t = M[m.titre];
    if (!t) continue;
    m.titre_mg = t[0];
    m.texte_mg = t[1];
    m.libelle_mg = t[2];
  }
  ecrire('pub.json', d);
  console.log('pub.json : ' + d.messages.length + ' messages');
}

// --------------------------------------------------------------------sites
{
  const d = lire('sites.json');
  for (const s of d.sites) {
    if (s.id === 'antsohihy') {
      s.parcours_mg = "Fambolena, Fiompiana, Tontolo iainana, Jono sy Fiompiana anaty rano.";
      s.note_mg = "Mbola hamafisin'ny sekreteria ao Mahajanga ny adiresy, ny ora fiasana ary ny lalam-piofanana ho an'ny taom-pianarana 2026–2027.";
      s.photos[0].alt_mg = "Takelaka famantarana « IUTAM — Annexe Antsohihy », manondro ny lalana sy ny toerana, eo amin'ny 60 m.";
      s.photos[1].alt_mg = "Takelaka famantarana « IUTAM Annexe Antsohihy », manondro ny lalana eo amin'ny 300 m.";
      s.photos[2].alt_mg = "Vondron'olona mijoro eo anoloan'ny afisy « Ny lalam-piofanana atolotray ».";
      s.photos[3].alt_mg = "Vondron'olona mijoro eo anoloan'ny afisy « Ny lalam-piofanana atolotray ».";
    }
    if (s.id === 'maevatanana') {
      s.parcours_mg = "Fambolena, Fiompiana ary Tontolo iainana.";
      s.note_mg = "Mbola hamafisin'ny sekreteria ao Mahajanga ny adiresy, ny ora fiasana ary ny lalam-piofanana ho an'ny taom-pianarana 2026–2027.";
      s.photos[0].alt_mg = "Sarin'ny tafon'ny IUTAM Maevatanana: trano misy rihana roa, ahitana ny takelaka « I.U.T.A.M — Antenne Maevatanana » sy ny famantarana mankany amin'ny sekreteria.";
    }
  }
  ecrire('sites.json', d);
  console.log('sites.json : 3 sites');
}

// -----------------------------------------------------------------actualites
{
  const d = lire('actualites.json');
  d.items = [{
    date: "2026-10-09",
    titre: "Le site officiel de l'IUTAM est en ligne",
    titre_mg: "Tonga soa eto amin'ny tranonkala ofisialin'ny IUTAM",
    resume: "Le site officiel de l'IUTAM est en ligne : découvrez les formations, les conditions d'admission et les frais de scolarité.",
    resume_mg: "Efa azo tsidihina amin'ny alalan'ny Aterineto ny tranonkala ofisialin'ny IUTAM. Jereo ato ny lalam-piofanana, ny fepetra fidirana ary ny saram-pianarana.",
    image: "",
    lien: ""
  }];
  ecrire('actualites.json', d);
  console.log('actualites.json : première actualité');
}
