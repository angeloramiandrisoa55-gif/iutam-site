# API IUTAM Mahajanga

L'API expose les contenus publics de l'IUTAM à d'autres applications (application
mobile, portail d'admission, tableaux de bord, site de l'Université).

Elle est volontairement **simple et sans serveur** : le site est statique, donc
l'API de lecture est constituée de fichiers JSON servis par le même hébergeur.
Les requêtes d'écriture (formulaire de contact, lettre d'information, espace
étudiant) sont traitées par un **Cloudflare Worker** qui ajoute validation,
limitation de débit et authentification.

---

## 1. Vue d'ensemble

| | Lecture | Écriture |
|---|---|---|
| Support | Fichiers statiques `/api/*.json` | Cloudflare Worker `api/worker.js` |
| Authentification | Aucune (données publiques) | JWT HS256 (Bearer) |
| Limitation de débit | Selon l'hébergeur | 5 requêtes / 10 min / IP |
| Origines autorisées | Toutes (CORS `*`) | Seulement le site (liste stricte) |
| Document machine | `/api/openapi.json` (OpenAPI 3.1) | — |

Base des URL : `https://www.VOTRE-DOMAINE.mg`

---

## 2. Points de terminaison de lecture

Toutes les réponses suivent la même forme :

```json
{
  "meta": {
    "endpoint": "/api/formations.json",
    "version": "2.1.0",
    "generated": "2026-10-19T09:15:00.000Z",
    "count": 6,
    "ressource": "formations"
  },
  "items": [ … ]
}
```

| Point de terminaison | Contenu | Nombre d'éléments |
|---|---|---|
| `GET /api/index.json` | Index de tous les points de terminaison | — |
| `GET /api/formations.json` | Les 6 parcours : niveau, bac, objectifs, compétences, débouchés | 6 |
| `GET /api/admissions.json` | Conditions d'admission, durée, diplôme, stages | 6 |
| `GET /api/frais.json` | Grille tarifaire complète (communs, tranches, niveaux) | 3 niveaux |
| `GET /api/actualites.json` | Actualités, de la plus récente à la plus ancienne | variable |
| `GET /api/sites.json` | Sites de l'IUTAM (Mahajanga, Antsohihy, Maevatanana) | 3 |
| `GET /api/faq.json` | Questions fréquentes, groupées par thème | 16 |
| `GET /api/contacts.json` | Coordonnées, horaires, réseaux sociaux | 1 |
| `GET /api/openapi.json` | Spécification OpenAPI 3.1 | — |

### 2.1 Exemple : les formations

```bash
curl https://www.VOTRE-DOMAINE.mg/api/formations.json
```

```json
{
  "meta": { "endpoint": "/api/formations.json", "version": "2.1.0", "count": 6 },
  "items": [
    {
      "id": "agriculture",
      "nom": { "fr": "Agriculture", "mg": "Fambolena" },
      "niveau": "licence",
      "duree": "3 ans",
      "bac": "C, D, S, OSE et Agricole",
      "bac_series": ["C", "D", "S", "OSE", "Agricole"],
      "resume": { "fr": "Acquérez les bases…", "mg": "Mahazo ny fanalahidy…" },
      "objectifs": [ { "fr": "Maîtriser les itinéraires…", "mg": "Man mastery…" } ],
      "competences": [ { "fr": "Analyse de sol…", "mg": "Fanadihadiana…" } ],
      "debouches": [
        { "metier": { "fr": "Technicien agricole", "mg": "Teknisy agrikola" },
          "secteur": { "fr": "Exploitations agricoles", "mg": "Tantara fambolena" } }
      ],
      "poursuite": { "fr": "Ingéniorat P.V.T.D.D.…", "mg": "Ingéniorat P.V.T.D.D.…" },
      "image": "images/pub-agriculture.jpg"
    }
  ]
}
```

**Convention importante** : les champs bilingues sont exposés sous la forme
`{ "fr": "…", "mg": "…" }`. Un client peut donc afficher la bonne langue
sans avoir à connaître la structure du site.

### 2.2 Exemple : les frais

```bash
curl https://www.VOTRE-DOMAINE.mg/api/frais.json
```

