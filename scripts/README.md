# Scripts de génération de données de test

Ce dossier contient des scripts pour générer et nettoyer des données de test pour l'application Compta Boucherie.

## 📋 Objectif

Générer des données de test réalistes pour :
- Tester les performances de l'application avec un grand volume de données
- Vérifier la taille des fichiers Excel générés (300+ lignes)
- Valider l'affichage et la pagination
- Tester l'envoi d'emails avec beaucoup de données

## 📊 Données générées

### Période
Du **1er janvier 2025** au **6 décembre 2025** (341 jours)

### Encaissements
- **1 encaissement par jour** = 341 encaissements
- Montants aléatoires réalistes :
  - Espèce : 100€ - 600€
  - CB : 200€ - 1000€
  - CH/VR : 50€ - 350€
  - TR : 50€ - 250€

### Factures
- **2 à 5 factures par jour** = environ 680 à 1705 factures
- Fournisseurs : Socopa, Sysco, Metro, Transgourmet, Brake France, Promocash
- Descriptions : Viande bovine, Viande porcine, Volaille, Charcuterie, Matériel, Fournitures
- Montants : 100€ - 2100€
- 70% des factures sont réglées
- Échéance : 1 mois après la date de facture

### Total estimé
- **~1000 à 2000 lignes au total** (341 encaissements + 680-1705 factures)

## 🚀 Utilisation

### 1. Générer les données de test

```bash
node scripts/generate-test-data.js
```

Ce script va :
1. Récupérer automatiquement une boucherie et un utilisateur actifs
2. Générer 341 encaissements (1 par jour)
3. Générer ~680-1705 factures (2-5 par jour)
4. Afficher un résumé avec les totaux

**Durée estimée** : 30 secondes à 2 minutes (selon la connexion)

### 2. Nettoyer les données de test

```bash
node scripts/clean-test-data.js
```

Ce script va :
1. Compter les données de test présentes
2. Demander confirmation
3. Supprimer tous les encaissements et factures de la période

**⚠️ ATTENTION** : Cette opération est irréversible !

## 📈 Tests à effectuer après génération

### 1. Performances de l'application
- [ ] Vérifier le temps de chargement de l'onglet Encaissements
- [ ] Vérifier le temps de chargement de l'onglet Factures
- [ ] Tester le scroll et la réactivité
- [ ] Vérifier la mémoire utilisée (DevTools)

### 2. Export Excel
- [ ] Aller dans l'onglet "Envoi Comptabilité"
- [ ] Sélectionner un mois (janvier à décembre 2025)
- [ ] Cliquer sur "Prévisualiser"
- [ ] Vérifier l'affichage des tableaux avec totaux
- [ ] Télécharger les fichiers Excel
- [ ] Ouvrir les fichiers et vérifier :
  - La taille du fichier
  - Le nombre de lignes
  - Les totaux
  - Le formatage

### 3. Envoi d'email
- [ ] Configurer l'email SMTP de la boucherie
- [ ] Configurer l'email du comptable
- [ ] Cliquer sur "Générer et envoyer"
- [ ] Vérifier la réception de l'email
- [ ] Vérifier les 2 pièces jointes
- [ ] Vérifier le tableau récapitulatif dans l'email

### 4. Historique
- [ ] Aller dans l'onglet Historique
- [ ] Sélectionner différents mois
- [ ] Vérifier les totaux mensuels
- [ ] Vérifier l'affichage des cartes

## 📦 Fichiers

- `generate-test-data.js` - Script Node.js pour générer les données
- `generate-test-data.sql` - Script SQL alternatif (nécessite adaptation manuelle des IDs)
- `clean-test-data.js` - Script Node.js pour nettoyer les données
- `README.md` - Ce fichier

## 🔧 Prérequis

- Node.js installé
- Fichier `.env` configuré avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
- Au moins une boucherie active dans la base
- Au moins un utilisateur actif dans cette boucherie

## 💡 Conseils

1. **Générer les données en dehors des heures de production**
2. **Faire un backup avant de générer des données massives**
3. **Utiliser un environnement de test si possible**
4. **Nettoyer les données après les tests**

## 🐛 Résolution de problèmes

### Erreur "Aucune boucherie active trouvée"
➡️ Vérifier qu'il existe au moins une boucherie avec `actif = true` dans la table `boucheries`

### Erreur "Aucun utilisateur actif trouvé"
➡️ Vérifier qu'il existe au moins un utilisateur avec `actif = true` pour la boucherie

### Le script est lent
➡️ C'est normal, il insère beaucoup de données. Attendre la fin de l'exécution.

### Erreur de permission
➡️ Vérifier les Row Level Security (RLS) policies dans Supabase

## 📞 Support

Pour toute question ou problème, consulter la documentation principale du projet.
