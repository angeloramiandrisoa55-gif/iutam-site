# Recommandations

## Hébergement et domaine
- Démarrer sur **GitHub Pages**, passer à **Cloudflare Pages** si l'on veut les en-têtes de sécurité et un CDN.
- Obtenir un domaine institutionnel (`.mg` ou sous-domaine de l'Université) : l'adresse reste la même même si l'hébergeur change.
- Garder une copie du dépôt chez l'IUTAM (clé USB ou second dépôt) : le site est fait de fichiers simples, il se restaure partout.

## Performance (réseau mobile à Madagascar)
- Poids actuel : ~1,5 Mo au total, avec chargement différé de la galerie.
- Pour ajouter des photos : largeur 1000–1200 px, JPEG qualité 75–80 (ou WebP), moins de 150 Ko chacune. Outil : squoosh.app.
- Éviter les vidéos intégrées ; préférer un lien YouTube/Facebook.
- Ne pas ajouter de bibliothèques lourdes : la 3D n'est utilisée que pour le logo.

## Sécurité
- Utiliser toujours HTTPS ; garder `_headers` (ou la config Nginx) avec la politique CSP.
- Aucun mot de passe, clé ou donnée personnelle dans le dépôt (le `.gitignore` aide).
- Activer l'authentification à deux facteurs sur GitHub et sur le compte du registrar.
- Limiter à 2 personnes l'accès en écriture au dépôt.

## Accessibilité et qualité
- Chaque photo a un texte alternatif : en ajouter un à chaque nouvelle image.
- Contraste vérifié en thème clair et sombre ; garder au moins 4,5:1 si les couleurs changent.
- Le site respecte le réglage « réduire les animations » du téléphone.
- Tester à chaque modification sur un vrai téléphone.

## Contenu et droits
- Faire valider par l'administration : textes, frais, conditions d'admission, présentation de la direction.
- Photos de personnes : obtenir l'accord des intéressés ; documenter la source des images (ex. photos de l'Université, filigrane UMAJ).
- Ajouter une page **Mentions légales** et une courte **politique de confidentialité** (le formulaire de contact envoie des e-mails). Se renseigner sur la législation malgache de protection des données personnelles auprès de l'Université.
- Utiliser une adresse e-mail **institutionnelle** (pas une adresse yahoo personnelle) : contact@, scolarite@.

## SEO
- Remplacer l'adresse `www.VOTRE-DOMAINE.mg`, déclarer le site dans Google Search Console et ajouter la fiche Google Maps de l'IUTAM (elle existe déjà : demander à en devenir gestionnaire pour mettre horaires et photos).
- Lier le site depuis la page Facebook de l'IUTAM, le site de l'Université et les réseaux étudiants.
- Publier régulièrement (admissions, résultats, événements) : c'est ce qui fait remonter le site dans Google.

## Mesure d'audience (optionnel)
Outils respectueux de la vie privée, sans cookies : Plausible, Umami (auto-hébergé) ou Cloudflare Web Analytics. Si ajout d'un script externe, mettre à jour la CSP dans `_headers`.

## Formulaire de contact
Actuellement : ouverture du client mail (`mailto:`). Évolutions simples : Formspree ou Netlify Forms (gratuit, sans serveur), ou un petit script PHP sur un hébergement mutualisé.

## Maintenance (rythme conseillé)
- À chaque rentrée : vérifier frais, calendrier, contacts, conditions d'admission.
- Tous les trimestres : tester les liens et l'affichage mobile, sauvegarder le dépôt.
- Désigner une personne responsable du contenu et une personne technique (vous, ou un étudiant successeur) ; garder ce `README` à jour.

## Feuille de route
1. **v1.1 (livrée)** : actualités, frais pilotés par fichiers de données, mentions légales, version malagasy, administration Decap CMS (à brancher).
2. **v1.2** : relecture des traductions malagasy par un locuteur natif ; page par parcours ; galerie complète ; fil d'actualités sur Facebook.
3. **v2** : CMS pour tous les contenus (parcours, admission), formulaire de contact avec envoi réel (Formspree / Netlify Forms / PHP).
4. **v3** : espace étudiant (résultats, certificats) relié au logiciel de scolarité de l'IUTAM, avec authentification et API sécurisée.
