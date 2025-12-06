-- Script de vérification avant nettoyage
-- Date : 2025-12-06
-- Objectif : Afficher un état complet des données avant le nettoyage de production

-- 📊 ÉTAT ACTUEL DE LA BASE DE DONNÉES

-- 1. Données qui SERONT SUPPRIMÉES
SELECT
  '❌ DONNÉES QUI SERONT SUPPRIMÉES' as categorie,
  (SELECT COUNT(*) FROM encaissements) as encaissements,
  (SELECT COUNT(*) FROM factures) as factures,
  (SELECT COUNT(*) FROM fournisseurs) as fournisseurs,
  (SELECT COUNT(*) FROM tracabilite WHERE table_name IN ('encaissements', 'factures')) as tracabilite_associee,
  (SELECT COUNT(*) FROM envois_comptabilite) as historique_envois;

-- 2. Données qui SERONT PRÉSERVÉES
SELECT
  '✅ DONNÉES QUI SERONT PRÉSERVÉES' as categorie,
  (SELECT COUNT(*) FROM users) as utilisateurs,
  (SELECT COUNT(*) FROM boucheries) as boucheries,
  (SELECT COUNT(*) FROM boucheries WHERE smtp_email IS NOT NULL) as boucheries_avec_smtp,
  (SELECT COUNT(*) FROM tracabilite WHERE table_name NOT IN ('encaissements', 'factures')) as autre_tracabilite;

-- 3. Détail des encaissements par boucherie
SELECT
  '📈 ENCAISSEMENTS PAR BOUCHERIE' as info,
  b.nom as boucherie,
  COUNT(e.id) as nombre_encaissements,
  MIN(e.date) as date_min,
  MAX(e.date) as date_max,
  SUM(e.total) as total_encaissements
FROM boucheries b
LEFT JOIN encaissements e ON e.boucherie_id = b.id
GROUP BY b.id, b.nom
ORDER BY b.nom;

-- 4. Détail des factures par boucherie
SELECT
  '📋 FACTURES PAR BOUCHERIE' as info,
  b.nom as boucherie,
  COUNT(f.id) as nombre_factures,
  MIN(f.date_facture) as date_min,
  MAX(f.date_facture) as date_max,
  SUM(f.montant) as total_factures
FROM boucheries b
LEFT JOIN factures f ON f.boucherie_id = b.id
GROUP BY b.id, b.nom
ORDER BY b.nom;

-- 5. Détail des fournisseurs par boucherie
SELECT
  '🏢 FOURNISSEURS PAR BOUCHERIE' as info,
  b.nom as boucherie,
  COUNT(f.id) as nombre_fournisseurs,
  COUNT(CASE WHEN f.actif = true THEN 1 END) as fournisseurs_actifs
FROM boucheries b
LEFT JOIN fournisseurs f ON f.boucherie_id = b.id
GROUP BY b.id, b.nom
ORDER BY b.nom;

-- 6. Utilisateurs et boucheries (PRÉSERVÉS)
SELECT
  '👥 UTILISATEURS (PRÉSERVÉS)' as info,
  u.username,
  u.email,
  b.nom as boucherie,
  u.created_at
FROM users u
LEFT JOIN boucheries b ON b.id = u.boucherie_id
ORDER BY u.username;

-- 7. Configurations SMTP (PRÉSERVÉES)
SELECT
  '📧 CONFIGURATIONS SMTP (PRÉSERVÉES)' as info,
  nom as boucherie,
  smtp_email,
  CASE WHEN smtp_password IS NOT NULL THEN '✅ Configuré' ELSE '❌ Non configuré' END as smtp_status,
  email_comptable,
  envoi_auto_factures
FROM boucheries
ORDER BY nom;

-- ⚠️  RÉSUMÉ
SELECT
  '⚠️  ATTENTION' as message,
  'Vous êtes sur le point de supprimer TOUTES les données ci-dessus' as avertissement,
  'Vérifiez attentivement avant d''exécuter clean-production-data.sql' as action;
