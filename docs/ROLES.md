# Rôles et permissions

Le site est public : tout ce qui est publié est lisible par tous. Les
permissions concernent donc **ce qui n'est pas publié** : l'interface
d'administration, l'API d'écriture et l'espace étudiant.

Le principe retenu : **le droit le plus faible possible**. Un compte qui ne
modifie pas les pages n'a pas accès à l'API d'écriture.

---

## 1. Les quatre rôles

| Rôle | Qui | Peut | Ne peut pas |
|---|---|---|---|
| **admin** | responsable technique du site (1 à 2 personnes) | tout : contenu, API, comptes, déploiement | — |
| **staff** | rédacteur (secrétariat, communication) | publier et modifier les contenus (actualités, FAQ, guides, formations) | gérer les comptes, l'API, le déploiement |
| **étudiant** | inscrit | consulter son propre dossier (à venir) | modifier un contenu, voir les autres étudiants |
| **invité** | visiteur | rien de plus que le public | tout |

---

## 2. Matrice des permissions

| Action | Public | Invité | Étudiant | Staff | Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Lire le site | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lire l'API de lecture (`/api/*.json`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Envoyer un message via le formulaire | ✅ | ✅ | ✅ | ✅ | ✅ |
| S'inscrire à la lettre d'information | ✅ | ✅ | ✅ | ✅ | ✅ |
| Modifier une actualité | ❌ | ❌ | ❌ | ✅ | ✅ |
| Modifier la FAQ, les guides, les formations | ❌ | ❌ | ❌ | ✅ | ✅ |
| Modifier les frais de scolarité | ❌ | ❌ | ❌ | ⚠️ validation | ✅ |
| Publier dans `/admin/` | ❌ | ❌ | ❌ | ✅ | ✅ |
| Envoyer des messages en masse (lettre d'information) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Créer ou supprimer un compte | ❌ | ❌ | ❌ | ❌ | ✅ |
| Réinitialiser un mot de passe | ❌ | ❌ | ❌ | ❌ | ✅ |
| Consulter les journaux et les statistiques | ❌ | ❌ | ❌ | ❌ | ✅ |
| Modifier le code, l'API, le déploiement | ❌ | ❌ | ❌ | ❌ | ✅ |
| Changer la configuration du Worker | ❌ | ❌ | ❌ | ❌ | ✅ |
| Consulter la liste des abonnés à la lettre | ❌ | ❌ | ❌ | ❌ | ✅ |

⚠️ = autorisé, mais la modification doit être validée par un admin
(frais de scolarité, programmes, textes officiels).

---

## 3. Comment les rôles sont appliqués

### 3.1 Contenus du site — GitHub + Decap CMS

L'interface `/admin/` (Decap CMS) s'authentifie par GitHub OAuth. **Les droits
sont ceux du compte GitHub** : un compte « lecture seule » ne peut pas publier.

Pour appliquer une séparation stricte :

1. Créer une **organisation GitHub** (ou une équipe) « IUTAM Site »
2. Définir des **équipes** avec des droits différents :
   - équipe `redacteurs` → rôle *Write* sur le dépôt
   - équipe `techniques` → rôle *Admin* sur le dépôt
3. Dans le panneau de l'organisation, restreindre l'accès au dépôt aux
   seules équipes concernées
4. Activer la **double authentification** obligatoire pour tous les membres

Limite : Decap ne connaît pas la notion de rôle `staff` : toute personne
membre de l'équipe `redacteurs` peut modifier n'importe quel fichier
autorisé par `admin/config.yml`. Pour une séparation plus fine, retirer les
collections sensibles (`frais`, `formations`) de `config.yml` et les traiter
uniquement par commit direct (voir § 3.2).

### 3.2 Fichiers sensibles — commits directs

Pour Happier, les fichiers `data/frais.json` et `data/formations.json` sont
modifiés par un administrateur en dehors du CMS. Le workflow de déploiement
vérifie automatiquement que rien n'a été modifié hors procédure.

### 3.3 API d'écriture — Cloudflare Worker

Le jeton JWT contient un champ `role` :

```json
{ "sub": "u1", "email": "…", "role": "admin", "exp": 1758278400 }
```

Règles appliquées par le Worker :

- une **écriture** (`POST /api/contact`, `/api/newsletter`) n'exige aucun rôle :
  ce sont des actions publiques ;
- une **lecture protégée** (`GET /api/me`) exige un jeton valide, quel que soit
  le rôle ;
- le contrôle du rôle (`admin`, `staff`) doit être ajouté **côté serveur** sur
  les routes administratives à venir (publication d'actualités, gestion des
  comptes) :

```js
// à ajouter dans api/worker.js le moment venu
const roles = { admin: 3, staff: 2, etudiant: 1, invite: 0 };
function authorize(payload, required) {
  return (roles[payload.role] || 0) >= roles[required];
}
```

### 3.4 Comptes et mots de passe

Les comptes sont dans l'espace de clé/valeur du Worker, sous `user:<adresse>`.
Le mot de passe n'y est **jamais** en clair : seul un condensat PBKDF2-SHA256
(120 000 itérations) et son sel sont conservés.

Règles de gestion :

- 12 caractères minimum, gestionnaire de mots de passe du navigateur
- pas de réutilisation d'un mot de passe d'un autre service
- rotation du `JWT_SECRET` : invalide toutes les sessions (à faire si un
  compte est compromis)
- le compte d'un étudiant qui quitte l'établissement est supprimé, pas désactivé

---

## 4. Répartition recommandée des accès

| Personne | Compte GitHub | Accès Worker | Rôle CMS |
|---|---|---|---|
| Responsable du site (technique) | `admin` | Admin | admin |
| Assistant technique (succession) | `admin` | Admin | admin |
| Secrétariat (rédaction) | `redacteur` (équipe) | aucun | staff |
| Communication /(student) | `redacteur` (équipe) | aucun | staff |
| Enseignants | aucun | aucun | aucun (propositions par le secrétariat) |
| Étudiants | aucun | aucun | aucun |

**Maximum deux personnes** doivent disposer des droits d'administration : c'est
la mesure la plus efficace contre le risque de perte d'accès ou de malveillance.

---

## 5. Révision de la matrice

La matrice doit être revue :

- à chaque rentrée universitaire ;
- à chaque changement de personne responsable ;
- au moins une fois par an, en même temps que le reste de la sécurité
  (voir `docs/CONTENU-A-COMPLETER.md`).

Toute personne ayant quitté l'équipe doit voir ses accès révoqués **le jour
même** : retirer l'utilisateur de l'organisation GitHub, de l'équipe Cloudflare
et supprimer son compte du Worker.

---

## 6. Voir aussi

- `docs/API.md` — authentification JWT
- `docs/SECURITE.md` — gestion des comptes et double authentification
- `docs/CMS.md` — installation de Decap CMS
- `admin/config.yml` — collections et champs modifiables
