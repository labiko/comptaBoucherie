-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.app_config (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  maintenance_mode boolean DEFAULT false,
  maintenance_message text DEFAULT 'Application en cours de maintenance. Merci de votre patience.'::text,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT app_config_pkey PRIMARY KEY (id)
);
CREATE TABLE public.boucheries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  adresse text,
  code_postal text,
  ville text,
  siret text,
  telephone text,
  email text,
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  mobile_autorise boolean NOT NULL DEFAULT false,
  email_comptable text,
  envoi_auto_factures boolean NOT NULL DEFAULT false,
  smtp_email text,
  smtp_password text,
  secteur character varying NOT NULL DEFAULT 'boucherie'::character varying,
  CONSTRAINT boucheries_pkey PRIMARY KEY (id)
);
CREATE TABLE public.encaissements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL,
  espece numeric NOT NULL DEFAULT 0,
  cb numeric NOT NULL DEFAULT 0,
  ch_vr numeric NOT NULL DEFAULT 0,
  tr numeric NOT NULL DEFAULT 0,
  total numeric DEFAULT (((espece + cb) + ch_vr) + tr),
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid,
  boucherie_id uuid NOT NULL,
  CONSTRAINT encaissements_pkey PRIMARY KEY (id),
  CONSTRAINT encaissements_boucherie_id_fkey FOREIGN KEY (boucherie_id) REFERENCES public.boucheries(id),
  CONSTRAINT encaissements_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id),
  CONSTRAINT encaissements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.envois_comptabilite (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  boucherie_id uuid NOT NULL,
  type_export text NOT NULL CHECK (type_export = ANY (ARRAY['factures'::text, 'encaissements'::text])),
  mois integer NOT NULL CHECK (mois >= 1 AND mois <= 12),
  annee integer NOT NULL CHECK (annee >= 2020),
  date_envoi timestamp without time zone NOT NULL DEFAULT now(),
  email_destinataire text NOT NULL,
  nombre_lignes integer DEFAULT 0,
  statut text DEFAULT 'envoye'::text CHECK (statut = ANY (ARRAY['envoye'::text, 'erreur'::text])),
  erreur_message text,
  user_id uuid,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT envois_comptabilite_pkey PRIMARY KEY (id),
  CONSTRAINT envois_comptabilite_boucherie_id_fkey FOREIGN KEY (boucherie_id) REFERENCES public.boucheries(id),
  CONSTRAINT envois_comptabilite_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.factures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date_facture date NOT NULL,
  fournisseur text NOT NULL,
  echeance date NOT NULL,
  description text,
  montant numeric NOT NULL,
  mode_reglement text NOT NULL,
  solde_restant numeric NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid,
  boucherie_id uuid NOT NULL,
  regle boolean DEFAULT false,
  fournisseur_id uuid,
  piece_jointe text,
  piece_jointe_updated_at timestamp with time zone,
  CONSTRAINT factures_pkey PRIMARY KEY (id),
  CONSTRAINT factures_boucherie_id_fkey FOREIGN KEY (boucherie_id) REFERENCES public.boucheries(id),
  CONSTRAINT factures_fournisseur_id_fkey FOREIGN KEY (fournisseur_id) REFERENCES public.fournisseurs(id),
  CONSTRAINT factures_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id),
  CONSTRAINT factures_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.fournisseurs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  boucherie_id uuid NOT NULL,
  nom character varying NOT NULL,
  type character varying,
  telephone character varying,
  email character varying,
  adresse text,
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fournisseurs_pkey PRIMARY KEY (id),
  CONSTRAINT fournisseurs_boucherie_id_fkey FOREIGN KEY (boucherie_id) REFERENCES public.boucheries(id)
);
CREATE TABLE public.invendus (
  id integer NOT NULL DEFAULT nextval('invendus_id_seq'::regclass),
  boucherie_id uuid NOT NULL,
  date date NOT NULL,
  produit character varying NOT NULL,
  quantite numeric,
  valeur_estimee numeric,
  note text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT invendus_pkey PRIMARY KEY (id),
  CONSTRAINT invendus_boucherie_id_fkey FOREIGN KEY (boucherie_id) REFERENCES public.boucheries(id)
);
CREATE TABLE public.tracabilite (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  boucherie_id uuid NOT NULL,
  table_name text NOT NULL CHECK (table_name = ANY (ARRAY['encaissements'::text, 'factures'::text])),
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action = ANY (ARRAY['CREATE'::text, 'UPDATE'::text, 'DELETE'::text])),
  user_id uuid NOT NULL,
  user_nom text NOT NULL,
  timestamp timestamp with time zone DEFAULT now(),
  old_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tracabilite_pkey PRIMARY KEY (id),
  CONSTRAINT tracabilite_boucherie_id_fkey FOREIGN KEY (boucherie_id) REFERENCES public.boucheries(id),
  CONSTRAINT tracabilite_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  login text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  nom text NOT NULL,
  prenom text,
  email text,
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  boucherie_id uuid NOT NULL,
  is_super_admin boolean DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_boucherie_id_fkey FOREIGN KEY (boucherie_id) REFERENCES public.boucheries(id)
);