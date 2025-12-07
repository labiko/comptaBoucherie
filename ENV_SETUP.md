# Configuration des environnements

## 🎯 Résumé

Le projet supporte **2 environnements** avec **2 bases de données Supabase** différentes :
- 🔵 **DEV** : Pour le développement et les tests
- 🟢 **PROD** : Pour les données client réelles

---

## 💻 En LOCALHOST

### Basculer entre DEV et PROD

**Fichier à modifier** : `.env` (ligne 9)

**Pour utiliser DEV** (par défaut) :
```bash
VITE_NODE_ENV=development
```

**Pour utiliser PROD** :
```bash
VITE_NODE_ENV=production
```

**⚠️ IMPORTANT** : Après modification, **ARRÊTER** complètement le serveur (`Ctrl+C`) puis le **relancer** :
```bash
npm run dev
```

Les variables d'environnement ne sont chargées qu'au démarrage de Vite.

### Vérifier l'environnement actif

Ouvrez la console du navigateur (F12), vous verrez au démarrage :
- 🔵 `Environnement: DÉVELOPPEMENT (localhost)` si DEV
- 🟢 `Environnement: PRODUCTION (localhost)` si PROD

---

## ☁️ Sur VERCEL

### Architecture actuelle

**2 projets Vercel séparés** :

#### 🟢 Projet PRODUCTION
- **Branche Git** : `master`
- **Variables Vercel** :
  - `VITE_SUPABASE_URL` = URL PROD
  - `VITE_SUPABASE_ANON_KEY` = Key PROD
- **Base Supabase** : `ylhwyotluskuhkjumqpf`

#### 🔵 Projet DÉVELOPPEMENT (à créer)
- **Branche Git** : `dev`
- **Variables Vercel** :
  - `VITE_SUPABASE_URL` = URL DEV
  - `VITE_SUPABASE_ANON_KEY` = Key DEV
- **Base Supabase** : `ghqeiknovctwqpucoeuv`

### Créer le projet DEV sur Vercel

1. Dashboard Vercel → "Add New..." → "Project"
2. Importer le même repository
3. Nom du projet : `boucherie-compta-dev` (ou autre)
4. Settings → Git → Production Branch: `dev`
5. Settings → Environment Variables → Ajouter les 2 variables DEV (voir `VERCEL_ENV_VARIABLES.md`)

**Résultat** :
- Chaque push sur `master` déploie sur PROD
- Chaque push sur `dev` déploie sur DEV
- Les 2 projets sont totalement isolés

---

## 🔄 Workflow recommandé

```
1. Développer en LOCALHOST avec NODE_ENV=development (base DEV)
2. Tester localement
3. Commit + Push sur branche dev
4. Vérifier le déploiement Vercel DEV
5. Une fois validé, merger dev → master
6. Le déploiement PROD se fait automatiquement
```

---

## 📝 Credentials de test (base DEV uniquement)

- **Admin** : `admin` / `admin123`
- **Nacer** : `nacer` / `nacer123`
- **Hany** : `hany` / `hany123`

---

## ⚠️ Règles de sécurité

- ✅ **TOUJOURS** développer et tester sur DEV
- ✅ **JAMAIS** modifier directement la base PROD
- ✅ **TOUJOURS** faire un dump avant toute opération critique
- ✅ Les fichiers `.env*` sont dans `.gitignore` (ne sont pas versionnés)
