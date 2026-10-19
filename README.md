# Site web de l'IUTAM – Mahajanga

Site vitrine officiel de l'**Institut Universitaire de Technologie et d'Agronomie de Mahajanga** (Université de Mahajanga, MESUPRES, système LMD).
Site statique : rapide, sans base de données, sans serveur à maintenir, hébergeable gratuitement.

## Fonctionnalités
- Accueil avec le logo en 3D animé (WebGL), reflet lumineux, rotation au défilement
- Sections : L'Institut, Direction, Vie étudiante (collages photo), Formations, Admission, Frais (grille dépliable), Contact
- **Actualités** et **grille des frais** pilotées par `data/*.json` (modifiables sans toucher au code)
- **Version malagasy** (`/mg/`) générée automatiquement, bouton FR / MG
- Page **mentions légales et confidentialité**
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
| Images | JPEG optimisés dans `images/` | ~860 Ko au total, chargement différé de la galerie |
| Hébergement | GitHub Pages, Cloudflare Pages ou Netlify | Gratuit, HTTPS automatique, déploiement par `git push` |
| Sécurité | `_headers` (CSP, anti-clickjacking) | Protège les visiteurs |

## Arborescence
```
iutam-site/
├── index.html              page française (source unique du contenu)
├── mg/index.html           version malagasy (GÉNÉRÉE, ne pas modifier à la main)
├── mentions-legales.html   mentions légales et confidentialité (à compléter)
├── 404.html                page d'erreur
├── css/style.css           styles, thèmes clair/sombre, animations
├── js/main.js              thème, animations, logo 3D, actualités et frais
├── js/legal.js             thème des pages légales
├── js/vendor/three.min.js  bibliothèque 3D (locale)
├── data/actualites.json    actualités          ┐ modifiables via GitHub
├── data/frais.json         grille des frais    ┘ ou via /admin/
├── admin/                  interface Decap CMS (index.html, config.yml)
├── tools/build-mg.js       génère mg/index.html
├── tools/build-site.js     prépare _site/ (fichiers publics seulement) pour l'hébergeur
├── .well-known/security.txt  contact sécurité
├── .htaccess / web.config  configuration Apache / IIS pour un serveur de l'Université
├── tools/mg.json           dictionnaire français → malagasy
├── images/                 logo, photos (images/actus/ pour les actualités)
├── favicon.ico / .png, robots.txt, sitemap.xml
├── _headers                en-têtes de sécurité (Netlify / Cloudflare)
├── package.json            raccourcis : npm run dev | build:mg | cms
├── CNAME.example           modèle pour domaine personnalisé
├── .github/workflows/pages.yml   déploiement automatique GitHub Pages
└── docs/                   DEPLOIEMENT, DEPLOIEMENT-CLOUDFLARE, HEBERGEMENT-UNIVERSITE, SECURITE, RECOMMANDATIONS, CMS, LANGUES, CONTENU-A-COMPLETER
```

## Démarrage en local
Le logo 3D charge une image dans WebGL : il faut un petit serveur (l'ouverture directe du fichier ne suffit pas).
```bash
cd iutam-site
python3 -m http.server 8080      # puis ouvrir http://localhost:8080  (ou : npm run dev)
node tools/build-mg.js           # régénère la version malagasy après une modification
# ou : npx serve .   |   ou l'extension VS Code « Live Server »
```

## Où modifier quoi
| Je veux changer… | Fichier |
|---|---|
| Textes, parcours, frais, téléphone, e-mail | `index.html` |
| Couleurs, polices, tailles | `css/style.css` (variables `--pri`, `--acc` au début) |
| Actualités | `data/actualites.json` ou `/admin/` (voir `docs/CMS.md`) |
| Frais de scolarité | `data/frais.json` ou `/admin/` |
| Sites IUTAM Antsohihy / Maevatanana (adresse, téléphone, parcours) | `data/sites.json` ou `/admin/` |
| Traductions malagasy | `tools/mg.json`, puis `npm run build:mg` (voir `docs/LANGUES.md`) |
| Mentions légales | `mentions-legales.html` (passages surlignés à compléter) |
| Photos | remplacer le fichier dans `images/` (même nom) |
| Comportement du logo 3D | `js/main.js` (section « Logo 3D animé ») |
| Adresse du site (SEO) | remplacer `www.VOTRE-DOMAINE.mg` dans `index.html`, `robots.txt`, `sitemap.xml` |

Les points à compléter avant mise en ligne sont listés dans `docs/CONTENU-A-COMPLETER.md`.

## Déploiement (résumé)
1. Créer un dépôt GitHub, y pousser le dossier.
2. Settings → Pages → Source : **GitHub Actions** (le workflow fourni publie le site).
3. Ajouter le domaine personnalisé si disponible.
Détails, autres hébergeurs et serveur VPS : `docs/DEPLOIEMENT.md`.

## Droits et responsabilités
- Les photos montrent des personnes identifiables : obtenir leur accord ou celui de l'administration avant publication.
- Le logo et les marques appartiennent à l'IUTAM / Université de Mahajanga.
- Three.js : licence MIT.
- Police « Chakra Petch » (dossier `fonts/`) : licence SIL OFL 1.1, libre d'usage.
