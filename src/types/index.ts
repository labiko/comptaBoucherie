// Types pour l'application Compta Boucherie

export interface Boucherie {
  id: string;
  nom: string;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  siret: string | null;
  telephone: string | null;
  email: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  boucherie_id: string;
  login: string;
  nom: string;
  prenom: string | null;
  email: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Encaissement {
  id: string;
  boucherie_id: string;
  date: string; // Format YYYY-MM-DD
  espece: number;
  cb: number;
  ch_vr: number; // Chèque/Virement
  tr: number; // Tickets Restaurant
  total: number; // Calculé automatiquement
  user_id: string;
  updated_by?: string; // Utilisateur qui a modifié en dernier
  created_at: string;
  updated_at: string;
}

export interface Facture {
  id: string;
  boucherie_id: string;
  date_facture: string;
  fournisseur: string;
  echeance: string;
  description: string;
  montant: number;
  mode_reglement: string;
  solde_restant: number;
  regle: boolean;
  user_id: string;
  updated_by?: string; // Utilisateur qui a modifié en dernier
  created_at: string;
  updated_at: string;
}

export interface MoisArchive {
  annee: number;
  mois: number; // 1-12
  nb_encaissements: number;
  nb_factures: number;
}

export interface Tracabilite {
  id: string;
  boucherie_id: string;
  table_name: 'encaissements' | 'factures';
  record_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  user_id: string;
  user_nom: string;
  timestamp: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  created_at: string;
  // Champs de la vue enrichie
  user_login?: string;
  record_date?: string;
  montant?: number;
}

export interface TracabiliteGrouped {
  date: string; // Format YYYY-MM-DD
  logs: Tracabilite[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
