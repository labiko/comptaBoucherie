// Utilitaires pour la traçabilité

import { formatMontantAvecDevise } from './format';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Mapping des noms de champs vers leur label français
const FIELD_LABELS: Record<string, string> = {
  // Encaissements
  date: 'Date',
  espece: 'Espèce',
  cb: 'CB',
  ch_vr: 'Chèque/Virement',
  tr: 'Tickets Restaurant',
  total: 'Total',

  // Factures
  date_facture: 'Date facture',
  fournisseur: 'Fournisseur',
  echeance: 'Échéance',
  description: 'Description',
  montant: 'Montant',
  mode_reglement: 'Mode règlement',
  solde_restant: 'Solde restant',
  regle: 'Réglé',

  // Champs communs
  user_id: 'Utilisateur',
  updated_by: 'Modifié par',
  created_at: 'Créé le',
  updated_at: 'Modifié le',
};

// Champs à ignorer dans l'affichage
const IGNORED_FIELDS = [
  'id',
  'boucherie_id',
  'user_id',
  'updated_by',
  'created_at',
  'updated_at',
];

export function getFieldLabel(fieldName: string): string {
  return FIELD_LABELS[fieldName] || fieldName;
}

export function formatFieldValue(fieldName: string, value: any): string {
  if (value === null || value === undefined) {
    return '-';
  }

  // Montants
  if (['espece', 'cb', 'ch_vr', 'tr', 'total', 'montant', 'solde_restant'].includes(fieldName)) {
    return formatMontantAvecDevise(Number(value));
  }

  // Dates
  if (['date', 'date_facture', 'echeance'].includes(fieldName)) {
    try {
      return format(parseISO(value), 'dd/MM/yyyy', { locale: fr });
    } catch {
      return value;
    }
  }

  // Booléens
  if (fieldName === 'regle' || typeof value === 'boolean') {
    return value ? 'Oui' : 'Non';
  }

  // Par défaut
  return String(value);
}

export function getChangedFields(oldValues: Record<string, any> | null, newValues: Record<string, any> | null): string[] {
  if (!oldValues && !newValues) return [];

  const allKeys = new Set([
    ...Object.keys(oldValues || {}),
    ...Object.keys(newValues || {}),
  ]);

  return Array.from(allKeys).filter(key => {
    if (IGNORED_FIELDS.includes(key)) return false;

    const oldVal = oldValues?.[key];
    const newVal = newValues?.[key];

    return oldVal !== newVal;
  });
}

export function shouldShowField(fieldName: string): boolean {
  return !IGNORED_FIELDS.includes(fieldName);
}
