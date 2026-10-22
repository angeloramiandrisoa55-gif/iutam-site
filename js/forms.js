// Formulaires du site : contact et inscription à la lettre d'information.
//
// Le formulaire n'ouvre plus simplement le logiciel de messagerie : il envoie
// les données en JSON à l'API (api/worker.js), qui les valide côté serveur,
// filtre les robots et les flood. Si l'API n'est pas encore déployée, le site
// retombe sur l'ouverture du logiciel de messagerie : le visiteur ne perd jamais
// son message.
//
// Sécurité côté client : validation des champs, pot de miel (honeypot), limite
// de longueur, messages d'erreur accessibles. La vraie protection (origine
// vérifiée, limitation de débit, validation serveur) est assurée par le Worker.

(function () {
  'use strict';

  var root = document.documentElement.dataset.root || '';
  var LANG = document.documentElement.lang === 'mg' ? 'mg' : 'fr';

  var T = {
    fr: {
      sending: 'Mampandefa…',
      ok: 'Misaotra ! Voalaza ny hafatrao, miverina haingana aminareo izahay.',
      ko: 'Tsy nahomby ny fandefasana. Mangataka andramo indray na antsoyinao ny sekretaria.',
      offline: 'Tsy mifandray ny navigateurinao : voaomitry tao amin\'ny mailakao ny hafatrao.',
      required: 'Tsy maintsy fenoina ity saha ity.',
      email: 'Mangataka adiresy mailaka marina.',
      short: 'Tsy feno ny hafatra (10 litera farafahakeliny).',
      consent: 'Ny manaiky anao dia ilaina hanarahana ny fangatahanao.',
      tooLong: 'Tsy feno ny saha ity.',
      rate: 'Be loatra ny fandefasana avy amin\'ity fitaovana ity. Mangataka andramo indray.',
      saved: 'Voarakitra ny fisoratana anarana.',
      subscribe: 'Hisoratra anarana',
      subscribed: 'Misaotra ! Voasoratra anarana amin\'ny gazety fampandrosoana.'
    },
    mg: {
      sending: 'Mampandefa…',
      ok: 'Misaotra ! Voalaza ny hafatrao, miverina haingana aminareo izahay.',
      ko: 'Tsy nahomby ny fandefasana. Mangataka andramo indray na antsoyinao ny sekretaria.',
      offline: 'Tsy mifandray ny navigateurinao : voaomitry tao amin\'ny mailakao ny hafatrao.',
      required: 'Tsy maintsy fenoina ity saha ity.',
      email: 'Mangataka adiresy mailaka marina.',
      short: 'Tsy feno ny hafatra (10 litera farafahakeliny).',
      consent: 'Tsy maintsy manaiky ianao mba hampiasaina ny angon-drindrinao.',
      tooLong: 'Tsy fara ny saha ity.',
      rate: 'Be loatra ny fandefasana avy amin’ity fitaovana ity. Mangataka andramo indray.',
      saved: 'Voarakitra ny fisoratana anarana.',
      subscribe: 'Hisoratra anarana',
      subscribed: 'Misaotra ! Voasoratra anarana amin’ny gazety fampandrosoana.'
    }
  }[LANG];

  /* ------------------------------------------------------------------ utilitaires */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function get(url) {
    return fetch(root + url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(url);
      return r.json();
    });
  }

  function mailtoFallback(cfg, subject, body) {
    var to = (cfg && cfg.siege && cfg.siege.email) || '';
    if (!to) { window.alert(subject + '\n\n' + body); return; }
    window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
  }

  function setMessage(el, text, state) {
    if (!el) return;
    el.textContent = text;
    el.className = 'fm ' + (state || '');
  }

  function fieldError(input, message) {
    if (!input) return;
    var box = input.closest('.fr') || input.parentNode;
    if (!box) return;
    var p = box.querySelector('.fe');
    if (!p) {
      p = document.createElement('p');
      p.className = 'fe';
      p.setAttribute('role', 'alert');
      box.appendChild(p);
    }
    p.textContent = message || '';
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function clearErrors(form) {
    Array.prototype.forEach.call(form.querySelectorAll('.fe'), function (p) { p.textContent = ''; });
    Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid]'), function (i) {
      i.removeAttribute('aria-invalid');
    });
  }

  /* ------------------------------------------------------------------ validation */

  function validate(form, rules) {
    var ok = true;
    for (var name in rules) {
      if (!Object.prototype.hasOwnProperty.call(rules, name)) continue;
      var input = form.elements[name];
      if (!input) continue;
      var rule = rules[name];
      var value = (input.value || '').trim();
      var msg = '';

      if (rule.required && !value) msg = T.required;
      else if (rule.email && value && !/^[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}$/i.test(value)) msg = T.email;
      else if (rule.min && value && value.length < rule.min) msg = T.short;
      else if (rule.max && value && value.length > rule.max) msg = T.tooLong;
      else if (rule.consent && !input.checked) msg = T.consent;

      fieldError(input, msg);
      if (msg) ok = false;
    }
    return ok;
  }

  /* ------------------------------------------------------------------ envoi */

  function send(endpoint, payload, btn, msgEl) {
    if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }
    setMessage(msgEl, T.sending, 'wait');

    return fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) {
        if (r.ok) return body;
        var err = new Error((body && body.error) || 'HTTP ' + r.status);
        err.status = r.status;
        err.body = body;
        throw err;
      });
    });
  }

  /* ------------------------------------------------------------------ contact */

  function initContact(cfg) {
    var form = document.getElementById('f');
    if (!form) return;
    var msgEl = document.getElementById('f-msg');
    var btn = form.querySelector('button[type=submit]');
    var endpoint = (cfg && cfg.formulaire && cfg.formulaire.endpoint) || '';

    var rules = {
      nom: { required: true, max: 120 },
      email: { required: true, email: true, max: 254 },
      sujet: { max: 150 },
      message: { required: true, min: 10, max: 4000 },
      consent: { consent: true }
    };

    // Nettoyage des erreurs dès que l'utilisateur corrige
    form.addEventListener('input', function (e) {
      if (e.target.matches('input, textarea')) fieldError(e.target, '');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors(form);
      if (!validate(form, rules)) {
        setMessage(msgEl, T.ko, 'err');
        var first = form.querySelector('[aria-invalid="true"]');
        if (first) first.focus();
        return;
      }

      var data = {
        nom: form.elements.nom.value.trim(),
        email: form.elements.email.value.trim(),
        sujet: (form.elements.sujet && form.elements.sujet.value.trim()) ||
          ((cfg && cfg.formulaire && cfg.formulaire.sujet) || 'Contact site IUTAM'),
        message: form.elements.message.value.trim(),
        consent: form.elements.consent.checked,
        // pot de miel : doit rester vide
        company: (form.elements.company && form.elements.company.value) || ''
      };

      // Aucune API configurée : ouverture directe du logiciel de messagerie.
      if (!endpoint) {
        setMessage(msgEl, T.offline, 'wait');
        mailtoFallback(cfg, data.sujet, data.message + '\n\n' + data.nom + ' — ' + data.email);
        return;
      }

      send(endpoint, data, btn, msgEl).then(function (body) {
        setMessage(msgEl, (body && body.message) || T.ok, 'ok');
        form.reset();
        clearErrors(form);
      }).catch(function (err) {
        if (err && err.status === 429) {
          setMessage(msgEl, T.rate, 'err');
          return;
        }
        setMessage(msgEl, T.ko, 'err');
        // Repli : le message n'est pas perdu, il part par la messagerie.
        mailtoFallback(cfg, data.sujet, data.message + '\n\n' + data.nom + ' — ' + data.email);
      }).finally(function () {
        if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); }
      });
    });
  }

  /* ------------------------------------------------------------------ newsletter */

  function initNewsletter(cfg) {
    var form = document.getElementById('nl');
    if (!form) return;
    var msgEl = document.getElementById('nl-msg');
    var btn = form.querySelector('button[type=submit]');
    var endpoint = (cfg && cfg.newsletter && cfg.newsletter.endpoint) || '';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors(form);
      var input = form.elements.email;
      var value = (input.value || '').trim();
      if (!value) { fieldError(input, T.required); return; }
      if (!/^[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}$/i.test(value)) { fieldError(input, T.email); return; }

      if (!endpoint) {
        setMessage(msgEl, T.saved, 'ok');
        input.value = '';
        return;
      }

      var data = {
        email: value,
        company: (form.elements.company && form.elements.company.value) || ''
      };

      send(endpoint, data, btn, msgEl).then(function (body) {
        setMessage(msgEl, (body && body.message) || T.subscribed, 'ok');
        form.reset();
      }).catch(function (err) {
        if (err && err.status === 429) { setMessage(msgEl, T.rate, 'err'); return; }
        setMessage(msgEl, T.ko, 'err');
      }).finally(function () {
        if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); }
      });
    });
  }

  /* ------------------------------------------------------------------ démarrage */

  function start() {
    get('data/contact.json').then(function (cfg) {
      initContact(cfg);
      initNewsletter(cfg);
    }).catch(function () {
      // Sans configuration, le formulaire de contact reste utilisable par messagerie.
      initContact(null);
      initNewsletter(null);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
