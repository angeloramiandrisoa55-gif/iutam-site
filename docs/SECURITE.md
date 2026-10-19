# Sécuriser le site et son hébergement

Un site statique (fichiers HTML/CSS/JS, sans base de données ni mot de passe) a très peu de surface d'attaque. Les vrais risques viennent des **comptes** (GitHub, hébergeur, domaine, e-mail), pas du code.

## 1. Déjà en place dans le projet
- Aucun cookie de suivi, aucun script externe, bibliothèque 3D hébergée localement
- Politique de contenu (CSP) stricte, anti-clickjacking, `nosniff`, HSTS : fichier `_headers`
- Le script `tools/build-site.js` ne publie que les fichiers publics (pas `docs/`, `tools/`, `.github/`)
- `admin/` exclu des moteurs de recherche ; `.well-known/security.txt` pour signaler une faille
- Contenu des actualités/frais échappé avant affichage (pas d'injection de code)

## 2. À faire pour TOUS les hébergeurs
| Action | Pourquoi |
|---|---|
| **Double authentification (2FA)** sur GitHub, hébergeur, registrar du domaine, e-mail | 90 % des piratages viennent d'un mot de passe volé |
| Gestionnaire de mots de passe (Bitwarden…) + mots de passe uniques | Pas de réutilisation |
| Comptes **au nom de l'institution**, 2 administrateurs minimum | Continuité si une personne part |
| Verrouillage du domaine (*registrar lock*) et renouvellement automatique | Éviter le vol ou l'expiration |
| Aucun mot de passe, jeton ou clé dans le dépôt | Les dépôts publics sont lus par des robots |
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
Le formulaire ouvre la messagerie du visiteur (`mailto:`) : aucune donnée n'est stockée sur le site. Si vous passez à un service (Formspree, Netlify Forms), ajouter un champ anti-robot, mentionner le service dans les mentions légales et autoriser son adresse dans `form-action` (`_headers`).

## 9. Si le site est piraté ou modifié (plan d'urgence)
1. Ne pas paniquer : le dépôt contient la version saine.
2. Sur GitHub, repérer le dernier commit sain (onglet *Commits*) puis `git revert` ou restaurer ; sur Cloudflare : *Deployments → Rollback*.
3. **Changer tous les mots de passe**, révoquer les jetons et sessions (GitHub, hébergeur, registrar, e-mail), vérifier la 2FA.
4. Regarder l'historique des connexions et les membres du dépôt ; retirer les accès inconnus.
5. Prévenir la direction de l'IUTAM et noter ce qui s'est passé.

## 10. Calendrier
| Quand | Quoi |
|---|---|
| Chaque rentrée | Vérifier frais, contacts, admission ; relire les accès (qui a encore besoin ?) |
| Tous les trimestres | Tester le site sur téléphone, sauvegarder le dépôt, lire les alertes Dependabot |
| Chaque année | Renouveler le domaine, vérifier la date d'expiration de `security.txt`, revoir les mots de passe |
