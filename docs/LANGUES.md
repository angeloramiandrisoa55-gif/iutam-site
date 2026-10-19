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
Les traductions malagasy fournies sont une première version : **elles doivent être relues par un locuteur natif** (enseignant de l'Université, service de communication) avant la mise en ligne, surtout pour le vocabulaire administratif et technique (stages, diplômes, parcours). Corriger directement `tools/mg.json`.

## Ajouter une langue (ex. anglais)
Copier `tools/mg.json` en `tools/en.json` et traduire les valeurs ; dupliquer `build-mg.js` en `build-en.js` en changeant `mg` en `en` (dossier `en/`, `lang="en"`, bouton de langue, `hreflang`). Ajouter les champs `_en` dans les JSON de données si besoin.

## Limites actuelles
- Les mentions légales sont en français seulement.
- Les noms officiels (parcours, diplômes, sigles) restent en français, comme dans la brochure.
