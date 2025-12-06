# Guide PWA - Compta Boucherie

## L'application est maintenant une PWA installable ! 🎉

L'application **Compta Boucherie** est désormais une Progressive Web App (PWA) complète, installable sur iOS et Android comme une vraie application native.

---

## ✨ Fonctionnalités PWA

### ✅ Installation sur l'écran d'accueil
- Installez l'application directement depuis le navigateur
- Icône personnalisée sur l'écran d'accueil
- Expérience "app native" sans barre d'URL

### ✅ Fonctionnement offline
- Les assets (CSS, JS, images) sont mis en cache
- L'application se charge instantanément même hors ligne
- Les données Supabase utilisent une stratégie NetworkFirst (réseau en priorité, cache en secours)

### ✅ Prompt d'installation automatique
- Banner élégant avec boutons "Installer" / "Plus tard"
- S'affiche automatiquement sur mobile
- Mémorise le choix de l'utilisateur (si dismissé)

---

## 📱 Comment installer l'application

### Sur Android (Chrome/Edge)

1. Ouvrez l'application dans Chrome ou Edge
2. Un banner "Installer Compta Boucherie" apparaît en bas de l'écran
3. Cliquez sur **"Installer"**
4. L'application est ajoutée à votre écran d'accueil

**Méthode alternative :**
1. Tapez sur le menu ⋮ (trois points)
2. Sélectionnez "Installer l'application" ou "Ajouter à l'écran d'accueil"

### Sur iOS (Safari)

1. Ouvrez l'application dans Safari
2. Tapez sur le bouton **Partager** (icône carré avec flèche vers le haut)
3. Faites défiler et tapez sur **"Sur l'écran d'accueil"**
4. Tapez **"Ajouter"**
5. L'application est maintenant sur votre écran d'accueil

---

## 🧪 Comment tester en développement

### Build et preview local

```bash
# Build de production avec PWA
npm run build

# Démarrer le serveur de preview
npm run preview

# L'app sera disponible sur http://localhost:4173/
```

### Tester sur mobile depuis votre PC

1. Assurez-vous que votre téléphone et PC sont sur le même réseau WiFi
2. Lancez le build : `npm run preview`
3. Démarrez le serveur avec exposition réseau :
```bash
npm run preview -- --host
```
4. Notez l'adresse IP affichée (ex: `http://192.168.1.10:4173`)
5. Ouvrez cette URL sur votre mobile

### Vérifier le PWA avec Chrome DevTools

1. Ouvrez l'application dans Chrome desktop
2. Appuyez sur **F12** pour ouvrir DevTools
3. Allez dans l'onglet **"Application"**
4. Dans le menu de gauche, vérifiez :
   - **Manifest** : Toutes les infos PWA (nom, icônes, thème)
   - **Service Workers** : Le SW doit être "activé et en cours d'exécution"
   - **Cache Storage** : Les assets doivent être en cache

---

## 🎨 Personnalisation

### Icône de l'application

L'icône actuelle est un SVG avec le thème bordeaux/boucherie.
Pour la personnaliser :

1. Modifiez `/public/icon.svg`
2. Ou remplacez par des PNG :
   - Créez `icon-192x192.png`
   - Créez `icon-512x512.png`
   - Mettez à jour le manifest dans `vite.config.ts`

### Couleurs et thème

Dans `vite.config.ts`, section `manifest` :
```typescript
theme_color: '#8B1538',        // Bordeaux (barre d'adresse sur mobile)
background_color: '#ffffff',   // Blanc (splash screen)
```

### Nom de l'application

```typescript
name: 'Compta Boucherie',      // Nom complet
short_name: 'Compta',          // Nom court (écran d'accueil)
```

---

## 🔧 Configuration technique

### Service Worker

- **Stratégie** : `NetworkFirst` pour Supabase (réseau en priorité)
- **Cache** : Tous les assets statiques (JS, CSS, images, fonts)
- **Mise à jour** : Automatique (`autoUpdate`)

### Manifest PWA

```json
{
  "name": "Compta Boucherie",
  "short_name": "Compta",
  "theme_color": "#8B1538",
  "display": "standalone",
  "orientation": "portrait",
  "categories": ["business", "finance", "productivity"]
}
```

### Fichiers générés au build

- `/dist/sw.js` : Service Worker
- `/dist/manifest.webmanifest` : Manifest PWA
- `/dist/registerSW.js` : Script d'enregistrement du SW
- `/dist/workbox-*.js` : Bibliothèque Workbox

---

## 📊 Statistiques

### Taille du build

- **Total** : ~1.2 MB (compressé gzip : ~358 KB)
- **Service Worker** : ~31 KB
- **Manifest** : ~0.4 KB
- **9 fichiers en precache** : ~1.2 MB

### Compatibilité

| Plateforme | Navigateur | Support |
|-----------|-----------|---------|
| Android | Chrome 84+ | ✅ Complet |
| Android | Edge 84+ | ✅ Complet |
| Android | Firefox 90+ | ✅ Complet |
| iOS | Safari 16.4+ | ✅ Complet |
| iOS | Chrome/Edge | ⚠️ Limité (utilise Safari sous le capot) |
| Desktop | Tous | ✅ Fonctionne comme webapp classique |

---

## ❓ FAQ

### L'application fonctionne-t-elle vraiment offline ?

**Partiellement** :
- ✅ Les pages, styles et scripts sont en cache → chargement instantané
- ✅ Les données déjà consultées restent en cache
- ❌ Les nouvelles requêtes API nécessitent une connexion Internet

### Que se passe-t-il lors d'une mise à jour ?

Le Service Worker se met à jour automatiquement :
1. L'utilisateur charge l'application
2. Le nouveau SW est téléchargé en arrière-plan
3. Au prochain rechargement, la nouvelle version est active

### Puis-je désactiver la PWA ?

Oui, il suffit de :
1. Retirer le plugin dans `vite.config.ts`
2. Supprimer les imports de `InstallPrompt` dans `App.tsx`
3. Rebuild l'application

### Comment désinstaller l'app du téléphone ?

**Android** : Appui long sur l'icône → "Désinstaller" ou "Supprimer"
**iOS** : Appui long sur l'icône → "Supprimer l'app"

---

## 🚀 Prochaines améliorations possibles

- [ ] Notifications push (avec permission utilisateur)
- [ ] Synchronisation en arrière-plan
- [ ] Mode offline complet avec IndexedDB
- [ ] Icônes PNG haute résolution (192x192, 512x512)
- [ ] Screenshots dans le manifest
- [ ] Share target (partage de fichiers vers l'app)

---

## 📦 Fichiers modifiés

### Nouveaux fichiers
- `public/icon.svg` - Icône SVG de l'application
- `src/components/InstallPrompt.tsx` - Composant prompt d'installation
- `src/components/InstallPrompt.css` - Styles du prompt
- `scripts/generate-icons.js` - Script helper pour générer les icônes

### Fichiers modifiés
- `vite.config.ts` - Configuration PWA avec vite-plugin-pwa
- `index.html` - Meta tags PWA et optimisations mobile
- `src/App.tsx` - Import et utilisation de InstallPrompt
- `package.json` - Ajout de vite-plugin-pwa et workbox-window
- `version.json` - Version 1.5.0

---

## 📞 Support

Pour toute question ou problème :
1. Vérifiez les logs du Service Worker dans DevTools
2. Testez sur plusieurs navigateurs
3. Vérifiez que le build est bien en HTTPS (requis pour PWA)

---

**Version** : 1.5.0
**Date** : 06/12/2025
**Auteur** : Claude Code
