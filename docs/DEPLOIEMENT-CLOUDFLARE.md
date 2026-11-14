# Déployer sur Cloudflare Pages (pas à pas)

Pourquoi Cloudflare Pages : gratuit, HTTPS automatique, réseau mondial rapide, protection contre les attaques incluse, et il applique le fichier `_headers` (en-têtes de sécurité). L'interface de Cloudflare évolue : si un libellé diffère légèrement, cherchez le même mot-clé.

## Avant de commencer
- [ ] Une adresse e-mail **institutionnelle** (ou celle de la personne responsable) pour créer les comptes
- [ ] Le projet sur GitHub (voir `docs/DEPLOIEMENT.md`, partie 1 : `git init`… `git push`)
- [ ] Compléter `docs/CONTENU-A-COMPLETER.md` et remplacer `www.VOTRE-DOMAINE.mg`

## 1. Créer et sécuriser le compte
1. Aller sur **dash.cloudflare.com** → *Sign up*.
2. Activer la **double authentification** : *My Profile → Authentication → Two-Factor*. Noter les codes de secours sur papier.

## 2. Créer le projet
1. Menu **Workers & Pages** → **Create** → onglet **Pages** → **Connect to Git**.
2. Autoriser GitHub, choisir le dépôt `iutam-site` (accès limité à ce seul dépôt).
3. Paramètres de build :

| Champ | Valeur |
|---|---|
| Project name | `iutam-site` (donne l'adresse `iutam-site.pages.dev`) |
| Production branch | `main` |
| Framework preset | None |
| Build command | `node tools/build-site.js` |
| Build output directory | `_site` |
| Variable d'environnement (facultatif) | `NODE_VERSION` = `20` |

4. **Save and Deploy**. Après 1 à 2 minutes : le site est en ligne sur `https://iutam-site.pages.dev`.

## 3. Vérifier l'adresse provisoire
- [ ] Le logo 3D, le thème clair/sombre, la version `/mg/`, les onglets de frais
- [ ] `https://iutam-site.pages.dev/.well-known/security.txt` s'ouvre
- [ ] En-têtes : sur securityheaders.com, saisir l'adresse : viser la note A

## 4. Brancher le nom de domaine
1. Projet → **Custom domains** → **Set up a custom domain** → saisir `www.votre-domaine.mg`.
2. **Si le DNS du domaine est chez Cloudflare** : l'enregistrement se crée tout seul.
3. **Si le DNS est chez le registrar** (cas probable pour un `.mg`) : créer chez lui un enregistrement `CNAME` : nom `www` → valeur `iutam-site.pages.dev`. Pour l'adresse sans `www`, demander au registrar une **redirection** vers `https://www.votre-domaine.mg`.
4. Attendre la validation (de quelques minutes à 24 h). Le certificat HTTPS est créé automatiquement.

> Option plus complète : déplacer le DNS du domaine chez Cloudflare (gratuit) : vous gagnez la protection DDoS, le cache et des règles de sécurité (voir `docs/SECURITE.md`).

## 5. Réglages de sécurité du domaine (si le DNS est chez Cloudflare)
- *SSL/TLS → Overview* : mode **Full (strict)**
- *SSL/TLS → Edge Certificates* : **Always Use HTTPS** activé, *Minimum TLS Version* **1.2**, **HSTS** activé une fois que tout fonctionne en HTTPS
- *DNS* : activer **DNSSEC**, puis copier l'enregistrement DS chez le registrar

## 6. Mettre à jour le site
- Modifier les fichiers → `git add . && git commit -m "Mise à jour" && git push` : déploiement automatique.
- Chaque branche et chaque demande de fusion génère une **adresse de prévisualisation** : pratique pour faire valider une modification avant de la publier.
- **Retour en arrière** : projet → *Deployments* → choisir une ancienne version → **Rollback**.

## 7. Suivi
- Surveillance gratuite de disponibilité : UptimeRobot ou Better Stack (alerte par e-mail si le site tombe).
- Mesure d'audience sans cookies (facultatif) : *Web Analytics* de Cloudflare ; l'ajouter oblige à autoriser son script dans `_headers`.

## Dépannage
| Problème | Solution |
|---|---|
| Le build échoue | Vérifier `NODE_VERSION=20` et que la commande est exactement `node tools/build-site.js` |
| Page blanche | Le dossier de sortie doit être `_site`, pas `/` |
| Le logo 3D ou les données ne se chargent pas | Ouvrir la console (F12) : une erreur « Content Security Policy » indique une ressource externe non autorisée dans `_headers` |
| Domaine « Pending » longtemps | Vérifier l'enregistrement CNAME chez le registrar (faute de frappe fréquente) |
