# Migration Multi-Boucherie - Documentation

## 🎯 Objectif

Transformer l'application d'une architecture **mono-boucherie** vers une architecture **multi-boucherie**, permettant de gérer plusieurs boucheries indépendantes avec leurs propres données.

## 📊 Architecture

### Avant la migration
```
users ──┐
        ├──> encaissements
        └──> factures

❌ Tous les utilisateurs partagent les mêmes données
❌ Impossible de séparer les données par boucherie
```

### Après la migration
```
boucheries
    ├──> users
    ├──> encaissements
    └──> factures

✅ Chaque boucherie a ses propres utilisateurs
✅ Chaque boucherie a ses propres données isolées
✅ Contrainte UNIQUE(boucherie_id, date) pour les encaissements
```

## 🗄️ Modifications de la base de données

### 1. Nouvelle table `boucheries`

```sql
CREATE TABLE boucheries (
  id UUID PRIMARY KEY,
  nom TEXT NOT NULL,
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  siret TEXT,
  telephone TEXT,
  email TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 2. Modifications des tables existantes

#### Table `users`
- ✅ Ajout : `boucherie_id UUID NOT NULL` (FK vers `boucheries.id`)
- ✅ Index : `idx_users_boucherie_id`

#### Table `encaissements`
- ✅ Ajout : `boucherie_id UUID NOT NULL` (FK vers `boucheries.id`)
- ❌ Suppression : Contrainte `UNIQUE(date, user_id)`
- ❌ Suppression : Contrainte `UNIQUE(date)`
- ✅ Ajout : Contrainte `UNIQUE(boucherie_id, date)`
- ✅ Index : `idx_encaissements_boucherie_id`

#### Table `factures`
- ✅ Ajout : `boucherie_id UUID NOT NULL` (FK vers `boucheries.id`)
- ✅ Index : `idx_factures_boucherie_id`

### 3. Mise à jour de la fonction `get_mois_archives`

```sql
-- Ancienne signature
get_mois_archives(user_id UUID)

-- Nouvelle signature
get_mois_archives(boucherie_id UUID)
```

## 💻 Modifications du code TypeScript

### Types mis à jour ([src/types/index.ts](../src/types/index.ts))

```typescript
// Nouveau type
export interface Boucherie {
  id: string;
  nom: string;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  siret: string | null;
  telephone: string | null;
  email: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

// Types modifiés avec boucherie_id
export interface User {
  id: string;
  boucherie_id: string; // ← NOUVEAU
  // ... autres champs
}

export interface Encaissement {
  id: string;
  boucherie_id: string; // ← NOUVEAU
  // ... autres champs
}

export interface Facture {
  id: string;
  boucherie_id: string; // ← NOUVEAU
  // ... autres champs
}
```

### Code React mis à jour ([src/pages/Encaissements.tsx](../src/pages/Encaissements.tsx))

#### Chargement des données
```typescript
// Avant
.from('encaissements')
.select('*')
.gte('date', monthStart)

// Après
.from('encaissements')
.select('*')
.eq('boucherie_id', user.boucherie_id) // ← Filtrage par boucherie
.gte('date', monthStart)
```

#### Création d'encaissement
```typescript
// Avant
.insert({
  date: todayStr,
  espece, cb, ch_vr, tr,
  user_id: user.id,
})

// Après
.insert({
  boucherie_id: user.boucherie_id, // ← Rattachement à la boucherie
  date: todayStr,
  espece, cb, ch_vr, tr,
  user_id: user.id,
})
```

## 📋 Scripts SQL à exécuter

### Ordre d'exécution sur Supabase

1. **[sql/migration-multi-boucherie.sql](../sql/migration-multi-boucherie.sql)**
   - Crée la table `boucheries`
   - Ajoute la boucherie "Wissam SARL"
   - Migre toutes les tables existantes
   - Met à jour les vues et fonctions
   - ✅ **DÉJÀ EXÉCUTÉ**

2. **[sql/add-users-hany-nacer-v2.sql](../sql/add-users-hany-nacer-v2.sql)**
   - Crée les utilisateurs hany et nacer
   - Les rattache à Wissam SARL
   - ⏳ **À EXÉCUTER**

## ✨ Fonctionnement

### Isolation des données

Chaque boucherie voit uniquement **ses propres données** :

- **Boucherie A** : Utilisateurs A1, A2, A3 → Encaissements A, Factures A
- **Boucherie B** : Utilisateurs B1, B2 → Encaissements B, Factures B

Les données sont totalement isolées grâce au filtre `boucherie_id`.

### Règles métier

1. **Un utilisateur** appartient à **une seule boucherie**
2. **Un encaissement** appartient à **une seule boucherie**
3. **Une facture** appartient à **une seule boucherie**
4. **Tous les utilisateurs d'une boucherie** voient les mêmes données
5. **Un seul encaissement par jour et par boucherie** (contrainte `UNIQUE(boucherie_id, date)`)

## 🏢 Boucherie actuelle : Wissam SARL

### Informations

- **Nom** : Wissam SARL
- **Adresse** : 123 Avenue de la République
- **Code postal** : 75011
- **Ville** : Paris
- **SIRET** : 123 456 789 00012
- **Téléphone** : 01 23 45 67 89
- **Email** : contact@wissam-sarl.fr

### Utilisateurs

| Login | Mot de passe | Nom | Statut |
|-------|-------------|-----|--------|
| admin | admin123 | Admin | ✅ Existant |
| hany | hany123 | Hany | ⏳ À créer |
| nacer | nacer123 | Nacer | ⏳ À créer |

## 🚀 Ajout d'une nouvelle boucherie (futur)

Pour ajouter une nouvelle boucherie, il suffira de :

1. Insérer une ligne dans la table `boucheries`
2. Créer les utilisateurs rattachés à cette boucherie
3. Les données seront automatiquement isolées

Exemple :
```sql
-- Créer une nouvelle boucherie
INSERT INTO boucheries (nom, adresse, ville, siret)
VALUES ('Boucherie Martin', '456 Rue de Paris', 'Lyon', '987 654 321 00012');

-- Créer un utilisateur pour cette boucherie
INSERT INTO users (boucherie_id, login, password_hash, nom)
VALUES (
  (SELECT id FROM boucheries WHERE nom = 'Boucherie Martin'),
  'martin',
  hash_password('martin123'),
  'Martin'
);
```

## 📊 Impact sur les performances

### Index créés
- `idx_users_boucherie_id` sur `users(boucherie_id)`
- `idx_encaissements_boucherie_id` sur `encaissements(boucherie_id)`
- `idx_factures_boucherie_id` sur `factures(boucherie_id)`

Ces index garantissent que les requêtes filtrées par `boucherie_id` restent performantes même avec de nombreuses boucheries.

## ✅ État de la migration

- ✅ Script SQL créé
- ✅ Migration exécutée sur Supabase
- ✅ Types TypeScript mis à jour
- ✅ Code React mis à jour
- ✅ Build de production validé
- ⏳ Création des utilisateurs hany et nacer en attente

## 🔄 Compatibilité ascendante

La migration est **non-destructive** :
- ✅ Toutes les données existantes ont été préservées
- ✅ Tous les utilisateurs ont été rattachés à Wissam SARL
- ✅ Tous les encaissements ont été rattachés à Wissam SARL
- ✅ Toutes les factures ont été rattachées à Wissam SARL

L'application fonctionne exactement comme avant, mais avec la possibilité d'ajouter de nouvelles boucheries.
