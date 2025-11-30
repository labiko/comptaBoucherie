// Utilitaires pour la génération de fichiers CSV et Excel
import type { Facture } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as XLSX from 'xlsx';

/**
 * Échappe les valeurs CSV (guillemets, point-virgules, sauts de ligne)
 * Utilise le point-virgule comme séparateur (standard français pour Excel)
 */
function escapeCsvValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';

  const str = String(value);

  // Si la valeur contient des guillemets, point-virgules ou sauts de ligne, l'entourer de guillemets
  if (str.includes('"') || str.includes(';') || str.includes('\n') || str.includes('\r')) {
    // Doubler les guillemets
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Formate un nombre en euros avec 2 décimales
 */
function formatEuros(montant: number): string {
  return montant.toFixed(2) + ' €';
}

/**
 * Génère un fichier CSV des factures pour un mois donné
 */
export function generateFacturesCsv(factures: Facture[]): string {
  const headers = [
    'Date facture',
    'Fournisseur',
    'Description',
    'Montant (€)',
    'Solde restant (€)',
    'Mode règlement',
    'Réglé',
    'Échéance',
    'Pièce jointe'
  ];

  const rows = factures.map(facture => [
    format(new Date(facture.date_facture), 'dd/MM/yyyy', { locale: fr }),
    facture.fournisseur,
    facture.description,
    facture.montant.toFixed(2).replace('.', ','), // Format nombre français
    facture.solde_restant.toFixed(2).replace('.', ','), // Format nombre français
    facture.mode_reglement,
    facture.regle ? 'Oui' : 'Non',
    format(new Date(facture.echeance), 'dd/MM/yyyy', { locale: fr }),
    facture.piece_jointe || '' // URL de la pièce jointe (cliquable dans Excel)
  ]);

  // Créer le CSV avec point-virgule comme séparateur (standard français)
  const csvLines = [
    headers.map(escapeCsvValue).join(';'),
    ...rows.map(row => row.map(escapeCsvValue).join(';'))
  ];

  return csvLines.join('\n');
}

/**
 * Télécharge un fichier CSV côté client
 */
export function downloadCsv(content: string, filename: string): void {
  // Ajouter le BOM UTF-8 pour Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Génère le nom du fichier CSV pour un envoi
 */
export function generateCsvFilename(
  boucherieNom: string,
  mois: number,
  annee: number,
  type: 'factures' | 'encaissements'
): string {
  const moisStr = String(mois).padStart(2, '0');
  const nomSanitize = boucherieNom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
    .replace(/[^a-zA-Z0-9]/g, '_'); // Remplacer les caractères spéciaux

  return `${type}_${nomSanitize}_${annee}_${moisStr}.csv`;
}

/**
 * Génère un fichier Excel (.xlsx) avec mise en forme et couleurs
 */
export function generateFacturesExcel(factures: Facture[]): ArrayBuffer {
  // Préparer les données
  const data = factures.map(facture => ({
    'Date facture': format(new Date(facture.date_facture), 'dd/MM/yyyy', { locale: fr }),
    'Fournisseur': facture.fournisseur,
    'Description': facture.description,
    'Montant (€)': facture.montant,
    'Solde restant (€)': facture.solde_restant,
    'Mode règlement': facture.mode_reglement,
    'Réglé': facture.regle ? 'Oui' : 'Non',
    'Échéance': format(new Date(facture.echeance), 'dd/MM/yyyy', { locale: fr }),
    'Pièce jointe': facture.piece_jointe || ''
  }));

  // Créer le workbook et la feuille
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Factures');

  // Définir les largeurs de colonnes
  const colWidths = [
    { wch: 12 }, // Date facture
    { wch: 25 }, // Fournisseur
    { wch: 35 }, // Description
    { wch: 12 }, // Montant
    { wch: 15 }, // Solde restant
    { wch: 15 }, // Mode règlement
    { wch: 8 },  // Réglé
    { wch: 12 }, // Échéance
    { wch: 200 } // Pièce jointe (largeur maximale pour URLs longues)
  ];
  ws['!cols'] = colWidths;

  // Ajouter les styles et couleurs
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

  // Styling de l'en-tête (ligne 1)
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!ws[address]) continue;
    ws[address].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '4472C4' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
  }

  // Colorer les lignes en fonction du statut "Réglé"
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const regleCol = 6; // Colonne G (index 6) = "Réglé"
    const regleAddress = XLSX.utils.encode_col(regleCol) + (R + 1);
    const isRegle = ws[regleAddress]?.v === 'Oui';

    // Appliquer la couleur à toute la ligne
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + (R + 1);
      if (!ws[address]) continue;

      ws[address].s = {
        fill: {
          fgColor: { rgb: isRegle ? 'C6EFCE' : 'FFC7CE' } // Vert si réglé, Rouge sinon
        },
        font: {
          color: { rgb: isRegle ? '006100' : '9C0006' } // Texte vert foncé ou rouge foncé
        },
        alignment: { vertical: 'center' }
      };

      // Format des nombres avec 2 décimales pour les colonnes montant
      if (C === 3 || C === 4) { // Montant et Solde restant
        ws[address].z = '#,##0.00';
      }
    }

    // Ajouter les hyperliens pour les pièces jointes
    const pieceJointeCol = 8; // Colonne I (index 8) = "Pièce jointe"
    const pieceAddress = XLSX.utils.encode_col(pieceJointeCol) + (R + 1);
    if (ws[pieceAddress]?.v) {
      const url = ws[pieceAddress].v as string;
      ws[pieceAddress].l = { Target: url, Tooltip: 'Cliquer pour ouvrir' };
      ws[pieceAddress].s = {
        ...ws[pieceAddress].s,
        font: {
          ...ws[pieceAddress].s?.font,
          underline: true,
          color: { rgb: '0563C1' }
        }
      };
    }
  }

  // Activer les filtres automatiques
  ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

  // Générer le fichier Excel en ArrayBuffer
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

/**
 * Télécharge un fichier Excel côté client
 */
export function downloadExcel(arrayBuffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Génère le nom du fichier Excel pour un envoi
 */
export function generateExcelFilename(
  boucherieNom: string,
  mois: number,
  annee: number,
  type: 'factures' | 'encaissements'
): string {
  const moisStr = String(mois).padStart(2, '0');
  const nomSanitize = boucherieNom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
    .replace(/[^a-zA-Z0-9]/g, '_'); // Remplacer les caractères spéciaux

  return `${type}_${nomSanitize}_${annee}_${moisStr}.xlsx`;
}
