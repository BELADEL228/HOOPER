# 📋 AUDIT COMPLET & CAHIER DE RECETTE DE BOUT EN BOUT (A À Z)
**Plateforme HOOPER — Réseau Social & Workspace des Franchises de Basketball au Togo**
*Version : 2.5 • Date de recette : Septembre 2026 • Statut du Build : 100% Opérationnel (0 erreur TypeScript)*

---

## 📑 TABLE DES MATIÈRES
1. [Rapport d'Audit Technique & Correctifs Récents](#1-rapport-daudit-technique--correctifs-récents)
2. [Matrice des Comptes de Test & Identifiants Officiels](#2-matrice-des-comptes-de-test--identifiants-officiels)
3. [Guide d'Installation Mobile & PWA (Android / iOS / Écran d'accueil)](#3-guide-dinstallation-mobile--pwa)
4. [Protocole de Recette pas à pas (Scénarios 1 à 1)](#4-protocole-de-recette-pas-à-pas)
   - [Scénario 1 : Super Administrateur de la Plateforme (SUPER_ADMIN)](#scénario-1--super-administrateur-super_admin)
   - [Scénario 2 : Président & Gouvernance de Club (CLUB_ADMIN / PRESIDENT)](#scénario-2--président--gouvernance-club_admin)
   - [Scénario 3 : Entraîneur Principal / Staff Technique (COACH)](#scénario-3--entraîneur-principal-coach)
   - [Scénario 4 : Joueur du Roster Professionnel (PLAYER)](#scénario-4--joueur-roster-player)
   - [Scénario 5 : Trésorier & Gestionnaire Comptable (TREASURER)](#scénario-5--trésorier--finances-treasurer)
   - [Scénario 6 : Supporter / Fan Affilié (SUPPORTER)](#scénario-6--supporter--fan-supporter)
   - [Scénario 7 : Visiteur Public Non Authentifié (VISITOR)](#scénario-7--visiteur-public-non-authentifié)
5. [Contrôle Qualité Mobile, Responsive & Navigation Unifiée](#5-contrôle-qualité-mobile--navigation-unifiée)
6. [Grille Récapitulative d'Émargement (Checklist)](#6-grille-récapitulative-démargement)

---

## 1. RAPPORT D'AUDIT TECHNIQUE & CORRECTIFS RÉCENTS

### 1.1 Architecture & Dual-Mode
L'application repose sur deux modes d'expérience distincts et synchronisés :
1. **Mode Réseau Social (`viewMode === 'social'`)** : Dédié au public, aux fans et à la communauté basketball du Togo. Inclut le fil d'actualité en direct, l'explorateur de talents, les stories/reels de dunks, le calendrier général, les réservations de terrains et la boutique officielle.
2. **Mode Club Workspace (`viewMode === 'club_workspace'`)** : Siège d'opération privé d'une franchise de basketball (ex: FIRE STONE, Swallows, Modèle de Lomé). Inclut 11 modules métiers spécialisés (Roster 3D, Scouting, Académie, Match Center Q1-Q4, Brackets tournois, Trésorerie FCFA, Messagerie vestiaire, QG gouvernance).

### 1.2 Résolution du Problème de Double Hamburger sur Mobile
- **Diagnostic** : Dans le mode Espace Club, le composant `Sidebar.tsx` et le composant `Navbar.tsx` affichaient simultanément chacun leur propre barre supérieure mobile et leur propre bouton hamburger (`<Menu />`), empilant deux en-têtes et deux menus déroulants sur les écrans tactiles.
- **Correction Appliquée** :
  - `Navbar.tsx` a été configuré en `hidden lg:block` (exclusivement actif sur grand écran pour la barre de recherche et le profil rapide).
  - `Sidebar.tsx` est désormais l'**unique gestionnaire de l'en-tête mobile**, avec un design épuré, l'écusson dynamique du club, le bouton de retour Ligue, le badge de notifications et un **seul et unique bouton hamburger stylisé**.

### 1.3 Prise en Charge Complète de la PWA Mobile
- **Diagnostic** : L'invite d'installation PWA (`beforeinstallprompt`) ne s'affichait pas sur certains smartphones accédant via le réseau Wi-Fi local HTTP, et aucun déclencheur manuel n'était mis à disposition de l'utilisateur.
- **Correction Appliquée** :
  - `public/manifest.json` et `public/manifest.webmanifest` ont été enrichis avec les identifiants requis (`id: "/?source=pwa"`), le mode `display_override` et les icônes `maskable` 192x192 et 512x512 conformes aux exigences strictes de Google Chrome sur Android.
  - Création d'un déclencheur universel `triggerPwaInstall()` accessible via un bouton flottant mobile, dans la barre latérale du club, ainsi que dans le menu "Plus" de la barre de navigation basse `MobileNavBar`.
  - Intégration d'un modal d'accompagnement interactif avec guides visuels détaillés pour **Android** (menu ⋮ ➔ "Installer l'application") et **iPhone / iOS** (bouton Partager ⎋ ➔ "Sur l'écran d'accueil").

---

## 2. MATRICE DES COMPTES DE TEST & IDENTIFIANTS OFFICIELS

Tous les comptes de démonstration pré-configurés partagent le mot de passe unifié :
> **Mot de passe universel de test :** `FireStone2026!`

| # | Profil de Test | Adresse Email | Rôle Système | Périmètre & Droits Principaux |
|---|---|---|---|---|
| **1** | **Super Admin** | `superadmin@firestone.com` | `SUPER_ADMIN` | Accès global plateforme, console Super Admin, Team Designer IA, validation des franchises. |
| **2** | **Président de Franchise** | `clubadmin@firestone.com` | `CLUB_ADMIN` | Direction du club, approbation des membres, charte graphique IA, matrice RBAC. |
| **3** | **Entraîneur Principal** | `coach@firestone.com` | `COACH` | Gestion de l'effectif, attribution des badges de match, fiches de scouting, tactiques. |
| **4** | **Joueur Titulaire** | `marcus.vance@firestone.com` | `PLAYER` | Accès feuille de match, messagerie vestiaire, consultation des badges, signalement de blessure. |
| **5** | **Trésorier du Club** | `sophie.laurent@firestone.com` | `TREASURER` | Gestion de la caisse FCFA (XOF), enregistrement des recettes/dépenses, justificatifs. |
| **6** | **Supporter Officiel** | `supporter@firestone.com` | `SUPPORTER` | Feed social, réactions, commentaires, billetterie, actualités club. |
| **7** | **Visiteur Public** | *(aucun / navigation anonyme)* | `VISITOR` | Découverte du portail public, scores, cartographie des terrains, incitation connexion. |

---

## 3. GUIDE D'INSTALLATION MOBILE & PWA

Pour tester l'application directement sur smartphone avec l'icône HD et le mode plein écran (comme une application APK native) :

### Sur Android (Google Chrome, Brave, Samsung Internet)
1. Ouvrez le navigateur mobile et naviguez vers l'URL de votre serveur (ex: `http://192.168.x.x:5173` ou URL de déploiement).
2. Deux options pour installer :
   - **Option A** : Appuyez sur le bouton flottant **« 📱 Installer l'App »** qui apparaît en bas à droite de l'écran.
   - **Option B** : Appuyez sur les **3 petits points ⋮** en haut à droite du navigateur, puis choisissez **« Installer l'application »** (ou « Ajouter à l'écran d'accueil »).
3. Confirmez l'installation.
4. L'icône officielle **HOOPER** apparaît instantanément sur votre écran d'accueil avec son écusson officiel et s'ouvre en **plein écran sans barre d'adresse**.

### Sur iPhone / iPad (Safari)
1. Ouvrez la page dans **Safari**.
2. Appuyez sur le bouton **Partager** (icône carrée avec une flèche vers le haut ⎋ dans la barre inférieure).
3. Faites défiler la liste vers le bas et sélectionnez **« Sur l'écran d'accueil »** (icône avec un carré +).
4. Appuyez sur **« Ajouter »** en haut à droite.
5. L'icône est créée et l'application s'exécute en mode Standalone iOS.

---

## 4. PROTOCOLE DE RECETTE PAS À PAS

Exécutez les tests compte par compte dans l'ordre indiqué ci-dessous.

---

### SCÉNARIO 1 : SUPER ADMINISTRATEUR (`SUPER_ADMIN`)
> **Identifiant** : `superadmin@firestone.com`  
> **Mot de passe** : `FireStone2026!`

- [ ] **1.1 Connexion Super Admin** :
  - Ouvrir la fenêtre d'authentification (bouton "Se connecter").
  - Saisir l'adresse et le mot de passe.
  - *Résultat attendu* : Connexion immédiate, avatar affiché, badge `SUPER_ADMIN` visible.
- [ ] **1.2 Accès Console Super Admin** :
  - Depuis la barre latérale ou le menu mobile, cliquer sur **« Super Admin Console »**.
  - *Résultat attendu* : Accès aux métriques globales de la plateforme (utilisateurs, clubs enregistrés, transactions).
- [ ] **1.3 AI Team Designer** :
  - Cliquer sur l'onglet **« AI Team Designer »**.
  - Vérifier que cet onglet est accessible (réservé aux Super Admins).
  - Générer un aperçu de maillot ou modifier un élément d'identité.
  - *Résultat attendu* : Le rendu visuel 3D/canvas s'actualise correctement.
- [ ] **1.4 Déconnexion** :
  - Cliquer sur le profil en bas de barre latérale (ou dans le menu mobile) et appuyer sur l'icône de déconnexion.
  - *Résultat attendu* : Déconnexion propre, retour en mode visiteur public.

---

### SCÉNARIO 2 : PRÉSIDENT & GOUVERNANCE (`CLUB_ADMIN`)
> **Identifiant** : `clubadmin@firestone.com`  
> **Mot de passe** : `FireStone2026!`

- [ ] **2.1 Connexion & Entrée dans le Workspace** :
  - Se connecter avec les identifiants Président.
  - Dans le menu ou sur la fiche club, cliquer sur **« Espace Gestion Club »** (ou « Gérer mon club »).
  - *Résultat attendu* : Bascule immédiate vers le mode franchise sombre avec les couleurs de la franchise.
- [ ] **2.2 Module QG & Administration Club (`club-admin`)** :
  - Accéder à l'onglet **« Gérer mon club »**.
  - **Onglet 1 (Effectif & Hiérarchie)** :
    - Vérifier la liste des membres affiliés.
    - Tester le changement de rôle d'un membre via la liste déroulante (ex: passer un membre de `MEMBER` à `COACH`).
    - Tester l'approbation d'un membre en attente (badge vert "Valider").
  - **Onglet 2 (Identité Visuelle & Couleurs)** :
    - Tester les palettes prédéfinies (Lomé Hawks, Étoile Noire, Atlantic Surge).
    - Vérifier que la carte pass en direct et le mockup du terrain s'ajustent aux couleurs sélectionnées.
    - Cliquer sur "Enregistrer la Charte Graphique" et vérifier le message de confirmation.
  - **Onglet 3 (Arène & Coordonnées)** :
    - Modifier le nom de l'arène (ex: "Palais des Sports de Lomé") ou la devise du club.
    - Enregistrer les modifications.
  - **Onglet 4 (Matrice RBAC & Sécurité)** :
    - Vérifier la délimitation claire des privilèges par rôle (Président, Admin, Coach, Trésorier, Roster).
- [ ] **2.3 Invitation d'un Nouveau Collaborateur** :
  - Cliquer sur le bouton **« Inviter un Collaborateur »**.
  - Renseigner un nom fictif (ex: "Koffi Mensah"), un email et choisir le rôle `PLAYER`.
  - Valider l'envoi de l'invitation.
  - *Résultat attendu* : Toast vert de confirmation d'envoi.

---

### SCÉNARIO 3 : ENTRAÎNEUR PRINCIPAL (`COACH`)
> **Identifiant** : `coach@firestone.com`  
> **Mot de passe** : `FireStone2026!`

- [ ] **3.1 Connexion Coach** :
  - Se connecter en tant que Coach Vance.
  - *Résultat attendu* : Accès aux onglets sportifs et d'entraînement.
- [ ] **3.2 Effectif & Roster 3D (`equipe`)** :
  - Ouvrir l'onglet **« Effectif & Staff »**.
  - Parcourir les cartes 3D des joueurs (titulaires vs banc).
  - Cliquer sur un joueur pour inspecter son radar individuel de compétences et ses box scores.
- [ ] **3.3 Attribution de Badges de Mérite (`badges`)** :
  - Ouvrir l'onglet **« Badges & Distinctions »**.
  - Sélectionner un joueur éligible et cliquer sur **« Décerner un Badge »**.
  - Choisir une catégorie (ex: "Sniper à 3-Points" ou "Capitaine Exemplaire") et saisir un motif.
  - Valider l'attribution.
  - *Résultat attendu* : Le badge s'ajoute au dossier d'honneur du joueur avec confirmation visuelle.
- [ ] **3.4 Scouting & Fiches de Détection (`scouting`)** :
  - Ouvrir l'onglet **« Scouting & Analyse »**.
  - Tester les filtres par poste (Meneur, Pivot, Ailier) et par potentiel NBA/BAL.
  - Utiliser l'arène de comparaison head-to-head pour confronter 2 prospects sur le radar bicolore.
- [ ] **3.5 Académie U16-U20 (`academie`)** :
  - Ouvrir l'onglet **« Centre de Formation »**.
  - Consulter les dates de détection régionale et lancer la lecture d'une vidéo technique dans le théâtre intégré.

---

### SCÉNARIO 4 : JOUEUR DU ROSTER PROFESSIONNEL (`PLAYER`)
> **Identifiant** : `marcus.vance@firestone.com`  
> **Mot de passe** : `FireStone2026!`

- [ ] **4.1 Connexion Joueur** :
  - Se connecter avec le compte de Marcus Vance.
  - Vérifier l'avatar et le rôle `PLAYER` dans le profil.
- [ ] **4.2 Fiche Joueur Personnelle (`mon-profil`)** :
  - Ouvrir l'onglet **« Mon Profil »**.
  - Vérifier l'affichage des moyennes personnelles (Points, Rebonds, Passes, Évaluation).
  - Consulter la collection personnelle de badges débloqués.
- [ ] **4.3 Vestiaire & Messagerie Équipe (`messagerie`)** :
  - Ouvrir l'onglet **« Messagerie Équipe »**.
  - Vérifier l'accès au canal général et au canal tactique.
  - Envoyer un message de test dans le fil (ex: "Bien reçu pour l'entraînement de demain 18h !").
  - *Résultat attendu* : Le message apparaît instantanément avec l'avatar et le badge Joueur.
- [ ] **4.4 Match Center & Préparation (`matchs`)** :
  - Consulter les scores récents et le prochain match officiel programmé.

---

### SCÉNARIO 5 : TRÉSORIER & FINANCES (`TREASURER`)
> **Identifiant** : `sophie.laurent@firestone.com`  
> **Mot de passe** : `FireStone2026!`

- [ ] **5.1 Connexion Trésorier** :
  - Se connecter en tant que Sophie Laurent.
- [ ] **5.2 Dashboard Financier FCFA (`finances`)** :
  - Ouvrir l'onglet **« Trésorerie & Cotisations »**.
  - Vérifier le solde disponible affiché en Francs CFA (XOF).
  - Inspecter les graphiques de cashflow mensuel et la répartition des dépenses (salaires, équipement, arène).
- [ ] **5.3 Enregistrement d'une Transaction Comptable** :
  - Cliquer sur **« Nouvelle Transaction »**.
  - Saisir une opération (ex: "Achat ballons Molten BG4500", montant: "150 000 FCFA", type: Dépense).
  - Valider l'enregistrement.
  - *Résultat attendu* : La ligne s'ajoute au grand livre comptable avec recalcul instantané des totaux.

---

### SCÉNARIO 6 : SUPPORTER / FAN AFFILIÉ (`SUPPORTER`)
> **Identifiant** : `supporter@firestone.com`  
> **Mot de passe** : `FireStone2026!`

- [ ] **6.1 Flux Social & Fil d'Actualité (`accueil`)** :
  - Naviguer sur le portail social public.
  - Liker une publication, publier un commentaire d'encouragement sous un highlight de match.
- [ ] **6.2 Tournois & Compétitions (`tournois`)** :
  - Consulter l'arbre de tournoi (tableau éliminatoire) et le classement général des franchises togolaises.
- [ ] **6.3 Terrains de Basket Togo (`terrains`)** :
  - Ouvrir la cartographie interactive.
  - Filtrer par région (ex: "Maritime / Lomé" ou "Kara").
  - Consulter la fiche technique d'un terrain (panneaux, revêtement, créneaux libres).

---

### SCÉNARIO 7 : VISITEUR PUBLIC NON AUTHENTIFIÉ
> **Statut** : Anonyme (sans compte)

- [ ] **7.1 Consultation Libre** :
  - Naviguer sur le site en mode navigation privée (sans cookie de session).
  - Consulter les scores en direct, les classements et les fiches publiques de clubs.
- [ ] **7.2 Protection des Espaces Privés** :
  - Tenter d'accéder à la trésorerie ou à l'administration du club.
  - *Résultat attendu* : Redirection propre vers la modal de connexion / inscription avec message explicatif.

---

## 5. CONTRÔLE QUALITÉ MOBILE & NAVIGATION UNIFIÉE

Pour valider l'expérience sur smartphone (résolution < 768px ou émulateur Chrome DevTools en mode mobile) :

- [ ] **5.1 Absence Totale de Double Hamburger** :
  - Basculer en mode mobile (ex: iPhone 14 Pro ou Pixel 7).
  - Entrer dans le Club Workspace.
  - **Vérifier le haut de l'écran** : Il ne doit y avoir **qu'un seul et unique en-tête**, avec **un seul bouton hamburger** (icône ☰).
  - La Navbar desktop ne doit pas apparaître au-dessus ni en-dessous.
- [ ] **5.2 Comportement du Tiroir Latéral Mobile** :
  - Appuyer sur l'icône hamburger ☰.
  - *Résultat attendu* : Le menu latéral s'ouvre de manière fluide avec fond flouté, l'icône se transforme en croix ✕.
  - Cliquer sur un onglet : la page se charge et le tiroir se referme automatiquement.
  - Cliquer sur la zone sombre hors du tiroir : le tiroir se referme immédiatement.
- [ ] **5.3 Barre de Navigation Inférieure (`MobileNavBar`)** :
  - Vérifier les onglets rapides au bas de l'écran (Accueil, Matchs, Équipe, Vestiaire).
  - Appuyer sur le bouton **« Plus »** à droite : le panneau tactile s'ouvre avec la liste complète des services et le bouton **« 📥 Installer l'App »**.
- [ ] **5.4 Test de l'Installation PWA depuis le Menu Mobile** :
  - Appuyer sur le bouton "Installer l'App" (soit dans l'en-tête, soit dans le menu Plus, soit via le badge flottant).
  - Vérifier l'ouverture du modal avec les onglets Android et iOS bien expliqués.

---

## 6. GRILLE RÉCAPITULATIVE D'ÉMARGEMENT

| Module Testé | Scénario Clé | Validé par | Statut |
|---|---|---|:---:|
| **Navigation Mobile** | Hamburger unique & tiroir fluide | Testeur Mobile | [ ] OK |
| **PWA Mobile** | Modal d'installation & guides OS | Testeur Mobile | [ ] OK |
| **Super Admin** | Console système & AI Designer | QA Lead | [ ] OK |
| **Présidence / QG** | Charte graphique IA & RBAC | QA Lead | [ ] OK |
| **Staff & Coach** | Attribution Badges & Scouting | QA Lead | [ ] OK |
| **Effectif Roster** | Fiche joueur & Box scores 3D | QA Lead | [ ] OK |
| **Match Center** | Scores Q1-Q4 & Highlights | QA Lead | [ ] OK |
| **Trésorerie** | Entrées/sorties FCFA & grand livre | QA Lead | [ ] OK |
| **Vestiaire** | Messagerie d'équipe & pièces jointes | QA Lead | [ ] OK |
| **Terrains Togo** | Radar 5 régions & réservations | QA Lead | [ ] OK |

---
*Document généré pour la recette officielle de la plateforme HOOPER 2026.*
