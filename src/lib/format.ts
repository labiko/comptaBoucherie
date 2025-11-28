// Utilitaires de formatage

/**
 * Formate un nombre avec séparateur de milliers et 2 décimales
 * Exemple: 1234.56 → "1 234,56"
 */
export function formatMontant(montant: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(montant);
}

/**
 * Formate un montant avec devise
 * Exemple: 1234.56 → "1 234,56 €"
 */
export function formatMontantAvecDevise(montant: number): string {
  return `${formatMontant(montant)} €`;
}
