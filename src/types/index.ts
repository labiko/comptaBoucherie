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
  mobile_autorise: boolean; // Indique si la boucherie a payé pour l'accès mobile
  email_comptable: string | null; // Email du comptable pour l'envoi mensuel automatique
  envoi_auto_factures: boolean; // Active l'envoi automatique mensuel
  smtp_email: string | null; // Email Gmail de la boucherie pour l'envoi SMTP
  smtp_password: string | null; // Mot de passe d'application Gmail
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

export interface Fournisseur {
  id: string;
  boucherie_id: string;
  nom: string;
  type: string | null; // Type de fournisseur: viande, abattoir, services, etc.
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Facture {
  id: string;
  boucherie_id: string;
  date_facture: string;
  fournisseur: string;
  fournisseur_id: string | null;
  echeance: string;
  description: string;
  montant: number;
  mode_reglement: string;
  solde_restant: number;
  regle: boolean;
  piece_jointe?: string | null; // URL de la pièce jointe (image)
  piece_jointe_updated_at?: string | null; // Date de dernière modification de la pièce jointe
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

// Types pour le Dashboard

export interface DashboardStats {
  boucherie_id: string;
  boucherie_nom: string;
  recette_jour: number;
  recette_j7: number;
  recette_semaine_derniere: number;
  total_mois: number;
  total_espece: number;
  total_cb: number;
  total_ch_vr: number;
  total_tr: number;
  nb_factures_retard: number;
  montant_factures_retard: number;
}

export interface WeekData {
  boucherie_id: string;
  date: string; // YYYY-MM-DD
  jour_court: string; // Lun, Mar, Mer...
  date_format: string; // DD/MM
  total: number;
}

export interface FactureRetard {
  id: string;
  boucherie_id: string;
  fournisseur: string;
  montant: number;
  solde_restant: number;
  echeance: string;
  description: string;
  jours_retard: number;
}

export interface FournisseurImpaye {
  boucherie_id: string;
  fournisseur: string;
  montant_total: number;
  nb_factures: number;
  echeance_plus_ancienne: string;
}

export interface PaymentDistribution {
  name: string;
  value: number;
  color: string;
}

export interface EnvoiComptabilite {
  id: string;
  boucherie_id: string;
  type_export: 'factures' | 'encaissements';
  mois: number; // 1-12
  annee: number;
  date_envoi: string;
  email_destinataire: string;
  nombre_lignes: number;
  statut: 'envoye' | 'erreur';
  erreur_message: string | null;
  user_id: string;
  created_at: string;
}
