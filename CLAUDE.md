# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Vue d'ensemble du projet

**Compta Boucherie** - Application web mobile uniquement pour la gestion comptable d'une boucherie. L'application est conçue exclusivement pour une utilisation sur smartphone avec une interface tactile simple.

### Nom & Image de marque
- Nom de l'app : "Compta Boucherie" (ou proposer des alternatives)
- Icône : Tons rouge/bordeaux avec symbole caisse/comptabilité
- Thème de couleurs : Couleurs boucherie (rouge/bordeaux) + couleurs comptabilité (vert ou bleu)
- Design : Sobre, lisible, optimisé pour écrans de téléphone

## Architecture principale

L'application est structurée autour de 3 onglets principaux :

### 1. Encaissements - ONGLET PRIORITAIRE
- Chaque ligne = UNE journée d'encaissement
- La date est AUTOMATIQUE (jour courant) - l'utilisateur ne choisit JAMAIS la date ni le mois
- L'utilisateur saisit 4 montants par jour :
  - Espèce
  - CB (Carte Bancaire)
  - CH/VR (Chèque/Virement)
  - TR (Tickets Restaurant)
- Total du jour calculé automatiquement : Espèce + CB + CH/VR + TR
- Affichage en bas d'écran :
  - Total du jour
  - Total de la semaine du jour
  - Total du mois courant
- Mécanisme d'archivage mensuel :
  - L'utilisateur peut archiver le mois courant (bouton "Archiver le mois")
  - Les données archivées restent consultables dans l'onglet Historique
- Interface type tableau Excel optimisé mobile (lignes espacées, saisie facile au doigt)

### 2. Factures - ONGLET SECONDAIRE
- Chaque ligne = une facture fournisseur
- Champs :
  - Date de facture
  - Fournisseur
  - Échéance
  - Description
  - Montant
  - Mode de règlement
  - Solde restant
- Le mois de classement est AUTOMATIQUE selon la date de facture
- Données aussi visibles dans l'onglet Historique

### 3. Historique - ONGLET ARCHIVES
- Consultation des données par mois :
  - Encaissements du mois sélectionné
  - Factures du mois sélectionné
- Affichage des totaux mensuels :
  - Total encaissements du mois
  - Total factures du mois
  - Solde (encaissements - factures)
- Affichage des mois archivés via l'onglet Encaissements

## Contraintes essentielles

### Design mobile-first
- Navigation : Onglets/boutons simples en bas de l'écran
- Champs de saisie : Gros et faciles à utiliser au doigt
- Interface tactile optimisée partout

### Gestion automatique des dates/mois
- L'utilisateur ne sélectionne JAMAIS la date ou le mois pour les encaissements
- Tout est basé sur le jour courant
- Le mois est déterminé automatiquement

### Périmètre actuel (À NE PAS développer maintenant)
- Pas d'authentification
- Pas d'export/impression (PDF, Excel) - mais laisser la structure prête pour l'ajouter plus tard
- Pas de gestion multi-utilisateur

## Lignes directrices de développement

### Gestion des dates
- Toute la logique de date doit utiliser la date système courante pour les encaissements
- La classification par mois est automatique pour les encaissements ET les factures
- Les calculs de totaux hebdomadaires doivent tenir compte du début de semaine (dimanche/lundi)

### Archivage des données
- Les données archivées doivent rester accessibles
- L'archivage est basé sur le mois
- Les données archivées sont en lecture seule dans la vue Historique

### Priorités UX mobile
- Grandes zones tactiles (minimum 44x44px)
- Retour visuel clair pour toutes les interactions
- Navigation simplifiée (maximum 3 onglets principaux)
- Optimisé pour orientation portrait du téléphone
- Montants bien visibles et lisibles
- Pas de scroll horizontal dans les tableaux

### Scripts SQL - Règles de transaction

**IMPORTANT** : Tous les scripts SQL doivent être encapsulés dans une transaction pour garantir l'intégrité des données.

**Structure obligatoire :**
```sql
-- Début de la transaction
BEGIN;

-- Vos requêtes SQL ici
CREATE TABLE ...
CREATE VIEW ...
ALTER TABLE ...

-- Fin de la transaction - Commit si tout s'est bien passé
COMMIT;
```

**Avantages :**
- En cas d'erreur, rollback automatique (aucune modification appliquée)
- En cas de succès, commit automatique (toutes les modifications appliquées)
- Garantit la cohérence des données
- Facilite le débogage

**Pour l'exécution des scripts SQL et autres commandes utiles, consultez** : `CLAUDE_REFERENCE.md`