```json
{
  "meta": { "ressource": "frais", "count": 3, "annee": "2026-2027" },
  "annee": "2026-2027",
  "communs": [ { "designation": { "fr": "Droit d'inscription", "mg": "Sarany fisoratana anarana" }, "montant": 60000 } ],
  "tranches": [ { "designation": { "fr": "1ère tranche de frais de formation", "mg": "…" } } ],
  "niveaux": [ { "nom": { "fr": "L1 – L2" }, "tranche": 166700 } ]
}
```

Les montants sont des entiers en Ariary (sans décimale, sans séparateur).

---

## 3. Points de terminaison d'écriture (Cloudflare Worker)

Base : `https://api.VOTRE-DOMAINE.mg` (à configurer dans `data/contact.json`).

| Point de terminaison | Méthode | Authentification | Description |
|---|---|---|---|
| `POST /api/contact` | POST | Origine autorisée | Envoi d'un message du formulaire |
| `POST /api/newsletter` | POST | Origine autorisée | Inscription à la lettre d'information |
| `POST /api/auth/login` | POST | Origine autorisée | Connexion, renvoie un jeton JWT |
| `GET /api/me` | GET | `Authorization: Bearer <jeton>` | Profil de l'utilisateur connecté |
| `GET /api/health` | GET | aucune | Sonde de disponibilité (monitoring) |

### 3.1 Envoyer un message

```bash
curl -X POST https://api.VOTRE-DOMAINE.mg/api/contact \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://www.VOTRE-DOMAINE.mg' \
  -d '{
        "nom": "Rakoto",
        "email": "rakoto@example.mg",
        "sujet": "Admission",
        "message": "Bonjour, je souhaite des informations sur les inscriptions.",
        "consent": true
      }'
```

Réponse `200` :

```json
{ "ok": true, "message": "Merci ! Votre message a bien été envoyé, nous revenons vers vous rapidement." }
```

Réponse `422` (champ invalide) :

```json
{
  "error": "Certains champs sont invalides.",
  "erreurs": { "email": "Adresse e-mail invalide." }
}
```

**Règles de validation** (appliquées côté serveur, jamais seulement côté client) :

| Champ | Type | Contraintes |
|---|---|---|
| `nom` | texte | obligatoire, 2 à 120 caractères |
| `email` | texte | obligatoire, format valide, 254 caractères max |
| `sujet` | texte | facultatif, 150 caractères max |
| `message` | texte | obligatoire, 10 à 4 000 caractères |
| `consent` | booléen | obligatoire et vrai |
| `company` | texte | **pot de miel** : doit rester vide |

Les caractères de contrôle sont supprimés, et les chevauchements de balises
(`<`, `>`) sont retirés, pour qu'un message ne puisse pas injecter de code
dans l'e-mail du secrétariat.

### 3.2 S'inscrire à la lettre d'information

```bash
curl -X POST https://api.VOTRE-DOMAINE.mg/api/newsletter \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://www.VOTRE-DOMAINE.mg' \
  -d '{"email": "interesse@example.mg"}'
```

L'adresse est enregistrée dans l'espace de clé/valeur `IUTAM_KV`, sous la clé
`nl:<adresse>`. Une inscription déjà connue renvoie un message sans erreur
(le Worker ne révèle pas les adresses déjà inscrites).

### 3.3 Se connecter et utiliser le jeton

```bash
curl -X POST https://api.VOTRE-DOMAINE.mg/api/auth/login \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://www.VOTRE-DOMAINE.mg' \
  -d '{"email": "etudiant@example.mg", "password": "…"}'
```

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.…",
  "token_type": "Bearer",
  "expires_in": 3600,
  "profil": { "email": "etudiant@example.mg", "nom": "…", "role": "etudiant" }
}
```

Puis :

```bash
curl https://api.VOTRE-DOMAINE.mg/api/me -H 'Authorization: Bearer <jeton>'
```

Le jeton est un **JWT HS256** signé avec `JWT_SECRET`, valable **1 heure**.
`GET /api/me` renvoie `401` si le jeton est absent, falsifié ou expiré.

---

## 4. Sécurité de l'API d'écriture

| Mesure | Détail |
|---|---|
| Origine obligatoire | `ALLOWED_ORIGINS` doit contenir l'origine du site ; sinon `403` |
| Anti-CSRF | la vérification d'origine protège les écritures ; les jetons JWT sont en en-tête `Authorization`, jamais envoyés automatiquement par le navigateur |
| Limitation de débit | 5 requêtes / 10 min / IP et par point de terminaison (`429`) |
| Anti-robot | pot de miel + durée minimale de remplissage (2 s, réglable par `BOT_MIN_MS`) |
| Hachage des mots de passe | PBKDF2-HMAC-SHA256, 120 000 itérations, sel aléatoire de 16 octets |
| Comparaison | à temps constant, pour ne pas révéler le nombre de caractères corrects |
| Fuite d'information | un compte inexistant déclenche un hachage factice : le temps de réponse ne trahit pas l'existence du compte |
| En-têtes | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security` sur toutes les réponses |

