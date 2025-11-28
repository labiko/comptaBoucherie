-- =====================================================
-- Génération de données de test pour l'année 2025
-- 10 encaissements et 10 factures répartis sur l'année
-- =====================================================

-- Début de la transaction
BEGIN;

-- Variables pour stocker les IDs (à adapter selon votre base)
-- Récupérer l'ID de la boucherie et de l'utilisateur
DO $$
DECLARE
  v_boucherie_id UUID;
  v_user_id UUID;
  v_user_nom TEXT;
BEGIN
  -- Récupérer la première boucherie active
  SELECT id INTO v_boucherie_id FROM boucheries WHERE actif = true LIMIT 1;

  -- Récupérer le premier utilisateur de cette boucherie
  SELECT id, nom INTO v_user_id, v_user_nom FROM users WHERE boucherie_id = v_boucherie_id LIMIT 1;

  -- Vérifier que les données existent
  IF v_boucherie_id IS NULL OR v_user_id IS NULL THEN
    RAISE EXCEPTION 'Aucune boucherie ou utilisateur trouvé';
  END IF;

  RAISE NOTICE 'Boucherie ID: %, User ID: %, User: %', v_boucherie_id, v_user_id, v_user_nom;

  -- =====================================================
  -- ENCAISSEMENTS - 10 entrées réparties sur 2025
  -- =====================================================

  -- Janvier 2025
  INSERT INTO encaissements (boucherie_id, date, espece, cb, ch_vr, tr, total, user_id, updated_by)
  VALUES (
    v_boucherie_id, '2025-01-15', 450.00, 1200.50, 320.00, 85.00, 2055.50, v_user_id, v_user_id
  );

  -- Février 2025
  INSERT INTO encaissements (boucherie_id, date, espece, cb, ch_vr, tr, total, user_id, updated_by)
  VALUES (
    v_boucherie_id, '2025-02-10', 520.00, 1350.75, 280.00, 92.50, 2243.25, v_user_id, v_user_id
  );

  -- Mars 2025
  INSERT INTO encaissements (boucherie_id, date, espece, cb, ch_vr, tr, total, user_id, updated_by)
  VALUES (
    v_boucherie_id, '2025-03-20', 380.00, 1450.00, 310.00, 78.00, 2218.00, v_user_id, v_user_id
  );

  -- Avril 2025
  INSERT INTO encaissements (boucherie_id, date, espece, cb, ch_vr, tr, total, user_id, updated_by)
  VALUES (
    v_boucherie_id, '2025-04-12', 490.00, 1280.25, 340.00, 88.50, 2198.75, v_user_id, v_user_id
  );

  -- Mai 2025
  INSERT INTO encaissements (boucherie_id, date, espece, cb, ch_vr, tr, total, user_id, updated_by)
  VALUES (
    v_boucherie_id, '2025-05-18', 560.00, 1520.50, 295.00, 95.00, 2470.50, v_user_id, v_user_id
  );

  -- Juin 2025
  INSERT INTO encaissements (boucherie_id, date, espece, cb, ch_vr, tr, total, user_id, updated_by)
  VALUES (
    v_boucherie_id, '2025-06-25', 410.00, 1390.00, 330.00, 82.00, 2212.00, v_user_id, v_user_id
  );

  -- Juillet 2025
  INSERT INTO encaissements (boucherie_id, date, espece, cb, ch_vr, tr, total, user_id, updated_by)
  VALUES (
    v_boucherie_id, '2025-07-08', 480.00, 1420.75, 285.00, 90.00, 2275.75, v_user_id, v_user_id
  );

  -- Août 2025
  INSERT INTO encaissements (boucherie_id, date, espece, cb, ch_vr, tr, total, user_id, updated_by)
  VALUES (
    v_boucherie_id, '2025-08-14', 530.00, 1380.50, 315.00, 87.50, 2313.00, v_user_id, v_user_id
  );

  -- Septembre 2025
  INSERT INTO encaissements (boucherie_id, date, espece, cb, ch_vr, tr, total, user_id, updated_by)
  VALUES (
    v_boucherie_id, '2025-09-22', 470.00, 1460.00, 300.00, 91.00, 2321.00, v_user_id, v_user_id
  );

  -- Octobre 2025
  INSERT INTO encaissements (boucherie_id, date, espece, cb, ch_vr, tr, total, user_id, updated_by)
  VALUES (
    v_boucherie_id, '2025-10-30', 500.00, 1500.25, 325.00, 93.00, 2418.25, v_user_id, v_user_id
  );

  -- =====================================================
  -- FACTURES - 10 entrées réparties sur 2025
  -- =====================================================

  -- Janvier 2025
  INSERT INTO factures (boucherie_id, date_facture, fournisseur, echeance, description, montant, solde_restant, regle, mode_reglement, user_id, updated_by)
  VALUES (
    v_boucherie_id, '2025-01-10', 'Metro Cash & Carry', '2025-02-10', 'Viande de bœuf - Approvisionnement janvier', 3500.00, 0.00, true, 'Virement', v_user_id, v_user_id
  );

  -- Février 2025
  INSERT INTO factures (boucherie_id, date_facture, fournisseur, echeance, description, montant, solde_restant, regle, mode_reglement, user_id, updated_by)
  VALUES (
    v_boucherie_id, '2025-02-05', 'Abattoir Régional', '2025-03-05', 'Viande de porc et volaille', 2800.00, 2800.00, false, 'Chèque', v_user_id, v_user_id
  );

  -- Mars 2025
  INSERT INTO factures (boucherie_id, date_facture, fournisseur, echeance, description, montant, solde_restant, regle, mode_reglement, user_id, updated_by)
  VALUES (
    v_boucherie_id, '2025-03-12', 'Rungis Marée', '2025-04-12', 'Produits de la mer - Mars', 1200.00, 600.00, false, 'Virement', v_user_id, v_user_id
  );

  -- Avril 2025
  INSERT INTO factures (boucherie_id, date_facture, fournisseur, echeance, description, montant, solde_restant, regle, mode_reglement, user_id, updated_by)
  VALUES (
    v_boucherie_id, '2025-04-08', 'EDF', '2025-05-08', 'Électricité - Trimestre 1', 420.00, 0.00, true, 'Prélèvement', v_user_id, v_user_id
  );

  -- Mai 2025
  INSERT INTO factures (boucherie_id, date_facture, fournisseur, echeance, description, montant, solde_restant, regle, mode_reglement, user_id, updated_by)
  VALUES (
    v_boucherie_id, '2025-05-15', 'Metro Cash & Carry', '2025-06-15', 'Viande de bœuf - Approvisionnement mai', 4200.00, 4200.00, false, 'Virement', v_user_id, v_user_id
  );

  -- Juin 2025
  INSERT INTO factures (boucherie_id, date_facture, fournisseur, echeance, description, montant, solde_restant, regle, mode_reglement, user_id, updated_by)
  VALUES (
    v_boucherie_id, '2025-06-20', 'Veolia Eau', '2025-07-20', 'Eau - Semestre 1', 180.00, 0.00, true, 'Prélèvement', v_user_id, v_user_id
  );

  -- Juillet 2025
  INSERT INTO factures (boucherie_id, date_facture, fournisseur, echeance, description, montant, solde_restant, regle, mode_reglement, user_id, updated_by)
  VALUES (
    v_boucherie_id, '2025-07-03', 'Abattoir Régional', '2025-08-03', 'Viande d''agneau - Juillet', 3100.00, 1550.00, false, 'Chèque', v_user_id, v_user_id
  );

  -- Août 2025
  INSERT INTO factures (boucherie_id, date_facture, fournisseur, echeance, description, montant, solde_restant, regle, mode_reglement, user_id, updated_by)
  VALUES (
    v_boucherie_id, '2025-08-10', 'Rungis Marée', '2025-09-10', 'Produits de la mer - Août', 1450.00, 0.00, true, 'Virement', v_user_id, v_user_id
  );

  -- Septembre 2025
  INSERT INTO factures (boucherie_id, date_facture, fournisseur, echeance, description, montant, solde_restant, regle, mode_reglement, user_id, updated_by)
  VALUES (
    v_boucherie_id, '2025-09-18', 'Metro Cash & Carry', '2025-10-18', 'Approvisionnement mixte septembre', 3800.00, 3800.00, false, 'Virement', v_user_id, v_user_id
  );

  -- Octobre 2025
  INSERT INTO factures (boucherie_id, date_facture, fournisseur, echeance, description, montant, solde_restant, regle, mode_reglement, user_id, updated_by)
  VALUES (
    v_boucherie_id, '2025-10-25', 'EDF', '2025-11-25', 'Électricité - Trimestre 3', 385.00, 385.00, false, 'Prélèvement', v_user_id, v_user_id
  );

  RAISE NOTICE '✅ 10 encaissements et 10 factures créés avec succès pour 2025';
END $$;

-- Message de confirmation
SELECT
  '✅ Données de test 2025 générées avec succès !' as message,
  (SELECT COUNT(*) FROM encaissements WHERE EXTRACT(YEAR FROM date) = 2025) as encaissements_2025,
  (SELECT COUNT(*) FROM factures WHERE EXTRACT(YEAR FROM date_facture) = 2025) as factures_2025;

-- Fin de la transaction - Commit si tout s'est bien passé
COMMIT;
