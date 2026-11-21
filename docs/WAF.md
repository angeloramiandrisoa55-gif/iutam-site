# Pare-feu applicatif (WAF)

Le site est statique : la principale surface d'attaque est le formulaire de
contact et l'API Worker. Un WAF ajoute une couche de protection **en amont**,
indépendante du code.

Trois niveaux sont possibles, du plus simple au plus complet.

| Niveau | Où | Coût | Efficacité |
|---|---|---|---|
| 1. Règles Cloudflare | CDN devant le site | gratuit (plan Free) | bloque le trafic automatisé |
| 2. `mod_security` | serveur Apache de l'Université | inclus dans la plupart des mutualisés | bloque injections et XSS |
| 3. Cloudflare + Worker | les deux | gratuit | couverture complète |

---

## 1. Règles Cloudflare (recommandé)

Cloudflare est gratuit pour un site institutionnel et apporte au passage le
HTTPS automatique, le cache et le CDN. Les règles se créent dans
**Security → WAF → Custom rules** (ou via l'API).

### 1.1 Bloquer les fichiers sensibles

```
Expression :  http.request.uri.path matches "(?i)\\.(env|git|sql|bak|log|yml|yaml|ini|key|pem)$"
Action     :  Block
```

### 1.2 Limiter le débit sur l'API

```
Expression :  http.request.uri.path starts_with "/api/"
Action     :  Rate limiting — 60 requests / 1 minute
```

### 1.3 Défendre le formulaire (le point sensible)

```
Expression :  http.request.uri.path eq "/api/contact"
Action     :  Rate limiting — 5 requests / 10 minutes
```

Cette règle est **indispensable** : c'est elle qui protège le formulaire contre
le bourrage, même si la limite de débit du Worker est désactivée.

### 1.4 Interdire les requêtes sans origine sur l'API d'écriture

```
Expression :  http.request.uri.path in {"/api/contact" "/api/newsletter" "/api/auth/login"}
              and not http.request.headers.origin contains "VOTRE-DOMAINE.mg"
Action     :  Block
```

### 1.5 Défendre l'interface d'administration

```
Expression :  http.request.uri.path starts_with "/admin/"
Action     :  Super Bot Fight Mode + JS challenge
```

Si le CMS Decap est utilisé, restreindre l'accès par adresse IP (adresses du
service informatique) est encore plus efficace :

```
Expression :  http.request.uri.path starts_with "/admin/" and ip.src ne 41.x.x.x
Action     :  Block
```

### 1.6 Boutique de règles gérées (WAF)

Dans **Security → WAF → Managed Rules**, activer les catégories :

- Cloudflare Managed Ruleset
- OWASP Core Ruleset
- **Browser Integrity Check** (à activer dans **Settings → Security Level**)

Ces règles protègent aussi le site si un jour une faille apparaît dans le code.

### 1.7 Vérifier

Après chaque règle, tester :

```bash
curl -I https://www.VOTRE-DOMAINE.mg/api/contact          # doit renvoyer 405 ou 403
curl -X POST https://www.VOTRE-DOMAINE.mg/api/contact \
  -H 'Origin: https://site-pirate.example' \
  -H 'Content-Type: application/json' -d '{}'                # doit renvoyer 403
```

---

## 2. `mod_security` (serveur Apache)

Déjà présent dans le fichier `.htaccess` livré, en mode **détection** : les
requêtes sont analysées et journalisées, mais ne sont pas bloquées. C'est le
réglage prudent pour une mise en production.

### 2.1 Passer en mode blocage

Une fois le site en ligne et les faux positifs identifiés :

1. Consulter le journal : `journalctl -u apache2 | grep mod_security` ou
   `/var/log/apache2/iutam-modsec-audit.log`
2. Noter les règles qui bloquent des requêtes légitimes
3. Commenter ces règles dans un fichier personnel :
   `/etc/apache2/conf-available/modsecurity_iutam-whitelist.conf`
4. Dans `.htaccess`, remplacer `SecRuleEngine DetectionOnly` par `SecRuleEngine On`

```apache
SecRuleEngine On
SecRequestBodyLimit 131072
SecRequestBodyInMemoryLimit 131072
SecRequestBodyNoFilesLimit 131072
Include /usr/share/modsecurity-crs/*.conf
```

Les mutualisés (cPanel, Nimbus) activent souvent `mod_security` par défaut
avec un niveau « paranoid » : si le site renvoie des erreurs 403 inexpliquées,
demander au service informatique de placer le dossier sur une liste blanche
(`Exclude rules` ou `mod_security.conf` dédié).

### 2.2 Règles minimales à ajouter

