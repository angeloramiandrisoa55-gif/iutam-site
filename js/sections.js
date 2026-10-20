// Sections dynamiques : débouchés, guides pratiques, questions fréquentes.
// Les contenus viennent des fichiers de data/ (modifiables via le CMS) ; le code
// se contente de les mettre en forme, dans la langue de la page.

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
      autres: 'Autres questions',
      resultats: 'résultat(s)'
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
      autres: 'Fanontaniana hafa',
      resultats: 'valiny'
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
        var deb = (p.debouches || []).map(function (d) {
          return '<li class="dm"><b>' + esc(text(d, 'metier')) + '</b>' +
            '<span class="ds">' + esc(text(d, 'secteur')) + '</span>' +
            (text(d, 'detail') ? '<span class="dd">' + esc(text(d, 'detail')) + '</span>' : '') +
            '</li>';
        }).join('');
        var obj = (p.objectifs || []).map(function (o) { return '<li>' + esc(text(o, 'fr')) + '</li>'; }).join('');
        var comp = (p.competences || []).map(function (c) { return '<li>' + esc(text(c, 'fr')) + '</li>'; }).join('');
        return '<article class="card nw db" style="--i:' + i + '">' +
          '<span class="ic">' + (p.id === 'agriculture' ? '🌾' : p.id === 'elevage' ? '🐄' : p.id === 'environnement' ? '🌿' :
            p.id === 'peche' ? '🐟' : p.id === 'padd' ? '🥛' : '🌴') + '</span>' +
          '<h3>' + esc(text(p, 'nom')) + '</h3>' +
          '<span class="chip">' + esc(p.duree || '') + '</span>' +
          '<p class="dbr">' + esc(text(p, 'resume')) + '</p>' +
          (obj ? '<h4>' + esc(T.objectifs) + '</h4><ul class="dbl">' + obj + '</ul>' : '') +
          (comp ? '<h4>' + esc(T.competences) + '</h4><ul class="dbl">' + comp + '</ul>' : '') +
          '<h4>' + esc(T.metiers) + '</h4><ul class="dbl dm-list">' + deb + '</ul>' +
          (text(p, 'poursuite') ? '<p class="dbs">' + esc(text(p, 'poursuite')) + '</p>' : '') +
          '</article>';
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
        return '<article class="card nw gd" style="--i:' + i + '">' +
          '<span class="ic">' + esc(g.icone || '📌') + '</span>' +
          '<h3>' + esc(text(g, 'titre')) + '</h3>' +
          '<p>' + esc(text(g, 'resume')) + '</p>' +
          (text(g, 'duree') ? '<span class="chip">' + esc(T.duree) + ' : ' + esc(text(g, 'duree')) + '</span>' : '') +
          '<h4>' + esc(T.etapes) + '</h4><ol class="gdl">' + steps + '</ol>' +
          (pieces ? '<h4>' + esc(T.pieces) + '</h4><ul class="dbl">' + pieces + '</ul>' : '') +
          '</article>';
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
      var html = groups.map(function (g, gi) {
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
      if (tabs) {
        var c = tabs.querySelector('[data-count]');
        if (c) c.textContent = total;
      }
    }

    get('data/faq.json').then(function (d) {
      data = d;
      if (tabs) {
        tabs.innerHTML = '<button class="fq-tab on" type="button" role="tab" aria-selected="true" data-g="">Tout</button>' +
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

  function start() {
    renderDebouches();
    renderGuides();
    renderFaq();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
