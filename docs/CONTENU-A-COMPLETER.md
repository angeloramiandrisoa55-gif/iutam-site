# Contenus et vérifications avant mise en ligne

## À obtenir de l'administration
- [ ] Nom officiel, titre et accord de publication pour la photo du directeur
- [ ] Adresse e-mail institutionnelle (remplacer `benjaiba@yahoo.fr` dans `index.html`, `data/contact.json` et `data/sites.json`) et numéros de téléphone officiels
- [ ] Horaires d'ouverture du secrétariat (champs `horaires` de `data/contact.json`)
- [ ] Confirmation que la grille tarifaire s'applique à tous les niveaux (Licence et Ingéniorat) et pour quelle année universitaire (champ `annee` de `data/frais.json`)
- [ ] Calendrier d'inscription, pièces à fournir, lieu de dépôt des dossiers
- [ ] Chiffres réels (effectifs, enseignants, partenaires) si souhaité
- [ ] Fichier du logo en haute définition (PNG/SVG) : remplace `images/logo.jpg` et `favicon.*`
- [ ] Photos haute qualité, légendes et accords de publication
- [ ] Lien de la page Facebook officielle (`data/contact.json` → `reseaux.facebook`)
- [ ] Textes officiels : présentation, mission, mentions légales

## Débouchés professionnels (nouveauté v2.1)
- [ ] **Faire valider les 24 débouchés** de `data/formations.json` (métier, secteur, description) : ils sont rédigés à partir des maquettes des formations, pas de documents officiels
- [ ] Confirmer l'intitulé exact des métiers (par exemple « Responsable de production végétale » plutôt que « Responsable de production ») et les secteurs correspondants
- [ ] Préciser si les débouches diffèrent selon les sites (Antsohihy, Maevatanana) et ajouter un champ si oui
- [ ] Ajouter les taux d'insertion professionnelle et de réussite, s'ils sont communiqués par l'Université (ils ne sont volontairement pas inventés)

## Questions fréquentes (nouveauté v2.1)
- [ ] Relire les **16 questions** de `data/faq.json` : elles sont rédigées à partir des conditions d'admission officielles et les usages de la scolarité
- [ ] Compléter la question sur le **nombre de places** (actuellement sans chiffre : le texte renvoie à la publication annuelle de l'appel à candidatures)
- [ ] Vérifier la question sur le **logement** : la réponse est volontairement prudente, l'hébergement relevant de l'Université et non de l'IUTAM
- [ ] Ajouter les questions fréquentes réellement posées au secrétariat (relever les questions reçues pendant un mois, c'est le meilleur matériau)

## Guides pratiques (nouveauté v2.1)
- [ ] Faire valider la liste des **pièces à fournir** pour l'inscription (`data/guides.json` → `guides[0].pieces`) par le secrétariat
- [ ] Vérifier le nom exact du dispositif de bourse et du dispositif de frais (`dikan-tena` / *Paid Schooling*) dans les libellés malagasy
- [ ] Confirmer la liste des pièces pour la demande de bourse (`guides[1].pieces`)
- [ ] Préciser les modalités de signature de la convention de stage (nombre d'exemplaires, interlocuteur côté IUTAM)

## Coordonnées et API (nouveauté v2.1)
- [ ] `data/contact.json` → `siege.email`, `siege.telephone`, `siege.horaires` : remplacer les valeurs provisoires
- [ ] `data/contact.json` → `formulaire.endpoint` et `newsletter.endpoint` : renseigner l'adresse de l'API une fois le Worker déployé (sinon le formulaire bascule sur la messagerie)
- [ ] `data/contact.json` → `reseaux.facebook` : lien de la page officielle
- [ ] `data/contact.json` → `institut.nom`, `institut.tutelle` : intitulés officiels complets

## Panneau des 6 parcours (carrousel)
- [ ] Faire valider les textes de chaque parcours (rédigés à partir de la brochure : objectifs, stages, conditions d'entrée) ; aucun débouché ni programme détaillé n'est affiché
- [ ] Photos : Agriculture (parcelles), Élevage (amphithéâtre, **photo d'élevage à fournir**), Environnement (pépinière), Pêche et Aquaculture (bassins), P.A.D.D. (laboratoire, **photo de production animale à fournir**), P.V.T.D.D. (serre d'ombrage). Pour changer une photo : remplacer le fichier `images/pub-….jpg` (même nom)
- [ ] Autorisations de publication des photos (logo UMAJ en filigrane sur certaines)
- [ ] Affiche « Nos formations » (`images/affiche-formations.jpg`) : confirmer qu'elle est à jour (logos des partenaires)

## Antsohihy et Maevatanana : photos et contacts
- [ ] **Déposer la photo de l'antenne de Maevatanana** dans `images/maevatanana.jpg` (le code l'attend déjà : fiche du site, panneau des parcours, bandeau rotatif). Recadrer le filigrane de l'appareil photo en bas à gauche avant la mise en ligne : `npm install --no-save sharp && node tools/optimize-images.js images/maevatanana.jpg --crop-bottom=8 --width=1400` (ou `squoosh.app` : largeur 1400 px, qualité 80). Tant que le fichier est absent, la page affiche une image cassée et la vérification des liens échoue (`npm run check`).
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
