-- Script de génération automatique de données de test
-- Récupère automatiquement les IDs et génère les données

BEGIN;

DO $$
DECLARE
    v_boucherie_id UUID;
    v_user_id UUID;
    v_date_debut DATE := '2025-01-01';
    v_date_fin DATE := '2025-12-06';
    v_current_date DATE;
    v_espece NUMERIC;
    v_cb NUMERIC;
    v_ch_vr NUMERIC;
    v_tr NUMERIC;
    v_total NUMERIC;
    v_facture_count INTEGER;
    v_fournisseurs TEXT[] := ARRAY['Socopa', 'Sysco', 'Metro', 'Transgourmet', 'Brake France', 'Promocash'];
    v_descriptions TEXT[] := ARRAY['Viande bovine', 'Viande porcine', 'Volaille', 'Charcuterie', 'Matériel', 'Fournitures'];
    v_modes_reglement TEXT[] := ARRAY['Virement', 'Chèque', 'Prélèvement', 'Espèces'];
    v_fournisseur TEXT;
    v_description TEXT;
    v_mode_reglement TEXT;
    v_montant NUMERIC;
    v_solde_restant NUMERIC;
    v_regle BOOLEAN;
    v_echeance DATE;
    i INTEGER;
    v_enc_count INTEGER := 0;
    v_fact_count INTEGER := 0;
BEGIN
    -- Récupérer une boucherie active
    SELECT id INTO v_boucherie_id
    FROM boucheries
    WHERE actif = true
    LIMIT 1;

    IF v_boucherie_id IS NULL THEN
        RAISE EXCEPTION 'Aucune boucherie active trouvée';
    END IF;

    RAISE NOTICE 'Boucherie sélectionnée: %', v_boucherie_id;

    -- Récupérer un utilisateur actif de cette boucherie
    SELECT id INTO v_user_id
    FROM users
    WHERE boucherie_id = v_boucherie_id
      AND actif = true
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Aucun utilisateur actif trouvé pour cette boucherie';
    END IF;

    RAISE NOTICE 'Utilisateur sélectionné: %', v_user_id;
    RAISE NOTICE 'Début de la génération...';

    -- Boucle sur chaque jour
    v_current_date := v_date_debut;

    WHILE v_current_date <= v_date_fin LOOP
        -- GÉNÉRATION DES ENCAISSEMENTS
        v_espece := ROUND((RANDOM() * 500 + 100)::NUMERIC, 2);
        v_cb := ROUND((RANDOM() * 800 + 200)::NUMERIC, 2);
        v_ch_vr := ROUND((RANDOM() * 300 + 50)::NUMERIC, 2);
        v_tr := ROUND((RANDOM() * 200 + 50)::NUMERIC, 2);
        v_total := v_espece + v_cb + v_ch_vr + v_tr;

        INSERT INTO encaissements (
            id,
            boucherie_id,
            date,
            espece,
            cb,
            ch_vr,
            tr,
            user_id,
            updated_by,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            v_boucherie_id,
            v_current_date,
            v_espece,
            v_cb,
            v_ch_vr,
            v_tr,
            v_user_id,
            v_user_id,
            v_current_date + TIME '08:00:00',
            v_current_date + TIME '08:00:00'
        );

        v_enc_count := v_enc_count + 1;

        -- GÉNÉRATION DES FACTURES (2 à 5 par jour)
        v_facture_count := FLOOR(RANDOM() * 4 + 2)::INTEGER;

        FOR i IN 1..v_facture_count LOOP
            v_fournisseur := v_fournisseurs[FLOOR(RANDOM() * array_length(v_fournisseurs, 1) + 1)::INTEGER];
            v_description := v_descriptions[FLOOR(RANDOM() * array_length(v_descriptions, 1) + 1)::INTEGER];
            v_mode_reglement := v_modes_reglement[FLOOR(RANDOM() * array_length(v_modes_reglement, 1) + 1)::INTEGER];
            v_montant := ROUND((RANDOM() * 2000 + 100)::NUMERIC, 2);
            v_regle := (RANDOM() < 0.7);

            IF v_regle THEN
                v_solde_restant := 0;
            ELSE
                v_solde_restant := ROUND(((RANDOM() * 0.7 + 0.3) * v_montant)::NUMERIC, 2);
            END IF;

            v_echeance := v_current_date + INTERVAL '1 month';

            INSERT INTO factures (
                id,
                boucherie_id,
                date_facture,
                fournisseur,
                fournisseur_id,
                echeance,
                description,
                montant,
                mode_reglement,
                solde_restant,
                regle,
                piece_jointe,
                piece_jointe_updated_at,
                user_id,
                updated_by,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                v_boucherie_id,
                v_current_date,
                v_fournisseur,
                NULL,
                v_echeance,
                v_description || ' - ' || TO_CHAR(v_current_date, 'DD/MM/YYYY'),
                v_montant,
                v_mode_reglement,
                v_solde_restant,
                v_regle,
                NULL,
                NULL,
                v_user_id,
                v_user_id,
                v_current_date + TIME '09:00:00' + (i || ' hours')::INTERVAL,
                v_current_date + TIME '09:00:00' + (i || ' hours')::INTERVAL
            );

            v_fact_count := v_fact_count + 1;
        END LOOP;

        -- Afficher progression tous les 30 jours
        IF v_enc_count % 30 = 0 THEN
            RAISE NOTICE 'Progression: % encaissements, % factures', v_enc_count, v_fact_count;
        END IF;

        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;

    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Génération terminée !';
    RAISE NOTICE 'Période: % au %', v_date_debut, v_date_fin;
    RAISE NOTICE 'Encaissements créés: %', v_enc_count;
    RAISE NOTICE 'Factures créées: %', v_fact_count;
    RAISE NOTICE 'Total lignes: %', v_enc_count + v_fact_count;
    RAISE NOTICE '==============================================';
END $$;

COMMIT;

-- Vérification des données insérées
SELECT
    'Encaissements' AS type,
    COUNT(*) AS nombre,
    MIN(date) AS date_min,
    MAX(date) AS date_max,
    ROUND(SUM(total), 2) AS total_montant
FROM encaissements
WHERE date >= '2025-01-01' AND date <= '2025-12-06'

UNION ALL

SELECT
    'Factures' AS type,
    COUNT(*) AS nombre,
    MIN(date_facture) AS date_min,
    MAX(date_facture) AS date_max,
    ROUND(SUM(montant), 2) AS total_montant
FROM factures
WHERE date_facture >= '2025-01-01' AND date_facture <= '2025-12-06'

ORDER BY type;
