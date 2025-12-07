-- Script de nettoyage des données pour mise en production
-- Date : 2025-12-06
-- Objectif : Supprimer uniquement les données d'encaissements, factures et fournisseurs
--           pour permettre à la boucherie de saisir ses propres données

-- IMPORTANT : Ce script préserve :
-- ✅ Les utilisateurs (table users)
-- ✅ Les boucheries (table boucheries)
-- ✅ Les configurations SMTP
-- ✅ Toutes les autres données système

-- ❌ Ce script supprime :
-- - Tous les encaissements
-- - Toutes les factures
-- - Tous les fournisseurs
-- - Toute la traçabilité associée
-- - Tout l'historique des envois comptables

-- ⚠️  ATTENTION : Cette opération est IRRÉVERSIBLE !
-- Faites un backup de la base avant d'exécuter ce script si nécessaire.

-- Début de la transaction
BEGIN;

-- 1. Supprimer l'historique des envois comptables
DELETE FROM envois_comptabilite;

-- 2. Supprimer toutes les factures
DELETE FROM factures;

-- 3. Supprimer tous les encaissements
DELETE FROM encaissements;

-- 4. Supprimer tous les fournisseurs
DELETE FROM fournisseurs;

-- 5. Supprimer toute la traçabilité (en dernier pour supprimer aussi les traces des suppressions ci-dessus)
DELETE FROM tracabilite;

-- 6. Vérification finale - Afficher le compte des enregistrements restants
SELECT
  'Vérification après nettoyage' as info,
  (SELECT COUNT(*) FROM encaissements) as nb_encaissements,
  (SELECT COUNT(*) FROM factures) as nb_factures,
  (SELECT COUNT(*) FROM fournisseurs) as nb_fournisseurs,
  (SELECT COUNT(*) FROM tracabilite) as nb_tracabilite,
  (SELECT COUNT(*) FROM envois_comptabilite) as nb_envois,
  (SELECT COUNT(*) FROM users) as nb_users_preserves,
  (SELECT COUNT(*) FROM boucheries) as nb_boucheries_preservees;

-- Afficher un message de confirmation
SELECT
  '✅ Données nettoyées avec succès !' as message,
  'La boucherie peut maintenant saisir ses propres données' as info;

-- Fin de la transaction - Commit si tout s'est bien passé
COMMIT;

-- Note : Si une erreur survient, toutes les modifications seront annulées automatiquement (ROLLBACK)
