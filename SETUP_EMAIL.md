# Configuration de l'envoi d'emails

✅ **CONFIGURATION TERMINÉE !** L'envoi d'emails est maintenant activé.

Ce guide explique la configuration qui a été effectuée.

## ✅ 1. Compte Resend créé

- Compte gratuit créé (3 000 emails/mois)
- Clé API générée: `re_U224pc9a_7u3ERu89j99Vz3SkcTZJDrF2`

## ✅ 2. Domaine de test configuré

Le domaine de test Resend `onboarding@resend.dev` est utilisé pour l'envoi.

**Important:** Avec le domaine de test, vous devez ajouter les adresses email de destination dans votre compte Resend:
1. Allez sur [resend.com/emails](https://resend.com/emails)
2. Ajoutez l'email comptable comme destinataire autorisé

### Pour passer en production (optionnel)

Si vous voulez utiliser votre propre domaine:

1. Allez sur [resend.com/domains](https://resend.com/domains)
2. Cliquez sur **"Add Domain"**
3. Entrez votre domaine (ex: `monentreprise.com`)
4. Ajoutez les enregistrements DNS fournis par Resend
5. Modifiez la ligne 40 de `supabase/functions/send-email/index.ts`:
   ```typescript
   from: 'Boucherie Compta <noreply@monentreprise.com>',
   ```
6. Redéployez: `npx supabase functions deploy send-email`

## ✅ 3. Secret Supabase configuré

Le secret `RESEND_API_KEY` a été configuré dans votre projet Supabase (`ylhwyotluskuhkjumqpf`).

## ✅ 4. Edge Function déployée

La Edge Function `send-email` est déployée et fonctionnelle.

Dashboard: https://supabase.com/dashboard/project/ylhwyotluskuhkjumqpf/functions

## 5. Comment tester l'envoi d'email

1. **Ajoutez votre email de test dans Resend** (obligatoire avec le domaine de test):
   - Allez sur [resend.com/audiences](https://resend.com/audiences)
   - Ajoutez l'adresse email destinataire

2. **Testez depuis l'application**:
   - Allez dans **Historique** > onglet **Export**
   - Sélectionnez un mois/année avec des factures
   - Cliquez sur **"Prévisualiser"**
   - Configurez l'email comptable en haut de la page
   - Cliquez sur **"Générer et envoyer"**
   - Vérifiez votre boîte email (et vos spams)

3. **Consultez les logs**:
   - Allez sur [resend.com/emails](https://resend.com/emails) pour voir l'historique des envois
   - Consultez le Dashboard Supabase pour les logs de la Edge Function

## 6. Résolution des problèmes

### "RESEND_API_KEY is not set"

- Vérifiez que vous avez bien ajouté le secret dans Supabase (étape 4)
- Redéployez la fonction: `npx supabase functions deploy send-email`

### "Failed to send email"

- Vérifiez que votre clé API Resend est valide
- Si vous utilisez votre propre domaine, vérifiez qu'il est bien vérifié dans Resend
- Consultez les logs de la Edge Function dans Supabase Dashboard

### "Email not received"

- Vérifiez vos spams
- Si vous utilisez le domaine de test (`onboarding@resend.dev`), vérifiez que l'adresse destinataire est bien ajoutée dans [resend.com/emails](https://resend.com/emails)
- Consultez les logs dans [resend.com/emails](https://resend.com/emails) pour voir le statut de l'email

## 8. Limites du plan gratuit Resend

- **3 000 emails/mois** (gratuit)
- 100 contacts
- Rétention des logs: 3 jours
- Support communautaire

Pour plus d'emails, consultez les [tarifs Resend](https://resend.com/pricing).

## Fichiers modifiés

Les fichiers suivants ont été créés/modifiés pour cette fonctionnalité:

- ✅ `supabase/functions/send-email/index.ts` - Edge Function pour l'envoi d'emails
- ✅ `src/lib/email.ts` - Fonction qui appelle la Edge Function
- ✅ `src/pages/Comptabilite.tsx` - Page qui utilise la fonction d'envoi
- ✅ `src/components/ConfirmModal.tsx` - Modal de confirmation moderne
- ✅ `src/components/ConfirmModal.css` - Styles du modal

## Support

Si vous rencontrez des problèmes:
1. Consultez la [documentation Resend](https://resend.com/docs)
2. Consultez la [documentation Supabase Edge Functions](https://supabase.com/docs/guides/functions)
