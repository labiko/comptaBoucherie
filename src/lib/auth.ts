import { supabase } from './supabase';
import type { User } from '../types';

export async function login(loginInput: string, password: string): Promise<User | null> {
  try {
    // Vérifier les credentials avec la fonction SQL
    const { data: isValid, error: verifyError } = await supabase
      .rpc('verify_password', {
        login_input: loginInput,
        password_input: password,
      });

    if (verifyError) throw verifyError;

    if (!isValid) {
      throw new Error('Login ou mot de passe incorrect');
    }

    // Récupérer les infos de l'utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('login', loginInput)
      .eq('actif', true)
      .single();

    if (userError) throw userError;

    return userData as User;
  } catch (error) {
    console.error('Erreur de connexion:', error);
    return null;
  }
}

export function saveUserToStorage(user: User) {
  localStorage.setItem('compta_user', JSON.stringify(user));
}

export function getUserFromStorage(): User | null {
  const userStr = localStorage.getItem('compta_user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

export function clearUserFromStorage() {
  localStorage.removeItem('compta_user');
}
