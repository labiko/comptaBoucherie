import { createClient } from '@supabase/supabase-js';

// Configuration Supabase dynamique selon l'environnement
//
// LOCALHOST (fichier .env) :
//   - NODE_ENV=development → Base DEV (ghqeiknovctwqpucoeuv)
//   - NODE_ENV=production → Base PROD (ylhwyotluskuhkjumqpf)
//
// VERCEL (variables d'environnement Vercel) :
//   - Utilise VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
//   - Chaque projet Vercel a ses propres variables

// Vérifier si on est vraiment sur Vercel (pas localhost)
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const isVercel = !isLocalhost && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseUrl: string;
let supabaseAnonKey: string;

if (isVercel) {
  // Sur Vercel : utiliser les variables standard (chaque projet Vercel a ses propres valeurs)
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  console.log('☁️ Environnement: VERCEL');
} else {
  // En localhost : utiliser VITE_NODE_ENV pour basculer entre DEV et PROD
  // Note: Vite préfixe toutes les variables custom avec VITE_
  const nodeEnv = import.meta.env.VITE_NODE_ENV || import.meta.env.NODE_ENV;
  const isDevelopment = nodeEnv === 'development';

  supabaseUrl = isDevelopment
    ? import.meta.env.VITE_DEV_SUPABASE_URL
    : import.meta.env.VITE_PROD_SUPABASE_URL;

  supabaseAnonKey = isDevelopment
    ? import.meta.env.VITE_DEV_SUPABASE_ANON_KEY
    : import.meta.env.VITE_PROD_SUPABASE_ANON_KEY;

  // Log de l'environnement actif (uniquement en localhost)
  if (isDevelopment) {
    console.log('🔵 Environnement: DÉVELOPPEMENT (localhost)');
    console.log('📡 Supabase URL:', supabaseUrl);
  } else {
    console.log('🟢 Environnement: PRODUCTION (localhost)');
    console.log('📡 Supabase URL:', supabaseUrl);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
