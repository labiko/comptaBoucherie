# Guide d'installation - Compta Boucherie

## 🎯 Résumé du projet

Application web mobile de comptabilité pour boucherie avec :
- Authentification utilisateur (login/mot de passe chiffré)
- Gestion des encaissements quotidiens
- Traçabilité complète (qui a créé/modifié chaque ligne)
- Archivage automatique par mois
- Design mobile-first (rouge/bordeaux + vert)

## 📋 Prérequis

- Node.js v18+ et npm
- Un compte Supabase (gratuit)
- Un navigateur moderne

## 🚀 Installation pas à pas

### Étape 1 : Cloner et installer les dépendances

```bash
cd Boucherie.Compta
npm install
```

### Étape 2 : Configuration de Supabase

1. **Créer un projet Supabase**
   - Allez sur https://supabase.com
   - Créez un nouveau projet
   - Notez l'URL et la clé `anon`

2. **Exécuter les scripts SQL dans l'ordre**

   a) **Script principal** : [sql/supabase-schema.sql](sql/supabase-schema.sql)
   - Créez la structure complète
   - Créez l'utilisateur admin par défaut

   b) **Migration `updated_by`** : [sql/add-updated-by.sql](sql/add-updated-by.sql)
   - Ajoute la traçabilité des modifications

   c) **Données de test (optionnel)** : [sql/insert-test-data.sql](sql/insert-test-data.sql)
   - Insère 10 encaissements et 5 factures pour novembre 2024

3. **Récupérer les clés API**
   - Dashboard Supabase > Settings > API
   - Copiez `Project URL` et `anon public key`

4. **Créer le fichier `.env`**

```bash
cp .env.example .env
```

Éditez `.env` et ajoutez vos clés :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-anon-key
```

### Étape 3 : Lancer l'application

```bash
npm run dev
```

L'application sera accessible sur http://localhost:5173

### Étape 4 : Première connexion

**Identifiants par défaut :**
- Login : `admin`
- Mot de passe : `admin123`

## 📚 Structure de la base de données

### Tables créées

#### `users`
- Authentification avec mot de passe chiffré (bcrypt)
- Champs : `id`, `login`, `password_hash`, `nom`, `prenom`, `email`, `actif`

#### `encaissements`
- Une ligne = un jour d'encaissement
- Champs : `id`, `date`, `espece`, `cb`, `ch_vr`, `tr`, `total` (calculé)
- Traçabilité : `user_id` (créateur), `updated_by` (dernier modificateur)
- Timestamps : `created_at`, `updated_at`

#### `factures`
- Factures fournisseurs
- Traçabilité complète comme les encaissements

### Vues SQL automatiques

- `encaissements_mois_courant` : Données du mois en cours
- `factures_mois_courant` : Factures du mois en cours
- `encaissements_archives` : Données des mois passés
- `factures_archives` : Factures des mois passés

### Fonctions SQL

- `hash_password(password)` : Chiffre un mot de passe
- `verify_password(login, password)` : Vérifie les credentials
- `get_mois_archives(user_id)` : Liste des mois archivés

## ✨ Fonctionnalités développées

### ✅ Onglet Encaissements

1. **Saisie du jour**
   - Date automatique (jour courant)
   - 4 types de paiement : Espèce, CB, CH/VR, TR
   - Tous les champs obligatoires (validation)
   - Montants >= 0 uniquement

2. **Édition des encaissements**
   - Bouton ✏️ sur chaque ligne
   - Modification avec traçabilité
   - `updated_by` et `updated_at` mis à jour automatiquement

3. **Totaux automatiques**
   - Total du jour
   - Total de la semaine
   - Total du mois

4. **Historique du mois**
   - Tableau des encaissements du mois courant
   - Ligne du jour mise en surbrillance

### ✅ Authentification

- Login obligatoire
- Session persistante (localStorage, pas d'expiration)
- Déconnexion via bouton dans le header
- Routes protégées

### ✅ Traçabilité complète

Chaque ligne enregistre :
- **Qui l'a créée** : `user_id`
- **Quand** : `created_at`
- **Qui l'a modifiée en dernier** : `updated_by`
- **Quand** : `updated_at`

## 🎨 Design

- **Mobile-first** : Optimisé pour smartphone
- **Couleurs** : Rouge/bordeaux (#8B1538) + Vert (#2D7D4C)
- **Touch-friendly** : Boutons >= 44px, zones tactiles larges
- **Responsive** : S'adapte aux petits écrans

## 📝 Commandes disponibles

```bash
# Développement
npm run dev

# Build production
npm run build

# Prévisualisation du build
npm run preview

# Linter
npm run lint
```

## 🔒 Sécurité

### Actuel (développement)
- RLS activé mais politiques permissives
- Pas d'expiration de session
- Données en localStorage

### À ajouter pour la production
- Politiques RLS strictes par utilisateur
- Expiration de session
- HTTPS obligatoire
- Rate limiting sur l'API

## 📖 Documentation complémentaire

- [CLAUDE.md](CLAUDE.md) : Guide pour Claude Code
- [README.md](README.md) : Présentation du projet
- [sql/README.md](sql/README.md) : Documentation des scripts SQL

## 🐛 Dépannage

### La page reste blanche
- Vérifiez la console (F12)
- Vérifiez que `.env` existe et contient les bonnes clés
- Redémarrez le serveur de dev

### Erreur "does not provide an export"
- Supprimez le dossier `node_modules`
- Relancez `npm install`
- Redémarrez le serveur

### Erreur de connexion Supabase
- Vérifiez que les scripts SQL ont été exécutés
- Vérifiez les clés dans `.env`
- Vérifiez que le projet Supabase est actif

## 📞 Support

Pour toute question ou problème, consultez :
- Documentation Supabase : https://supabase.com/docs
- Documentation Vite : https://vitejs.dev
- Documentation React : https://react.dev
