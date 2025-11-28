# Dashboard - Instructions d'installation

## ✅ Implémentation terminée

Le Dashboard a été implémenté avec succès avec toutes les fonctionnalités suivantes :

### Fonctionnalités
- ✅ Recette du jour avec comparaisons (J-7 et semaine dernière)
- ✅ Graphique des 7 derniers jours avec moyenne
- ✅ Alertes factures en retard (> 30 jours)
- ✅ Objectif mensuel avec barre de progression
- ✅ Répartition des paiements (camembert)
- ✅ Top 3 fournisseurs impayés

### Composants créés
- `src/pages/Dashboard.tsx` - Page principale
- `src/components/DashboardCard.tsx` - Carte générique
- `src/components/WeekChart.tsx` - Graphique hebdomadaire
- `src/components/PaymentPieChart.tsx` - Camembert paiements
- `src/components/ProgressBar.tsx` - Barre de progression

### Fichiers modifiés
- `src/App.tsx` - Route Dashboard ajoutée (page d'accueil)
- `src/components/TabBar.tsx` - Onglet Dashboard en 1ère position
- `src/types/index.ts` - Types pour le Dashboard

---

## 🗄️ IMPORTANT : Exécuter le script SQL

**Avant d'utiliser le Dashboard, vous DEVEZ exécuter le script SQL suivant dans Supabase :**

### Étapes :

1. Ouvrez votre projet Supabase : https://supabase.com/dashboard
2. Allez dans **SQL Editor**
3. Créez une nouvelle requête
4. Copiez le contenu du fichier `sql/create-dashboard-views.sql`
5. Exécutez le script
6. Rafraîchissez votre application

### Script SQL à exécuter

Le script crée 4 vues SQL optimisées :
- `v_dashboard_stats` - Statistiques globales
- `v_dashboard_week` - Encaissements des 7 derniers jours
- `v_dashboard_factures_retard` - Factures impayées > 30j
- `v_dashboard_top_fournisseurs_impayes` - Top 3 fournisseurs

---

## 🎨 Personnalisation

### Modifier l'objectif mensuel

Dans `src/pages/Dashboard.tsx` ligne 18 :

```typescript
const OBJECTIF_MENSUEL = 50000; // Modifiez cette valeur
```

### Changer les couleurs

Dans les fichiers CSS :
- `src/pages/Dashboard.css` - Styles généraux
- `src/components/DashboardCard.css` - Cartes
- `src/components/ProgressBar.css` - Barre de progression

---

## 📱 Accès au Dashboard

Une fois le script SQL exécuté :

1. Connectez-vous à l'application
2. Le Dashboard apparaît directement (page d'accueil)
3. Naviguez entre les onglets via la TabBar

---

## 🐛 Dépannage

### "Impossible de charger les données"

→ Vérifiez que le script SQL a bien été exécuté dans Supabase

### "Aucune donnée disponible"

→ Ajoutez des encaissements et factures pour voir les graphiques

### Graphiques vides

→ Les graphiques nécessitent au moins 1 jour d'encaissements

---

## 📊 Prochaines améliorations possibles

- Paramétrage de l'objectif mensuel via interface
- Export PDF du dashboard
- Notifications push pour alertes
- Refresh automatique toutes les 5 minutes
- Graphiques personnalisables

---

**Implémenté avec ❤️ par Claude Code**
