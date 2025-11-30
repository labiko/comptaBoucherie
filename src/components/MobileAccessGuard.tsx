import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import './MobileAccessGuard.css';

export function MobileAccessGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [showBlockedPopup, setShowBlockedPopup] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      if (!user) return;

      // Détecter si mobile (simple et direct)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (!isMobile) {
        // Pas mobile, on laisse passer
        return;
      }

      // C'est mobile, vérifier si autorisé
      const { data } = await supabase
        .from('boucheries')
        .select('mobile_autorise')
        .eq('id', user.boucherie_id)
        .single();

      if (data && !data.mobile_autorise) {
        // Mobile non autorisé, afficher le popup
        setShowBlockedPopup(true);
      }
    }

    checkAccess();
  }, [user]);

  if (showBlockedPopup) {
    return (
      <div className="mobile-blocked-popup">
        <div className="mobile-blocked-content">
          <div className="mobile-blocked-icon">🔒</div>
          <h2>Accès Mobile Non Autorisé</h2>
          <p>
            Cette application est configurée pour une utilisation sur <strong>ordinateur uniquement</strong>.
          </p>
          <p className="mobile-blocked-info">
            Pour activer l'accès mobile, veuillez contacter votre administrateur.
          </p>
          <a href="mailto:diallo.labico@hotmail.fr?subject=Demande d'activation accès mobile" className="mobile-blocked-btn">
            📧 Nous contacter
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
