/* Assistant IUTAM : questions fréquentes sous forme de discussion.
 *
 * Fonctionnement (voir le schéma « Visiteur → interface → analyse de la question →
 * recherche dans les informations officielles → information vérifiée ? ») :
 *  1. le visiteur écrit ou touche une question ;
 *  2. le texte est analysé (salutation, remerciement, au revoir, demande d'aide…) ;
 *  3. sinon, le moteur cherche dans data/faq.json, les informations officielles du site ;
 *  4. s'il trouve une réponse fiable, il la donne avec des liens vers la bonne section ;
 *  5. sinon il le dit honnêtement, propose d'appeler ou d'écrire au secrétariat,
 *     ou de signaler la question (le formulaire de contact est prérempli).
 *
 * Le moteur est local : aucune donnée n'est envoyée sur Internet, rien n'est enregistré,
 * et il ne peut pas inventer de réponse (pas d'IA générative).
 */
(function () {
  'use strict';

  var root = document.documentElement.dataset.root || '';
  var LANG = document.documentElement.lang === 'mg' ? 'mg' : 'fr';

  /* ------------------------------------------------------------------ textes */

  var UI = {
    fr: {
      fab: 'Poser une question',
      fabLabel: "Ouvrir l'assistant IUTAM",
      title: 'Assistant IUTAM',
      sub: 'Informations officielles',
      close: "Fermer l'assistant",
      placeholder: 'Écrivez votre question…',
      send: 'Envoyer',
      note: 'Vos messages ne sont pas enregistrés.',
      typing: "L'assistant écrit…",
      welcome: "Bonjour ! Je suis l'assistant de l'IUTAM. Je réponds à vos questions sur l'admission, les frais, les formations et le contact, à partir des informations officielles. Choisissez un thème ou écrivez votre question.",
      greet: 'Bonjour ! Comment puis-je vous aider ?',
      how: 'Je vais bien, merci ! Comment puis-je vous aider ?',
      thanks: "Avec plaisir ! Si vous avez une autre question, je suis là.",
      bye: "Au revoir et bonne journée ! N'hésitez pas à revenir.",
      who: "Je suis l'assistant virtuel de l'IUTAM. Je ne suis pas une personne : je cherche dans les informations officielles du site et je ne réponds qu'avec des informations vérifiées. Pour tout le reste, le secrétariat vous répondra.",
      help: 'Voici les thèmes sur lesquels je peux vous renseigner :',
      cat: 'Voici les questions fréquentes sur « %s » :',
      related: 'Vous pouvez aussi demander :',
      none: "Je n'ai pas cette information dans les données officielles de l'IUTAM. Pour une réponse fiable, contactez directement le secrétariat.",
      call: 'Appeler le secrétariat',
      mail: 'Écrire au secrétariat',
      report: 'Signaler cette question',
      subject: 'Question sans réponse',
      body: 'Bonjour, voici ma question : « %s »',
      error: 'Les informations sont momentanément indisponibles. Merci de contacter le secrétariat.',
      links: {
        admission: ["Voir les conditions d'admission", 'admission'],
        frais: ['Voir la grille des frais', 'frais'],
        formation: ['Voir les formations', 'formations'],
        contact: ['Aller à la section Contact', 'contact']
      }
    },
    mg: {
      fab: 'Manontania',
      fabLabel: "Sokafy ny mpanampy IUTAM",
      title: 'Mpanampy IUTAM',
      sub: 'Fampahalalana ofisialy',
      close: 'Akatony ny mpanampy',
      placeholder: 'Soraty eto ny fanontanianao…',
      send: 'Alefa',
      note: 'Tsy voatahiry ny hafatrao.',
      typing: 'Manoratra ny mpanampy…',
      welcome: "Salama! Izaho no mpanampy virtoaly an'ny IUTAM. Mamaly ny fanontanianao momba ny fidirana, ny saram-pianarana, ny lalam-piofanana ary ny fifandraisana aho, araka ny fampahalalana ofisialy. Safidio ny lohahevitra na soraty ny fanontanianao.",
      greet: 'Salama! Inona no azoko ampiana anao?',
      how: 'Tsara ihany aho, misaotra! Inona no azoko ampiana anao?',
      thanks: 'Tsy misy fisaorana! Raha manana fanontaniana hafa ianao, eto foana aho.',
      bye: "Veloma, mirary soa! Azonao atao ny miverina amin'ny fotoana rehetra.",
      who: "Izaho no mpanampy virtoaly an'ny IUTAM. Tsy olona aho: mikaroka ao amin'ny fampahalalana ofisialin'ny tranonkala aho ary valiny voamarina ihany no omeko. Ho an'ny zavatra hafa rehetra, ny sekreteria no hamaly anao.",
      help: 'Ireto ny lohahevitra azoko ampahafantarina anao:',
      cat: 'Ireto ny fanontaniana mahazatra momba ny « %s »:',
      related: 'Azonao fanontaniana koa:',
      none: "Tsy hitako ao amin'ny fampahalalana ofisialin'ny IUTAM io fanazavana io. Mba hahazoana valiny azo antoka, mifandraisa mivantana amin'ny sekreteria.",
      call: 'Antsoy ny sekreteria',
      mail: 'Soraty mailaka ny sekreteria',
      report: 'Ataovy fantatra ity fanontaniana ity',
      subject: 'Fanontaniana tsy nahitana valiny',
      body: "Salama, ity ny fanontanianako: « %s »",
      error: "Tsy azo atao ankehitriny ny maka ny fampahalalana. Mifandraisa amin'ny sekreteria azafady.",
      links: {
        admission: ['Jereo ny fepetra fidirana', 'admission'],
        frais: ["Jereo ny lisitry ny saram-pianarana", 'frais'],
        formation: ['Jereo ny lalam-piofanana', 'formations'],
        contact: ["Mankanesa any amin'ny fifandraisana", 'contact']
      }
    }
  };
  var T = UI[LANG];

  /* --------------------------------------------------------- analyse du texte */

  function norm(s) {
    s = String(s || '').toLowerCase();
    if (s.normalize) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s.replace(/[’'`´]/g, ' ').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function wordSet(list) {
    var o = {};
    list.split(' ').forEach(function (w) { if (w) o[w] = 1; });
    return o;
  }

  var STOP = wordSet(
    'quel quelle quels quelles quoi comment combien pourquoi quand est sont es suis sommes etes a ai as avons avez ont ete etre avoir ' +
    'fait faire peut peux peuvent puis pouvez pouvoir veux veut voulez vouloir dois doit faut il elle ils elles on je tu nous vous me te se ' +
    'ce cet cette ces ca cela c mon ma mes ton ta tes son sa ses notre nos votre vos leur leurs le la les un une des du de d l au aux et ou ' +
    'ni mais donc or car que qui dont ne pas plus moins tres trop si en y dans sur sous par pour avec sans chez vers entre apres avant ' +
    'depuis pendant lors alors aussi encore deja meme temps moi toi lui ici cherche chercher cherchons souhaite souhaiter voudrais aimerais besoin savoir sais connaitre svp stp plait information informations infos info renseignements renseignement voici voila s m t j n qu iutam ' +
    'ny sy ao eo ho no ve ary na ka dia izay iza inona ahoana ohatrinona rehefa raha amin an i ilay io ity ireo izany any eto mba hoe ' +
    'fa tsy misy afaka azo ianao aho izahay isika izy ireo'
  );

  function stem(t) {
    return t.length > 6 ? t.slice(0, 6) : t;
  }

  function tokens(text) {
    return norm(text).split(' ').filter(function (t) {
      return t.length > 1 && !STOP[t];
    });
  }

  /* familles de mots : permettent de comprendre « combien ça coûte » = « frais » */
  var CONCEPTS = {
    frais: 'frais prix cout couts coute coutent couter tarif tarifs cher payer paiement paiements verser versement tranche tranches montant droit droits scolarite saram sarany vidiny vola aloa fandoavana mandoa',
    bourse: 'bourse bourses aide aides financement financier financiere vatsim fanampiana',
    admission: 'admission admissions admis admettre inscription inscriptions inscrire inscrit candidature candidater candidat candidats postuler condition conditions entree entrer integrer rejoindre fepetra fidirana hiditra fisoratana anarana mangataka fangatahana mpangataka',
    dossier: 'dossier dossiers piece pieces document documents deposer depot antontan taratasy atolotra ametrahana',
    bac: 'bac baccalaureat serie series bakalorea sokajy',
    licence: 'licence licences laisansa pro professionnelle professionnel matihanina',
    master: 'master ingenieur ingenieurs ingeniorat injeniera',
    stage: 'stage stages stagiaire entreprise entreprises orinasa',
    formation: 'formation formations parcours filiere filieres cursus programme organisee organisation lalam piofanana fandaminana rafitra',
    diplome: 'diplome diplomes delivre delivres mari pahaizana',
    lieu: 'aiza adresse situe situee localisation localiser trouve trouver plan carte acces adiresy',
    contact: 'contact contacter contactez telephone telephoner tel appeler appel joindre numero email mail courriel mailaka secretariat sekreteria mifandray mifandraisa hifandraisana fifandraisana telefaonina laharana antsoy',
    visite: 'visite visiter visiteur rendez rdv passer venir accueil manatona',
    campus: 'logement loger heberger hebergement dortoir residence cite chambre restaurant restauration cantine manger repas fisakafoana honenana',
    travail: 'travailler travail emploi cours distance ligne vae experience miasa lavitra mitohy traikefa',
    duree: 'duree dure durer ans annees an annee semestre semestres maharitra taona',
    places: 'places place nombre limite limites effectif capacite quota voafetra',
    site: 'site web internet facebook reseaux sociaux malagasy langue tranonkala tambajotra sosialy teny'
  };
  var CONCEPT_OF = {};
  Object.keys(CONCEPTS).forEach(function (key) {
    CONCEPTS[key].split(' ').forEach(function (w) {
      var s = stem(w);
      (CONCEPT_OF[s] = CONCEPT_OF[s] || []).push('@' + key);
    });
  });

  /* liste de termes (mots racinisés + familles) avec leur nombre d'occurrences */
  function bag(text) {
    var out = {};
    tokens(text).forEach(function (t) {
      var s = stem(t);
      out[s] = (out[s] || 0) + 1;
      (CONCEPT_OF[s] || []).forEach(function (c) { out[c] = (out[c] || 0) + 1; });
    });
    return out;
  }

  /* -------------------------------------------------------------- l'index */

  var docs = [];
  var df = {};
  var groups = [];
  var ready = false;

  function pick(obj, key) {
    return (LANG === 'mg' ? obj[key + '_mg'] : obj[key]) || obj[key] || obj[key + '_mg'] || '';
  }

  function tidy(s) {
    s = String(s || '').trim();
    if (s === s.toUpperCase() && s.length > 3) s = s.charAt(0) + s.slice(1).toLowerCase();
    return s;
  }

  function buildIndex(data) {
    docs = [];
    df = {};
    groups = [];
    (data.groupes || []).forEach(function (g) {
      var group = { id: g.id, title: tidy(pick(g, 'titre')), items: [] };
      (g.questions || []).forEach(function (q) {
        var inQ = bag((q.q || '') + ' ' + (q.q_mg || ''));
        var inA = bag((q.r || '') + ' ' + (q.r_mg || ''));
        var w = {};
        Object.keys(inQ).forEach(function (t) { w[t] = (w[t] || 0) + 3; });
        Object.keys(inA).forEach(function (t) { w[t] = (w[t] || 0) + Math.min(inA[t], 2); });
        var doc = {
          group: g.id,
          q: pick(q, 'q'),
          r: pick(q, 'r'),
          nq: norm(q.q) + '|' + norm(q.q_mg),
          qw: inQ,
          w: w
        };
        docs.push(doc);
        group.items.push(doc);
        Object.keys(w).forEach(function (t) { df[t] = (df[t] || 0) + 1; });
      });
      groups.push(group);
    });
    ready = docs.length > 0;
  }

  function idf(t) {
    var n = docs.length;
    var d = df[t] || 0;
    return Math.log(1 + (n - d + 0.5) / (d + 0.5));
  }

  /* cherche la meilleure réponse : renvoie la liste triée {doc, score, cover} */
  function search(text) {
    var qb = bag(text);
    if (/(^| )ou (est|se|sont|ca|puis|peut)( |$)/.test(norm(text))) qb['@lieu'] = 1;
    /* un mot qui appartient à une famille est compris par sa famille : « mifandraisa » = « contact » */
    var terms = Object.keys(qb).filter(function (t) {
      return t.charAt(0) === '@' || !CONCEPT_OF[t];
    });
    if (!terms.length) return [];
    var unknown = Math.log(1 + docs.length);
    var total = 0;
    terms.forEach(function (t) { total += df[t] ? idf(t) : unknown; });
    var nt = norm(text);
    var res = docs.map(function (doc) {
      var score = 0;
      var hit = 0;
      var inQuestion = 0;
      var found = 0;
      terms.forEach(function (t) {
        if (doc.w[t]) {
          var i = idf(t);
          score += i * (1 - Math.exp(-0.6 * doc.w[t]));
          hit += i;
          found++;
          if (doc.qw[t]) inQuestion += i;
        }
      });
      if (nt && doc.nq.indexOf(nt) !== -1 && nt.length > 8) { score += 5; inQuestion += 1; }
      return { doc: doc, score: score, cover: total ? hit / total : 0, inQ: inQuestion, found: found };
    });
    res.sort(function (a, b) { return b.score - a.score; });
    return res;
  }

  /* ------------------------------------------------- salutations et politesse */

  function has(nt, list) {
    var padded = ' ' + nt + ' ';
    return list.some(function (p) { return padded.indexOf(' ' + p + ' ') !== -1; });
  }
  function strip(nt, list) {
    var s = ' ' + nt + ' ';
    list.slice().sort(function (a, b) { return b.length - a.length; }).forEach(function (p) {
      s = s.split(' ' + p + ' ').join(' ');
    });
    return s.replace(/\s+/g, ' ').trim();
  }

  var GREET = ['bonjour', 'bonsoir', 'salut', 'coucou', 'hello', 'hi', 'hey', 'allo', 'bjr', 'slt', 'salama', 'manao ahoana', 'mbola salama', 'akory', 'salama tompoko'];
  var THANKS = ['merci', 'merci beaucoup', 'thanks', 'thank you', 'misaotra', 'misaotra indrindra', 'mankasitraka', 'super', 'parfait', 'tres bien', 'ok', 'okay', 'daccord', 'd accord', 'tsara'];
  var BYE = ['au revoir', 'aurevoir', 'a bientot', 'bye', 'bonne journee', 'bonne soiree', 'veloma', 'mandra pihaona'];
  var HOW = ['ca va', 'comment ca va', 'comment allez vous', 'comment vas tu', 'comment tu vas', 'tu vas bien', 'vous allez bien', 'manao ahoana ianao', 'tsara ve ianao'];
  var WHO = ['qui es tu', 'qui etes vous', 'tu es qui', 'vous etes qui', 'tu es un robot', 'es tu un robot', 'etes vous un robot', 'tu es une ia', 'es tu une ia', 'chatbot', 'comment tu t appelles', 'ton nom', 'ianao iza', 'iza ianao'];
  var HELP = ['aide', 'aide moi', 'aidez moi', 'help', 'que peux tu faire', 'que pouvez vous faire', 'que sais tu faire', 'options', 'menu', 'fanampiana', 'afaka manampy'];

  function intent(text) {
    var nt = norm(text);
    if (!nt) return { kind: 'empty' };
    if (has(nt, WHO)) return { kind: 'who' };
    if (has(nt, HOW)) return { kind: 'how' };
    var rest = strip(strip(strip(nt, GREET), THANKS), BYE);
    var left = tokens(rest);
    if (has(nt, GREET) && !left.length) return { kind: 'greet' };
    if (has(nt, BYE) && !left.length) return { kind: 'bye' };
    if (has(nt, THANKS) && !left.length) return { kind: 'thanks' };
    if (has(nt, HELP) && tokens(strip(nt, HELP)).length === 0) return { kind: 'help' };
    return { kind: 'search', text: rest || nt };
  }

  /* ----------------------------------------------------- réponse du moteur */

  function reply(text) {
    var it = intent(text);
    if (it.kind !== 'search') return { kind: it.kind, text: T[it.kind] || '' };
    if (!ready) return { kind: 'error', text: T.error };
    var res = search(it.text);
    var best = res[0];
    var sure = best && best.cover >= 0.4 && best.score >= 0.25 && (best.inQ > 0 || (best.found >= 2 && best.cover >= 0.5));
    if (!sure) return { kind: 'none', text: T.none };
    var related = res.slice(1).filter(function (r) {
      return r.score >= best.score * 0.6 && r.cover >= 0.3;
    }).slice(0, 3).map(function (r) { return r.doc; });
    return { kind: 'answer', doc: best.doc, text: best.doc.r, related: related };
  }

  /* ================================================================ interface */

  var el = {};
  var busy = false;
  var started = false;
  var lastTrigger = null;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function icon(name) {
    return window.IUTAMIcons ? window.IUTAMIcons.svg(name) : null;
  }
  function withIcon(node, name) {
    var i = icon(name);
    if (i) node.insertBefore(i, node.firstChild);
    return node;
  }

  function scrollDown() {
    el.log.scrollTop = el.log.scrollHeight;
  }

  function addMsg(who, text) {
    var row = make('div', 'as-m as-' + who);
    var bubble = make('div', 'as-b');
    String(text).split('\n').forEach(function (line, i) {
      if (i) bubble.appendChild(document.createElement('br'));
      bubble.appendChild(document.createTextNode(line));
    });
    row.appendChild(bubble);
    el.log.appendChild(row);
    scrollDown();
    return row;
  }

  function chipRow(items, label) {
    var wrap = make('div', 'as-chips');
    if (label) wrap.appendChild(make('p', 'as-cl', label));
    items.forEach(function (c) {
      var b = make('button', 'as-chip', c.label);
      b.type = 'button';
      b.addEventListener('click', c.run);
      wrap.appendChild(b);
    });
    return wrap;
  }

  function linkBtn(label, href, name, external) {
    var a = make('a', 'as-act', label);
    a.href = href;
    if (external) { a.target = '_blank'; a.rel = 'noopener'; }
    withIcon(a, name);
    return a;
  }

  function contactLink(scheme) {
    var a = document.querySelector('#contact a[href^="' + scheme + '"]');
    return a ? a.getAttribute('href') : '';
  }

  function categoryChips() {
    return chipRow(groups.map(function (g) {
      return { label: g.title, run: function () { showCategory(g); } };
    }));
  }

  function questionChips(items, label) {
    return chipRow(items.map(function (d) {
      return { label: d.q, run: function () { ask(d.q); } };
    }), label);
  }

  function showCategory(g) {
    addMsg('user', g.title);
    bot(function () {
      var row = addMsg('bot', T.cat.replace('%s', g.title));
      row.appendChild(questionChips(g.items));
    });
  }

  function reportQuestion(q) {
    close(false);
    var subject = document.getElementById('c-sujet');
    var message = document.getElementById('c-message');
    if (subject && !subject.value) subject.value = T.subject;
    if (message && !message.value) message.value = T.body.replace('%s', q);
    var target = document.getElementById('contact');
    if (target) target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    if (message) setTimeout(function () { message.focus({ preventScroll: true }); }, 600);
  }

  function actions(row, links) {
    var box = make('div', 'as-acts');
    links.forEach(function (n) { box.appendChild(n); });
    if (box.childNodes.length) row.appendChild(box);
  }

  function groupLinks(groupId) {
    var out = [];
    var cfg = T.links[groupId];
    if (cfg && document.getElementById(cfg[1])) out.push(linkBtn(cfg[0], '#' + cfg[1], 'arrow'));
    if (groupId === 'contact') {
      var tel = contactLink('tel:');
      var mail = contactLink('mailto:');
      if (tel) out.push(linkBtn(T.call, tel, 'phone'));
      if (mail) out.push(linkBtn(T.mail, mail, 'mail'));
    }
    return out;
  }

  function bot(render, textLength) {
    busy = true;
    el.send.disabled = true;
    var wait = reduced ? 0 : Math.min(900, 350 + (textLength || 40) * 2);
    var dots = null;
    if (wait) {
      dots = make('div', 'as-m as-bot as-typing');
      dots.setAttribute('role', 'status');
      var b = make('div', 'as-b');
      b.setAttribute('aria-label', T.typing);
      b.appendChild(make('i')); b.appendChild(make('i')); b.appendChild(make('i'));
      dots.appendChild(b);
      el.log.appendChild(dots);
      scrollDown();
    }
    setTimeout(function () {
      if (dots && dots.parentNode) dots.parentNode.removeChild(dots);
      render();
      busy = false;
      el.send.disabled = false;
      scrollDown();
    }, wait);
  }

  function ask(text) {
    text = String(text || '').trim().slice(0, 300);
    if (!text || busy) return;
    open();
    addMsg('user', text);
    var r = reply(text);
    bot(function () {
      var row = addMsg('bot', r.text);
      if (r.kind === 'greet' || r.kind === 'who' || r.kind === 'how' || r.kind === 'thanks') {
        row.appendChild(categoryChips());
      } else if (r.kind === 'help') {
        row.appendChild(categoryChips());
      } else if (r.kind === 'answer') {
        actions(row, groupLinks(r.doc.group));
        if (r.related.length) row.appendChild(questionChips(r.related, T.related));
      } else if (r.kind === 'none' || r.kind === 'error') {
        var list = [];
        var tel = contactLink('tel:');
        var mail = contactLink('mailto:');
        if (tel) list.push(linkBtn(T.call, tel, 'phone'));
        if (mail) list.push(linkBtn(T.mail, mail, 'mail'));
        var rep = make('button', 'as-act', T.report);
        rep.type = 'button';
        withIcon(rep, 'flag');
        rep.addEventListener('click', function () { reportQuestion(text); });
        list.push(rep);
        actions(row, list);
      }
    }, r.text.length);
  }

  function welcome() {
    if (started) return;
    started = true;
    var row = addMsg('bot', T.welcome);
    row.appendChild(categoryChips());
  }

  /* Téléphone : quand le clavier s'ouvre, la fenêtre prend la hauteur de la zone réellement visible */
  var vvOn = false;
  function syncViewport() {
    var vv = window.visualViewport;
    if (!vv || window.innerWidth > 560) {
      el.panel.style.removeProperty('--vvh');
      el.panel.style.removeProperty('--vvt');
      return;
    }
    el.panel.style.setProperty('--vvh', vv.height + 'px');
    el.panel.style.setProperty('--vvt', vv.offsetTop + 'px');
    scrollDown();
  }
  function watchViewport(on) {
    var vv = window.visualViewport;
    document.documentElement.classList.toggle('as-lock', !!on && window.innerWidth <= 560);
    if (vv && on && !vvOn) {
      vv.addEventListener('resize', syncViewport);
      vv.addEventListener('scroll', syncViewport);
      vvOn = true;
    } else if (vv && !on && vvOn) {
      vv.removeEventListener('resize', syncViewport);
      vv.removeEventListener('scroll', syncViewport);
      vvOn = false;
    }
    if (on) {
      syncViewport();
    } else {
      el.panel.style.removeProperty('--vvh');
      el.panel.style.removeProperty('--vvt');
    }
  }

  /* Téléphone : le bouton « Retour » ferme l'assistant au lieu de quitter le site */
  var histPushed = false;
  var prevRestoration = null;
  function pushHistory() {
    if (histPushed || window.innerWidth > 560 || !window.history || !history.pushState) return;
    try {
      prevRestoration = history.scrollRestoration;
      history.scrollRestoration = 'manual';
      history.pushState({ iutamChat: 1 }, '', location.href);
      histPushed = true;
    } catch (e) {}
  }
  function endHistory() {
    setTimeout(function () {
      try { if (prevRestoration) history.scrollRestoration = prevRestoration; } catch (e) {}
    }, 400);
  }
  function popHistory() {
    if (!histPushed) return;
    histPushed = false;
    try { history.back(); } catch (e) {}
    endHistory();
  }
  window.addEventListener('popstate', function () {
    if (el.panel && isOpen()) {
      histPushed = false;
      close(false, true);
      endHistory();
    }
  });

  function isOpen() {
    return !el.panel.hidden;
  }

  function open() {
    if (isOpen()) return;
    lastTrigger = document.activeElement;
    el.panel.hidden = false;
    el.fab.setAttribute('aria-expanded', 'true');
    el.root.classList.add('is-open');
    welcome();
    watchViewport(true);
    pushHistory();
    setTimeout(function () { el.input.focus({ preventScroll: true }); }, 60);
  }

  function close(restoreFocus, fromHistory) {
    if (!isOpen()) return;
    el.panel.hidden = true;
    el.fab.setAttribute('aria-expanded', 'false');
    el.root.classList.remove('is-open');
    watchViewport(false);
    if (!fromHistory) popHistory();
    if (restoreFocus !== false && lastTrigger && lastTrigger.focus) lastTrigger.focus({ preventScroll: true });
  }

  function build() {
    var rootEl = make('div', 'as');
    rootEl.id = 'as-root';

    var fab = make('button', 'as-fab');
    fab.type = 'button';
    fab.setAttribute('aria-label', T.fabLabel);
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-controls', 'as-panel');
    var fi = icon('chat');
    if (fi) fab.appendChild(fi);
    fab.appendChild(make('span', 'as-fab-t', T.fab));

    var panel = make('div', 'as-panel');
    panel.id = 'as-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', T.title);

    var head = make('header', 'as-h');
    var av = make('span', 'as-av');
    av.setAttribute('aria-hidden', 'true');
    var ai = icon('chat');
    if (ai) av.appendChild(ai);
    var ht = make('div', 'as-ht');
    ht.appendChild(make('b', null, T.title));
    ht.appendChild(make('small', null, T.sub));
    var x = make('button', 'as-x');
    x.type = 'button';
    x.setAttribute('aria-label', T.close);
    var xi = icon('x');
    if (xi) x.appendChild(xi); else x.textContent = 'x';
    head.appendChild(av);
    head.appendChild(ht);
    head.appendChild(x);

    var log = make('div', 'as-log');
    log.setAttribute('role', 'log');
    log.setAttribute('aria-live', 'polite');
    log.tabIndex = 0;

    var form = make('form', 'as-form');
    form.noValidate = true;
    var input = make('input', 'as-in');
    input.type = 'text';
    input.maxLength = 300;
    input.autocomplete = 'off';
    input.placeholder = T.placeholder;
    input.setAttribute('aria-label', T.placeholder.replace('…', ''));
    var send = make('button', 'as-send');
    send.type = 'submit';
    send.setAttribute('aria-label', T.send);
    var si = icon('send');
    if (si) send.appendChild(si); else send.textContent = '>';
    form.appendChild(input);
    form.appendChild(send);

    var note = make('p', 'as-note', T.note);

    panel.appendChild(head);
    panel.appendChild(log);
    panel.appendChild(form);
    panel.appendChild(note);
    rootEl.appendChild(panel);
    rootEl.appendChild(fab);
    document.body.appendChild(rootEl);

    el = { root: rootEl, fab: fab, panel: panel, log: log, input: input, send: send };

    fab.addEventListener('click', function () { if (isOpen()) close(); else open(); });
    x.addEventListener('click', function () { close(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value;
      input.value = '';
      ask(v);
      input.focus({ preventScroll: true });
    });
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
    });
    /* un lien d'ancre dans une réponse : sur téléphone, on ferme la fenêtre pour voir la section */
    panel.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (a && window.innerWidth < 700) close(false);
    });
  }

  /* ----------------------------------------------- carte de la section « FAQ » */

  function wireCard() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-ic]'), function (n) {
      if (n.firstChild) return;
      var i = icon(n.getAttribute('data-ic'));
      if (i) n.appendChild(i);
    });
    var suggest = document.getElementById('as-suggest');
    if (suggest) {
      suggest.textContent = '';
      groups.forEach(function (g) {
        if (!g.items[0]) return;
        var b = make('button', 'as-chip', g.items[0].q);
        b.type = 'button';
        b.addEventListener('click', function () { ask(g.items[0].q); });
        suggest.appendChild(b);
      });
    }
    Array.prototype.forEach.call(document.querySelectorAll('[data-assistant-open]'), function (b) {
      b.addEventListener('click', function () { open(); });
    });
  }

  /* ------------------------------------------------------------------ départ */

  window.IUTAMAssistant = {
    open: open,
    close: close,
    ask: ask,
    _engine: { load: buildIndex, reply: reply, norm: norm }
  };

  function init() {
    build();
    var url = root + 'data/faq.json';
    fetch(url, { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error('faq');
      return r.json();
    }).then(function (data) {
      buildIndex(data);
      wireCard();
    }).catch(function () {
      wireCard();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else if (document.body) init();
})();
