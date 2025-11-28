-- Script d'insertion de données de test pour novembre 2024
-- À exécuter après le script supabase-schema.sql

-- Récupérer l'ID de l'utilisateur admin
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id FROM users WHERE login = 'admin';

  -- Insertion d'encaissements pour novembre 2024
  -- Du 1er novembre au 10 novembre (10 jours)

  INSERT INTO encaissements (date, espece, cb, ch_vr, tr, user_id) VALUES
  -- 1er novembre 2024 (vendredi)
  ('2024-11-01', 450.50, 1250.75, 320.00, 85.50, admin_user_id),

  -- 2 novembre 2024 (samedi) - weekend, plus de ventes
  ('2024-11-02', 680.00, 1850.25, 450.00, 125.00, admin_user_id),

  -- 4 novembre 2024 (lundi)
  ('2024-11-04', 520.75, 1420.50, 280.00, 95.25, admin_user_id),

  -- 5 novembre 2024 (mardi)
  ('2024-11-05', 390.25, 1180.00, 310.50, 78.00, admin_user_id),

  -- 6 novembre 2024 (mercredi)
  ('2024-11-06', 475.00, 1320.75, 295.00, 102.50, admin_user_id),

  -- 7 novembre 2024 (jeudi)
  ('2024-11-07', 510.50, 1450.25, 340.00, 88.75, admin_user_id),

  -- 8 novembre 2024 (vendredi)
  ('2024-11-08', 595.00, 1680.50, 380.00, 115.00, admin_user_id),

  -- 9 novembre 2024 (samedi) - weekend
  ('2024-11-09', 720.25, 1920.00, 475.50, 135.00, admin_user_id),

  -- 11 novembre 2024 (lundi)
  ('2024-11-11', 485.00, 1385.75, 325.00, 92.50, admin_user_id),

  -- 12 novembre 2024 (mardi)
  ('2024-11-12', 410.50, 1240.25, 290.00, 85.00, admin_user_id);

  -- Insertion de quelques factures pour novembre 2024
  INSERT INTO factures (date_facture, fournisseur, echeance, description, montant, mode_reglement, solde_restant, user_id) VALUES
  -- Facture fournisseur viande
  ('2024-11-01', 'Abattoir Régional', '2024-11-30', 'Achat viande bovine', 2500.00, 'Virement', 2500.00, admin_user_id),

  -- Facture fournisseur volaille
  ('2024-11-05', 'Volailles du Terroir', '2024-12-05', 'Achat poulets et dindes', 850.00, 'Chèque', 850.00, admin_user_id),

  -- Facture électricité
  ('2024-11-08', 'EDF', '2024-11-25', 'Facture électricité octobre', 320.50, 'Prélèvement', 320.50, admin_user_id),

  -- Facture emballages
  ('2024-11-10', 'Emballages Pro', '2024-12-10', 'Barquettes et films alimentaires', 450.00, 'Virement', 450.00, admin_user_id),

  -- Facture entretien
  ('2024-11-12', 'Maintenance Frigo', '2024-11-30', 'Entretien chambre froide', 680.00, 'Chèque', 680.00, admin_user_id);

  RAISE NOTICE 'Données de test insérées avec succès pour l''utilisateur admin';
END $$;

-- Afficher un résumé des données insérées
SELECT
  'Encaissements novembre 2024' as type,
  COUNT(*) as nombre,
  SUM(total) as total_montant
FROM encaissements
WHERE EXTRACT(YEAR FROM date) = 2024
  AND EXTRACT(MONTH FROM date) = 11

UNION ALL

SELECT
  'Factures novembre 2024' as type,
  COUNT(*) as nombre,
  SUM(montant) as total_montant
FROM factures
WHERE EXTRACT(YEAR FROM date_facture) = 2024
  AND EXTRACT(MONTH FROM date_facture) = 11;
