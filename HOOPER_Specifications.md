# HOOPER Platform - Cahier des Charges Complet

**Réseau Social Basketball + Gestion Club Multi-Rôles**

Généré le : 21/09/2026 | Version 1.0 (Temporaire)

---

## Table des Matières

1. [Résumé Exécutif](#résumé-exécutif)
2. [Exigences Fonctionnelles par Rôle](#exigences-fonctionnelles-par-rôle)
3. [Workflows d'Inscription Détaillés](#workflows-dinscription-détaillés)
4. [Système de Permissions RBAC](#système-de-permissions-rbac)
5. [Solutions Techniques](#solutions-techniques)
6. [Cartographie & Infrastructures](#cartographie--infrastructures)
7. [Système de Design Automatisé](#système-de-design-automatisé)
8. [Recommandations UI/UX](#recommandations-uiux)
9. [Architecture Modulaire & Sécurisée](#architecture-modulaire--sécurisée)
10. [Plan d'Implémentation](#plan-dimplémentation)

---

## Résumé Exécutif

### Vision Globale

HOOPER est une plateforme intégrée de basket-ball qui unifie :
- **Réseau social public** : Feed, exploration, actualités
- **Espace de gestion de club** : Workspace dédié avec contrôle d'accès
- **Système multi-rôles** : 7 profils distincts avec workflows adaptés
- **Solutions techniques** : Messagerie, billetterie, e-commerce, cartographie

### Objectifs Clés

✅ Supporter 7 rôles distincts avec workflows d'inscription adapté  
✅ Implémenter RBAC (Role-Based Access Control) granulaire  
✅ Intégrer workspace de club, messagerie, billetterie, e-commerce  
✅ Cartographier les terrains avec géolocalisation interactive  
✅ Assurer UX cohérente multi-plateforme (mobile, tablet, desktop)  
✅ Garantir sécurité & modularité architecturale  
✅ Système de design automatisé basé sur logo du club  

### Principes Clés

1. **Moindre Privilège** : Chaque rôle n'accède qu'à ses ressources nécessaires
2. **Contextualisation** : Formulaires & interfaces adaptés au rôle
3. **Modularité** : Séparation claire social vs club_workspace
4. **Feedback Utilisateur** : Communication claire du statut des demandes
5. **Accessibilité** : Design adaptatif (mobile-first)
6. **Design System** : Cohérence visuelle générée automatiquement

---

## Exigences Fonctionnelles par Rôle

### 2.1 - COACH

#### Workflow d'Inscription

```
1. Coach choisit son rôle au départ (liste déroulante)
2. Champ "Club affilié" apparaît dynamiquement
3. Coach sélectionne le club dans la liste disponible
4. Remplit le formulaire Coach (infos personnelles, expérience, certificats)
5. Soumet la demande → Status PENDING → Admin club reçoit notification
```

#### Droits & Permissions

✅ Gestion roster (voir joueurs, éditer fiches)  
✅ Création & remplissage feuilles de match  
✅ Accès tactiques & formations  
✅ Gestion recrutement & candidatures  
❌ Finances, approuver adhésions formelles, super admin  

---

### 2.2 - DIRIGEANT (Club Admin)

#### Workflow d'Inscription

```
1. Choisit rôle "Dirigeant" → question "Créer un nouveau club?"
2. Si OUI :
   - Remplit dossier création club (nom, logo, photo terrain, adresse)
   - Upload logo (système design auto-généré activé)
   - Devient ADMIN automatique du club créé
   - Droits étendus SUR SON CLUB UNIQUEMENT
3. Si NON : Rejoint club existant → workflow similaire à Coach
```

#### Droits & Permissions

✅ TOUS droits sur son club uniquement  
✅ Gestion joueurs (ajouter, éditer, suspendre)  
✅ Création événements, matchs, tournois  
✅ Finances & budgets  
✅ Approuver/rejeter adhésions  
✅ Gestion sponsors & billetterie  
❌ Gérer AUTRE club, modifier système global  

---

### 2.3 - JOUEUR

#### Workflow d'Inscription

**CAS A - Auto-inscription :**
```
1. Choisit "Joueur" → sélectionne club
2. Remplit formulaire joueur
3. Soumet → Status PENDING → Admin approve
```

**CAS B - Invitation Admin :**
```
1. Admin du club ajoute joueur (email + nom)
2. Génère mot de passe temporaire
3. À première connexion : Redirection page paramètres
4. Changement password obligatoire
5. Connexions suivantes : Mode standard
```

#### Droits & Permissions

✅ Accès workspace du club  
✅ Voir roster & autres joueurs  
✅ Chat équipe  
✅ Éditer propre profil (stats, bio)  
✅ Voir matchs, tournois du club  
❌ Gérer autres joueurs, finances, approuver adhésions  

---

### 2.4 - SPONSOR

#### Workflow d'Inscription

```
1. Choisit "Sponsor" → remplit formulaire (type sponsor, budget, domaine)
2. Question : "Voulez-vous sponsoriser une équipe?" OUI/NON
3. Si OUI :
   - Affiche liste clubs avec stats (nombre joueurs, palmares, etc.)
   - Clique sur club → Devient "Sponsor officiel" de ce club
   - Workspace club affiche Sponsor actif
   - Notification 24h automatique annonce nouveau sponsor
```

#### Droits & Permissions

✅ Voir clubs & détails (stats publics)  
✅ Devenir sponsor officiel  
✅ Voir espace dédié sponsor dans workspace  
❌ Gérer joueurs, finances, créer contenu  

---

### 2.5 - CANDIDAT (Centre de Formation)

#### Workflow d'Inscription

```
1. Choisit "Candidat académie" → sélectionne club
2. Remplit formulaire candidature (CV, vidéo perfs, test physiques)
3. Admin club reçoit candidature → accepte/rejette
4. Si accepté : Accès centre de formation du club
```

#### Droits & Permissions

✅ Accès page académie publique  
✅ Consulter résultats candidature  
❌ Accéder workspace tant que non accepté  

---

### 2.6 - SUPPORTER / FAN (Visiteur Connecté)

#### Workflow d'Inscription

```
1. Choisit "Supporter" → remplit infos basiques
2. Aucune affiliation club requise
3. Accès immédiat au mode social public
```

#### Droits & Permissions

✅ Lire feed public  
✅ Voir clubs, matchs, photos  
✅ Commenter posts  
✅ Acheter billets matchs publics  
❌ Accès workspace, gestion club  

---

### 2.7 - VISITEUR (Non-Connecté)

#### Accès

```
• Feed public (lecture seule)
• Clubs & matchs publics
• Photos & actualités
```

#### Permissions

✅ Lire contenu public  
❌ Commenter, liker, chat, accès workspace  

---

## Workflows d'Inscription Détaillés

### Bonnes Pratiques UX Multi-Rôles

#### 1. Questionner le Rôle Dès le Départ

**Écran 1 : Sélection du rôle**
```
┌─────────────────────────────────┐
│  Quel type d'utilisateur êtes-  │
│         vous?                   │
├─────────────────────────────────┤
│  ○ Coach                        │
│  ○ Dirigeant (Admin Club)       │
│  ○ Joueur                       │
│  ○ Sponsor                      │
│  ○ Candidat (Académie)          │
│  ○ Supporter                    │
│  ○ Visiteur                     │
└─────────────────────────────────┘
```

Adaptez dynamiquement les champs suivants selon le choix.

#### 2. Formulaire Contextualisé

| Rôle | Champs Dynamiques |
|------|------------------|
| COACH | Infos perso + "Club affilié" (dropdown) |
| DIRIGEANT | Infos + "Créer club?" (OUI/NON) → Si OUI : dossier complet |
| JOUEUR | Infos + "Club affilié" (dropdown) |
| SPONSOR | Infos + type sponsor + budget + question sponsoring |
| CANDIDAT | Infos + "Club affilié" + CV/vidéo |
| SUPPORTER | Infos basiques uniquement |

#### 3. Clarté & Hiérarchie Visuelle

- **Sections distinctes** : Infos personnelles | Infos club | Options sponsoring
- **Repères visuels** : Couleurs, ombres, espacements (selon design system)
- **Champs obligatoires** : Clairement indiqués avec `*`
- **Mobile** : Contenu adapté sans encombre, responsive design
- **Spacing** : Respirer les sections, pas surcharger

#### 4. Feedback Immédiat

Après soumission :

```
COACH :
✓ "Votre inscription en tant que COACH a été envoyée 
  au club [Nom] pour approbation."

DIRIGEANT (création club) :
✓ "Bravo! Votre club [Nom] a été créé. 
  Vous êtes administrateur. Logo importé & design 
  system généré."

JOUEUR (auto-inscription) :
✓ "Votre candidature a été envoyée au club. 
  Vous serez notifié de la décision."

JOUEUR (invitation admin) :
✓ "Bienvenue! Un email temporaire vous a été envoyé. 
  À votre première connexion, vous devrez changer 
  votre mot de passe."

SPONSOR :
✓ "Vous êtes maintenant sponsor officiel de [Club]. 
  Une notification d'annonce a été envoyée aux membres."

CANDIDAT (refusé) :
✗ "Votre candidature a été considérée. 
  Raison du refus : [détail]. Vous pouvez réessayer 
  l'année prochaine."
```

---

## Système de Permissions RBAC

### Matrice de Permissions Granulaires

**Format** : `resource:action` (ex: `players:read`, `players:write`, `players:approve`)

| Rôle | Permissions |
|------|------------|
| **VISITEUR** | `club:read` (publics), `posts:read` (publics) |
| **SUPPORTER** | `club:read`, `posts:read`, `posts:comment`, `posts:like`, `tickets:read` |
| **CANDIDAT** | `club:read`, `academy:read`, `academy:apply`, `posts:read` |
| **JOUEUR** | `club:read`, `players:read`, `players:write` (self), `matches:read`, `messaging:read/write` |
| **COACH** | `club:read`, `players:read/write`, `matches:read/write`, `academy:read/write`, `tactics:read` |
| **SPONSOR** | `club:read`, `sponsors:write` (self), `sponsorships:read` |
| **ADMIN/DIRIGEANT** | Tous sauf `admin:write`. Approuver adhésions, suspendre joueurs, gérer tout pour son club |
| **SUPER_ADMIN** | `admin:read`, `admin:write` (TOUT) |

### Implémentation Centralisée

```typescript
// Moteur politique RBAC centralisé
const rolePermissionMap = {
  VISITOR: ['club:read'],
  SUPPORTER: ['club:read', 'posts:read', 'posts:comment', 'posts:like', 'tickets:read'],
  PLAYER: ['club:read', 'players:read', 'players:write:self', 'matches:read', 'messaging:rw'],
  COACH: ['club:read', 'players:rw', 'matches:rw', 'academy:rw', 'tactics:read'],
  SPONSOR: ['club:read', 'sponsors:write:self', 'sponsorships:read'],
  ADMIN: ['club:rw', 'players:rw', 'matches:rw', 'academy:rw', 'finance:read', 'sponsors:read'],
  SUPER_ADMIN: ['admin:rw'] // TOUS
};

// Propagation automatique : mise à jour rôle = mise à jour permissions
```

**Bénéfices** :
1. Mise à jour rôle propage automatiquement les permissions
2. Vérification côté serveur OBLIGATOIRE
3. Frontend adapte UI selon permissions (masquer/montrer actions)

---

## Solutions Techniques

### 5.1 - WORKSPACE DE CLUB

**Description** : Espace dédié connecté aux pages sociales. Membre du club reconnu automatiquement & authentifié.

**Contenu** :
- Calendrier prochains matchs & tournois
- Dashboard with stats (joueurs, performances)
- Roster gestion
- Financials & budgets
- Sponsors actifs (notification 24h)
- Centre de formation (si applicable)

**Architecture** :
- Sous-domaine distinct OU module React interconnecté
- Contrôle d'accès basé sur `ClubMember.status = ACTIVE`
- Transparent interconnexion avec pages sociales

---

### 5.2 - MESSAGERIE

#### Messagerie de Club (Group Chat)

- Tous les membres du club (joueurs, coachs, dirigeants) dans 1 chat groupe
- Facilite annonces rapides (matchs, changements)
- Similaire à TeamSnap ou Slack
- Notifications en temps réel

#### Messagerie Sociale (Direct Messages)

- Messages privés entre utilisateurs (hors contexte club)
- Limité aux contacts établis sur plateforme
- Système messaging interne standard
- Historique persistant

**Technologies** : Socket.io pour temps réel, persistance DB, notifications push

---

### 5.3 - BILLETTERIE (Ticketing)

#### Approche Mobile-First

```
Entièrement dématérialisée
↓
Chaque billet = Code QR unique + reçu
↓
Code QR scannable à l'événement OU imprimable papier
```

#### Fonctionnalités

✅ Billets gratuits & payants  
✅ Module paiement sécurisé intégré  
✅ Suivi historique achats  
✅ Notifications pré-match  
✅ Transferts billets (optionnel)  

---

### 5.4 - BOUTIQUE EN LIGNE (E-Commerce)

#### Contenu & Structure

- Articles sport uniquement (équipements, maillots, accessoires)
- Chaque article : photo, description, prix
- Variations (taille, couleur, quantité)
- Filtrages par catégorie, prix, note

#### Panier & Commande

- Panier persistant (DB, pas localStorage seul)
- Consultation historique commandes
- Intégration paiement sécurisé
- Suivi expédition / livraison

---

## Cartographie & Infrastructures

### Technologie

Carte interactive géolocalisée : **Google Maps API** | **Mapbox** | **OpenStreetMap**

### Données Terrains

- Club fournit photos/vidéos terrain liées à position géographique
- Marqueur sur carte → Fiche terrain (photo, nom, équipes, description)
- Info additionelle : superficie, type gazon, horaires, conditions accès

### Visualisation 3D (Optionnel)

- Système "plan de visite" : Google Street View-like OU image 360°
- Permet aux utilisateurs se repérer visuellement
- Améliore découverte des terrains

### Couverture Togo

- Utiliser fonds de carte détaillés du Togo
- Enrichir données locales (emplacement précis, photos récentes)
- Outils génériques peuvent manquer de précision en régions

---

## Système de Design Automatisé

### Vision

Un système de design **épuré, efficace, propre** qui se génère automatiquement à partir du logo du club uploadé.

### Architecture du Système

#### Phase 1 : Analyse du Logo

```javascript
// À l'upload du logo
1. Extraire couleurs dominantes (3-5 couleurs)
2. Calculer luminance & saturation
3. Identifier couleur primaire (dominant)
4. Identifier couleur secondaire (accent)
5. Identifier couleur tertiaire (support)
```

#### Phase 2 : Génération Palette Automatique

```
Couleur Primaire (du logo)
├─ Primary: Couleur exacte
├─ Primary Light: Variante claire (-20% luminance)
├─ Primary Dark: Variante sombre (+20% luminance)
├─ Primary Tint: Très claire (pour backgrounds)
└─ Primary Shade: Très foncée (pour texte)

Couleur Secondaire (accent)
├─ Secondary: Couleur extraite
├─ Secondary Light: Variante claire
└─ Secondary Dark: Variante sombre

Neutres (Auto-générés)
├─ Noir: #090A0F (très foncé, texte principal)
├─ Gris 1: #1F2937 (backgrounds sombres)
├─ Gris 2: #374151 (elements)
├─ Gris 3: #6B7280 (texte secondaire)
├─ Gris 4: #9CA3AF (borders)
├─ Gris 5: #E5E7EB (backgrounds clairs)
├─ Blanc: #FFFFFF (surfaces)
└─ Transparent: rgba(0,0,0,0) (overlays)
```

#### Phase 3 : Sélection du Thème

```
Analyse du logo :

SI couleur primaire luminance > 60%
  → Thème CLAIR (fond blanc, texte noir)
SINON
  → Thème SOMBRE (fond très foncé, texte blanc)

SI saturation couleur primaire > 70%
  → Design VIBRANT (secondary color utilisée généreusement)
SINON
  → Design MINIMAL (secondary color utilisée sparingly)
```

---

### Palette Finale (Exemple)

**Si Logo = Orange Vif (#FF6B35)**

```
Primaire (Orange)
├─ Primary (#FF6B35) - Logo exact
├─ Primary Light (#FFD4B3) - Backgrounds
├─ Primary Dark (#CC4A1F) - Hover states
└─ Primary Tint (#FFF3EA) - Très clair

Secondaire (Bleu complémentaire auto-généré)
├─ Secondary (#0066CC) - Accent
├─ Secondary Light (#CCE5FF) - Hover
└─ Secondary Dark (#003D99) - Sombre

Neutres
├─ Text Primary (#090A0F) - Noir
├─ Text Secondary (#6B7280) - Gris
├─ Background (#FFFFFF) - Blanc
├─ Border (#E5E7EB) - Très clair
└─ Surface (#F9FAFB) - Micro-surface
```

---

### Principes de Design Épuré & Efficace

#### 1. Monocolor avec Nuances

```
Utiliser UNE couleur primaire + 4 nuances :
Light Tint → Light → Base → Dark → Dark Shade

JAMAIS plus de 2 couleurs "fortes" au même endroit
```

#### 2. Espacements Réguliers

```
Système base 4px ou 8px :
  4px - Micro-spacing (padding intra-composant)
  8px - Spacing petit
  16px - Spacing standard
  24px - Spacing grand
  32px - Spacing très grand
  48px - Spacing section

Consistance = Efficacité visuelle
```

#### 3. Typographie Minimaliste

```
Famille : 1-2 polices max (ex: Inter + Poppins)
  Inter : Corps & texte long (lisibilité)
  Poppins : Titres & headlines (caractère)

Poids : Regular (400) + Bold (600) + Semi-bold (500)
  Jamais 3+ poids différents par page

Tailles :
  H1 : 32px (headlines principales)
  H2 : 24px (sous-titres)
  H3 : 18px (petits titres)
  Body : 14px ou 16px (texte standard)
  Small : 12px (labels, captions)
```

#### 4. Profondeur Subtile

```
Pas de couleurs criardes. 
Utiliser ombres pour hiérarchie :
  Elevation 1 : 0 1px 3px rgba(0,0,0,0.1)
  Elevation 2 : 0 4px 6px rgba(0,0,0,0.1)
  Elevation 3 : 0 10px 15px rgba(0,0,0,0.1)

Ombres color-blind friendly
```

#### 5. Cohérence & Prévisibilité

```
Éléments simples & reconnaissables :
  Boutons : Couleur primaire, pas de border
  Cards : Blanc + ombre légère
  Inputs : Border gris clair (#E5E7EB)
  Icons : 24px ou 32px, une seule couleur
  Borders : #E5E7EB, 1px max
```

---

### Génération du Design System Complet

**À chaque création de club, générer :**

```
/design-system/{clubId}/
├── colors.json          # Palette générée
├── typography.css       # Fonts & tailles
├── spacing.css          # Systèmes espacements
├── elevation.css        # Ombres & profondeur
├── components.css       # Buttons, cards, inputs
├── tokens.js            # Variables CSS
└── guidelines.md        # Documentation
```

**CSS Variables** :

```css
:root {
  /* Couleurs */
  --color-primary: #FF6B35;
  --color-primary-light: #FFD4B3;
  --color-primary-dark: #CC4A1F;
  --color-primary-tint: #FFF3EA;
  
  --color-secondary: #0066CC;
  --color-text-primary: #090A0F;
  --color-text-secondary: #6B7280;
  --color-background: #FFFFFF;
  --color-border: #E5E7EB;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Typography */
  --font-family-body: 'Inter', sans-serif;
  --font-family-heading: 'Poppins', sans-serif;
  --font-size-body: 14px;
  --font-size-heading: 24px;
  
  /* Elevation */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}
```

---

### Application au Workspace

**Le workspace du club utilise AUTOMATIQUEMENT** :

```
Header:     Primary color background
Text:       Primary text color
Buttons:    Primary + hover (Primary Dark)
Accents:    Secondary color (sparingly)
Backgrounds: Primary Tint pour sections
Cards:      Blanc + Shadow small
```

**Résultat** : Design cohérent, efficace, **propre**, sans surcharge colorée.

---

## Recommandations UI/UX

### Design Adaptatif & Modulable

- ✅ Cohérent mobile, tablette, desktop
- ✅ Thèmes de couleur modulaires (auto-générés à partir logo club)
- ✅ Palettes contrastées & harmonieuses
- ✅ Mode clair & mode sombre équilibrés
- ✅ Respects WCAG 2.1 AA pour accessibilité

### Profils Sociaux Repensés

#### JOUEUR

- Statistiques + badges fusionnés (éviter redondance)
- Bouton visible "Accéder espace club" si affilié
- Timeline achievements & posts
- Stats comparatif (optionnel)

#### VISITEUR/FAN

- Infos publiques uniquement (achievements, actualités équipe)
- Pas de bouton navigation interne club
- Sections : About | Achievements | Teams | Posts

### Fil d'Actualité Interactif

- Commentaires imbriqués (nested threads) similaires à YouTube
- Indentation OU lignes de connexion pour clarté
- Limiter profondeur (2-3 niveaux max)
- Charger progressivement (bouton "Voir plus" ou lazy loading)
- Seules actions nécessaires (répondre, aimer/disliker)

### Live & Vidéo en Direct

- Flux vidéo HD du match (source interne ou partenaire)
- Scoreboard dynamique en temps réel
- Surimpression score + statistiques clés match
- Chat live intégré (optionnel)

---

## Architecture Modulaire & Sécurisée

### Séparation des Domaines

```
Domaine 1 : Social
├── Feed (actualités)
├── Explore (découverte)
├── Profiles (utilisateurs)
└── Controllers & APIs (social-specific)

Domaine 2 : Club Workspace
├── Dashboard
├── Roster
├── Matches
├── Financials
└── Controllers & APIs (club-specific)

Interconnexion
└── API Gateway + RBAC middleware
```

### Sécurité : Validation Côté Serveur

**Règle d'Or** : Même si Coach voit bouton "Ajouter joueur", backend refusera si actor ≠ admin

```javascript
// Frontend : Affiche bouton selon role
if (userRole === 'COACH' || userRole === 'ADMIN') {
  showButton('add-player');
}

// Backend : Valide permissions réelles
app.post('/api/players/add', 
  authenticateToken, 
  requirePermission('players:write'),
  requireClubOwnership, // Crucial !
  (req, res) => {
    // Action exécutée
  }
);
```

**Bénéfice** : Escalade privilèges **impossible**

### Frontend UX vs Backend Security

| Côté | Rôle | Effet |
|------|------|-------|
| **Frontend** | Masque/affiche actions selon rôle | UX (améliore expérience) |
| **Backend** | Valide permissions avant logique métier | Security (critique) |

### Testing des Permissions

```typescript
describe('RBAC Permissions', () => {
  it('COACH can read players', async () => {
    const res = await GET('/api/players', { role: 'COACH' });
    expect(res.status).toBe(200);
  });
  
  it('COACH cannot delete players', async () => {
    const res = await DELETE('/api/players/1', { role: 'COACH' });
    expect(res.status).toBe(403); // Forbidden
  });
  
  it('ADMIN can delete players in own club', async () => {
    const res = await DELETE('/api/players/1', 
      { role: 'ADMIN', clubId: '123' }
    );
    expect(res.status).toBe(200);
  });
});
```

---

## Plan d'Implémentation

### Phase 1 : Fondations (Semaines 1-4)

**Objectif** : Infrastructure & sécurité

- ☐ Implémenter workflows d'inscription pour 7 rôles
- ☐ Créer système RBAC centralisé (rolePermissionMap)
- ☐ Middleware authentification + autorisation backend
- ☐ Database schema : ClubMember, permissions, audit logs
- ☐ Tests unitaires RBAC

**Livrables** :
- System de création de compte multi-rôles
- Moteur d'autorisation fonctionnel
- Base de données structurée

---

### Phase 2 : Features Techniques (Semaines 5-12)

**Objectif** : Solutions techniques core

- ☐ Workspace de club (dashboard, roster, financials)
- ☐ Messagerie (group chat + DMs)
- ☐ Billetterie avec QR codes
- ☐ E-commerce (panier, checkout)
- ☐ Cartographie & géolocalisation terrains
- ☐ Intégration Socket.io pour temps réel

**Livrables** :
- Workspace fonctionnel
- Système messagerie temps réel
- Billetterie dématérialisée
- E-commerce opérationnel

---

### Phase 3 : Design System & UX (Semaines 13-18)

**Objectif** : Cohérence visuelle & expérience utilisateur

- ☐ Système de design automatisé (basé logo)
- ☐ CSS variables & tokens (design system)
- ☐ Redesign profils sociaux par rôle
- ☐ Fil d'actualité avec commentaires imbriqués
- ☐ Mode clair & sombre optimisés
- ☐ Responsive design (mobile-first)
- ☐ Icônes & illustrations cohérentes

**Livrables** :
- Design system complet & automatisé
- Interface cohérente & épurée
- Profils adaptés par rôle
- Mobile-friendly UI

---

### Phase 4 : Testing & Déploiement (Semaines 19-24)

**Objectif** : Qualité & stabilité

- ☐ Unit tests (permissions, workflows, RBAC)
- ☐ Integration tests (scenarios complets)
- ☐ E2E tests (Cypress pour chaque rôle)
- ☐ Performance testing (load tests)
- ☐ Security audit (penetration testing)
- ☐ User acceptance testing (UAT)
- ☐ Déploiement staging → production
- ☐ Monitoring & alerting

**Livrables** :
- Application testée & sécurisée
- Documentation d'utilisation
- Support utilisateur

---

## Checklist Technique Final

### Backend

- [ ] `authenticateToken()` middleware sur CHAQUE route protégée
- [ ] `requirePermission()` middleware avant logique métier
- [ ] Aucune donnée sensible (password, token) en API
- [ ] Input validation sur tous les paramètres
- [ ] Rate limiting sur login, register, club creation
- [ ] CORS whitelist origins
- [ ] HTTPS + HSTS headers
- [ ] JWT secret strong & rotation régulière
- [ ] AuditLog persisté en DB
- [ ] Passwords bcrypt + salt

### Frontend

- [ ] `canAccessPage()` guard sur CHAQUE route
- [ ] Pas de logique sensible côté client
- [ ] Fallback UI gracieuses (loading, erreurs)
- [ ] Validation formulaires (client + serveur)
- [ ] Responsive design testé
- [ ] Accessibilité WCAG 2.1 AA

### Database

- [ ] Schema ClubMember + statuses
- [ ] AuditLog table
- [ ] Permissions table (RBAC)
- [ ] Transactions pour cohérence
- [ ] Indices optimisés

### Testing

- [ ] Unit tests RBAC (100% coverage permissions)
- [ ] Integration tests workflows
- [ ] E2E tests Cypress (toutes les pages par rôle)
- [ ] Security tests (bypass attempts)

---

## Résumé Exécutif Final

HOOPER est une plateforme **riche en fonctionnalités**, **sécurisée**, et **épurée visuellement** :

✅ **7 rôles distincts** avec workflows adaptés  
✅ **RBAC granulaire** centralisé  
✅ **Workspace de club** intégré  
✅ **Messagerie temps réel** (group + DMs)  
✅ **Billetterie dématérialisée** avec QR  
✅ **E-commerce sportif** complet  
✅ **Cartographie interactive** des terrains  
✅ **Design system automatisé** basé logo  
✅ **Interface cohérente & épurée**  
✅ **Architecture modulaire & sécurisée**  

**Temps d'implémentation** : 6 mois (24 semaines)  
**Équipe estimée** : 4-6 développeurs + 1-2 designers  

---

**Document généré le 21/09/2026 | Version 1.0 (Temporaire)**
