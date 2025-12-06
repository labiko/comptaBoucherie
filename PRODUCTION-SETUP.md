# Guide de mise en production - Compta Boucherie

## 📋 Préparation pour la production

Ce guide explique comment nettoyer les données de test et préparer l'application pour que la boucherie puisse saisir ses propres données.

---

## ⚠️ IMPORTANT : Données à supprimer

### ❌ Ce qui sera supprimé :
- **Tous les encaissements** (données de test)
- **Toutes les factures** (données de test)
- **Tous les fournisseurs** (données de test)
- **Toute la traçabilité** associée
- **Tout l'historique des envois** comptables

### ✅ Ce qui sera préservé :
- **Utilisateurs** et leurs identifiants
- **Boucheries** et leurs informations
- **Configurations SMTP** (emails, mots de passe)
- **Paramètres système**

---

## 🔍 Étape 1 : Vérification avant nettoyage

Avant de supprimer quoi que ce soit, exécutez le script de vérification pour voir l'état actuel de la base.

### Via Supabase Dashboard

1. Connectez-vous à [Supabase Dashboard](https://app.supabase.com/)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Créez une nouvelle requête
5. Copiez le contenu du fichier `sql/verify-before-clean.sql`
6. Cliquez sur **Run**

### Via CLI Supabase

```bash
npx supabase db execute --file sql/verify-before-clean.sql
```

### Ce que vous verrez :

Le script affichera :
- 📊 Nombre d'encaissements, factures, fournisseurs
- 📈 Détail par boucherie
- 👥 Liste des utilisateurs (qui seront préservés)
- 📧 Configurations SMTP (qui seront préservées)

**Vérifiez attentivement ces informations avant de continuer !**

---

## 🗑️ Étape 2 : Nettoyage des données

Une fois que vous avez vérifié l'état actuel et que vous êtes sûr de vouloir supprimer les données de test, exécutez le script de nettoyage.

### Via Supabase Dashboard

1. Connectez-vous à [Supabase Dashboard](https://app.supabase.com/)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Créez une nouvelle requête
5. Copiez le contenu du fichier `sql/clean-production-data.sql`
6. Cliquez sur **Run**

### Via CLI Supabase

```bash
npx supabase db execute --file sql/clean-production-data.sql
```

### Ce qui se passe :

Le script va :
1. Supprimer la traçabilité liée aux encaissements/factures
2. Supprimer l'historique des envois comptables
3. Supprimer toutes les factures
4. Supprimer tous les encaissements
5. Supprimer tous les fournisseurs
6. Afficher un résumé de vérification

**Le tout dans une transaction** : si une erreur survient, rien n'est supprimé (rollback automatique).

---

## ✅ Étape 3 : Vérification après nettoyage

Après l'exécution du script, vous devriez voir :

```
✅ Données nettoyées avec succès !
La boucherie peut maintenant saisir ses propres données

Vérification après nettoyage:
- nb_encaissements: 0
- nb_factures: 0
- nb_fournisseurs: 0
- nb_tracabilite: 0
- nb_envois: 0
- nb_users_preserves: [nombre actuel]
- nb_boucheries_preservees: [nombre actuel]
```

---

## 🚀 Étape 4 : Test de l'application

Après le nettoyage, testez l'application :

### 1. Connexion
- ✅ Les utilisateurs peuvent toujours se connecter avec leurs identifiants

### 2. Onglet Encaissements
- ✅ L'onglet s'affiche correctement
- ✅ Aucun encaissement n'est affiché
- ✅ Le formulaire de création fonctionne
- ✅ Créez un encaissement de test

### 3. Onglet Factures
- ✅ L'onglet s'affiche correctement
- ✅ Aucune facture n'est affichée
- ✅ Le formulaire de création s'affiche
- ⚠️ **La liste des fournisseurs est vide** (normal)
- ✅ Créez d'abord un fournisseur dans Administration

### 4. Onglet Administration
- ✅ L'onglet Fournisseurs est vide
- ✅ Créez un ou plusieurs fournisseurs
- ✅ Vérifiez que la configuration SMTP est toujours présente
- ✅ Les onglets Historique et Export sont vides (normal)

---

## 📝 Checklist finale avant production

- [ ] ✅ Script de vérification exécuté et lu attentivement
- [ ] ✅ Backup de la base (optionnel mais recommandé)
- [ ] ✅ Script de nettoyage exécuté avec succès
- [ ] ✅ Connexion testée
- [ ] ✅ Création d'un encaissement de test réussie
- [ ] ✅ Création d'un fournisseur de test réussie
- [ ] ✅ Création d'une facture de test réussie
- [ ] ✅ Configuration SMTP vérifiée
- [ ] ✅ Application PWA installée sur mobile
- [ ] ✅ Test de l'application mobile complet

---

## 🎯 Prochaines étapes pour la boucherie

1. **Créer les fournisseurs**
   - Aller dans Administration → Fournisseurs
   - Créer tous les fournisseurs habituels

2. **Saisir les encaissements**
   - Aller dans Encaissements
   - Saisir les encaissements journaliers

3. **Saisir les factures**
   - Aller dans Factures
   - Créer les factures avec les fournisseurs

4. **Consulter l'historique**
   - Aller dans Administration → Historique
   - Voir les données par mois

---

## 🔧 En cas de problème

### Erreur lors du nettoyage

Si le script échoue :
- Vérifiez les logs d'erreur dans Supabase
- Aucune donnée n'a été supprimée (transaction annulée)
- Contactez le support technique

### Données manquantes après nettoyage

Si des données importantes ont été supprimées par erreur :
- Restaurez le backup (si vous en avez fait un)
- Ou contactez le support Supabase pour une restauration

### Application ne fonctionne plus

Si l'application ne se charge plus :
- Vérifiez que les utilisateurs et boucheries sont toujours présents
- Vérifiez la console du navigateur (F12) pour les erreurs
- Vérifiez que le build a été déployé correctement

---

## 📞 Support

Pour toute question ou problème :
1. Vérifiez les logs dans Supabase Dashboard
2. Consultez la documentation dans `PWA-GUIDE.md`
3. Contactez l'équipe de développement

---

## 📦 Fichiers SQL de production

| Fichier | Description | Usage |
|---------|-------------|-------|
| `verify-before-clean.sql` | Vérification avant nettoyage | Exécuter EN PREMIER |
| `clean-production-data.sql` | Nettoyage des données | Exécuter APRÈS vérification |

---

**Version** : 1.5.1
**Date** : 06/12/2025
**Auteur** : Claude Code

⚠️ **ATTENTION** : Ces opérations sont irréversibles. Faites un backup si nécessaire avant d'exécuter les scripts de nettoyage.
