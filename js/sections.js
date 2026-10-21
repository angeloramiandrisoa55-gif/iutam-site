// Sections dynamiques : débouchés, guides pratiques, questions fréquentes,
// bandeau publicitaire rotatif.
// Les contenus viennent des fichiers de data/ (modifiables via le CMS) ; le code
// se contente de les mettre en forme, dans la langue de la page.
//
// Les fiches détaillées (objectifs, compétences, étapes) sont repliées par
// défaut : la page reste compacte et le visiteur n'ouvre que ce qui l'intéresse.

(function () {
  'use strict';

  var root = document.documentElement.dataset.root || '';
  var LANG = document.documentElement.lang === 'mg' ? 'mg' : 'fr';

  var T = {
    fr: {
      empty: 'Contenu indisponible pour le moment.',
      metiers: 'Métiers',
      secteur: 'Secteur',
      objectifs: 'Objectifs de la formation',
      competences: 'Compétences',
      pieces: 'Pièces à réunir',
      etapes: 'Étapes',
      duree: 'Durée indicative',
      resultats: 'résultat(s)',
      tout: 'Tout',
      licence: 'Licence',
      master: 'Ingéniorat',
      mentionLic: 'Biologie Appliquée',
      mentionMas: 'Agro-biodiversité et Environnement',
      bac: 'Bac :',
      voirPlus: 'Voir le détail',
      replier: 'Replier'
    },
    mg: {
      empty: 'Tsy azo ny votoatiny amin\'ity fotoana ity.',
      metiers: 'Asa',
      secteur: 'Sehatra',
      objectifs: 'Tanjon\'ny fanofanana',
      competences: 'Fahaizana',
      pieces: 'Antontan-taratasy ilaina',
      etapes: 'Dingana',
      duree: 'Faharetan\'ny fotoana',
      resultats: 'valiny',
      tout: 'Rehetra',
      licence: 'Licence',
      master: 'Ingéniorat',
      mentionLic: 'Biologie Appliquée',
      mentionMas: 'Agro-biodiversité et Tontolo iainana',
      bac: 'Bakalaoraly :',
      voirPlus: 'Hijery ny antsipiriany',
      replier: 'Hidio'
    }
  }[LANG];

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

  /** Choisit la version de la langue, avec repli sur le français. */
  function pick(o, k) {
    if (!o) return '';
    if (typeof o === 'string') return o;
    if (LANG === 'mg' && o[k + '_mg']) return o[k + '_mg'];
    if (o[k]) return o[k];
    if (typeof o.fr === 'string') return o.fr;
    if (typeof o.mg === 'string' && LANG === 'mg') return o.mg;
    return '';
  }

  function text(o, k) {
    var v = pick(o, k);
    return typeof v === 'string' ? v : '';
  }

  /* ------------------------------------------------------------- débouchés */

  var ICONES = {
    agriculture: '🌾', elevage: '🐄', environnement: '🌿',
    peche: '🐟', padd: '🥛', pvtdd: '🌴'
  };

  // Numération romaine : registre « catalogue » plutôt que « application ».
  var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

  function renderDebouches() {
    var box = document.getElementById('deb-list');
    if (!box) return;
    var tabs = document.querySelectorAll('#debouches .db-tab');
    var data = null;

    function draw(filter) {
      if (!data) return;
      var list = (data.parcours || []).filter(function (p) {
        return !filter || p.niveau === filter;
      });
      if (!list.length) {
        box.innerHTML = '<p class="empty">' + esc(T.empty) + '</p>';
        return;
      }
      box.innerHTML = list.map(function (p, i) {
        // Présentation « catalogue » : une ligne par parcours, numérotée en romain.
        // Le détail (objectifs, compétences, secteurs) se déplie à la demande.
        var metiers = (p.debouches || []).map(function (d) { return esc(text(d, 'metier')); }).join(' · ');
        var debDetail = (p.debouches || []).map(function (d) {
          return '<li class="dm"><b>' + esc(text(d, 'metier')) + '</b>' +
            '<span class="ds">' + esc(text(d, 'secteur')) + '</span>' +
            (text(d, 'detail') ? '<span class="dd">' + esc(text(d, 'detail')) + '</span>' : '') +
            '</li>';
        }).join('');
        var obj = (p.objectifs || []).map(function (o) { return '<li>' + esc(text(o, 'fr')) + '</li>'; }).join('');
        var comp = (p.competences || []).map(function (c) { return '<li>' + esc(text(c, 'fr')) + '</li>'; }).join('');
        var niveau = p.niveau === 'ingeniorat' ? T.master : T.licence;
        var mention = p.niveau === 'ingeniorat' ? T.mentionMas : T.mentionLic;
        return '<details class="db-row" style="--i:' + i + '">' +
          '<summary>' +
          '<span class="db-num" aria-hidden="true">' + ROMAN[i] + '</span>' +
          '<span class="db-t"><b>' + esc(text(p, 'nom')) + '</b>' +
          '<span class="db-lv">' + esc(niveau) + ' · ' + esc(mention) + '</span></span>' +
          '<span class="db-m">' + metiers + '</span>' +
          '<span class="db-d">' + esc(p.duree || '') + '</span>' +
          '<span class="db-x" aria-hidden="true">+</span>' +
          '</summary>' +
          '<div class="db-body">' +
          '<p class="db-cond">' +
          '<span><b>' + esc(T.bac) + '</b>' + esc(p.bac || '') + '</span>' +
          '<span><b>' + esc(T.duree) + '</b>' + esc(p.duree || '') + '</span>' +
          '</p>' +
          '<div class="db-cols">' +
          (obj ? '<div><h5>' + esc(T.objectifs) + '</h5><ul class="dbl">' + obj + '</ul></div>' : '') +
          (comp ? '<div><h5>' + esc(T.competences) + '</h5><ul class="dbl">' + comp + '</ul></div>' : '') +
          (debDetail ? '<div><h5>' + esc(T.metiers) + '</h5><ul class="dbl">' + debDetail + '</ul></div>' : '') +
          '</div>' +
          (text(p, 'poursuite') ? '<p class="db-suite">' + esc(text(p, 'poursuite')) + '</p>' : '') +
          '</div></details>';
      }).join('');
    }

    Array.prototype.forEach.call(tabs, function (b) {
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(tabs, function (x) {
          x.classList.toggle('on', x === b);
          x.setAttribute('aria-selected', x === b ? 'true' : 'false');
        });
        draw(b.getAttribute('data-niv'));
      });
    });

    get('data/formations.json').then(function (d) {
      data = d;
      draw('');
    }).catch(function () {
      box.innerHTML = '<p class="empty">' + esc(T.empty) + '</p>';
    });
  }

  /* ----------------------------------------------------------------- guides */

  function renderGuides() {
    var box = document.getElementById('guides-list');
    if (!box) return;
    get('data/guides.json').then(function (d) {
      var list = d.guides || [];
      if (!list.length) { box.innerHTML = '<p class="empty">' + esc(T.empty) + '</p>'; return; }
      box.innerHTML = list.map(function (g, i) {
        var steps = (g.etapes || []).map(function (e) {
          return '<li><b>' + esc(text(e, 't')) + '</b><span>' + esc(text(e, 'd')) + '</span></li>';
        }).join('');
        var pieces = (g.pieces || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('');
        return '<details class="card nw gd" style="--i:' + i + '">' +
          '<summary class="gd-sum">' +
          '<span class="ic">' + esc(g.icone || '📌') + '</span>' +
          '<span class="gd-t"><b>' + esc(text(g, 'titre')) + '</b>' +
          '<span>' + esc(text(g, 'resume')) + '</span></span>' +
          (text(g, 'duree') ? '<span class="chip">' + esc(T.duree) + ' : ' + esc(text(g, 'duree')) + '</span>' : '') +
          '<span class="fold-i" aria-hidden="true">+</span>' +
          '</summary>' +
          '<div class="gd-body">' +
          '<h4>' + esc(T.etapes) + '</h4><ol class="gdl">' + steps + '</ol>' +
          (pieces ? '<h4>' + esc(T.pieces) + '</h4><ul class="dbl">' + pieces + '</ul>' : '') +
          '</div></details>';
      }).join('');
    }).catch(function () {
      box.innerHTML = '<p class="empty">' + esc(T.empty) + '</p>';
    });
  }

  /* -------------------------------------------------------------------- FAQ */

  function renderFaq() {
    var box = document.getElementById('faq-list');
    if (!box) return;
    var tabs = document.getElementById('faq-tabs');
    var data = null;

    function draw(groupId) {
      if (!data) return;
      var groups = (data.groupes || []).filter(function (g) {
        return !groupId || g.id === groupId;
      });
      var total = 0;
      var html = groups.map(function (g) {
        var qs = (g.questions || []).map(function (q, qi) {
          total++;
          var id = 'faq-' + g.id + '-' + qi;
          return '<details class="fq" id="' + id + '"><summary>' +
            '<span class="fq-q">' + esc(text(q, 'q')) + '</span>' +
            '<span class="fq-i" aria-hidden="true">+</span></summary>' +
            '<div class="fq-a"><p>' + esc(text(q, 'r')) + '</p></div></details>';
        }).join('');
        return '<div class="fqg"><h3 class="fqg-t">' + esc(text(g, 'titre')) + '</h3>' + qs + '</div>';
      }).join('');
      box.innerHTML = html;
    }

    get('data/faq.json').then(function (d) {
      data = d;
      if (tabs) {
        tabs.innerHTML = '<button class="fq-tab on" type="button" role="tab" aria-selected="true" data-g="">' + esc(T.tout) + '</button>' +
          (d.groupes || []).map(function (g) {
            return '<button class="fq-tab" type="button" role="tab" aria-selected="false" data-g="' + esc(g.id) + '">' +
              esc(text(g, 'titre')) + '</button>';
          }).join('');
        Array.prototype.forEach.call(tabs.querySelectorAll('.fq-tab'), function (b) {
          b.addEventListener('click', function () {
            Array.prototype.forEach.call(tabs.querySelectorAll('.fq-tab'), function (x) {
              x.classList.toggle('on', x === b);
              x.setAttribute('aria-selected', x === b ? 'true' : 'false');
            });
            draw(b.getAttribute('data-g'));
          });
        });
      }
      draw('');
    }).catch(function () {
      box.innerHTML = '<p class="empty">' + esc(T.empty) + '</p>';
    });
  }

  /* --------------------------------------------------- bandeau pub rotatif */

  function renderPub() {
    var box = document.getElementById('pub-auto');
    if (!box) return;

    var body = box.querySelector('.pub-body');
    var link = box.querySelector('a.btn');
    var bar = box.querySelector('.pub-bar');
    var bg = box.querySelector('.pub-bg');
    var pauseBtn = box.querySelector('.pub-pause');
    var items = [];
    var i = 0, timer = null, hold = false, paused = false;

    var DUR = 7000;
    var VOILE = 'linear-gradient(100deg,rgba(4,30,19,.9) 0%,rgba(8,38,62,.8) 50%,rgba(4,30,19,.45) 100%)';

    /** Chemin d'image relatif à la page (le dossier « mg/ » est à un niveau au-dessus). */
    function imgsrc(p) {
      return /^(https?:|data:)/i.test(p) ? p : root + String(p).replace(/^\//, '');
    }

    function show(n) {
      i = (n + items.length) % items.length;
      var it = items[i];
      body.classList.add('swap');
      setTimeout(function () {
        body.innerHTML = '<b>' + esc(text(it, 'titre')) + '</b><span>' + esc(text(it, 'texte')) + '</span>';
        body.classList.remove('swap');
        link.setAttribute('href', it.lien || '#admission');
        link.textContent = text(it, 'libelle') || '→';
        // photo de fond : le voile sombre garde le texte bien lisible
        if (bg && it.image) {
          bg.style.backgroundImage = VOILE + ',url("' + imgsrc(it.image) + '")';
        }
      }, 260);
      if (bar) {
        bar.style.animation = 'none';
        void bar.offsetWidth;
        bar.style.animation = 'pubbar ' + DUR + 'ms linear forwards';
      }
    }

    function run() {
      clearTimeout(timer);
      if (hold || paused || !items.length) return;
      timer = setTimeout(function () { show(i + 1); run(); }, DUR);
    }

    function stop() { clearTimeout(timer); }

    get('data/pub.json').then(function (d) {
      items = d.messages || [];
      if (!items.length) return;
      show(0);
      run();
    }).catch(function () { /* le bandeau reste tel quel */ });

    // Pause manuelle : obligatoire pour un contenu qui se met à jour seul (WCAG 2.2.2)
    if (pauseBtn) {
      pauseBtn.addEventListener('click', function () {
        paused = !paused;
        pauseBtn.textContent = paused ? '▶' : '⏸';
        pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
        pauseBtn.setAttribute('aria-label', paused
          ? (LANG === 'mg' ? 'Hanohana ny famakiana ny hafatra' : 'Reprendre le défilement des messages')
          : (LANG === 'mg' ? 'Hanohana ny famakiana ny hafatra' : 'Suspendre le défilement des messages'));
        if (paused) stop(); else run();
      });
    }

    box.addEventListener('mouseenter', function () { hold = true; stop(); });
    box.addEventListener('mouseleave', function () { hold = false; run(); });
    box.addEventListener('focusin', function () { hold = true; stop(); });
    box.addEventListener('focusout', function () { hold = false; run(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else run();
    });
  }

  function start() {
    renderDebouches();
    renderGuides();
    renderFaq();
    renderPub();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
                                                                              