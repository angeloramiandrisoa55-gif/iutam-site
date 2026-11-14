# Surveillance et alertes

Un site institutionnel doit être surveillé : personne ne remarque un site
cassé, mais les prospectiveurs, eux, vont simplement aller voir ailleurs.

Trois niveaux de surveillance sont proposés, combinables.

| Niveau | Outil | Coût | Ce qu'il détecte |
|---|---|---|---|
| 1. Interne | workflow GitHub Actions | gratuit | site down, certificat expiré, API en panne |
| 2. Externe | UptimeRobot / Better Stack | gratuit (5 min) | site inaccessible depuis l'extérieur |
| 3. Métier | Google Analytics / Plausible | gratuit | pages consultées, recherches sans résultat |

---

## 1. Surveillance interne (déjà en place)

Le fichier `.github/workflows/uptime.yml` s'exécute **toutes les 30 minutes** et
contrôle :

- `https://www.VOTRE-DOMAINE.mg/` — page d'accueil
- `https://www.VOTRE-DOMAINE.mg/mg/` — version malagache
- `https://www.VOTRE-DOMAINE.mg/api/index.json` — API
- `https://www.VOTRE-DOMAINE.mg/mentions-legales.html` — page légale

En cas d'échec :

1. une **demande GitHub** est ouverte automatiquement, avec le libellé
   `alerte` (une seule demande ouverte à la fois, pour éviter le bruit) ;
