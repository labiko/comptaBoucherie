-- Schéma de base de données Supabase pour Compta Boucherie
-- À exécuter dans l'éditeur SQL de Supabase

-- Extension pour le chiffrement des mots de passe
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table des utilisateurs
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, -- Mot de passe chiffré avec pgcrypto
  nom TEXT NOT NULL,
  prenom TEXT,
  email TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_users_login ON users(login);
CREATE INDEX idx_users_actif ON users(actif);

-- Fonction pour chiffrer le mot de passe
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10)); -- Utilise bcrypt avec 10 rounds
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier le mot de passe
CREATE OR REPLACE FUNCTION verify_password(login_input TEXT, password_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash
  FROM users
  WHERE login = login_input AND actif = true;

  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;

  RETURN stored_hash = crypt(password_input, stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Table des encaissements
CREATE TABLE encaissements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  espece DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cb DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ch_vr DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Chèque/Virement
  tr DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Tickets Restaurant
  total DECIMAL(10, 2) GENERATED ALWAYS AS (espece + cb + ch_vr + tr) STORED,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, user_id) -- Un encaissement par jour et par utilisateur
);

-- Index pour améliorer les performances
CREATE INDEX idx_encaissements_date ON encaissements(date DESC);
CREATE INDEX idx_encaissements_user_id ON encaissements(user_id);
CREATE INDEX idx_encaissements_user_date ON encaissements(user_id, date DESC);

-- Table des factures
CREATE TABLE factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_facture DATE NOT NULL,
  fournisseur TEXT NOT NULL,
  echeance DATE NOT NULL,
  description TEXT,
  montant DECIMAL(10, 2) NOT NULL,
  mode_reglement TEXT NOT NULL,
  solde_restant DECIMAL(10, 2) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_factures_date ON factures(date_facture DESC);
CREATE INDEX idx_factures_fournisseur ON factures(fournisseur);
CREATE INDEX idx_factures_user_id ON factures(user_id);
CREATE INDEX idx_factures_user_date ON factures(user_id, date_facture DESC);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_encaissements_updated_at
  BEFORE UPDATE ON encaissements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_factures_updated_at
  BEFORE UPDATE ON factures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Vue pour les encaissements du mois courant
CREATE OR REPLACE VIEW encaissements_mois_courant AS
SELECT *
FROM encaissements
WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE);

-- Vue pour les factures du mois courant
CREATE OR REPLACE VIEW factures_mois_courant AS
SELECT *
FROM factures
WHERE EXTRACT(YEAR FROM date_facture) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND EXTRACT(MONTH FROM date_facture) = EXTRACT(MONTH FROM CURRENT_DATE);

-- Vue pour les encaissements archivés (mois passés)
CREATE OR REPLACE VIEW encaissements_archives AS
SELECT *
FROM encaissements
WHERE (EXTRACT(YEAR FROM date) < EXTRACT(YEAR FROM CURRENT_DATE))
   OR (EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND EXTRACT(MONTH FROM date) < EXTRACT(MONTH FROM CURRENT_DATE));

-- Vue pour les factures archivées (mois passés)
CREATE OR REPLACE VIEW factures_archives AS
SELECT *
FROM factures
WHERE (EXTRACT(YEAR FROM date_facture) < EXTRACT(YEAR FROM CURRENT_DATE))
   OR (EXTRACT(YEAR FROM date_facture) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND EXTRACT(MONTH FROM date_facture) < EXTRACT(MONTH FROM CURRENT_DATE));

-- Fonction pour obtenir la liste des mois disponibles dans les archives
CREATE OR REPLACE FUNCTION get_mois_archives(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(annee INTEGER, mois INTEGER, nb_encaissements BIGINT, nb_factures BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH mois_encaissements AS (
    SELECT
      EXTRACT(YEAR FROM date)::INTEGER as annee,
      EXTRACT(MONTH FROM date)::INTEGER as mois,
      COUNT(*) as nb
    FROM encaissements
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
      AND ((EXTRACT(YEAR FROM date) < EXTRACT(YEAR FROM CURRENT_DATE))
           OR (EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
               AND EXTRACT(MONTH FROM date) < EXTRACT(MONTH FROM CURRENT_DATE)))
    GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
  ),
  mois_factures AS (
    SELECT
      EXTRACT(YEAR FROM date_facture)::INTEGER as annee,
      EXTRACT(MONTH FROM date_facture)::INTEGER as mois,
      COUNT(*) as nb
    FROM factures
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
      AND ((EXTRACT(YEAR FROM date_facture) < EXTRACT(YEAR FROM CURRENT_DATE))
           OR (EXTRACT(YEAR FROM date_facture) = EXTRACT(YEAR FROM CURRENT_DATE)
               AND EXTRACT(MONTH FROM date_facture) < EXTRACT(MONTH FROM CURRENT_DATE)))
    GROUP BY EXTRACT(YEAR FROM date_facture), EXTRACT(MONTH FROM date_facture)
  )
  SELECT
    COALESCE(e.annee, f.annee) as annee,
    COALESCE(e.mois, f.mois) as mois,
    COALESCE(e.nb, 0) as nb_encaissements,
    COALESCE(f.nb, 0) as nb_factures
  FROM mois_encaissements e
  FULL OUTER JOIN mois_factures f ON e.annee = f.annee AND e.mois = f.mois
  ORDER BY annee DESC, mois DESC;
END;
$$ LANGUAGE plpgsql;

-- Activer Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE encaissements ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les utilisateurs
-- Pour le moment, on permet l'accès à tous (à ajuster selon les besoins de sécurité)
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);

-- Politiques RLS pour les encaissements
CREATE POLICY "Enable all for all users on encaissements" ON encaissements FOR ALL USING (true);

-- Politiques RLS pour les factures
CREATE POLICY "Enable all for all users on factures" ON factures FOR ALL USING (true);

-- Insérer un utilisateur par défaut (mot de passe: "admin123")
INSERT INTO users (login, password_hash, nom, prenom, email)
VALUES (
  'admin',
  hash_password('admin123'),
  'Administrateur',
  'Principal',
  'admin@boucherie.fr'
);

-- Afficher l'ID de l'utilisateur créé pour référence
SELECT id, login, nom, prenom FROM users WHERE login = 'admin';
