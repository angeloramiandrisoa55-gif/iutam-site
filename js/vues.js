/* Formations et démarches : lignes compactes + pages dédiées.
 *
 * - Les parcours (#formations) et les démarches (#guides-list) s'affichent en
 *   lignes compactes, générées depuis data/formations.json et data/guides.json
 *   (versions FR et MG dans les mêmes fichiers : champs « _mg »).
 * - Un clic ouvre une page dédiée, avec une URL partageable :
 *       #/formation/agriculture      #/demarche/inscription
 * - Le bouton Retour du téléphone (popstate) ferme la page et revient à la liste.
 * - Un lien partagé ouvre directement la page.
 */
(function () {
  'use strict';

  var root = document.documentElement.dataset.root || '';
  var LANG = document.documentElement.lang === 'mg' ? 'mg' : 'fr';
  var ROUTE = /^#\/(formation|demarche)\/([a-z0-9-]+)$/;

  var T = {
    fr: {
      backF: '← Retour aux formations', backD: '← Retour aux démarches',
      discover: 'Découvrir le parcours', open: 'Ouvrir',
      delai: 'Délai', bac: 'Bac :', licReq: 'Licence requise :',
      duree: 'Durée', mention: 'Mention', diplome: 'Diplôme', selection: 'Sélection',
      objectifs: 'Objectifs', competences: 'Compétences', debouches: 'Débouchés',
      poursuite: "Poursuite d'études", stages: 'Stages en milieu professionnel',
      admission: "Conditions d'admission", frais: 'Voir les frais',
      etapes: 'Étapes', pieces: 'Pièces à fournir', contact: 'Contacter le secrétariat',
      autres: 'Autres démarches', introF: 'Parcours', introD: 'Démarche',
      notfound: "Cette page n'existe pas.", empty: 'Contenu indisponible pour le moment.',
      loading: 'Chargement…'
    },
    mg: {
      backF: "← Miverina any amin'ny lalam-piofanana", backD: "← Miverina any amin'ny torolalana",
      discover: 'Hijery ny lalam-piofanana', open: 'Sokafy',
      delai: 'Fotoana ilaina', bac: 'Bakalorea :', licReq: 'Laisansa takiana :',
      duree: 'Faharetana', mention: 'Taranja', diplome: 'Diplaoma', selection: 'Safidy',
      objectifs: "Tanjon'ny fanofanana", competences: 'Fahaizana', debouches: "Fahafahana arak'asa",
      poursuite: 'Fanohizana ny fianarana', stages: "Fiofanana eny amin'ny toeram-piasana",
      admission: 'Fepetra fidirana', frais: "Jereo ny saram-pianarana",
      etapes: 'Dingana', pieces: 'Antontan-taratasy ilaina', contact: "Mifandraisa amin'ny Sekreteria",
      autres: 'Torolalana hafa', introF: 'Lalam-piofanana', introD: 'Torolalana',
      notfound: 'Tsy hita ity pejy ity.', empty: "Tsy azo ny votoatiny amin'ity fotoana ity.",
      loading: 'Mandefa…'
    }
  }[LANG];

  var ICONS = { agriculture: '🌾', elevage: '🐄', environnement: '🌿', peche: '🐟', padd: '🥛', pvtdd: '🌴' };
  var COLORS = { agriculture: 'p-agri', elevage: 'p-elev', environnement: 'p-env', peche: 'p-peche', padd: 'p-padd', pvtdd: 'p-pvtdd' };
  var SECTION = { formation: 'formations', demarche: 'guides' };

  var data = null;       // { f: formations.json, g: guides.json }
  var cur = '';          // clé de la page ouverte ("formation/agriculture") ou ''
  var viewEl = null, lastTrigger = null, pendingScroll = null, baseTitle = document.title;

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function get(u) {
    return fetch(root + u, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(u);
      return r.json();
    });
  }
  /** Version de la langue courante, avec repli sur le français. */
  function tx(o, k) {
    if (!o) return '';
    if (LANG === 'mg' && o[k + '_mg']) return o[k + '_mg'];
    return o[k] || '';
  }
  function list(o, k) {
    if (LANG === 'mg' && o[k + '_mg'] && o[k + '_mg'].length) return o[k + '_mg'];
    return o[k] || [];
  }

  /* « P.A.D.D. — Production Animale… » : titre court + sous-titre */
  function split(nom) {
    var i = nom.indexOf(' — ');
    return i < 0 ? { t: nom, s: '' } : { t: nom.slice(0, i), s: nom.slice(i + 3) };
  }

  function condition(p, short) {
    if (p.niveau === 'ingeniorat') {
      var v = tx(p, 'bac');
      var reste = v.replace(/^(Licence en |Laisansa amin'ny )/, '');
      return T.licReq + ' ' + (short ? reste.replace(/ et équivalents$| ary mitovy aminy$/, '') : reste);
    }
    return T.bac + ' ' + tx(p, 'bac');
  }

  /* ------------------------------------------------------ lignes compactes */

  function rowFormation(p) {
    var n = split(tx(p, 'nom'));
    return '<a class="frow ' + (COLORS[p.id] || '') + '" href="#/formation/' + esc(p.id) + '">' +
      '<span class="fi" aria-hidden="true">' + (ICONS[p.id] || '🎓') + '</span>' +
      '<span class="ft"><b>' + esc(n.t) + '</b>' +
      (n.s ? '<span class="fs">' + esc(n.s) + '</span>' : '') +
      '<small>' + esc(condition(p, true)) + '</small></span>' +
      '<span class="fgo"><span class="fgo-t">' + esc(T.discover) + '</span><i aria-hidden="true">→</i></span>' +
      '</a>';
  }

  function rowDemarche(g) {
    var d = tx(g, 'duree');
    return '<a class="drow" href="#/demarche/' + esc(g.id) + '">' +
      '<span class="fi di" aria-hidden="true">' + esc(g.icone || '📌') + '</span>' +
      '<span class="ft"><b>' + esc(tx(g, 'titre')) + '</b>' +
      '<span class="fs">' + esc(tx(g, 'resume')) + '</span>' +
      (d ? '<span class="dl">' + esc(T.delai) + ' : ' + esc(d) + '</span>' : '') + '</span>' +
      '<span class="fgo"><span class="fgo-t">' + esc(T.open) + '</span><i aria-hidden="true">→</i></span>' +
      '</a>';
  }

  function renderLists() {
    Array.prototype.forEach.call(document.querySelectorAll('.fl[data-niv]'), function (box) {
      var niv = box.getAttribute('data-niv');
      box.innerHTML = (data.f.parcours || []).filter(function (p) { return p.niveau === niv; })
        .map(rowFormation).join('');
    });
    var gl = document.getElementById('guides-list');
    if (gl) gl.innerHTML = (data.g.guides || []).map(rowDemarche).join('');
  }

  /* ------------------------------------------------------- pages dédiées */

  function section(title, inner) {
    return inner ? '<div class="vs"><h2>' + esc(title) + '</h2>' + inner + '</div>' : '';
  }
  function ul(items, cls) {
    var h = (items || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    return h ? '<ul class="vl ' + (cls || '') + '">' + h + '</ul>' : '';
  }
  function fact(k, v) {
    return v ? '<div><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>' : '';
  }

  function pageFormation(id) {
    var p = (data.f.parcours || []).filter(function (x) { return x.id === id; })[0];
    if (!p) return null;
    var niv = (data.f.niveaux || []).filter(function (n) { return n.id === p.niveau; })[0] || {};
    var ing = p.niveau === 'ingeniorat';
    var n = split(tx(p, 'nom'));
    var mention = LANG === 'mg'
      ? (ing ? data.f.mention_ingeniorat_mg : data.f.mention_licence_mg)
      : (ing ? data.f.mention_ingeniorat : data.f.mention_licence);
    var niveauNom = LANG === 'mg' ? (p.niveau_mg || tx(niv, 'nom')) : tx(niv, 'nom');
    var deb = (p.debouches || []).map(function (d) {
      return '<li><b>' + esc(tx(d, 'metier')) + '</b>' +
        (tx(d, 'secteur') ? '<span>' + esc(tx(d, 'secteur')) + '</span>' : '') + '</li>';
    }).join('');
    var stages = (niv.stages || []).map(function (s) {
      return '<li><b>' + esc(s.niveau) + '</b><span>' + esc(tx(s, 'titre')) + '</span></li>';
    }).join('');
    var target = ing ? 'adm-mas' : 'adm-lic';

    var html =
      '<div class="vh ' + (COLORS[id] || '') + '">' +
      '<span class="fi vi" aria-hidden="true">' + (ICONS[id] || '🎓') + '</span>' +
      '<div><p class="vk-k">' + esc(niveauNom) + (mention ? ' · ' + esc(mention) : '') + '</p>' +
      '<h1 id="vue-t">' + esc(n.t) + '</h1>' +
      (n.s ? '<p class="vsub">' + esc(n.s) + '</p>' : '') + '</div></div>' +
      '<p class="vlead">' + esc(tx(p, 'resume')) + '</p>' +
      '<dl class="vf">' +
      fact(T.duree, tx(p, 'duree')) +
      fact(ing ? T.licReq.replace(/ ?:$/, '') : T.bac.replace(/ ?:$/, ''),
        ing ? condition(p, false).replace(T.licReq + ' ', '') : tx(p, 'bac')) +
      fact(T.diplome, tx(niv, 'diplome')) +
      fact(T.selection, tx(niv, 'selection')) +
      '</dl>' +
      section(T.objectifs, ul(list(p, 'objectifs'))) +
      section(T.competences, ul(list(p, 'competences'))) +
      section(T.debouches, deb ? '<ul class="vl vd">' + deb + '</ul>' : '') +
      section(T.poursuite, tx(p, 'poursuite') ? '<p>' + esc(tx(p, 'poursuite')) + '</p>' : '') +
      section(T.stages, stages ? '<ul class="vl vst">' + stages + '</ul>' : '') +
      '<div class="vact">' +
      '<a class="btn" href="#' + target + '" data-leave="' + target + '">' + esc(T.admission) + '</a>' +
      '<a class="btn o" href="#frais" data-leave="frais">' + esc(T.frais) + '</a></div>';
    return { html: html, title: n.t, back: T.backF };
  }

  function pageDemarche(id) {
    var gs = data.g.guides || [];
    var g = gs.filter(function (x) { return x.id === id; })[0];
    if (!g) return null;
    var steps = (g.etapes || []).map(function (e) {
      return '<li><b>' + esc(tx(e, 't').replace(/^\d+\.\s*/, '')) + '</b><span>' + esc(tx(e, 'd')) + '</span></li>';
    }).join('');
    var d = tx(g, 'duree');
    var autres = gs.filter(function (x) { return x.id !== id; }).map(function (x) {
      return '<a href="#/demarche/' + esc(x.id) + '"><span class="fi di" aria-hidden="true">' + esc(x.icone || '📌') + '</span>' +
        '<span>' + esc(tx(x, 'titre')) + '</span><i aria-hidden="true">→</i></a>';
    }).join('');
    var html =
      '<div class="vh vh-d">' +
      '<span class="fi di vi" aria-hidden="true">' + esc(g.icone || '📌') + '</span>' +
      '<div><p class="vk-k">' + esc(T.introD) + '</p><h1 id="vue-t">' + esc(tx(g, 'titre')) + '</h1>' +
      (d ? '<p class="vdl">' + esc(T.delai) + ' : ' + esc(d) + '</p>' : '') + '</div></div>' +
      '<p class="vlead">' + esc(tx(g, 'intro') || tx(g, 'resume')) + '</p>' +
      section(T.etapes, steps ? '<ol class="vsteps">' + steps + '</ol>' : '') +
      section(T.pieces, ul(list(g, 'pieces'), 'vchk')) +
      '<div class="vact"><a class="btn" href="tel:+261320558006">' + esc(T.contact) + '</a>' +
      '<a class="btn o" href="#contact" data-leave="contact">Contact</a></div>' +
      (autres ? '<nav class="vmore" aria-label="' + esc(T.autres) + '"><h2>' + esc(T.autres) + '</h2>' + autres + '</nav>' : '');
    return { html: html, title: tx(g, 'titre'), back: T.backD };
  }

  /* ------------------------------------------------------------ la « vue » */

  function ensureView() {
    if (viewEl) return viewEl;
    viewEl = document.createElement('div');
    viewEl.className = 'vue';
    viewEl.id = 'vue';
    viewEl.hidden = true;
    viewEl.setAttribute('role', 'region');
    viewEl.setAttribute('aria-labelledby', 'vue-t');
    viewEl.innerHTML = '<div class="vue-bar"><button class="vue-back" type="button"></button></div>' +
      '<article class="vue-in"></article>';
    document.body.appendChild(viewEl);
    viewEl.querySelector('.vue-back').addEventListener('click', function () { leave(null); });
    return viewEl;
  }

  function setInert(on) {
    Array.prototype.forEach.call(document.querySelectorAll('body > header, body > main, body > footer'), function (n) {
      if (on) n.setAttribute('inert', ''); else n.removeAttribute('inert');
    });
  }

  function show(type, id) {
    var page = data ? (type === 'formation' ? pageFormation(id) : pageDemarche(id)) : null;
    var el = ensureView();
    var inner = el.querySelector('.vue-in');
    var back = el.querySelector('.vue-back');
    back.textContent = type === 'formation' ? T.backF : T.backD;
    if (!page) {
      inner.innerHTML = '<h1 id="vue-t">' + esc(data ? T.notfound : T.empty) + '</h1>';
    } else {
      inner.innerHTML = page.html;
      document.title = page.title + ' · IUTAM';
    }
    var wasHidden = el.hidden;
    el.hidden = false;
    document.documentElement.classList.add('vue-open');
    setInert(true);
    el.scrollTop = 0;
    if (wasHidden) {
      lastTrigger = lastTrigger || document.activeElement;
    }
    var h = inner.querySelector('h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  function hide() {
    if (!viewEl || viewEl.hidden) return;
    viewEl.hidden = true;
    document.documentElement.classList.remove('vue-open');
    setInert(false);
    document.title = baseTitle;
    var t = lastTrigger;
    lastTrigger = null;
    if (pendingScroll) {
      var target = document.getElementById(pendingScroll);
      pendingScroll = null;
      if (target) {
        var hd = document.querySelector('body > header');
        var off = (hd ? hd.offsetHeight : 0) + 8;
        window.scrollTo(0, Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - off));
      }
    } else if (t && t.focus && document.contains(t)) {
      t.focus({ preventScroll: true });
    }
  }

  /** Lit l'adresse et affiche, ou ferme, la page correspondante. */
  function route() {
    var m = ROUTE.exec(location.hash);
    if (!m) { cur = ''; hide(); return; }
    cur = m[1] + '/' + m[2];
    if (!data) { show(m[1], m[2]); return; }
    show(m[1], m[2]);
  }

  /** Ouvre une page depuis un lien de la page (ajoute une entrée d'historique). */
  function openLink(href, trigger) {
    lastTrigger = trigger || document.activeElement;
    if (location.hash === href) { route(); return; }
    try { history.pushState({ vue: 1 }, '', href); } catch (e) { location.hash = href; return; }
    route();
  }

  /** Quitte la page : retour d'historique si on vient de la liste, sinon URL propre. */
  function leave(sectionId) {
    var type = (cur.split('/')[0]) || 'formation';
    pendingScroll = sectionId || null;
    if (history.state && history.state.vue) {
      history.back();            // popstate → route() → hide()
    } else {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
      cur = '';
      if (!sectionId) pendingScroll = SECTION[type];
      hide();
    }
  }

  // Phase de capture : ces liens doivent passer AVANT le défilement doux de main.js,
  // sinon il fait défiler la page cachée derrière la vue et la vue reste ouverte.
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var leaveId = a.getAttribute('data-leave');
    if (leaveId) { e.preventDefault(); e.stopPropagation(); leave(leaveId); return; }
    var href = a.getAttribute('href');
    if (href && ROUTE.test(href)) { e.preventDefault(); e.stopPropagation(); openLink(href, a); }
  }, true);

  window.addEventListener('popstate', route);
  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && viewEl && !viewEl.hidden) { e.preventDefault(); leave(null); }
  });

  /* ---------------------------------------------------------------- départ */

  function start() {
    var jobs = [get('data/formations.json'), get('data/guides.json')];
    Promise.all(jobs).then(function (r) {
      data = { f: r[0], g: r[1] };
      renderLists();
      route();                   // lien partagé : ouvre directement la page
    }).catch(function () {
      Array.prototype.forEach.call(document.querySelectorAll('.fl[data-niv], #guides-list'), function (b) {
        b.innerHTML = '<p class="empty">' + esc(T.empty) + '</p>';
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