2. si la variable secrète `HC_PING_URL` est renseignée, une alerte est envoyée
   à [healthchecks.io](https://healthchecks.io), qui peut déclencher un SMS,
   un e-mail ou une notification Telegram.

### Configuration dans GitHub

| Élément | Où | Valeur |
|---|---|---|
| `SITE_URL` | **Settings → Secrets and variables → Actions → Variables** | `https://www.VOTRE-DOMAINE.mg` |
| `HC_PING_URL` | **Settings → Secrets and variables → Actions → Secrets** | URL du ping healthchecks.io |
| `alerte` | **Issues → Labels** | étiquette à créer (couleur rouge) |

### Tester la surveillance

Dans GitHub : **Actions → Surveillance du site → Run workflow**.
Ou en ligne de commande :

```bash
for u in / /mg/ /api/index.json /mentions-legales.html; do
  printf '%-28s %s\n' "$u" "$(curl -s -o /dev/null -w '%{http_code}' https://www.VOTRE-DOMAINE.mg$u)"
done
```

---

## 2. Surveillance externe (recommandée)

Un service externe vérifie le site **depuis l'extérieur**, ce qui détecte aussi
les pannes de réseau, de DNS ou de certificat que GitHub ne verrait pas.

### UptimeRobot (gratuit, 5 min d'intervalle)

1. Créer un compte sur <https://uptimerobot.com>
2. **Add New Monitor** :
   - Monitor Type : HTTP(s)
   - Friendly name : IUTAM Mahajanga
   - URL : `https://www.VOTRE-DOMAINE.mg/`
   - Monitoring Interval : 5 minutes
3. Ajouter un second moniteur sur `https://www.VOTRE-DOMAINE.mg/api/index.json`
4. **Alert Contacts** : e-mail du secrétariat + WhatsApp (via l'e-mail)

### Better Stack / Hetrix Tools

Mêmes principes, avec la possibilité de surveiller depuis plusieurs pays
(important pour vérifier l'accessibilité depuis Madagascar et depuis l'Europe).

### Le certificat est surveillé aussi

UptimeRobot signale les erreurs de certificat avant leur expiration. En
complément, le workflow GitHub contrôle la date de fin de validité et
l'affiche dans son résumé.

---

## 3. Journalisation

| Composant | Journal | Où le consulter |
|---|---|---|
| Cloudflare | Security → Events, Analytics | tableau de bord Cloudflare |
| Cloudflare Worker | `npx wrangler tail` | terminal |
| Apache | `/var/log/apache2/iutam-access.log` | serveur de l'Université |
| GitHub Actions | onglet « Logs » de chaque exécution | GitHub |

### Rotation des journaux (serveur Apache)

```bash
sudo cat > /etc/logrotate.d/iutam <<'EOF'
/var/log/apache2/iutam*.log {
    weekly
    rotate 8
    compress
    delaycompress
    missingok
    notifempty
    create 640 root adm
    sharedscripts
    postrotate
        systemctl reload apache2 > /dev/null 2>&1 || true
    endscript
}
EOF
```

### Ce qu'il faut surveiller dans les journaux

- Pic soudain de requêtes `POST /api/contact` → tentative de bourrage
- Requêtes `POST` avec une origine inconnue → tentative d'usurpation
- `401` ou `422` répétés sur `/api/auth/login` → tentative de devinette de mot de passe
- Requêtes vers `/admin/` depuis une adresse inconnue

---

## 4. Mesure d'audience

Pour savoir ce que les visiteurs cherchent et quelles pages les ammènent à
s'adresser au secrétariat, il faut mesurer les visites. Deux outils
respectueux de la vie privée, sans cookies :

### Plausible (recommandé)

- Auto-hébergeable ou en version cloud (payante mais légère)
- Aucun cookie, aucune trace personnelle
- Se place dans le `<head>` de `index.html` :

```html
<script defer data-domain="www.VOTRE-DOMAINE.mg" src="https://plausible.io/js/script.js"></script>
```

> Si le script est ajouté, **mettre à jour la politique de sécurité de contenu**
> dans `_headers` et `.htaccess` : ajouter `https://plausible.io` (et
> `https://plausible.io` dans `connect-src`, `script-src` et `img-src`).

### Cloudflare Web Analytics (gratuit)

S'active dans le tableau de bord Cloudflare, sans modification du code.
C'est le choix le plus simple quand le site est déjà derrière Cloudflare.

### Ce qu'il faut regarder

- Pages les plus visitées (pour savoir quel contenu est utile)
- Recherches internes sans résultat (le moteur de recherche du site enregistre
  les requêtes : c'est la meilleure source pour créer de nouvelles FAQ)
- Taux de rebond sur la page « Contact » (trop élevé = le formulaire pose problème)

---

## 5. Journal de bord trimestriel

À remplir une fois par trimestre (le fichier `docs/CONTENU-A-COMPLETER.md`
contient la liste des vérifications annuelles).

| Élément | Vérification | Résultat |
|---|---|---|
| Disponibilité | 99,5 % ou plus sur 30 jours | |
| Certificat | valide et renewal automatique actif | |
| Alertes | aucune alerte non traitée | |
| Journal Worker | aucune tentative d'abus non bloquée | |
| Sauvegardes | archives présentes et restauration testée | |
| Contenus | tarifs, calendrier, contacts à jour | |
| Accessibilité | test sur téléphone Android et iPhone | |
| Liens | aucune erreur (job « Contrôles de sécurité ») | |

---

## 6. En cas de panne

1. **Vérifier l'alerte** : lire le message (le workflow GitHub indique la page
   concernée et le code HTTP).
2. **Consulter l'hébergeur** : GitHub Pages (Actions), Cloudflare (Incidents),
   serveur de l'Université (service informatique).
3. **Si le site est down mais le dépôt est sain** : redéployer manuellement
   (Actions → *Déploiement GitHub Pages* → *Run workflow*).
4. **Si le Worker est en panne** : `npx wrangler tail` pour voir les erreurs ;
   le site continue de fonctionner (le formulaire bascule sur la messagerie).
5. **Après la panne** : noter la cause et la durée, et en tirer une règle de
   prevention (voir `docs/SECURITE.md`, section « Retour d'expérience »).

---

## 7. Voir aussi

- `docs/SECURITE.md` — procédures d'incident et de restauration
- `docs/API.md` — sonde `/api/health`
- `.github/workflows/uptime.yml` — workflow de surveillance
- `docs/RECOMMANDATIONS.md` — feuille de route générale
