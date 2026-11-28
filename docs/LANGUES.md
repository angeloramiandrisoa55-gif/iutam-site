# Versions linguistiques (français / malagasy)

- **Français** : `index.html` est la source unique.
- **Malagasy** : `mg/index.html` est **généré** à partir de `index.html` et du dictionnaire `tools/mg.json`. Ne jamais modifier `mg/index.html` à la main.

## Modifier un texte
1. Changer le texte français dans `index.html`.
2. Dans `tools/mg.json`, mettre à jour la clé correspondante (le texte français exact) et sa traduction.
3. Lancer `node tools/build-mg.js` (ou `npm run build:mg`). Le script affiche les entrées du dictionnaire qui ne correspondent plus à rien : c'est le signe qu'un texte français a changé.
4. Vérifier `mg/index.html` dans le navigateur, puis `git push`. Sur GitHub Pages, le workflow régénère aussi la version malagasy à chaque publication.

Les textes qui viennent de `data/*.json` (actualités, frais) se traduisent dans les champs `titre_mg`, `resume_mg`, `designation_mg`.

## Barre de navigation malagasy (libellés courts)
Les intitulés officiels de `mg.json` (« Sehatra arak'asa sy fahafahana miasa », « Fanontaniana apetraka matetika »…) sont trop longs pour la barre : ils restent utilisés pour les **titres de sections**, mais la barre utilise des libellés courts définis dans `NAV_MG` (`tools/build-mg.js`, étape 2b) :

| Lien | Libellé court | Infobulle (intitulé officiel) |
|---|---|---|
| `#about` | Momba ny IUTAM | Ny Ivontoeram-pampianarana |
| `#vie` | Fiainana | Fiainan'ny mpianatra |
| `#formations` | Fiofanana | |
| `#debouches` | Fahafahana asa | Sehatra arak'asa sy fahafahana miasa |
| `#admission` | Hisoratra anarana | Fidirana |
| `#frais` | Saram-pianarana | |
| `#faq` | Fanontaniana | Fanontaniana apetraka matetika |
| `#actus` | Vaovao | |
| `#contact` | Fifandraisana | |

Le bouton d'inscription (`<a class="cta hd-cta">` dans l'en-tête, copie `nav-cta` dans le menu mobile) s'écrit « S'inscrire » en français et **Hisoratra izao** en malagasy (constante `CTA_MG`). **Cible du bouton :** il mène au formulaire (`#f`), prérempli (sujet « Pré-inscription » / « Fisoratana anarana » + modèle de message, voir `forms.js`). Si l'Université a une plateforme d'inscription en ligne, renseigner `"inscription": { "url": "https://…" }` dans `data/contact.json` : le bouton ouvrira alors ce lien (nouvel onglet). Le modèle de message malagasy est à faire relire par un locuteur natif.

Pour changer un libellé de la barre, modifier `NAV_MG` / `CTA_MG`, puis `npm run build:mg`. En malagasy, le menu burger remplace la barre à 2 rangées sous 1100 px (800 px en français).

## Données : champs malagasy (`data/*.json`)
Chaque texte français a son équivalent `_mg` ; si le `_mg` est vide, la page malagasy retombe sur le français (donc du français dans la page MG). Pour `formations.json`, penser à renseigner pour chaque parcours : `objectifs_mg[]`, `competences_mg[]`, `bac_mg`, et pour chaque débouché `metier_mg`, `secteur_mg`, `detail_mg`. `metiers_mg[]` doit rester identique à la liste des `metier_mg`. Pour `guides.json` : `pieces_mg[]`, `duree_mg`. Les libellés de l'interface (titres de colonnes, boutons, messages du formulaire, recherche) sont dans les tableaux `T` de `js/sections.js`, `js/forms.js`, `js/search.js` et `js/main.js` : le bloc `fr` doit être en français, le bloc `mg` en malagasy.

## Relecture des traductions
Les traductions malagasy de la page principale sont désormais le **texte officiel** transmis par l'IUTAM (version v2.1). Elles font foi.

Les contenus qui arrivent par JavaScript (FAQ, guides pratiques, débouchés détaillés, bandeaux) et qui ne figuraient pas dans cette version officielle conservent une traduction provisoire : **elles doivent être relues par un locuteur natif** (enseignant de l'Université, service de communication), surtout pour le vocabulaire administratif et technique (stages, diplômes, parcours). Corriger directement `tools/mg.json` ou le champ `_mg` du fichier de données concerné.

### Mettre à jour le malagasy à partir d'une page officielle
Quand l'IUTAM transmet une nouvelle version malgache de la page :

```bash
node tools/align-mg.js chemin/vers/la-page-officielle-mg.html   # aligne et reporte les traductions
node tools/clean-mg.js                                          # retire les clés obsolètes
node tools/compare-mg.js chemin/vers/la-page-officielle-mg.html  # contrôle ce qui reste différent
```

`align-mg.js` compare la page officielle à la version générée (alignement par programmation dynamique), puis reporte chaque traduction officielle sur la clé française correspondante. `compare-mg.js` indique les écarts restants.

**Attention** : la page officielle ne contient pas les sections chargées par JavaScript (FAQ, guides, débouchés détaillés) ; ces contenus restent à traduire à la main.

## Ajouter une langue (ex. anglais)
Copier `tools/mg.json` en `tools/en.json` et traduire les valeurs ; dupliquer `build-mg.js` en `build-en.js` en changeant `mg` en `en` (dossier `en/`, `lang="en"`, bouton de langue, `hreflang`). Ajouter les champs `_en` dans les JSON de données si besoin.

## Limites actuelles
- Les mentions légales sont en français seulement.
- Les noms officiels (parcours, diplômes, sigles) restent en français, comme dans la brochure.
