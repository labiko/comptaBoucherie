-- =====================================================
-- Vues SQL pour le Dashboard
-- =====================================================

-- Vue : Statistiques globales du dashboard
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT
  b.id as boucherie_id,
  b.nom as boucherie_nom,

  -- Recette du jour
  COALESCE((
    SELECT SUM(total)
    FROM encaissements
    WHERE date = CURRENT_DATE
    AND boucherie_id = b.id
  ), 0) as recette_jour,

  -- Recette J-7
  COALESCE((
    SELECT SUM(total)
    FROM encaissements
    WHERE date = CURRENT_DATE - INTERVAL '7 days'
    AND boucherie_id = b.id
  ), 0) as recette_j7,

  -- Recette même jour semaine dernière
  COALESCE((
    SELECT SUM(total)
    FROM encaissements
    WHERE EXTRACT(DOW FROM date) = EXTRACT(DOW FROM CURRENT_DATE)
    AND date = CURRENT_DATE - INTERVAL '7 days'
    AND boucherie_id = b.id
  ), 0) as recette_semaine_derniere,

  -- Total mois courant
  COALESCE((
    SELECT SUM(total)
    FROM encaissements
    WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)
    AND boucherie_id = b.id
  ), 0) as total_mois,

  -- Répartition paiements mois courant - Espèce
  COALESCE((
    SELECT SUM(espece)
    FROM encaissements
    WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)
    AND boucherie_id = b.id
  ), 0) as total_espece,

  -- CB
  COALESCE((
    SELECT SUM(cb)
    FROM encaissements
    WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)
    AND boucherie_id = b.id
  ), 0) as total_cb,

  -- Chèque/Virement
  COALESCE((
    SELECT SUM(ch_vr)
    FROM encaissements
    WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)
    AND boucherie_id = b.id
  ), 0) as total_ch_vr,

  -- Tickets Restaurant
  COALESCE((
    SELECT SUM(tr)
    FROM encaissements
    WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)
    AND boucherie_id = b.id
  ), 0) as total_tr,

  -- Nombre factures en retard > 30 jours
  COALESCE((
    SELECT COUNT(*)
    FROM factures
    WHERE regle = false
    AND echeance < CURRENT_DATE - INTERVAL '30 days'
    AND boucherie_id = b.id
  ), 0)::INTEGER as nb_factures_retard,

  -- Montant total factures en retard
  COALESCE((
    SELECT SUM(solde_restant)
    FROM factures
    WHERE regle = false
    AND echeance < CURRENT_DATE - INTERVAL '30 days'
    AND boucherie_id = b.id
  ), 0) as montant_factures_retard

FROM boucheries b
WHERE b.actif = true;


-- Vue : Encaissements des 7 derniers jours
CREATE OR REPLACE VIEW v_dashboard_week AS
SELECT
  e.boucherie_id,
  e.date,
  TO_CHAR(e.date, 'Dy', 'fr_FR') as jour_court,
  TO_CHAR(e.date, 'DD/MM') as date_format,
  e.total
FROM encaissements e
WHERE e.date >= CURRENT_DATE - INTERVAL '6 days'
  AND e.date <= CURRENT_DATE
ORDER BY e.date ASC;


-- Vue : Factures impayées avec retard
CREATE OR REPLACE VIEW v_dashboard_factures_retard AS
SELECT
  f.id,
  f.boucherie_id,
  f.fournisseur,
  f.montant,
  f.solde_restant,
  f.echeance,
  f.description,
  CURRENT_DATE - f.echeance as jours_retard
FROM factures f
WHERE f.regle = false
  AND f.echeance < CURRENT_DATE - INTERVAL '30 days'
ORDER BY f.echeance ASC;


-- Vue : Top fournisseurs impayés
CREATE OR REPLACE VIEW v_dashboard_top_fournisseurs_impayes AS
SELECT
  f.boucherie_id,
  f.fournisseur,
  SUM(f.solde_restant) as montant_total,
  COUNT(*) as nb_factures,
  MIN(f.echeance) as echeance_plus_ancienne
FROM factures f
WHERE f.regle = false
  AND f.solde_restant > 0
GROUP BY f.boucherie_id, f.fournisseur
ORDER BY montant_total DESC
LIMIT 3;


-- Commentaires
COMMENT ON VIEW v_dashboard_stats IS 'Statistiques globales pour le dashboard : recettes, totaux, alertes';
COMMENT ON VIEW v_dashboard_week IS 'Encaissements des 7 derniers jours pour le graphique hebdomadaire';
COMMENT ON VIEW v_dashboard_factures_retard IS 'Liste des factures impayées avec plus de 30 jours de retard';
COMMENT ON VIEW v_dashboard_top_fournisseurs_impayes IS 'Top 3 des fournisseurs avec le plus d''impayés';
