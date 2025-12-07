# Règles de développement

## Gestion de version
À chaque commit, incrémenter automatiquement la version dans `version.json` (patch: +0.0.1, minor: +0.1.0, major: +1.0.0) et l'inclure dans le commit.

## Gestion des commits
**IMPORTANT** : Ne JAMAIS commit ou push sans demande explicite de l'utilisateur.
- Toujours demander confirmation avant de commit
- Ne pas commit automatiquement après une modification
- Attendre que l'utilisateur demande explicitement "commit" ou "commit et push"

## Workflow Git et Environnements

### Règle CRITIQUE : Protection de la branche MASTER

**⚠️ RÈGLE ABSOLUE** : Par défaut, **TOUS** les commits et push doivent être faits **UNIQUEMENT** sur la branche `dev`.

**La branche `master` est PROTÉGÉE et correspond à la PRODUCTION en ligne (Vercel).**

### Workflow obligatoire :

1. **Développement** :
   - Travailler en LOCAL avec `VITE_NODE_ENV=development` (base DEV)
   - Tous les commits/push par défaut sur la branche `dev`

2. **Validation** :
   - Tester sur Vercel DEV (branche `dev` déployée automatiquement)
   - Vérifier que tout fonctionne correctement

3. **Production** (UNIQUEMENT sur demande EXPLICITE) :
   - ⚠️ Ne merger `dev` → `master` que sur demande EXPLICITE de l'utilisateur
   - Ne JAMAIS push sur `master` sans autorisation explicite
   - Toujours demander confirmation avant toute action sur `master`

### Commandes Git autorisées par défaut :

✅ **AUTORISÉ sans demander** :
```bash
git add .
git commit -m "message"
git push origin dev
```

❌ **INTERDIT sans demande EXPLICITE** :
```bash
git push origin master
git checkout master
git merge dev (si on est sur master)
```

### Phrases clés pour autoriser les actions sur MASTER :

L'utilisateur doit utiliser ces phrases **EXPLICITEMENT** :
- "merge sur master"
- "push sur master"
- "déploie en production"
- "met à jour la production"

**Si l'utilisateur dit simplement "commit" ou "push" → toujours utiliser la branche `dev`.**

### Architecture des environnements :

```
┌─────────────────────────────────────────────────┐
│  LOCALHOST                                       │
│  - Branche: dev                                  │
│  - Base: DEV (ghqeiknovctwqpucoeuv)             │
│  - VITE_NODE_ENV=development                    │
└─────────────────────────────────────────────────┘
                    ↓ push
┌─────────────────────────────────────────────────┐
│  VERCEL DEV                                      │
│  - Branche: dev (auto-deploy)                   │
│  - Base: DEV (ghqeiknovctwqpucoeuv)             │
│  - URL: boucherie-compta-dev.vercel.app         │
└─────────────────────────────────────────────────┘
                    ↓ merge (EXPLICITE UNIQUEMENT)
┌─────────────────────────────────────────────────┐
│  VERCEL PROD (PROTÉGÉ)                          │
│  - Branche: master (auto-deploy)                │
│  - Base: PROD (ylhwyotluskuhkjumqpf)            │
│  - URL: production réelle client                │
└─────────────────────────────────────────────────┘
```

### Exemples de dialogue :

**✅ Exemple 1 - Commit normal (dev par défaut)** :
```
User: "commit les changements"
Claude: Je vais commit et push sur la branche dev.
         [git add . && git commit && git push origin dev]
```

**✅ Exemple 2 - Demande explicite pour master** :
```
User: "merge sur master et déploie en production"
Claude: ⚠️ Vous demandez un déploiement en PRODUCTION.
         Voulez-vous vraiment merger dev → master ? (oui/non)
User: "oui"
Claude: [git checkout master && git merge dev && git push origin master]
```

**❌ Exemple 3 - Ambiguïté (refuser)** :
```
User: "push les changements"
Claude: Je vais push sur la branche dev.
         [git push origin dev]
         (pas de push sur master sans demande explicite)
```
