// Thème de couleurs pour Compta Boucherie
// Rouge/Bordeaux (boucherie) + Vert (comptabilité)

export const theme = {
  colors: {
    // Couleurs principales boucherie
    primary: '#8B1538', // Bordeaux foncé
    primaryLight: '#A52A4A', // Bordeaux moyen
    primaryDark: '#6B0F2B', // Bordeaux très foncé

    // Couleurs secondaires comptabilité
    secondary: '#2D7D4C', // Vert comptable
    secondaryLight: '#3D9D5C', // Vert clair
    secondaryDark: '#1D5D3C', // Vert foncé

    // Couleurs de fond
    background: '#FFFFFF',
    backgroundGray: '#F5F5F5',
    backgroundDark: '#E8E8E8',

    // Couleurs de texte
    textPrimary: '#1A1A1A',
    textSecondary: '#666666',
    textLight: '#999999',

    // Couleurs système
    success: '#2D7D4C',
    error: '#D32F2F',
    warning: '#F57C00',
    info: '#1976D2',

    // Couleurs des bordures
    border: '#DDDDDD',
    borderLight: '#EEEEEE',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },

  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },

  // Tailles minimales pour le tactile (mobile-first)
  touchTarget: {
    min: '44px', // Taille minimale recommandée pour les boutons tactiles
  },
};

export type Theme = typeof theme;
