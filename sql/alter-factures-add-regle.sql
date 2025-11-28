-- Ajouter le champ "regle" (booléen) à la table factures
ALTER TABLE factures
ADD COLUMN IF NOT EXISTS regle BOOLEAN DEFAULT false;

-- Mettre à jour les factures existantes : réglé si solde_restant = 0
UPDATE factures
SET regle = (solde_restant = 0)
WHERE regle IS NULL;