> **Note sur bcrypt / argon2.** Cloudflare Workers ne propose ni bcrypt ni argon2.
> PBKDF2 via l'API WebCrypto est l'algorithme le plus fort disponible dans ce
> contexte, avec un nombre d'itérations élevé. Si l'IUTAM souhaite argon2id,
> il faut un backend dédié (Node.js, PHP ou PostgreSQL) — voir la feuille de
> route en fin de document.

---

## 5. Créer un compte utilisateur (espace étudiant)

Les utilisateurs sont stockés dans l'espace de clé/valeur, sous la clé
`user:<adresse en minuscules>` :

```json
{
  "id": "u1",
  "email": "etudiant@example.mg",
  "nom": "Rakoto Jean",
  "role": "etudiant",
  "salt": "<base64>",
  "hash": "<base64>"
}
```

Rôles possibles : `admin`, `staff`, `etudiant`, `invite` (voir `docs/ROLES.md`).

Pour créer un compte, il faut d'abord hasher le mot de passe. Le script
suivant utilise exactement le même algorithme que le Worker :

```js
// tools/hash-password.js
const enc = new TextEncoder();
const password = process.argv[2];
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
const bits = await crypto.subtle.deriveBits(
  { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, key, 256);
const b64 = b => Buffer.from(b).toString('base64');
console.log(JSON.stringify({ salt: b64(salt), hash: b64(new Uint8Array(bits)) }, null, 2));
```

Puis enregistrer le résultat dans le KV :

```bash
npx wrangler kv:key put --binding IUTAM_KV "user:etudiant@example.mg" --path=user.json
```

---

## 6. Tester en local

```bash
npm run api:dev          # lance le Worker en local (port 8787)
npm test                 # 18 tests de sécurité, sans réseau
```

Pour pointed le site vers le Worker local, dans `data/contact.json` :

```json
"formulaire": { "endpoint": "http://127.0.0.1:8787/api/contact" },
"newsletter": { "endpoint": "http://127.0.0.1:8787/api/newsletter" }
```

et dans `.dev.vars` (jamais commité) :

```
ALLOWED_ORIGINS=http://localhost:8080
JWT_SECRET=un-secret-de-test-suffisamment-long
```

---

## 7. Déploiement

```bash
npx wrangler kv:namespace create IUTAM_KV      # 1. créer l'espace de stockage
# 2. reporter l'identifiant dans wrangler.toml
npx wrangler secret put JWT_SECRET             # 3. secret de signature
npx wrangler secret put ALLOWED_ORIGINS        # 4. origine du site
npx wrangler deploy                             # 5. publication
```

Puis, dans `data/contact.json`, renseigner les adresses des points de terminaison :

```json
"formulaire": { "endpoint": "https://api.VOTRE-DOMAINE.mg/api/contact" },
"newsletter": { "endpoint": "https://api.VOTRE-DOMAINE.mg/api/newsletter" }
```

et enfin, dans `_headers` et `.htaccess`, ajouter l'origine du Worker à la
politique de contenu (`connect-src` et `form-action`).

---

## 8. Feuille de route

| Version | Contenu |
|---|---|
| **v2.1** (actuelle) | lecture statique, contact, newsletter, connexion JWT, sonde de santé |
| v2.2 | espace étudiant : notes, attestation de scolarité, emploi du temps |
| v2.3 | API d'administration : publication d'actualités depuis l'interface |
| v3.0 | migration vers une base de données (PostgreSQL) si le volume d'utilisateurs le justifie |

---

## 9. Voir aussi

- `docs/SECURITE.md` — mesures de sécurité et procédures d'incident
- `docs/WAF.md` — pare-feu applicatif (Cloudflare, mod_security)
- `docs/MONITORING.md` — surveillance et alertes
- `docs/ROLES.md` — rôles et permissions
- `api/worker.js` — code du Worker
- `tools/build-api.js` — génération des fichiers de l'API
