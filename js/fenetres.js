/* Fenêtres de détails, bouton « Retour » et pied de page.
 *
 *  1) Les blocs dépliables (débouchés, guides pratiques, grille tarifaire) s'ouvrent dans une fenêtre,
 *     comme les mentions légales : plus rien ne s'étale dans la page. Chaque fenêtre a « Retour » et « Fermer ».
 *  2) Toutes les fenêtres (mentions légales, photos, détails) ajoutent une étape à l'historique :
 *     le bouton « Retour » du téléphone ou du navigateur ferme la fenêtre au lieu de quitter le site.
 *  3) Page des mentions légales : « Retour au site » revient là où l'on était.
 *  4) Pied de page : le nom de l'institut tient sur une seule ligne.
 */
(function () {
  'use strict';

  var LANG = document.documentElement.lang === 'mg' ? 'mg' : 'fr';
  var TXT = {
    fr: { back: '← Retour', close: 'Fermer', fees: 'Grille tarifaire' },
    mg: { back: '← Miverina', close: 'Akatony', fees: 'Lisitry ny saram-pianarana' }
  };
  var T = TXT[LANG];
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------ dernier élément touché (pour rendre le focus) */
  var lastTrigger = null;
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('a,button,summary');
    if (t) lastTrigger = t;
  }, true);

  /* ------------------------------------------------------------- 2) historique : bouton « Retour » */
  var opened = [];
  var prevRestoration = null;

  function lockBody(on) {
    document.body.style.overflow = on ? 'hidden' : '';
  }
  function restoreScrollMode() {
    setTimeout(function () {
      try { if (prevRestoration) history.scrollRestoration = prevRestoration; } catch (e) {}
    }, 400);
  }
  function onOpen(m) {
    if (m.__h) return;
    try {
      prevRestoration = history.scrollRestoration;
      history.scrollRestoration = 'manual';
      history.pushState({ iutamFenetre: 1 }, '', location.href);
      m.__h = true;
      m.__trigger = lastTrigger;
      opened.push(m);
    } catch (e) {}
  }
  function onClosed(m) {
    if (!m.__h) return;
    m.__h = false;
    opened = opened.filter(function (x) { return x !== m; });
    try { history.back(); } catch (e) {}
    restoreScrollMode();
  }
  var watcher = new MutationObserver(function (list) {
    list.forEach(function (mu) {
      var m = mu.target;
      if (!m.classList || !m.classList.contains('mm')) return;
      if (m.hidden) onClosed(m); else onOpen(m);
    });
  });
  watcher.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['hidden'] });

  window.addEventListener('popstate', function () {
    var m = opened[opened.length - 1];
    if (!m) return;
    m.__h = false;
    opened.pop();
    m.hidden = true;
    lockBody(false);
    if (m.__trigger && m.__trigger.focus) m.__trigger.focus({ preventScroll: true });
    restoreScrollMode();
  });

  /* ------------------------------------------------------------ 1) fenêtres de détails */
  var sheet = null;
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function textOf(root, sel) {
    var n = root.querySelector(sel);
    return n ? n.textContent.trim() : '';
  }

  function buildSheet() {
    var m = el('div', 'mm mm-sheet');
    m.hidden = true;
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.setAttribute('aria-labelledby', 'sheet-t');
    var box = el('div', 'mm-box');
    var bar = el('div', 'sheet-bar');
    var back = el('button', 'sheet-back', T.back);
    back.type = 'button';
    var x = el('button', 'sheet-x', '✕');
    x.type = 'button';
    x.setAttribute('aria-label', T.close);
    bar.appendChild(back);
    bar.appendChild(x);
    var inner = el('div', 'sheet-in');
    var head = el('div', 'sheet-head');
    var body = el('div', 'sheet-body');
    inner.appendChild(head);
    inner.appendChild(body);
    box.appendChild(bar);
    box.appendChild(inner);
    m.appendChild(box);
    document.body.appendChild(m);

    function close() {
      m.hidden = true;
      lockBody(false);
      if (m.__trigger && m.__trigger.focus) m.__trigger.focus({ preventScroll: true });
    }
    back.addEventListener('click', close);
    x.addEventListener('click', close);
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
    m.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
      if (e.key !== 'Tab') return;
      var f = [].filter.call(m.querySelectorAll('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'), function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0];
      var last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    return { m: m, box: box, inner: inner, head: head, body: body, back: back };
  }

  function showSheet(headNodes, bodyNode, trigger) {
    if (!sheet) sheet = buildSheet();
    sheet.head.innerHTML = '';
    sheet.body.innerHTML = '';
    headNodes.forEach(function (n) { if (n) sheet.head.appendChild(n); });
    sheet.body.appendChild(bodyNode);
    sheet.inner.scrollTop = 0;
    sheet.m.__trigger = trigger || lastTrigger;
    lockBody(true);
    sheet.m.hidden = false;
    setTimeout(function () { sheet.back.focus({ preventScroll: true }); }, 30);
  }

  function openDebouche(summary) {
    var d = summary.parentElement;
    var body = d.querySelector('.db-body');
    if (!body) return;
    var h = el('h2', 'sheet-t', textOf(summary, '.db-t b'));
    h.id = 'sheet-t';
    var eyebrow = el('p', 'sheet-eyebrow', textOf(summary, '.db-lv'));
    var meta = el('p', 'sheet-meta');
    var metiers = textOf(summary, '.db-m');
    if (metiers) meta.appendChild(el('span', 'sheet-line', metiers));
    showSheet([eyebrow, h, meta], body.cloneNode(true), summary);
  }

  function openGuide(summary) {
    var d = summary.parentElement;
    var body = d.querySelector('.gd-body');
    if (!body) return;
    var top = el('div', 'sheet-gd');
    var ic = summary.querySelector('.ic');
    if (ic) top.appendChild(ic.cloneNode(true));
    var txt = el('div', 'sheet-gt');
    var h = el('h2', 'sheet-t', textOf(summary, '.gd-t b'));
    h.id = 'sheet-t';
    txt.appendChild(h);
    var resume = textOf(summary, '.gd-t > span');
    if (resume) txt.appendChild(el('p', 'sheet-line', resume));
    var chip = textOf(summary, '.chip');
    if (chip) txt.appendChild(el('span', 'chip', chip));
    top.appendChild(txt);
    showSheet([top], body.cloneNode(true), summary);
  }

  function openFees(button) {
    var panel = document.getElementById('fp');
    if (!panel) return;
    var h = el('h2', 'sheet-t', T.fees);
    h.id = 'sheet-t';
    var total = textOf(button, '#frais-total');
    var meta = el('p', 'sheet-meta');
    if (total) meta.appendChild(el('span', 'chip', total));
    var wrap = el('div', 'sheet-fees');
    wrap.innerHTML = panel.innerHTML;
    showSheet([h, meta], wrap, button);
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var s = e.target.closest('details.db-row > summary');
    if (s) { e.preventDefault(); e.stopPropagation(); openDebouche(s); return; }
    s = e.target.closest('details.gd > summary');
    if (s) { e.preventDefault(); e.stopPropagation(); openGuide(s); return; }
    var fb = e.target.closest('#fb');
    if (fb) { e.preventDefault(); e.stopImmediatePropagation(); openFees(fb); }
  }, true);

  /* ------------------------------------- 3) page des mentions légales : « Retour au site » */
  [].forEach.call(document.querySelectorAll('a.back, a.back-bottom'), function (a) {
    a.addEventListener('click', function (e) {
      var ref = document.referrer || '';
      var memeSite = ref && ref.indexOf(location.origin) === 0 && /\/(index\.html)?(#.*)?$/.test(ref.split('?')[0]);
      if (history.length > 1 && memeSite) { e.preventDefault(); history.back(); }
    });
  });

  /* ------------------------------------- 4) pied de page : le nom de l'institut sur une seule ligne */
  function fitFooter() {
    var n = document.querySelector('footer .ft-n');
    if (!n) return;
    n.style.fontSize = '';
    n.style.whiteSpace = '';
    var dispo = n.clientWidth;
    var w = n.scrollWidth;
    if (dispo > 0 && w > dispo) {
      var fs = parseFloat(getComputedStyle(n).fontSize) * dispo / w;
      if (fs >= 8.5) {
        n.style.fontSize = fs + 'px';
      } else {
        /* écran vraiment trop étroit : on garde un texte lisible, sur deux lignes */
        n.style.whiteSpace = 'normal';
        n.style.fontSize = '10px';
      }
    }
  }
  fitFooter();
  window.addEventListener('resize', fitFooter);
  window.addEventListener('load', fitFooter);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitFooter);
})();
