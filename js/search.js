// Moteur de recherche interne.
//   - s'ouvre avec le bouton 🔍 ou avec Ctrl + K (Cmd + K sur Mac)
//   - indexe les titres de la page et le contenu des fichiers de data/
//   - fonctionne entièrement dans le navigateur : aucune donnée n'est envoyée
//
// L'index est reconstruit à chaque ouverture (le contenu évolue au fil des
// actualités) : c'est rapide et évite de gérer un cache à invalider.

(function () {
  'use strict';

  var root = document.documentElement.dataset.root || '';
  var LANG = document.documentElement.lang === 'mg' ? 'mg' : 'fr';

  var T = {
    fr: {
      placeholder: 'Rechercher une formation, une question, une actualité…',
      open: 'Rechercher sur le site',
      close: 'Fermer la recherche',
      empty: 'Aucun résultat. Essayez d\'autres mots.',
      hint: 'Astuce : Ctrl + K pour ouvrir, Échap pour fermer',
      noResults: 'Aucun résultat',
      results: 'résultat(s)',
      sections: 'dans cette page',
      data: 'dans le contenu'
    },
    mg: {
      placeholder: 'Hitady ny lalam-piofanana, ny fanontaniana, ny vaovao…',
      open: 'Fikarohana ao amin\'ny tranonkala',
      close: 'Hidio ny fikarohana',
      empty: 'Tsy misy valiny. Andramo teny hafa.',
      hint: 'Torohevitra : Ctrl + K hanokatra, Esc hidio',
      noResults: 'Tsy misy valiny',
      results: 'valiny',
      sections: 'amin\'ity pejy ity',
      data: 'amin\'ny votoatiny'
    }
  }[LANG];

  var PAGE_INDEX = [];   // reconstruit à chaque ouverture (le contenu évolue)
  var DATA_INDEX = [];   // chargé une seule fois (formations, FAQ, guides, actualités)
  var dataReady = null;

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function strip(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  /** Minuscules sans accents : « Pêche » et « peche » se rejoignent. */
  function norm(s) {
    return strip(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function get(u) {
    return fetch(root + u, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(u);
      return r.json();
    });
  }

  /* ------------------------------------------------------------------ index */

  function indexPage() {
    var out = [];
    var sections = document.querySelectorAll('section[id]');
    Array.prototype.forEach.call(sections, function (sec) {
      var h = sec.querySelector('h2');
      if (!h) return;
      var title = strip(h.textContent);
      var body = strip(sec.textContent);
      out.push({
        kind: 'section',
        title: title,
        text: body,
        href: '#' + sec.id,
        anchor: sec.id
      });
      // sous-sections (h3) : pour un résultat plus précis
      Array.prototype.forEach.call(sec.querySelectorAll('h3[id]'), function (h3) {
        out.push({
          kind: 'section',
          title: strip(h3.textContent),
          text: body,
          href: '#' + h3.id,
          anchor: h3.id
        });
      });
    });
    return out;
  }

  function indexData() {
    var jobs = [];

    jobs.push(get('data/formations.json').then(function (d) {
      (d.parcours || []).forEach(function (p) {
        var deb = (p.debouches || []).map(function (x) {
          return (x.metier || '') + ' ' + (x.metier_mg || '') + ' ' + (x.secteur || '') + ' ' + (x.secteur_mg || '');
        }).join(' ');
        DATA_INDEX.push({
          kind: 'data',
          title: p.nom || '',
          text: [p.resume, p.resume_mg, p.bac, deb].filter(Boolean).join(' '),
          href: '#debouches'
        });
      });
    }).catch(function () { }));

    jobs.push(get('data/faq.json').then(function (d) {
      (d.groupes || []).forEach(function (g) {
        (g.questions || []).forEach(function (q) {
          DATA_INDEX.push({
            kind: 'data',
            title: q.q || q.q_mg || '',
            text: [q.q, q.q_mg, q.r, q.r_mg].filter(Boolean).join(' '),
            href: '#faq'
          });
        });
      });
    }).catch(function () { }));

    jobs.push(get('data/guides.json').then(function (d) {
      (d.guides || []).forEach(function (g) {
        var steps = (g.etapes || []).map(function (e) {
          return (e.t || '') + ' ' + (e.t_mg || '') + ' ' + (e.d || '') + ' ' + (e.d_mg || '');
        }).join(' ');
        DATA_INDEX.push({
          kind: 'data',
          title: g.titre || g.titre_mg || '',
          text: [g.titre, g.titre_mg, g.resume, g.resume_mg, steps, (g.pieces || []).join(' ')].filter(Boolean).join(' '),
          href: '#guides'
        });
      });
    }).catch(function () { }));

    jobs.push(get('data/actualites.json').then(function (d) {
      (d.items || []).forEach(function (x) {
        DATA_INDEX.push({
          kind: 'data',
          title: x.titre || x.titre_mg || '',
          text: [x.titre, x.titre_mg, x.resume, x.resume_mg].filter(Boolean).join(' '),
          href: '#actus'
        });
      });
    }).catch(function () { }));

    return Promise.all(jobs);
  }

  function buildIndex() {
    PAGE_INDEX = indexPage();
    if (!dataReady) dataReady = indexData();
    return dataReady;
  }

  /* ----------------------------------------------------------------- rendu */

  function search(q) {
    var n = norm(q);
    if (n.length < 2) return [];
    var words = n.split(/\s+/);
    var res = [];
    var ALL = PAGE_INDEX.concat(DATA_INDEX);
    for (var i = 0; i < ALL.length; i++) {
      var it = ALL[i];
      var hay = norm(it.title + ' ' + it.text);
      var score = 0;
      for (var w = 0; w < words.length; w++) {
        var word = words[w];
        if (!word) continue;
        if (norm(it.title).indexOf(word) !== -1) score += 12;
        var pos = hay.indexOf(word);
        if (pos !== -1) score += 5;
        else {
          // correspondance partielle (début de mot)
          if (hay.indexOf(word.slice(0, 4)) !== -1) score += 2;
          else { score = 0; break; }
        }
      }
      if (score > 0) res.push({ item: it, score: score });
    }
    res.sort(function (a, b) { return b.score - a.score; });
    // on garde au maximum 2 résultats par section
    var seen = {}, out = [];
    for (var j = 0; j < res.length && out.length < 14; j++) {
      var k = res[j].item.href;
      if (seen[k] >= 2) continue;
      seen[k] = (seen[k] || 0) + 1;
      out.push(res[j].item);
    }
    return out;
  }

  function snippet(item, q) {
    var words = norm(q).split(/\s+/).filter(Boolean);
    var body = strip(item.text);
    if (!body) return '';
    var n = norm(body);
    var at = -1;
    for (var i = 0; i < words.length; i++) {
      at = n.indexOf(words[i]);
      if (at !== -1) break;
    }
    if (at === -1) return body.slice(0, 140) + (body.length > 140 ? '…' : '');
    var start = Math.max(0, at - 50);
    return (start > 0 ? '…' : '') + body.slice(start, start + 160) + (body.length > start + 160 ? '…' : '');
  }

  /* ----------------------------------------------------------------- popup */

  var overlay, input, results, closeBtn, lastFocus;

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'srch';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', T.open);
    overlay.innerHTML =
      '<div class="srch-box">' +
      '<div class="srch-bar">' +
      '<span class="srch-ic" aria-hidden="true">🔍</span>' +
      '<input type="search" class="srch-in" placeholder="' + esc(T.placeholder) + '" aria-label="' + esc(T.open) + '" autocomplete="off" spellcheck="false">' +
      '<button type="button" class="srch-x" aria-label="' + esc(T.close) + '">✕</button>' +
      '</div>' +
      '<div class="srch-res" role="region" aria-live="polite"></div>' +
      '<p class="srch-hint">' + esc(T.hint) + '</p>' +
      '</div>';
    document.body.appendChild(overlay);
    input = overlay.querySelector('.srch-in');
    results = overlay.querySelector('.srch-res');
    closeBtn = overlay.querySelector('.srch-x');

    input.addEventListener('input', function () { draw(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); e.preventDefault(); }
      if (e.key === 'ArrowDown') { var f = results.querySelector('a'); if (f) { f.focus(); e.preventDefault(); } }
    });
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (overlay.hidden) open(); else close();
      }
      if (e.key === 'Escape' && !overlay.hidden) close();
    });
  }

  function open() {
    if (!overlay) build();
    lastFocus = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    input.value = '';
    // L'index de la page est reconstruit à chaque ouverture : les sections
    // dynamiques (débouchés, guides, FAQ) sont peut-être arrivées depuis.
    buildIndex();
    draw('');
    input.focus();
  }

  function close() {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function draw(q) {
    if (!results) return;
    if (!q || q.trim().length < 2) {
      results.innerHTML = '<p class="empty">' + esc(T.hint) + '</p>';
      return;
    }
    var list = search(q);
    if (!list.length) {
      results.innerHTML = '<p class="empty">' + esc(T.empty) + '</p>';
      return;
    }
    var html = '<p class="srch-n">' + list.length + ' ' + esc(T.results) + '</p>';
    html += list.map(function (it, i) {
      return '<a class="srch-r" href="' + esc(it.href) + '" data-i="' + i + '">' +
        '<span class="srch-t">' + esc(it.title || it.href) + '</span>' +
        '<span class="srch-s">' + esc(snippet(it, q)) + '</span>' +
        '<span class="srch-k">' + esc(it.kind === 'data' ? T.data : T.sections) + '</span>' +
        '</a>';
    }).join('');
    results.innerHTML = html;
    Array.prototype.forEach.call(results.querySelectorAll('.srch-r'), function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var id = a.getAttribute('href').replace('#', '');
        var target = document.getElementById(id);
        close();
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', '#' + id);
        }
      });
    });
  }

  function start() {
    var btn = document.getElementById('sb');
    if (btn) btn.addEventListener('click', open);
    // Construction anticipée de l'index (silencieuse)
    buildIndex();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
