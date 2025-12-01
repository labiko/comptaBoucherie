-- Script pour supprimer tout l'historique des envois
-- Date : 2025-01-30

-- Compter le nombre d'envois avant suppression
SELECT COUNT(*) as nombre_envois_avant_suppression
FROM envois_comptabilite;

-- Supprimer tous les envois
DELETE FROM envois_comptabilite;

-- Vérifier que tout a été supprimé
SELECT COUNT(*) as nombre_envois_apres_suppression
FROM envois_comptabilite;

-- Message de confirmation
SELECT '✅ Tous les envois ont été supprimés' as message;
