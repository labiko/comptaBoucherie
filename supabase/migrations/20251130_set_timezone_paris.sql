-- Configurer le timezone par défaut à Europe/Paris pour toute la base de données
ALTER DATABASE postgres SET timezone TO 'Europe/Paris';

-- Modifier la colonne date_envoi pour utiliser timestamp avec timezone
ALTER TABLE envois_comptabilite
ALTER COLUMN date_envoi TYPE timestamptz USING date_envoi AT TIME ZONE 'UTC';

-- Définir la valeur par défaut pour utiliser le timezone Paris
ALTER TABLE envois_comptabilite
ALTER COLUMN date_envoi SET DEFAULT now();

-- Vérification
SELECT current_setting('timezone') as current_timezone;
