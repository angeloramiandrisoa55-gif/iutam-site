# Contenus et vérifications avant mise en ligne

## À obtenir de l'administration
- [ ] Nom officiel, titre et accord de publication pour la photo du directeur
- [ ] Adresse e-mail institutionnelle (remplacer `benjaiba@yahoo.fr` dans `index.html`) et numéros de téléphone officiels
- [ ] Horaires d'ouverture du secrétariat
- [ ] Confirmation que la grille tarifaire s'applique à tous les niveaux (Licence et Ingéniorat) et pour quelle année universitaire
- [ ] Calendrier d'inscription, pièces à fournir, lieu de dépôt des dossiers
- [ ] Chiffres réels (effectifs, enseignants, partenaires) si souhaité
- [ ] Fichier du logo en haute définition (PNG/SVG) : remplace `images/logo.jpg` et `favicon.*`
- [ ] Photos haute qualité, légendes et accords de publication
- [ ] Lien de la page Facebook officielle
- [ ] Textes officiels : présentation, mission, mentions légales

## Panneau des 6 parcours (carrousel)
- [ ] Faire valider les textes de chaque parcours (rédigés à partir de la brochure : objectifs, stages, conditions d'entrée) ; aucun débouché ni programme détaillé n'est affiché
- [ ] Photos : Agriculture (parcelles), Élevage (amphithéâtre, **photo d'élevage à fournir**), Environnement (pépinière), Pêche et Aquaculture (bassins), P.A.D.D. (laboratoire, **photo de production animale à fournir**), P.V.T.D.D. (serre d'ombrage). Pour changer une photo : remplacer le fichier `images/pub-….jpg` (même nom)
- [ ] Autorisations de publication des photos (logo UMAJ en filigrane sur certaines)
- [ ] Affiche « Nos formations » (`images/affiche-formations.jpg`) : confirmer qu'elle est à jour (logos des partenaires)

## Antsohihy et Maevatanana : photos et contacts
- [ ] Antsohihy : les contacts affichés (032 05 580 06 · 034 02 653 27, iutamumg@gmail.com) viennent des panneaux « IUTAM Annexe Antsohihy » photographiés ; confirmer, et fournir l'adresse précise et les horaires
- [ ] Autorisation de publier les photos d'Antsohihy (panneaux avec une personne, groupe devant l'affiche, bâtiment avec logo Faritra Sofia)
- [ ] **Maevatanana : l'image affichée est une illustration (mention « Illustration »), pas une photo** ; fournir une vraie photo et la placer dans `images/` puis dans `data/sites.json` (champ `image`, et mettre `illustration` à `false`)
- [ ] Confirmer l'existence et l'offre de formation de l'IUTAM à Maevatanana (non confirmée officiellement dans la recherche)

## Contacts à trancher
- [ ] **Numéro officiel du secrétariat** : +261 32 05 580 06 (brochure) ou +261 32 05 582 14 (page officielle en ligne de l'IUTAM) ; appeler les deux et garder le bon
- [ ] **E-mail officiel** : benjaiba@yahoo.fr (brochure) ou iutamumg@gmail.com (page officielle en ligne)
- [ ] Une fois tranché : remplacer dans `index.html`, `mentions-legales.html`, `data/sites.json` (bouton d'appel : constante `SEC` dans `js/main.js`)

## IUTAM Antsohihy et IUTAM Maevatanana (pub)
- [ ] Pour chacun : adresse, téléphone, e-mail, parcours proposés, éventuel lien (page Facebook) : à renseigner dans `data/sites.json` (les parcours affichés viennent de documents de préinscription : à confirmer pour 2026-2027 ; l'offre exacte de Maevatanana est à vérifier)
- [ ] Confirmer que le texte de la bannière correspond à ce que proposent ces deux sites
- [ ] Photos et logos de ces sites, avec autorisation (la photo d'Antsohihy actuellement utilisée porte le logo « Faritra Sofia » : confirmer qu'elle montre bien le site de l'IUTAM et que sa publication est autorisée) ; photo de Maevatanana à ajouter dans `data/sites.json` (champ `image`)

## Pages légales, langues et CMS
- [ ] `mentions-legales.html` : texte complété (e-mail, responsable, concepteur, hébergeur GitHub Pages) ; à faire valider par l'administration, et à mettre à jour si l'hébergeur ou l'e-mail change
- [ ] Traductions malagasy (`tools/mg.json`) relues par un locuteur natif
- [ ] Première vraie actualité (remplace « Bienvenue sur le site de l'IUTAM ») dans `data/actualites.json`
- [ ] Année universitaire et montants de `data/frais.json` confirmés
- [ ] Si CMS : compte GitHub des éditeurs, passerelle OAuth, `admin/config.yml` complété (voir `docs/CMS.md`)

## À remplacer dans le code
- [ ] `www.VOTRE-DOMAINE.mg` dans `index.html` (canonical, Open Graph), `robots.txt`, `sitemap.xml`
- [ ] Renommer `CNAME.example` en `CNAME` (GitHub Pages avec domaine)
- [ ] Texte du bandeau de contact et de la section « Direction » si le nom doit apparaître

## À tester
- [ ] Téléphone Android et iPhone, thème clair et sombre, rotation de l'écran
- [ ] Navigateurs : Chrome, Firefox, Safari, Samsung Internet
- [ ] Réseau lent (4G faible)
- [ ] Orthographe et accents sur tout le site
