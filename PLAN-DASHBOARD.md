# Plan d'Implémentation : Dashboard de Synthèse

## 📊 OBJECTIF
Créer une page Dashboard qui affiche en un coup d'œil les indicateurs clés de performance de la boucherie.

## 🎯 FONCTIONNALITÉS À IMPLÉMENTER

### 1. Recette du Jour
- **Montant total** du jour (somme de tous les encaissements)
- **Comparaison J-7** : Écart en € et %
- **Comparaison même jour semaine dernière** : Écart en € et %
- **Indicateur visuel** : Vert si en hausse, rouge si en baisse

### 2. Tendance Hebdomadaire (Graphique)
- **Graphique ligne/barres** des 7 derniers jours
- **Axe X** : Jours (Lun, Mar, Mer...)
- **Axe Y** : Montant total journalier
- **Moyenne de la semaine** : Ligne horizontale en pointillés

### 3. Alertes Factures Impayées
- **Liste des factures** avec échéance > 30 jours et non réglées
- **Badge rouge** avec nombre de factures en alerte
- **Détails** : Fournisseur, montant, nombre de jours de retard
- **Action rapide** : Clic pour marquer comme réglé

### 4. Répartition Paiements (Camembert)
- **Distribution** : Espèce, CB, Chèque/Virement, Tickets Restaurant
- **Pourcentages** pour chaque mode
- **Légende** avec montants absolus
- **Couleurs distinctives** par mode de paiement

### 5. Objectif Mensuel (Barre de Progression)
- **Objectif défini** par l'utilisateur (paramètre)
- **Progression actuelle** : % réalisé
- **Montant restant** pour atteindre l'objectif
- **Projection fin de mois** basée sur moyenne journalière
- **Code couleur** : Rouge (<50%), Orange (50-80%), Vert (>80%)

### 6. Top 3 Fournisseurs Impayés
- **Classement** par montant total de factures impayées
- **Affichage** : Nom fournisseur + montant dû + nombre de factures
- **Lien** vers la page Factures filtrée par fournisseur

## 📁 FICHIERS À CRÉER/MODIFIER

### Nouveaux fichiers
1. **src/pages/Dashboard.tsx** - Composant principal
2. **src/pages/Dashboard.css** - Styles du dashboard
3. **src/components/DashboardCard.tsx** - Carte générique pour KPI
4. **src/components/DashboardCard.css** - Styles des cartes
5. **src/components/WeekChart.tsx** - Graphique hebdomadaire
6. **src/components/PaymentPieChart.tsx** - Camembert répartition
7. **src/components/ProgressBar.tsx** - Barre de progression objectif
8. **sql/create-dashboard-views.sql** - Vues SQL pour optimisation

### Fichiers à modifier
1. **src/App.tsx** - Ajouter route Dashboard
2. **src/components/TabBar.tsx** - Ajouter onglet Dashboard (1er)
3. **src/types/index.ts** - Ajouter types DashboardStats

## 🗄️ MODÈLE DE DONNÉES

### Vue SQL : v_dashboard_stats
```sql
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT
  boucherie_id,
  -- Recette du jour
  (SELECT SUM(total) FROM encaissements WHERE date = CURRENT_DATE AND boucherie_id = b.id) as recette_jour,

  -- Recette J-7
  (SELECT SUM(total) FROM encaissements WHERE date = CURRENT_DATE - INTERVAL '7 days' AND boucherie_id = b.id) as recette_j7,

  -- Recette même jour semaine dernière
  (SELECT SUM(total) FROM encaissements
   WHERE date = CURRENT_DATE - INTERVAL '7 days'
   AND boucherie_id = b.id) as recette_semaine_derniere,

  -- Total mois courant
  (SELECT SUM(total) FROM encaissements
   WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)
   AND boucherie_id = b.id) as total_mois,

  -- Répartition paiements mois courant
  (SELECT SUM(espece) FROM encaissements
   WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)
   AND boucherie_id = b.id) as total_espece,

  (SELECT SUM(cb) FROM encaissements
   WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)
   AND boucherie_id = b.id) as total_cb,

  -- Factures impayées > 30j
  (SELECT COUNT(*) FROM factures
   WHERE regle = false
   AND echeance < CURRENT_DATE - INTERVAL '30 days'
   AND boucherie_id = b.id) as nb_factures_retard

FROM boucheries b;
```

