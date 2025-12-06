-- Script de génération de données de test
-- Génère des encaissements et factures du 01/01/2025 au 06/12/2025
-- IMPORTANT: Adapter le boucherie_id et user_id selon votre base

BEGIN;

-- Variables à configurer
DO $$
DECLARE
    v_boucherie_id UUID := 'YOUR_BOUCHERIE_ID_HERE'; -- À remplacer par un vrai ID
    v_user_id UUID := 'YOUR_USER_ID_HERE'; -- À remplacer par un vrai ID
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
BEGIN
    -- Boucle sur chaque jour de la période
    v_current_date := v_date_debut;

    WHILE v_current_date <= v_date_fin LOOP
        -- ========================================
        -- GÉNÉRATION DES ENCAISSEMENTS (1 par jour)
        -- ========================================

        -- Générer des montants aléatoires réalistes
        v_espece := ROUND((RANDOM() * 500 + 100)::NUMERIC, 2); -- Entre 100€ et 600€
        v_cb := ROUND((RANDOM() * 800 + 200)::NUMERIC, 2); -- Entre 200€ et 1000€
        v_ch_vr := ROUND((RANDOM() * 300 + 50)::NUMERIC, 2); -- Entre 50€ et 350€
        v_tr := ROUND((RANDOM() * 200 + 50)::NUMERIC, 2); -- Entre 50€ et 250€
        v_total := v_espece + v_cb + v_ch_vr + v_tr;

        INSERT INTO encaissements (
            id,
            boucherie_id,
            date,
            espece,
            cb,
            ch_vr,
            tr,
            total,
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
            v_total,
            v_user_id,
            v_user_id,
            v_current_date + TIME '08:00:00',
            v_current_date + TIME '08:00:00'
        );

        -- ========================================
        -- GÉNÉRATION DES FACTURES (2 à 5 par jour)
        -- ========================================

        v_facture_count := FLOOR(RANDOM() * 4 + 2)::INTEGER; -- Entre 2 et 5 factures par jour

        FOR i IN 1..v_facture_count LOOP
            -- Sélectionner aléatoirement fournisseur, description, mode de règlement
            v_fournisseur := v_fournisseurs[FLOOR(RANDOM() * array_length(v_fournisseurs, 1) + 1)::INTEGER];
            v_description := v_descriptions[FLOOR(RANDOM() * array_length(v_descriptions, 1) + 1)::INTEGER];
            v_mode_reglement := v_modes_reglement[FLOOR(RANDOM() * array_length(v_modes_reglement, 1) + 1)::INTEGER];

            -- Générer un montant réaliste
            v_montant := ROUND((RANDOM() * 2000 + 100)::NUMERIC, 2); -- Entre 100€ et 2100€

            -- 70% des factures sont réglées
            v_regle := (RANDOM() < 0.7);

            -- Si réglée, solde = 0, sinon solde partiel ou total
            IF v_regle THEN
                v_solde_restant := 0;
            ELSE
                -- Solde partiel (30% à 100% du montant)
                v_solde_restant := ROUND((RANDOM() * 0.7 + 0.3) * v_montant, 2);
            END IF;

            -- Échéance = 1 mois après la date de facture
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
                NULL, -- Pas de fournisseur_id pour les données de test
                v_echeance,
                v_description || ' - ' || TO_CHAR(v_current_date, 'DD/MM/YYYY'),
                v_montant,
                v_mode_reglement,
                v_solde_restant,
                v_regle,
                NULL, -- Pas de pièce jointe pour alléger les tests
                NULL,
                v_user_id,
                v_user_id,
                v_current_date + TIME '09:00:00' + (i || ' hours')::INTERVAL,
                v_current_date + TIME '09:00:00' + (i || ' hours')::INTERVAL
            );
        END LOOP;

        -- Passer au jour suivant
        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;

    RAISE NOTICE 'Génération terminée !';
    RAISE NOTICE 'Période: % au %', v_date_debut, v_date_fin;
    RAISE NOTICE 'Nombre de jours: %', v_date_fin - v_date_debut + 1;
    RAISE NOTICE 'Encaissements créés: %', v_date_fin - v_date_debut + 1;
    RAISE NOTICE 'Factures créées (estimation): % à %', (v_date_fin - v_date_debut + 1) * 2, (v_date_fin - v_date_debut + 1) * 5;
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
