# Gérer les contenus sans toucher au code

Les contenus du site ne sont pas écrits dans `index.html` : ils viennent de
fichiers simples, modifiables par une personne non technique.

| Fichier | Contenu | Où ça s'affiche |
|---|---|---|
| `data/actualites.json` | liste des actualités (date, titre, résumé, image, lien, version malagasy) | section « Actualités » |
| `data/frais.json` | frais communs, intitulés des tranches, montant d'une tranche par niveau (L1 – L2, L3, M1 – M2) | section « Frais » (onglets par niveau) ; les totaux sont calculés automatiquement |
| `data/formations.json` | les 6 parcours : niveau, séries de Bacc, objectifs, compétences, débouchés, poursuite d'études | sections « Formations » et « Débouchés », et l'API `/api/formations.json` |
| `data/faq.json` | questions fréquentes, groupées par thème (admission, frais, formation, contact) | section « Questions fréquentes », et l'API |
| `data/guides.json` | guides pratiques : inscription, bourses, stages (étapes et pièces à réunir) | section « Guides pratiques » (dans « Admission ») |
| `data/sites.json` | sites de l'IUTAM (Mahajanga, Antsohihy, Maevatanana) | section des sites, et l'API |
| `data/contact.json` | coordonnées, horaires, réseaux sociaux, adresses de l'API | section « Contact », et l'API |

Exemple d'actualité :
```json
{ "date": "2026-11-03", "titre": "Rentrée universitaire", "titre_mg": "Fiverenan'ny taom-pianarana",
  "resume": "Les cours reprennent le lundi...", "resume_mg": "", "image": "/images/actus/rentree.jpg", "lien": "" }
```
Les champs `_mg` sont facultatifs : s'ils sont vides, le texte français est affiché sur la version malagasy.

## Option A : sans outil supplémentaire (recommandée pour démarrer)
1. Se connecter à GitHub, ouvrir `data/actualites.json`, cliquer sur le crayon ✏️.
2. Ajouter un bloc `{ ... }` (copier un existant), enregistrer (« Commit changes »).
3. Le site se met à jour tout seul en 1 à 2 minutes.

Ajouter une image : l'envoyer dans `images/actus/` (Add file → Upload), puis écrire son chemin dans `image`. Taille conseillée : 1000 px de large, moins de 150 Ko.

## Option B : interface d'administration (Decap CMS) sur `/admin/`
Formulaires visuels pour **tous** les contenus ci-dessus, avec envoi d'images. Les fichiers `admin/index.html` et `admin/config.yml` sont déjà fournis ; il reste à brancher l'authentification :
1. Dans `admin/config.yml`, remplacer `repo` par `VOTRE_COMPTE/iutam-site`.
2. Choisir une passerelle d'authentification GitHub pour Decap CMS (ex. un petit service « decap-proxy » à déployer sur Cloudflare Workers, ou un service tiers) et renseigner son adresse dans `base_url`, ainsi que dans `_headers` (ligne `connect-src`).
3. Créer une « OAuth App » dans GitHub (Settings → Developer settings) avec l'adresse de retour fournie par la passerelle.
4. Donner aux éditeurs un accès **en écriture** au dépôt (compte GitHub avec double authentification).
5. Ouvrir `https://VOTRE-DOMAINE/admin/`, se connecter, publier : le CMS enregistre un commit, le site se redéploie.

Les collections disponibles dans l'interface : **Actualités**, **Frais de scolarité**, **Sites**, **Formations et débouchés**, **Questions fréquentes**, **Guides pratiques**, **Coordonnées**.

> Netlify Identity / Git Gateway est une autre voie possible, mais Netlify a annoncé son abandon progressif : vérifier la documentation actuelle de Decap CMS avant de la choisir.

**Tester en local** (sans GitHub) :
```bash
npm run cms     # terminal 1 : npx decap-server
npm run dev     # terminal 2 : http://localhost:8080/admin/
```

## Sécurité et bonnes pratiques
- `/admin/` est exclu de Google (`noindex`, `robots.txt`) mais reste accessible : seule l'authentification GitHub protège l'écriture.
- Limiter l'accès en écriture à 2 ou 3 personnes ; activer la double authentification.
- Pour faire relire avant publication : ajouter `publish_mode: editorial_workflow` dans `config.yml` (le CMS crée alors une demande de fusion à valider).
- La matrice des droits (qui modifie quoi) est décrite dans `docs/ROLES.md`. En particulier, les **frais de scolarité** et les **formations** doivent rester sous la responsabilité d'un administrateur : retirer ces collections de `config.yml` si les rédacteurs ne doivent pas y toucher.

## Limites
Les textes de présentation (institution, direction, vie étudiante) et le design se modifient dans `index.html` et `css/style.css`. Après toute modification de `index.html`, lancer `npm run build:mg` pour régénérer la version malagasy, puis `npm run check:i18n` pour vérifier que rien n'a été oublié.
