// Configuration des modules par secteur
// Permet d'activer/désactiver des fonctionnalités selon le type d'entreprise

export type Secteur = 'boucherie' | 'boulangerie';

export interface ModuleConfig {
  id: string;
  label: string;
  icon: string;
  route: string;
  enabled: boolean;
}

export const MODULES_BY_SECTEUR: Record<Secteur, ModuleConfig[]> = {
  boucherie: [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', route: '/', enabled: true },
    { id: 'encaissements', label: 'Encaissements', icon: '💰', route: '/encaissements', enabled: true },
    { id: 'factures', label: 'Factures', icon: '📄', route: '/factures', enabled: true },
    { id: 'administration', label: 'Admin', icon: '⚙️', route: '/administration', enabled: true },
    { id: 'invendus', label: 'Invendus', icon: '🥖', route: '/invendus', enabled: false }, // Désactivé pour boucheries
  ],
  boulangerie: [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', route: '/', enabled: true },
    { id: 'encaissements', label: 'Encaissements', icon: '💰', route: '/encaissements', enabled: true },
    { id: 'factures', label: 'Factures', icon: '📄', route: '/factures', enabled: true },
    { id: 'invendus', label: 'Invendus', icon: '🥖', route: '/invendus', enabled: true }, // Activé pour boulangeries
    { id: 'administration', label: 'Admin', icon: '⚙️', route: '/administration', enabled: true },
  ],
};

/**
 * Récupère les modules actifs pour un secteur donné
 * @param secteur - Le secteur de l'entreprise
 * @returns Liste des modules actifs
 */
export function getActiveModules(secteur: Secteur): ModuleConfig[] {
  return MODULES_BY_SECTEUR[secteur].filter(m => m.enabled);
}
