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
export function formatEuros(montant: number): string {
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
export function generateFacturesExcel(
  factures: Facture[],
  boucherieNom: string,
  mois: number,
  annee: number
): ArrayBuffer {
  // Créer le workbook et une feuille vide
  const wb = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = {};

  // Noms des mois en français
  const moisNoms = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  // Date de génération
  const dateGeneration = format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr });

  // === EN-TÊTE PROFESSIONNEL (Lignes 1-4) ===

  // Ligne 1: "FACTURES - [Nom boucherie]"
  ws['A1'] = { v: `FACTURES - ${boucherieNom}`, t: 's' };
  ws['A1'].s = {
    font: { bold: true, sz: 16, color: { rgb: '4472C4' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  };

  // Ligne 2: "Période : [Mois] [Année]"
  ws['A2'] = { v: `Période : ${moisNoms[mois - 1]} ${annee}`, t: 's' };
  ws['A2'].s = {
    font: { italic: true, sz: 12, color: { rgb: '2C3E50' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  };

  // Ligne 3: "Généré le : [Date]"
  ws['A3'] = { v: `Généré le : ${dateGeneration}`, t: 's' };
  ws['A3'].s = {
    font: { sz: 10, color: { rgb: '7F8C8D' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  };

  // Ligne 4: Vide (séparation)

  // === EN-TÊTE DU TABLEAU (Ligne 5) ===
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

  headers.forEach((header, colIndex) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 4, c: colIndex });
    ws[cellAddress] = { v: header, t: 's' };
    ws[cellAddress].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      fill: { fgColor: { rgb: '4472C4' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'medium', color: { rgb: '4472C4' } },
        bottom: { style: 'medium', color: { rgb: '4472C4' } },
        left: { style: 'thin', color: { rgb: '4472C4' } },
        right: { style: 'thin', color: { rgb: '4472C4' } }
      }
    };
  });

  // === DONNÉES DES FACTURES (Lignes 6+) ===
  let totalMontant = 0;
  let totalSoldeRestant = 0;

  factures.forEach((facture, rowIndex) => {
    const excelRow = rowIndex + 5; // Ligne 6 = index 5
    const isRegle = facture.regle;
    const isEvenRow = rowIndex % 2 === 0; // Alterner les couleurs

    // Calculer les totaux
    totalMontant += facture.montant;
    totalSoldeRestant += facture.solde_restant;

    // Données de la ligne
    const rowData = [
      { v: format(new Date(facture.date_facture), 'dd/MM/yyyy', { locale: fr }), t: 's' },
      { v: facture.fournisseur, t: 's' },
      { v: facture.description, t: 's' },
      { v: facture.montant, t: 'n' },
      { v: facture.solde_restant, t: 'n' },
      { v: facture.mode_reglement, t: 's' },
      { v: isRegle ? 'Oui' : 'Non', t: 's' },
      { v: format(new Date(facture.echeance), 'dd/MM/yyyy', { locale: fr }), t: 's' },
      { v: facture.piece_jointe || '', t: 's' }
    ];

    rowData.forEach((cell, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: excelRow, c: colIndex });
      ws[cellAddress] = cell;

      // Style de la cellule avec alternance de couleurs
      ws[cellAddress].s = {
        fill: {
          fgColor: { rgb: isEvenRow ? 'FFFFFF' : 'F2F2F2' } // Blanc/Gris clair alterné
        },
        font: {
          color: { rgb: '000000' } // Texte noir
        },
        alignment: { vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'D0D0D0' } },
          bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
          left: { style: 'thin', color: { rgb: 'D0D0D0' } },
          right: { style: 'thin', color: { rgb: 'D0D0D0' } }
        }
      };

      // Mise en évidence de la colonne "Réglé" avec couleur conditionnelle
      if (colIndex === 6) { // Colonne "Réglé"
        ws[cellAddress].s.fill = {
          fgColor: { rgb: isRegle ? 'D4EDDA' : 'F8D7DA' } // Vert clair ou Rouge clair
        };
        ws[cellAddress].s.font = {
          bold: true,
          color: { rgb: isRegle ? '155724' : '721C24' } // Vert foncé ou Rouge foncé
        };
      }

      // Format des nombres avec 2 décimales pour les colonnes montant
      if (colIndex === 3 || colIndex === 4) { // Montant et Solde restant
        ws[cellAddress].z = '#,##0.00';
      }
    });

    // Ajouter l'hyperlien pour la pièce jointe
    if (facture.piece_jointe) {
      const pieceAddress = XLSX.utils.encode_cell({ r: excelRow, c: 8 });
      ws[pieceAddress].l = { Target: facture.piece_jointe, Tooltip: 'Cliquer pour ouvrir' };
      ws[pieceAddress].s = {
        ...ws[pieceAddress].s,
        font: {
          ...ws[pieceAddress].s?.font,
          underline: true,
          color: { rgb: '0563C1' }
        }
      };
    }
  });

  // === LIGNE DE TOTAUX ===
  const totalRow = factures.length + 5; // Après la dernière facture

  // Cellules de la ligne de totaux
  ws[XLSX.utils.encode_cell({ r: totalRow, c: 2 })] = { v: 'TOTAL', t: 's' };
  ws[XLSX.utils.encode_cell({ r: totalRow, c: 3 })] = { v: totalMontant, t: 'n' };
  ws[XLSX.utils.encode_cell({ r: totalRow, c: 4 })] = { v: totalSoldeRestant, t: 'n' };

  // Style de la ligne de totaux
  for (let c = 0; c <= 8; c++) {
    const cellAddress = XLSX.utils.encode_cell({ r: totalRow, c });
    if (!ws[cellAddress]) {
      ws[cellAddress] = { v: '', t: 's' };
    }
    ws[cellAddress].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      fill: { fgColor: { rgb: '5A6C7D' } },
      alignment: { horizontal: c === 2 ? 'center' : 'left', vertical: 'center' },
      border: {
        top: { style: 'medium', color: { rgb: '2C3E50' } }, // Bordure supérieure épaisse
        bottom: { style: 'medium', color: { rgb: '2C3E50' } },
        left: { style: 'thin', color: { rgb: '5A6C7D' } },
        right: { style: 'thin', color: { rgb: '5A6C7D' } }
      }
    };

    // Format des montants dans les totaux
    if (c === 3 || c === 4) {
      ws[cellAddress].z = '#,##0.00';
    }
  }

  // === CONFIGURATION DE LA FEUILLE ===

  // Définir les largeurs de colonnes
  ws['!cols'] = [
    { wch: 12 }, // Date facture
    { wch: 25 }, // Fournisseur
    { wch: 35 }, // Description
    { wch: 12 }, // Montant
    { wch: 15 }, // Solde restant
    { wch: 15 }, // Mode règlement
    { wch: 8 },  // Réglé
    { wch: 12 }, // Échéance
    { wch: 150 } // Pièce jointe
  ];

  // Définir les hauteurs de lignes
  ws['!rows'] = [
    { hpt: 24 }, // Ligne 1: Titre principal
    { hpt: 18 }, // Ligne 2: Période
    { hpt: 15 }, // Ligne 3: Date génération
    { hpt: 15 }, // Ligne 4: Séparation
    { hpt: 22 }  // Ligne 5: En-tête du tableau (plus haute)
  ];

  // Fusionner les cellules de l'en-tête (lignes 1-3) sur toutes les colonnes
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Ligne 1
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // Ligne 2
    { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } }  // Ligne 3
  ];

  // Définir la plage de la feuille
  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: totalRow, c: 8 }
  });

  // Activer les filtres automatiques sur l'en-tête du tableau (ligne 5)
  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: 4, c: 0 },
      e: { r: factures.length + 4, c: 8 }
    })
  };

  // Ajouter la feuille au workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Factures');

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
