# Site web de l'IUTAM – Mahajanga

Site vitrine officiel de l'**Institut Universitaire de Technologie et d'Agronomie de Mahajanga** (Université de Mahajanga, MESUPRES, système LMD).
Site statique : rapide, sans base de données, sans serveur à maintenir, hébergeable gratuitement.

## Fonctionnalités
- Accueil avec le logo en 3D animé (WebGL), reflet lumineux, rotation au défilement
- Sections : L'Institut, Direction, Vie étudiante, Formations, **Débouchés**, Admission, Frais, **Questions fréquentes**, Actualités, Contact
- **Actualités**, **débouchés professionnels**, **guides pratiques**, **FAQ** et **frais** pilotés par `data/*.json` (modifiables sans toucher au code)
- **Version malagasy** (`/mg/`) générée automatiquement, bouton FR / MG
- **Moteur de recherche interne** (bouton 🔍 ou `Ctrl + K`), entièrement dans le navigateur
- **Formulaire de contact** avec validation, pot de miel et envoi réel à l'API (repli automatique sur la messagerie)
- **Lettre d'information** (inscription par e-mail)
- Page **mentions légales et confidentialité**, page de maintenance 503
- Interface d'administration optionnelle (**Decap CMS**) sur `/admin/`
- **Panneau interactif des 6 parcours** (défilement automatique, flèches, onglets, balayage tactile, pause), plus l'affiche « Nos formations » en grand
- Mode clair/sombre (automatique + bouton, choix mémorisé)
- Animations au défilement, barre de progression, compteurs
- Responsive (téléphone d'abord), accessible (`prefers-reduced-motion`, textes alternatifs, navigation clavier)
- SEO de base : balises Open Graph, données structurées (schema.org), sitemap, robots.txt, page 404

## Technologies
| Besoin | Choix | Pourquoi |
|---|---|---|
| Structure / style / logique | HTML5, CSS3 (variables, grid), JavaScript natif | Aucune dépendance, durable, facile à reprendre |
| 3D | Three.js r128 (copie locale, `js/vendor/`) | Pas de dépendance à un CDN, fonctionne même si un service externe tombe |
| API de lecture | Fichiers JSON statiques (`api/*.json`) | Données exposées sans serveur ni base de données |
| API d'écriture | Cloudflare Worker (`api/worker.js`) | Formulaire, newsletter, connexion JWT : validation et limitation de débit côté serveur |
| Contenus | Fichiers `data/*.json` + Decap CMS | Modifiables par le secrétariat, versionnés, réversibles |
| Images | JPEG optimisés dans `images/` | ~860 Ko au total, chargement différé de la galerie |
| Hébergement | GitHub Pages, Cloudflare Pages, Netlify, ou serveur de l'Université (Apache/IIS/Nginx/Caddy) | Gratuit, HTTPS automatique, déploiement par `git push` |
| Sécurité | `_headers`, `.htaccess`, `web.config` (CSP, anti-clickjacking, HSTS) | Protège les visiteurs |

## Arborescence
```
iutam-site/
├── index.html              page française (source unique du contenu)
├── mg/index.html           version malagasy (GÉNÉRÉE, ne pas modifier à la main)
├── mentions-legales.html   mentions légales et confidentialité (à compléter)
├── 404.html / 503.html     pages d'erreur et de maintenance
├── css/style.css           styles, thèmes clair/sombre, animations
├── js/main.js              thème, animations, logo 3D, actualités et frais
├── js/sections.js          débouchés, guides pratiques, FAQ
├── js/forms.js             formulaire de contact et lettre d'information
├── js/search.js            moteur de recherche interne
├── js/legal.js             thème des pages légales
├── js/vendor/three.min.js  bibliothèque 3D (locale)
├── data/*.json             contenus modifiables : formations, actualites, frais,
│                           sites, faq, guides, contact
├── api/worker.js           API Cloudflare (écriture, authentification JWT)
├── api/*.json              API de lecture (GÉNÉRÉE par tools/build-api.js)
├── admin/                  interface Decap CMS (index.html, config.yml)
├── tools/                  scripts de compilation, de contrôle et de sauvegarde
├── .well-known/security.txt  contact sécurité
├── .htaccess / web.config  configuration Apache / IIS pour un serveur de l'Université
├── deploy/                 auto-hébergement Docker + Caddy (HTTPS automatique)
├── wrangler.toml           configuration du Worker
├── tools/mg.json           dictionnaire français → malagasy
├── images/                 logo, photos (images/actus/ pour les actualités)
├── favicon.ico / .png, robots.txt, sitemap.xml
├── _headers                en-têtes de sécurité (Netlify / Cloudflare)
├── package.json            raccourcis : npm run dev | build | check | test
├── CNAME.example           modèle pour domaine personnalisé
├── .github/workflows/      pages.yml · backup.yml · uptime.yml · security.yml
└── docs/                   DEPLOIEMENT, HEBERGEMENT-UNIVERSITE, SECURITE, WAF,
                            MONITORING, API, ROLES, RECOMMANDATIONS, CMS, LANGUES,
                            CONTENU-A-COMPLETER
```

## Démarrage en local
Le logo 3D charge une image dans WebGL : il faut un petit serveur (l'ouverture directe du fichier ne suffit pas).
```bash
cd iutam-site
python3 -m http.server 8080      # puis ouvrir http://localhost:8080  (ou : npm run dev)
node tools/build-site.js         # génère mg/ et api/ puis prépare _site/
npx serve _site                  # ou : npm run serve
```

## Où modifier quoi
| Je veux changer… | Fichier |
|---|---|
| Textes, parcours, téléphone, e-mail | `index.html` |
| Couleurs, polices, tailles | `css/style.css` (variables `--pri`, `--acc` au début) |
| Débouchés, objectifs, compétences des formations | `data/formations.json` ou `/admin/` |
| Actualités | `data/actualites.json` ou `/admin/` |
| Frais de scolarité | `data/frais.json` ou `/admin/` |
| Questions fréquentes | `data/faq.json` ou `/admin/` |
| Guides pratiques (inscription, bourses, stages) | `data/guides.json` ou `/admin/` |
| Coordonnées, adresses des API, réseaux sociaux | `data/contact.json` ou `/admin/` |
| Sites IUTAM Antsohihy / Maevatanana (adresse, téléphone, parcours) | `data/sites.json` ou `/admin/` |
| Traductions malagasy | `tools/mg.json`, puis `npm run build:mg` (voir `docs/LANGUES.md`) |
| Mentions légales | `mentions-legales.html` (passages surlignés à compléter) |
| Photos | remplacer le fichier dans `images/` (même nom) |
| Comportement du logo 3D | `js/main.js` (section « Logo 3D animé ») |
| Adresse du site (SEO) | remplacer `www.VOTRE-DOMAINE.mg` dans `index.html`, `robots.txt`, `sitemap.xml` |

Les points à compléter avant mise en ligne sont listés dans `docs/CONTENU-A-COMPLETER.md`.

## Contrôles et tests
```bash
npm run check       # liens internes, ancres, images, balises
npm run check:i18n  # tout le texte visible est-il traduit en malagasy ?
npm run check:data  # les fichiers de données sont-ils cohérents ?
npm test            # 18 tests de sécurité de l'API (validation, CSRF, JWT, débit)
npm run check:all   # tout d'un coup
```
Ces contrôles sont aussi exécutés automatiquement à chaque publication
(`.github/workflows/pages.yml`).

## Déploiement (résumé)
1. Créer un dépôt GitHub, y pousser le dossier.
2. Settings → Pages → Source : **GitHub Actions** (le workflow fourni publie le site).
3. Ajouter le domaine personnalisé si disponible.
4. Pour le formulaire de contact et la newsletter : déployer l'API
   (`npx wrangler deploy`, voir `docs/API.md`) puis renseigner son adresse dans
   `data/contact.json`.
Détails, autres hébergeurs et serveur VPS : `docs/DEPLOIEMENT.md`.

## Droits et responsabilités
- Les photos montrent des personnes identifiables : obtenir leur accord ou celui de l'administration avant publication.
- Le logo et les marques appartiennent à l'IUTAM / Université de Mahajanga.
- Three.js : licence MIT.
- Police « Chakra Petch » (dossier `fonts/`) : licence SIL OFL 1.1, libre d'usage.
