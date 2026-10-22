# Versions linguistiques (français / malagasy)

- **Français** : `index.html` est la source unique.
- **Malagasy** : `mg/index.html` est **généré** à partir de `index.html` et du dictionnaire `tools/mg.json`. Ne jamais modifier `mg/index.html` à la main.

## Modifier un texte
1. Changer le texte français dans `index.html`.
2. Dans `tools/mg.json`, mettre à jour la clé correspondante (le texte français exact) et sa traduction.
3. Lancer `node tools/build-mg.js` (ou `npm run build:mg`). Le script affiche les entrées du dictionnaire qui ne correspondent plus à rien : c'est le signe qu'un texte français a changé.
4. Vérifier `mg/index.html` dans le navigateur, puis `git push`. Sur GitHub Pages, le workflow régénère aussi la version malagasy à chaque publication.

Les textes qui viennent de `data/*.json` (actualités, frais) se traduisent dans les champs `titre_mg`, `resume_mg`, `designation_mg`.

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
