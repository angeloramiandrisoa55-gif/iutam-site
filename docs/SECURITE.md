# Sécuriser le site et son hébergement

Un site statique (fichiers HTML/CSS/JS, sans base de données ni mot de passe) a très peu de surface d'attaque. Les vrais risques viennent des **comptes** (GitHub, hébergeur, domaine, e-mail), pas du code.

Depuis la version 2.1, le site comporte une **API d'écriture** (formulaire de
contact, lettre d'information, espace étudiant). C'est la seule partie qui
traite des données : elle fait l'objet d'une attention particulière.

## 1. Déjà en place dans le projet

**Le site public**
- Aucun cookie de suivi, aucun script externe, bibliothèque 3D hébergée localement
- Politique de contenu (CSP) stricte, anti-clickjacking, `nosniff`, HSTS : fichiers `_headers`, `.htaccess` et `web.config`
- Le script `tools/build-site.js` ne publie que les fichiers publics (pas `docs/`, `tools/`, `.github/`, ni le code du Worker)
- `admin/` exclu des moteurs de recherche ; `.well-known/security.txt` complet pour signaler une faille
- Contenu des actualités/frais échappé avant affichage (pas d'injection de code)
- Recherche interne entièrement dans le navigateur : aucune requête envoyée à un tiers

**L'API d'écriture (`api/worker.js`)**
- Origine obligatoire : seules les requêtes venant du site sont acceptées
- Limitation de débit par IP et par point de terminaison
- Pot de miel et durée minimale de remplissage contre les robots
- Validation stricte des entrées, longueurs bornées, caractères de contrôle supprimés
- Mots de passe hachés en PBKDF2-SHA256 (120 000 itérations), comparaison à temps constant
- Jetons JWT HS256 signés, expiration d'une heure, vérifiés à chaque requête
- En-têtes de sécurité sur toutes les réponses
- 18 tests automatisés vérifient ces comportements : `npm test`

**L'outillage**
- Sauvegardes automatiques quotidiennes (branche `backup`, étiquette, artefact 30 jours)
- Surveillance de la disponibilité toutes les 30 minutes, avec ouverture d'une alerte
- Contrôles automatiques à chaque publication : liens, traductions, données, syntaxe, tests de l'API
- Recherche de secrets et audit des dépendances (workflow `security.yml`)

## 2. À faire pour TOUS les hébergeurs
| Action | Pourquoi |
|---|---|
| **Double authentification (2FA)** sur GitHub, hébergeur, registrar du domaine, e-mail | 90 % des piratages viennent d'un mot de passe volé |
| Gestionnaire de mots de passe (Bitwarden…) + mots de passe uniques | Pas de réutilisation |
| Comptes **au nom de l'institution**, 2 administrateurs minimum | Continuité si une personne part |
| Verrouillage du domaine (*registrar lock*) et renouvellement automatique | Éviter le vol ou l'expiration |
| Aucun mot de passe, jeton ou clé dans le dépôt | Les dépôts publics sont lus par des robots |
| `JWT_SECRET` et `ALLOWED_ORIGINS` dans les secrets du Worker, jamais dans le dépôt | Un secret publiés est un secret perdu |
| E-mail institutionnel avec **SPF, DKIM, DMARC** | Empêche l'usurpation de l'adresse de l'IUTAM |
| Surveillance de disponibilité (UptimeRobot…) | Savoir vite si le site est modifié ou tombe |
| Sauvegarde du dépôt (copie sur disque/clé tous les trimestres) | Restauration complète en minutes |

## 3. GitHub (dépôt)
1. *Settings → Security → Two-factor* obligatoire pour l'organisation.
2. Limiter l'accès en **écriture** à 2 ou 3 personnes ; les autres en lecture.
3. *Settings → Branches → Add rule* sur `main` : exiger une demande de fusion et une relecture avant publication.
4. Activer *Dependabot alerts* et *Secret scanning* (*Settings → Code security*).
5. *Settings → Actions → General* : droits des workflows en **lecture seule** par défaut.

## 4. GitHub Pages (pas d'en-têtes personnalisés)
- *Settings → Pages* : cocher **Enforce HTTPS**.
- GitHub Pages ne lit pas `_headers`. Deux solutions :
  - **Recommandé** : placer **Cloudflare devant** (DNS du domaine chez Cloudflare, enregistrement « proxied »), puis *Rules → Transform Rules → Modify Response Header* pour ajouter les en-têtes de `_headers`.
  - Ou ajouter dans le `<head>` de `index.html`, `mg/index.html` et `mentions-legales.html` :
    `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; base-uri 'self'">`
    (la directive `frame-ancestors` n'est pas prise en charge dans une balise meta). Tester le site après ajout.

## 5. Cloudflare Pages / Netlify
- `_headers` appliqué automatiquement : vérifier sur securityheaders.com (objectif A).
- Cloudflare : DDoS inclus ; activer *Bot Fight Mode*, **DNSSEC**, TLS minimum 1.2, *Always Use HTTPS*.
- Projet Pages : limiter les membres, ne pas partager les jetons d'API.
- Netlify : 2FA obligatoire, restreindre les déploiements de prévisualisation aux membres de l'équipe.

## 6. Serveur VPS (le plus exigeant : tout est à votre charge)
```bash
# Mises à jour automatiques de sécurité
sudo apt update && sudo apt upgrade -y && sudo apt install -y unattended-upgrades fail2ban ufw
sudo dpkg-reconfigure --priority=low unattended-upgrades
# Pare-feu : SSH, HTTP, HTTPS seulement
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
# SSH : clés uniquement (créer d'abord votre clé et tester la connexion !)
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/;s/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```
- Nginx : `server_tokens off;`, en-têtes de `docs/DEPLOIEMENT.md`, certificat Let's Encrypt (renouvellement automatique : `sudo certbot renew --dry-run`).
- Utilisateur non-root pour le déploiement ; dossier du site en lecture seule pour le serveur web.
- Sauvegarde du serveur chaque semaine ; mise à jour d'Ubuntu tous les mois.
- Honnêtement : pour un site statique, un VPS demande plus de travail et de risque qu'un hébergeur géré.

## 7. Interface d'administration (Decap CMS) : si activée
- Seuls les comptes GitHub ayant l'accès en écriture peuvent publier : appliquer les règles de la partie 3.
- Passerelle d'authentification : la déployer sur un compte contrôlé par l'institution, jamais un service inconnu.
- Mode relecture : `publish_mode: editorial_workflow` (une personne rédige, une autre valide).

## 8. Formulaire de contact

Le formulaire n'ouvre plus seulement la messagerie : il envoie les données en
JSON à l'API (`api/worker.js`), qui les valide, filtre les robots et limite le
débit. **Si l'API n'est pas déployée**, le site bascule automatiquement sur
l'ouverture du logiciel de messagerie : le visiteur ne perd jamais son message.

Le formulaire recueille un consentement explicite et n'envoie que trois
informations (nom, e-mail, message) plus le sujet. Aucune donnée n'est stockée
dans le site lui-même ; les messages sont transmis au secrétariat par e-mail
(ou par webhook).

Si un service tiers est préféré (Formspree, Netlify Forms) : le signaler dans
les mentions légales, vérifier que l'adresse du service est autorisée dans
`form-action` (`_headers`) et que la politique de confidentialité le mentionne.

## 9. Sauvegardes et restauration

Trois niveaux, complémentaires :

| Niveau | Quoi | Comment | Fréquence |
|---|---|---|---|
| Git | tout l'historique du site | le dépôt GitHub | à chaque publication |
| Automatique | archive datée du site construit | workflow `backup.yml` | tous les jours (02 h 17 UTC) |
| Hors ligne | archive sur disque ou clé USB | `npm run backup` | chaque trimestre |

Le workflow de sauvegarde crée une étiquette `backup-AAAA-MM-JJ`, met à jour une
branche `backup` et dépose un artefact conservé 30 jours. Pour une sauvegarde
hors ligne :

```bash
npm run backup           # crée backup/iutam-site-AAAA-MM-JJ_HHMM.tar.gz
npm run backup:list      # liste les sauvegardes disponibles
node tools/backup.js --restore=iutam-site-2026-10-19_1728.tar.gz --yes
```

**Tester la restauration au moins une fois par an** : une sauvegarde jamais
testée n'est pas une sauvegarde. Extraire l'archive dans un dossier vide et
vérifier que `index.html`, `mg/index.html` et `api/index.json` s'affichent.

## 10. Si le site est piraté ou modifié (plan d'urgence)
1. Ne pas paniquer : le dépôt contient la version saine.
2. Sur GitHub, repérer le dernier commit sain (onglet *Commits*) puis `git revert` ou restaurer ; sur Cloudflare : *Deployments → Rollback*.
3. **Changer tous les mots de passe**, révoquer les jetons et sessions (GitHub, hébergeur, registrar, e-mail), vérifier la 2FA.
4. **Si le Worker est concerné** : `npx wrangler secret put JWT_SECRET` avec une nouvelle valeur (invalide toutes les sessions) et vérifier les journaux `npx wrangler tail`.
5. Regarder l'historique des connexions et les membres du dépôt ; retirer les accès inconnus.
6. Prévenir la direction de l'IUTAM et noter ce qui s'est passé.

**Retour d'expérience** : consigner dans un fichier `docs/INCIDENTS.md`
(date, cause, durée, action corrective). C'est la mémoire de l'institution :
chaque incident teaches quelque chose qui doit être vérifié au prochain audit.

## 11. Calendrier
| Quand | Quoi |
|---|---|
| Chaque rentrée | Vérifier frais, contacts, admission ; relire les accès (qui a encore besoin ?) |
| Tous les trimestres | Tester le site sur téléphone, sauvegarder le dépôt, lire les alertes Dependabot, tester la restauration d'une sauvegarde |
| Chaque année | Renouveler le domaine, vérifier la date d'expiration de `security.txt`, revoir les mots de passe, audit OWASP Top 10 |

## 12. Documents liés
- `docs/WAF.md` — pare-feu applicatif (Cloudflare, mod_security)
- `docs/MONITORING.md` — surveillance, alertes, journalisation
- `docs/ROLES.md` — rôles et permissions
- `docs/API.md` — documentation de l'API et authentification
- `api/worker.js` — code de l'API d'écriture
- `tools/test-worker.js` — tests de sécurité de l'API