Si le serveur ne dispose pas des règles OWASP complètes, ces quelques règles
couvrent l'essentiel :

```apache
# injections SQL
SecRule ARGS "@detectSQLi" "id:1001,phase:2,deny,status:403,log,msg:'Injection SQL'"

# injections de script
SecRule ARGS "@detectXSS" "id:1002,phase:2,deny,status:403,log,msg:'XSS'"

# traversée de répertoires
SecRule REQUEST_URI "@detectFileTraversal" "id:1003,phase:2,deny,status:403,log"

# commandes système
SecRule REQUEST_URI "@detectCmdInjection" "id:1004,phase:2,deny,status:403,log"

# requêtes sans en-tête Referer sur l'API d'écriture
SecRule REQUEST_URI "@contains /api/contact" "id:1005,phase:1,chain,deny,status:403"
  SecRule REQUEST_HEADERS:Origin "@streq ''"
```

---

## 3. Limitation de débit côté serveur

Sur Apache 2.4, `mod_ratelimit` limite les **connexions simultanées** par IP.
Le bloc fourni dans `.htaccess` l'applique déjà au dossier `/api/`.

Pour une limitation par nombre de requêtes (et non par connexions), utiliser
`mod_limit_req` avec un bac à sable :

```apache
<IfModule mod_limit_req.c>
  <IfModule mod_limit_req.c>
    LimitRequestBody 131072
  </IfModule>
</IfModule>
```

ou, plus simple à configurer sur un mutualisé, la règle Cloudflare de la
section 1.3.

---

## 4. Protection du formulaire de contact

Le formulaire est protégé par **six couches indépendantes**. Une seule défaillance
ne suffit donc pas à permettre un abus.

| # | Couche | Où | Effet |
|---|---|---|---|
| 1 | Longueur et format des champs | Worker | pas de message géant, pas d'adresse invalide |
| 2 | Pot de miel | Worker + formulaire | le robot qui remplit tous les champs se signale |
| 3 | Durée minimale de remplissage | Worker | une soumission en moins de 2 s est ignorée |
| 4 | Limitation de débit | Worker + Cloudflare | 5 envois / 10 min / IP |
| 5 | Origine obligatoire | Worker | seul le site peut écrire |
| 6 | Absence de lien sortant | Worker | un message ne peut pas contenir de lien cliquable suivi automatiquement |

> Point 6 : si le secrétariat souhaite pouvoir cliquer sur les liens envoyés par
> les étudiants, retirer le filtrage des URL et accepter que des robots
> « habillés » passent. C'est un choix à faire avec l'administration.

---

## 5. Certificat HTTPS

- **Cloudflare / Netlify / GitHub Pages** : certificat automatique, renouvelé
  sans intervention. Rien à faire.
- **Serveur de l'Université** : demander l'installation d'un certificat
  Let's Encrypt au service informatique, puis retirer les `#` du bloc
  « Redirection vers HTTPS » dans `.htaccess`.
- **Auto-hébergement (Docker + Caddy)** : `deploy/docker-compose.yml` obtient et
  renouvelle le certificat automatiquement. C'est la solution la plus simple
  pour un serveur dédié.

Après activation, vérifier :

```bash
# le site répond en HTTPS
curl -I https://www.VOTRE-DOMAINE.mg/
# HSTS présent (2 ans)
curl -I https://www.VOTRE-DOMAINE.mg/ | grep -i strict-transport-security
# pas de Mixed Content
# https://www.whatsmydns.net/ssl-test/ ou securityheaders.com
```

---

## 6. Vérification périodique

À faire tous les trimestres (ou à chaque mise à jour du site) :

- [ ] `https://securityheaders.com/?q=https://www.VOTRE-DOMAINE.mg` — score A ou plus
- [ ] `https://www.hardenize.com` ou `https://observatory.mozilla.org`
- [ ] Cloudflare : consulter **Security → Events** pour les requêtes bloquées
- [ ] Serveur : `journalctl -u apache2 | grep -i modsecurity | tail`
- [ ] Vérifier que `ALLOWED_ORIGINS` et `JWT_SECRET` n'ont pas changé
- [ ] Tester le formulaire avec une adresse `@` en Techniques
- [ ] Tester une soumission en moins de 2 secondes (elle doit être ignorée)

---

## 7. Voir aussi

- `docs/SECURITE.md` — politique de sécurité, incidents, sauvegardes
- `docs/API.md` — documentation de l'API
- `docs/MONITORING.md` — surveillance
- `api/worker.js` — implémentation des contrôles côté serveur
- `.htaccess` — configuration Apache livrée
- `_headers` — en-têtes Cloudflare / Netlify livrés
