# Guide de déploiement

Avant tout : remplacer `www.VOTRE-DOMAINE.mg` dans `index.html`, `robots.txt` et `sitemap.xml` (ou l'adresse `https://compte.github.io/depot/` tant qu'il n'y a pas de domaine), et compléter `docs/CONTENU-A-COMPLETER.md`.

## 1. GitHub Pages (recommandé pour démarrer, gratuit)
```bash
cd iutam-site
git init
git add .
git commit -m "Site IUTAM v1"
git branch -M main
git remote add origin https://github.com/VOTRE_COMPTE/iutam-site.git
git push -u origin main
```
Sur GitHub : **Settings → Pages → Build and deployment → Source : GitHub Actions**. Le workflow `.github/workflows/pages.yml` publie le site à chaque `git push` (onglet *Actions* pour suivre). Adresse : `https://VOTRE_COMPTE.github.io/iutam-site/`.

**Domaine personnalisé** : renommer `CNAME.example` en `CNAME` (une seule ligne : le domaine), puis chez le registrar créer un enregistrement `CNAME` `www` → `VOTRE_COMPTE.github.io`. Dans Settings → Pages, saisir le domaine et cocher **Enforce HTTPS** (certificat automatique, quelques minutes).

> Les en-têtes de sécurité (`_headers`) ne sont pas appliqués par GitHub Pages. Pour les avoir, utiliser Cloudflare Pages ou Netlify.

> Le workflow GitHub exécute `node tools/build-site.js` (version malagasy + fichiers publics seulement) à chaque publication. Pour les autres hébergeurs, lancer cette commande avant de pousser (ou la déclarer comme *Build command*).

## 2. Cloudflare Pages ou Netlify (gratuit, en-têtes de sécurité inclus)
- Créer un compte, **Add new site → Import from Git**, choisir le dépôt.
- Build command : `node tools/build-site.js` · Dossier de publication : `_site` (le script ne publie que les fichiers publics, pas `docs/` ni `tools/`). Guide détaillé : `docs/DEPLOIEMENT-CLOUDFLARE.md`.
- Le fichier `_headers` est lu automatiquement. HTTPS et CDN inclus.
- Domaine : Settings → Custom domains, suivre les enregistrements DNS indiqués.

## 3. Serveur VPS (si l'IUTAM veut tout héberger)
Ubuntu + Nginx :
```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
sudo mkdir -p /var/www/iutam && sudo rsync -av --exclude docs --exclude .git ./ /var/www/iutam/
```
`/etc/nginx/sites-available/iutam` :
```nginx
server {
  listen 80;
  server_name www.VOTRE-DOMAINE.mg VOTRE-DOMAINE.mg;
  root /var/www/iutam;
  index index.html;
  error_page 404 /404.html;
  gzip on; gzip_types text/css application/javascript image/svg+xml;
  add_header X-Content-Type-Options nosniff always;
  add_header X-Frame-Options DENY always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;
  add_header Content-Security-Policy "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'" always;
  location /images/ { expires 1y; add_header Cache-Control "public, immutable"; }
  location ~* \.(css|js)$ { expires 7d; }
  location / { try_files $uri $uri/ =404; }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/iutam /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d www.VOTRE-DOMAINE.mg -d VOTRE-DOMAINE.mg   # HTTPS + renouvellement automatique
```

## 4. Nom de domaine
Un domaine en `.mg` s'obtient via un registrar agréé (Nic.mg). Prévoir la demande tôt, avec les pièces administratives de l'Université. Alternative immédiate : sous-domaine de l'Université (ex. `iutam.mahajanga-univ.mg`) : demander à l'administrateur du domaine de créer un enregistrement `CNAME` vers l'hébergeur choisi.

## 5. Mettre à jour le site
```bash
# modifier index.html / css / images, puis :
git add . && git commit -m "Mise à jour des actualités" && git push
```
Retour en arrière : `git revert HEAD && git push`.

## 6. Vérifications après mise en ligne
- [ ] Le site s'ouvre en HTTPS, avec et sans `www`
- [ ] Logo 3D visible sur téléphone et ordinateur ; thème clair/sombre OK
- [ ] Tous les liens du menu, le bouton carte, le formulaire (`mailto:`) fonctionnent
- [ ] Lighthouse (Chrome → F12 → Lighthouse) : viser 90+ en performance, accessibilité, SEO
- [ ] Soumettre `sitemap.xml` dans Google Search Console
- [ ] Tester sur un téléphone Android d'entrée de gamme et en 3G/4G lente

## 7. Dépannage
| Problème | Cause probable | Solution |
|---|---|---|
| Logo 3D absent en local | fichier ouvert directement | lancer un serveur local (voir README) |
| Page blanche sur GitHub Pages | mauvais chemin ou Source non réglée | Source = GitHub Actions ; vérifier l'onglet Actions |
| Pas de HTTPS | DNS pas encore propagé | attendre (jusqu'à 24 h), puis cocher Enforce HTTPS |
| Images non à jour | cache navigateur | renommer le fichier ou vider le cache |
