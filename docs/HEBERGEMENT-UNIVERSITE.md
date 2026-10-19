# Héberger le site sur les serveurs de l'Université de Mahajanga

Le site est composé de fichiers statiques (HTML, CSS, JS, images) : n'importe quel serveur web de l'Université peut l'héberger, sans PHP ni base de données. Taille totale : environ 1,1 Mo.

## 1. Avantages et limites
| Avantages | Limites |
|---|---|
| Adresse officielle (`iutam.mahajanga-univ.mg`), données chez l'institution | La disponibilité dépend du serveur et de l'électricité/connexion de l'Université |
| Aucun compte étranger à gérer, rien à payer | Pas de réseau mondial (CDN) : un peu plus lent pour les visiteurs éloignés |
| Contrôle complet par l'IUTAM / l'Université | La sécurité du serveur est à la charge du service informatique |
| | L'interface d'administration (CMS) n'est pas utilisée ici |

**Conseil de durabilité** : garder le projet sur GitHub (source et sauvegarde) et, si possible, un déploiement de secours sur Cloudflare Pages (`docs/DEPLOIEMENT-CLOUDFLARE.md`). Si le serveur de l'Université tombe, on bascule l'adresse en changeant un seul enregistrement DNS.

## 2. Ce qu'il faut demander au service informatique
- [ ] Type de serveur web : **Apache**, **Nginx** ou **IIS (Windows)**
- [ ] Un sous-domaine : `iutam.mahajanga-univ.mg` (ou un dossier : `mahajanga-univ.mg/iutam/`)
- [ ] Un espace web dédié (2 Mo suffisent) et un compte limité à ce dossier
- [ ] Mode d'accès : **SFTP** (préféré à FTP), cPanel / gestionnaire de fichiers, ou SSH
- [ ] Un certificat **HTTPS** (Let's Encrypt ou certificat de l'Université)
- [ ] Autorisation des fichiers `.htaccess` (Apache) ou `web.config` (IIS) pour les en-têtes de sécurité
- [ ] Sauvegardes du dossier et nom d'un responsable à contacter
- [ ] Pas besoin de PHP, de base de données ni d'accès extérieur autre que le web

## 3. Préparer le dossier à déposer
**Sans ordinateur de développement** : utiliser le paquet prêt à envoyer `iutam-site-a-deposer-universite.zip`. Il contient exactement le contenu à placer à la racine du site, avec l'adresse `iutam.mahajanga-univ.mg` déjà renseignée.

**Avec Node.js** (pour régénérer après une modification) :
```bat
node tools/build-site.js --univ --domain=iutam.mahajanga-univ.mg
```
Le dossier `_site/` contient alors tout ce qu'il faut (sans `docs/`, `tools/`, `admin/`), avec `.htaccess` (Apache) et `web.config` (IIS).

## 4. Déposer les fichiers
1. Dézipper le paquet.
2. Se connecter en **SFTP** avec WinSCP ou FileZilla (adresse, utilisateur et mot de passe fournis par le service informatique), ou via le gestionnaire de fichiers cPanel.
3. Ouvrir le dossier racine du sous-domaine (souvent `public_html/iutam` ou `www/iutam`).
4. Envoyer **le contenu** du dossier (pas le dossier lui-même) : `index.html` doit se trouver directement à la racine.
5. Vérifier que les fichiers cachés (`.htaccess`, `.well-known`) sont bien envoyés (activer « afficher les fichiers cachés » dans le logiciel).

## 5. Serveur web : configuration
- **Apache** : le fichier `.htaccess` fourni suffit (en-têtes de sécurité, cache, compression, page 404, pas de listage des dossiers).
- **IIS** : le fichier `web.config` fourni fait la même chose.
- **Nginx** : le service informatique reprend le bloc `server { … }` de `docs/DEPLOIEMENT.md`, partie 3.

## 6. HTTPS
1. Demander l'installation du certificat.
2. Une fois HTTPS fonctionnel, dans `.htaccess`, retirer les `#` du bloc « Redirection vers HTTPS » (ou demander la redirection au service informatique).
3. Tester : `http://…` doit renvoyer vers `https://…`.

## 7. Adresse et DNS
- Sous-domaine : le service informatique crée un enregistrement `A`/`CNAME` vers le serveur qui héberge le site.
- Si l'adresse finale n'est pas `iutam.mahajanga-univ.mg`, régénérer avec `--domain=nouvelle-adresse` (cela corrige les balises de référencement, `sitemap.xml` et `robots.txt`).
- Si le site est dans un **sous-dossier** (`mahajanga-univ.mg/iutam/`) : il fonctionne, car les chemins sont relatifs. Seule la page `404.html` (lien « Accueil » vers `/`) et les balises canoniques sont à adapter.

## 8. Mettre à jour le site
| Quoi | Comment |
|---|---|
| Actualités, frais | Modifier `data/actualites.json` ou `data/frais.json` et **envoyer ces seuls fichiers** : rien d'autre à régénérer |
| Texte, parcours, photos | Modifier `index.html` (et `tools/mg.json` pour le malagasy), régénérer le paquet, renvoyer les fichiers modifiés |
| Image d'actualité | Envoyer la photo dans `images/actus/` et écrire son chemin dans le JSON |

Garder la même procédure à chaque fois, et garder une copie du dossier précédent pour pouvoir revenir en arrière.

## 9. Sécurité (à la charge du serveur de l'Université)
- Compte SFTP **dédié**, limité au dossier du site ; mot de passe fort ou clé ; pas de FTP en clair.
- Serveur web et système à jour ; pare-feu ; sauvegarde régulière.
- Listage des dossiers désactivé (déjà fait dans `.htaccess` et `web.config`).
- Surveillance : un service gratuit (UptimeRobot) envoie une alerte si le site tombe.
- Pas d'interface d'administration publique : les modifications passent par un dépôt de fichiers contrôlé.
- Voir aussi `docs/SECURITE.md` (comptes, double authentification, plan d'urgence).

## 10. Vérifications après dépôt
- [ ] `https://iutam.mahajanga-univ.mg` s'ouvre, sans avertissement de sécurité
- [ ] Logo 3D, thème clair/sombre, version `/mg/`, onglets de frais, fenêtre des mentions légales
- [ ] Une page inexistante affiche `404.html`
- [ ] En-têtes : securityheaders.com (ou `curl -I https://…`) : présence de `Content-Security-Policy` et `X-Content-Type-Options`
- [ ] Les actualités et les frais se chargent (si rien ne s'affiche : le serveur ne sert pas les `.json`, ajouter le type MIME `application/json`)
- [ ] Test sur un téléphone avec connexion mobile

## 11. Dépannage
| Problème | Cause probable | Solution |
|---|---|---|
| Erreur 500 après dépôt | `.htaccess` non accepté par le serveur | Retirer les blocs de modules non installés, ou demander `AllowOverride All` |
| Actualités/frais vides | `.json` bloqués ou mal typés | Ajouter le type MIME `application/json` |
| Texte du logo 3D absent | WebGL désactivé ou image bloquée | Ouvrir la console (F12) ; le logo fixe s'affiche en secours |
| Polices de titre classiques | `.woff2` non servi | Ajouter le type `font/woff2` (déjà prévu dans les fichiers fournis) |
| Page d'accueil = liste de fichiers | `index.html` pas à la racine | Déplacer le contenu directement dans le dossier racine |