### Interface TypeScript : DashboardStats
```typescript
export interface DashboardStats {
  recetteJour: number;
  recetteJ7: number;
  recetteSemaineDerniere: number;
  totalMois: number;
  totalEspece: number;
  totalCB: number;
  totalChVr: number;
  totalTR: number;
  nbFacturesRetard: number;
}

export interface WeekData {
  date: string;
  jour: string;
  total: number;
}

export interface FactureImpayee {
  id: string;
  fournisseur: string;
  montant: number;
  echeance: string;
  joursRetard: number;
}

export interface FournisseurImpaye {
  fournisseur: string;
  montantTotal: number;
  nbFactures: number;
}
```

## 🎨 DESIGN & UI

### Layout
```
+----------------------------------------------------------+
|  🏪 Dashboard - Boucherie XXX                    👤 Admin |
+----------------------------------------------------------+
|                                                           |
|  +-----------------+  +-----------------+  +------------+ |
|  | 💰 Recette Jour |  | 📊 Semaine      |  | ⚠️ Alertes | |
|  | 2 450,00 €      |  | [Graphique 7j]  |  | 3 factures | |
|  | +12.5% vs J-7   |  | Moy: 2 100€     |  | impayées   | |
|  +-----------------+  +-----------------+  +------------+ |
|                                                           |
|  +-----------------+  +-----------------+  +------------+ |
|  | 🎯 Objectif Mois|  | 💳 Répartition  |  | 👥 Top     | |
|  | [========= ] 78%|  | [Camembert]     |  | Fournisseurs|
|  | 15 000/19 200€  |  | CB 45% • Esp 35%|  | impayés    | |
|  +-----------------+  +-----------------+  +------------+ |
|                                                           |
+----------------------------------------------------------+
```

### Couleurs
- **Recette en hausse** : #2D7D4C (vert)
- **Recette en baisse** : #8B1538 (rouge)
- **Neutre** : #666666 (gris)
- **Alertes** : #FF6B6B (rouge vif)
- **Objectif atteint** : #43A047 (vert clair)
- **Cartes** : Background blanc, shadow légère

## 📋 ÉTAPES D'IMPLÉMENTATION

### Phase 1 : Structure de base
1. ✅ Créer Dashboard.tsx avec layout grid responsive
2. ✅ Créer DashboardCard.tsx composant réutilisable
3. ✅ Ajouter route dans App.tsx
4. ✅ Ajouter onglet dans TabBar (en 1ère position)

### Phase 2 : SQL & Data
1. ✅ Créer vues SQL pour dashboard
2. ✅ Créer fonctions helper pour calculs
3. ✅ Ajouter types TypeScript

### Phase 3 : KPIs de base
1. ✅ Recette du jour avec comparaisons
2. ✅ Total mensuel
3. ✅ Nb alertes factures

### Phase 4 : Graphiques
1. ✅ Graphique tendance 7 jours (Chart.js ou Recharts)
2. ✅ Camembert répartition paiements

### Phase 5 : Fonctionnalités avancées
1. ✅ Barre progression objectif mensuel
2. ✅ Liste factures impayées > 30j
3. ✅ Top 3 fournisseurs impayés

### Phase 6 : Polish & UX
1. ✅ Animations au chargement
2. ✅ Skeleton loaders
3. ✅ Refresh auto toutes les 5min
4. ✅ Responsive mobile

## 🔧 TECHNOLOGIES

- **Graphiques** : Recharts (léger, React-friendly)
- **Icons** : SVG inline (cohérence avec existant)
- **Dates** : date-fns (déjà utilisé)
- **CSS** : CSS modules (cohérence)

## ✅ CRITÈRES DE SUCCÈS

- ✅ Dashboard charge en < 2 secondes
- ✅ Toutes les données affichées sont correctes
- ✅ Responsive sur mobile et tablette
- ✅ Pas de régression sur pages existantes
- ✅ Code propre et maintenable
- ✅ Accessible (a11y)

## 📦 LIVRABLES

1. Page Dashboard fonctionnelle
2. 6 composants réutilisables
3. Vues SQL optimisées
4. Types TypeScript complets
5. CSS responsive
6. Documentation inline

---

**Début implémentation** : Maintenant
**Durée estimée** : 2-3 heures
**Complexité** : Moyenne
