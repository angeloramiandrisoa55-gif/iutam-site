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
Le formulaire envoie désormais les données à l'API (`api/worker.js`) : validation côté serveur, pot de miel, limitation de débit, origine obligatoire. Sans Worker, le repli automatique sur le logiciel de messagerie évite de perdre un message. Voir `docs/API.md` et `docs/WAF.md`.

## Maintenance (rythme conseillé)
- À chaque rentrée : vérifier frais, calendrier, contacts, conditions d'admission.
- Tous les trimestres : tester les liens et l'affichage mobile, sauvegarder le dépôt, lire les alertes Dependabot, **tester la restauration d'une sauvegarde**.
- Désigner une personne responsable du contenu et une personne technique (vous, ou un étudiant successeur) ; garder ce `README` à jour.

## Feuille de route
1. **v1.1 (livrée)** : actualités, frais pilotés par fichiers de données, mentions légales, version malagasy, administration Decap CMS (à brancher).
2. **v1.2 (livrée)** : relecture des traductions malagasy par un locuteur natif ; page par parcours ; galerie complète.
3. **v2.0 (livrée)** : CMS étendu, design refait, panneaux des parcours, 3D, thème sombre, SEO.
4. **v2.1 (livrée)** — sécurité, infrastructure et contenu :
   - **Sécurité** : API Worker (validation serveur, limitation de débit, origine obligatoire, JWT, PBKDF2), pare-feu applicatif documenté (`docs/WAF.md`), en-têtes de sécurité durcis sur les trois configurations de serveur, `security.txt` complet.
   - **Infrastructure** : sauvegardes automatiques quotidiennes, surveillance toutes les 30 minutes, 18 tests de sécurité, contrôles automatiques à chaque publication (liens, traductions, données, encodage, API), minification, déploiement Docker + Caddy (HTTPS automatique).
   - **Contenu** : débouchés professionnels, guides pratiques, questions fréquentes, moteur de recherche interne, lettre d'information, formulaire qui part réellement.
   - **Qualité** : Lighthouse 100/100/100 (accessibilité, bonnes pratiques, référencement) en français et en malagasy.
5. **v2.2** : relecture des traductions malgaches par un locuteur natif ; chiffres clés et taux d'insertion publiés par l'Université ; photos de l'élevage et de Maevatanana.
6. **v2.3** : espace étudiant (notes, attestations, emplois du temps) relié au logiciel de scolarité, avec les rôles de `docs/ROLES.md`.
7. **v3.0** : API d'administration, publication depuis l'interface, éventuelle base de données (PostgreSQL) si le volume le justifie.
