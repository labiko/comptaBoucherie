# Compta Boucherie

Application web mobile pour la gestion comptable d'une boucherie.

## 🎯 Fonctionnalités

### Onglet Encaissements (Développé)
- ✅ Saisie automatique de la date du jour
- ✅ Saisie de 4 types d'encaissements : Espèce, CB, Chèque/Virement, Tickets Restaurant
- ✅ Calcul automatique du total journalier
- ✅ Affichage des totaux : jour, semaine, mois
- ✅ Historique du mois en cours
- ✅ Archivage mensuel

### Onglet Factures (À développer)
- 📝 Saisie des factures fournisseurs
- 📝 Gestion des échéances et soldes

### Onglet Historique (À développer)
- 📝 Consultation par mois
- 📝 Totaux mensuels
- 📝 Visualisation des mois archivés

## 🚀 Installation

### Prérequis
- Node.js (v18 ou supérieur)
- npm
- Un compte Supabase (gratuit)

### Étape 1 : Installation des dépendances

```bash
npm install
```

### Étape 2 : Configuration de Supabase

1. Créez un projet sur [Supabase](https://supabase.com)

2. Allez dans l'éditeur SQL (SQL Editor) et exécutez le contenu du fichier `supabase-schema.sql`

3. Récupérez vos clés API :
   - Allez dans Settings > API
   - Copiez l'URL du projet (`URL`)
   - Copiez la clé `anon/public` (`anon key`)

4. Créez un fichier `.env` à la racine du projet :

```bash
cp .env.example .env
```

5. Éditez le fichier `.env` et remplacez les valeurs :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-anon-key
```

### Étape 3 : Lancement de l'application

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 📱 Utilisation

### Mode de développement

```bash
npm run dev
```

### Build de production

```bash
npm run build
```

Les fichiers seront générés dans le dossier `dist/`

### Prévisualisation du build

```bash
npm run preview
```

## 🎨 Thème de couleurs

- **Couleurs principales (Boucherie)** : Rouge bordeaux (#8B1538)
- **Couleurs secondaires (Comptabilité)** : Vert (#2D7D4C)
- **Design** : Mobile-first, optimisé pour smartphone

## 📂 Structure du projet

```
src/
├── components/          # Composants réutilisables
│   ├── Layout.tsx      # Layout principal avec header
│   └── TabBar.tsx      # Barre de navigation par onglets
├── pages/              # Pages de l'application
│   ├── Encaissements.tsx
│   ├── Factures.tsx
│   └── Historique.tsx
├── lib/                # Configuration et utilitaires
│   └── supabase.ts     # Client Supabase
├── types/              # Types TypeScript
│   └── index.ts
└── styles/             # Thème et styles globaux
    └── theme.ts
```

## 🗄️ Base de données

### Tables

#### `encaissements`
- `id` : UUID (clé primaire)
- `date` : DATE (unique, une ligne par jour)
- `espece` : DECIMAL(10,2)
- `cb` : DECIMAL(10,2)
- `ch_vr` : DECIMAL(10,2)
- `tr` : DECIMAL(10,2)
- `total` : DECIMAL(10,2) (calculé automatiquement)
- `archived` : BOOLEAN
- `created_at` : TIMESTAMP

#### `factures`
- `id` : UUID (clé primaire)
- `date_facture` : DATE
- `fournisseur` : TEXT
- `echeance` : DATE
- `description` : TEXT
- `montant` : DECIMAL(10,2)
- `mode_reglement` : TEXT
- `solde_restant` : DECIMAL(10,2)
- `archived` : BOOLEAN
- `created_at` : TIMESTAMP

#### `mois_archives`
- `id` : UUID (clé primaire)
- `annee` : INTEGER
- `mois` : INTEGER (1-12)
- `archived_at` : TIMESTAMP

### Fonction SQL

`archiver_mois(p_annee, p_mois)` : Archive tous les encaissements et factures d'un mois donné.

## 🔐 Sécurité

Pour l'instant, l'application n'a pas de système d'authentification (Row Level Security configuré pour permettre tous les accès).

**Important** : Avant de déployer en production, configurez l'authentification et les politiques RLS appropriées dans Supabase.

## 📝 TODO

- [ ] Développer l'onglet Factures
- [ ] Développer l'onglet Historique
- [ ] Ajouter l'authentification
- [ ] Ajouter l'export PDF/Excel
- [ ] Tests unitaires
- [ ] PWA (installation sur mobile)
- [ ] Mode hors-ligne

## 🛠️ Technologies utilisées

- **React** 19.2 + **TypeScript**
- **Vite** - Build tool
- **Supabase** - Backend as a service (PostgreSQL)
- **React Router** - Routing
- **date-fns** - Manipulation des dates

## 📄 Licence

Projet privé - Tous droits réservés
