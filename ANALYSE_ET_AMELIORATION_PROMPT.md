# ANALYSE ET AMÉLIORATION DU PROMPT MAÎTRE
## Plateforme Nationale du Basketball Togolais

---

## 📊 AUDIT DU PROMPT EXISTANT

### ✅ POINTS FORTS

1. **Vision claire et ambitieuse** - L'objectif final est bien défini
2. **Scope complet** - 45 sections couvrent 90% des cas d'usage
3. **Hiérarchisation MVP** - Les phases 1, 2, 3 sont définies
4. **Stack technologique** - Choix modernes et justifiés
5. **Pensée mobile-first** - Excellente approche
6. **Modération et sécurité** - Mentionnées
7. **Extensibilité** - Pensée pour d'autres sports/pays

### ⚠️ POINTS FAIBLES

| Problème | Impact | Solution |
|----------|--------|----------|
| Pas de définition des fichiers/dossiers | Organisation chaotique | Arborescence complète |
| Modèle de données vague | Risque de redesign | Schéma Prisma détaillé |
| Pas de patterns d'API | Incohérence | REST standardisé + GraphQL optionnel |
| Absence de CI/CD détaillé | Déploiement fragile | Pipeline GitHub Actions |
| Pas de stratégie d'erreur | UX mauvaise | Error handling global |
| Caching non défini | Perfs dégradées | Redis strategy |
| Pas de rate limiting | DDoS possible | Stratégie throttling |
| Gestion des médias vague | Stockage chaotique | Cloudinary + CDN |
| Tests non mentionnés | Code instable | Jest + Vitest + E2E |
| Monitoring absent | Blind in production | Sentry + LogRocket + Custom |

---

## 🏗️ ARCHITECTURE TECHNIQUE AMÉLIORÉE

### 1. ARBORESCENCE DU PROJET

```
basketball-togo-platform/
│
├── apps/
│   ├── web/                          # Frontend React
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── common/          # Boutons, modales, etc
│   │   │   │   ├── features/        # Composants métier
│   │   │   │   │   ├── auth/
│   │   │   │   │   ├── teams/
│   │   │   │   │   ├── players/
│   │   │   │   │   ├── matches/
│   │   │   │   │   ├── tournaments/
│   │   │   │   │   ├── feed/
│   │   │   │   │   ├── messages/
│   │   │   │   │   ├── recruitment/
│   │   │   │   │   └── analytics/
│   │   │   │   └── layout/          # Header, Nav, Footer
│   │   │   ├── pages/               # Page-level components
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   ├── store/               # Redux/Zustand
│   │   │   ├── services/            # API calls
│   │   │   ├── utils/               # Helper functions
│   │   │   ├── types/               # TypeScript types
│   │   │   ├── styles/              # Global + theme tokens
│   │   │   └── App.tsx
│   │   ├── public/
│   │   ├── tests/
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── package.json
│   │
│   ├── api/                         # Backend Node.js/NestJS
│   │   ├── src/
│   │   │   ├── main.ts              # Entry point
│   │   │   ├── app.module.ts        # Root module
│   │   │   ├── config/              # Configuration
│   │   │   │   ├── database.config.ts
│   │   │   │   ├── redis.config.ts
│   │   │   │   ├── auth.config.ts
│   │   │   │   └── env.validation.ts
│   │   │   ├── modules/             # Feature modules
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.module.ts
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── strategies/  # JWT, Google, etc
│   │   │   │   │   ├── guards/
│   │   │   │   │   └── dto/
│   │   │   │   ├── users/
│   │   │   │   ├── teams/
│   │   │   │   ├── players/
│   │   │   │   ├── matches/
│   │   │   │   ├── tournaments/
│   │   │   │   ├── feed/
│   │   │   │   ├── messages/
│   │   │   │   ├── recruitment/
│   │   │   │   ├── partnerships/
│   │   │   │   ├── sponsoring/
│   │   │   │   ├── venues/
│   │   │   │   ├── analytics/
│   │   │   │   ├── notifications/
│   │   │   │   ├── moderation/
│   │   │   │   └── admin/
│   │   │   ├── common/
│   │   │   │   ├── decorators/
│   │   │   │   ├── filters/         # Exception filters
│   │   │   │   ├── guards/          # Auth guards
│   │   │   │   ├── pipes/           # Validation pipes
│   │   │   │   ├── middleware/
│   │   │   │   └── constants/
│   │   │   ├── database/
│   │   │   │   ├── prisma/
│   │   │   │   │   └── schema.prisma
│   │   │   │   └── migrations/
│   │   │   ├── integrations/
│   │   │   │   ├── cloudinary/
│   │   │   │   ├── stripe/
│   │   │   │   ├── fcm/
│   │   │   │   └── email/
│   │   │   └── utils/
│   │   ├── tests/
│   │   ├── docker/
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── ai-service/                  # Python FastAPI - Microservice IA
│       ├── src/
│       │   ├── main.py
│       │   ├── config.py
│       │   ├── services/
│       │   │   ├── logo_analyzer.py
│       │   │   ├── theme_generator.py
│       │   │   ├── match_summarizer.py
│       │   │   ├── post_suggester.py
│       │   │   ├── scout_analyzer.py
│       │   │   └── recommendation.py
│       │   ├── models/
│       │   ├── routes/
│       │   └── utils/
│       ├── tests/
│       ├── requirements.txt
│       ├── Dockerfile
│       └── docker-compose.yml
│
├── packages/                        # Monorepo shared packages
│   ├── shared-types/               # Types TypeScript partagés
│   ├── constants/
│   ├── utils/
│   └── ui-components/              # Composants réutilisables
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API_ENDPOINTS.md
│   ├── API_SPEC.yaml              # OpenAPI/Swagger
│   ├── DEPLOYMENT.md
│   ├── TESTING.md
│   ├── SECURITY.md
│   └── ROADMAP.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Tests + lint
│       ├── cd.yml                  # Deploy staging
│       └── deploy-prod.yml
│
├── docker-compose.yml              # Dev environment
├── .env.example
└── README.md
```

---

## 💾 SCHÉMA PRISMA COMPLET (Premier MVP)

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ============ AUTH & USER ============

enum UserRole {
  SUPPORTER
  PLAYER
  COACH
  TEAM_MANAGER
  SPONSOR
  ORGANIZER
  ARBITER
  ADMIN
  SUPER_ADMIN
}

enum VerificationStatus {
  UNVERIFIED
  PENDING
  VERIFIED
  REJECTED
}

model User {
  id                String              @id @default(cuid())
  email             String              @unique
  password          String              // Hashed
  username          String              @unique
  
  // Profile
  firstName         String
  lastName          String
  avatar            String?             // Cloudinary URL
  bio               String?
  
  // Account
  role              UserRole            @default(SUPPORTER)
  verificationStatus VerificationStatus  @default(UNVERIFIED)
  isActive          Boolean             @default(true)
  isSuspended       Boolean             @default(false)
  suspendReason     String?
  suspendedUntil    DateTime?
  
  // Timestamps
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  lastLogin         DateTime?
  
  // Relations
  profile           UserProfile?
  player            Player?
  coach             Coach?
  teamMemberships   TeamMember[]
  sponsorProfile    SponsorProfile?
  
  posts             Post[]
  comments          Comment[]
  likes             Like[]
  follows           Follow[] @relation("follower")
  followedBy        Follow[] @relation("followee")
  
  sentMessages      Message[] @relation("sender")
  receivedMessages  Message[] @relation("recipient")
  
  notifications     Notification[]
  recruitmentApps   RecruitmentApplication[]
  
  reportedBy        Report[] @relation("reportedUser")
  createdReports    Report[] @relation("reportingUser")
  
  @@index([email])
  @@index([username])
}

model UserProfile {
  id              String  @id @default(cuid())
  userId          String  @unique
  user            User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  city            String?
  country         String? @default("TG")
  phone           String?
  website         String?
  socialLinks     Json?   // {instagram, twitter, linkedin, etc}
  
  theme           Json?   // {primaryColor, secondaryColor, etc}
  profileBannerUrl String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// ============ PLAYERS ============

enum Position {
  POINT_GUARD
  SHOOTING_GUARD
  SMALL_FORWARD
  POWER_FORWARD
  CENTER
  VERSATILE
}

enum DominantHand {
  LEFT
  RIGHT
}

enum PlayerAvailability {
  LOOKING_FOR_TEAM
  AVAILABLE_FOR_TOURNAMENT
  OPEN_TO_INTERNATIONAL
  AVAILABLE_FOR_SCOUTING
  UNAVAILABLE
}

model Player {
  id                String                @id @default(cuid())
  userId            String                @unique
  user              User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Physical
  height            Float?                // cm
  weight            Float?                // kg
  dominantHand      DominantHand?
  
  // Career
  position          Position
  jerseyNumber      Int?
  city              String
  nationality       String
  
  // Status
  availability      PlayerAvailability[]  @default([])
  isLookingForTeam  Boolean               @default(false)
  isOpenToInternational Boolean            @default(false)
  
  currentTeam       Team?                 @relation("currentTeam", fields: [currentTeamId], references: [id])
  currentTeamId     String?
  
  // Media
  videoHighlights   String[]              // URLs
  photos            String[]              // Cloudinary
  
  // Relations
  teamHistory       TeamMember[]
  stats             PlayerStats[]
  matchPerformances MatchPlayer[]
  achievements      Achievement[]
  
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt
  
  @@index([currentTeamId])
}

// ============ TEAMS & CLUBS ============

enum TeamCategory {
  PROFESSIONAL
  SEMI_PROFESSIONAL
  AMATEUR
  ACADEMY
  UNIVERSITY
  SCHOOL
}

model Team {
  id                String              @id @default(cuid())
  name              String              @unique
  slug              String              @unique
  logo              String              // Cloudinary
  banner            String?             // Cloudinary
  
  // Identity
  description       String?
  founded           Int
  city              String
  category          TeamCategory
  
  // Management
  owner             TeamMember          @relation("owner", fields: [ownerId], references: [id])
  ownerId           String              @unique
  coach             Coach?              @relation(fields: [coachId], references: [id])
  coachId           String?
  
  // Theme & Branding
  theme             Json?               // {primaryColor, secondaryColor, accentColor, etc}
  themeVariant      String              @default("dark") // dark, light, arena, minimal
  brandColors       Json?               // {main, secondary, accent}
  
  // Contact
  email             String?
  phone             String?
  website           String?
  socialLinks       Json?               // {instagram, twitter, facebook, etc}
  
  // Followers & Engagement
  followersCount    Int                 @default(0)
  
  // Stats
  totalMatches      Int                 @default(0)
  wins              Int                 @default(0)
  losses            Int                 @default(0)
  averageScore      Float               @default(0)
  
  // Relations
  members           TeamMember[]
  players           Player[] @relation("currentTeam")
  matches           Match[] @relation("teamA")
  matchesAsB        Match[] @relation("teamB")
  venues            Venue[]
  
  posts             Post[]
  stories           Story[]
  
  tournaments       TournamentTeam[]
  standings         Standing[]
  
  follows           Follow[]
  
  sponsorships      Sponsorship[]
  partnerships      Partnership[] @relation("teamA")
  partnershipsAsB   Partnership[] @relation("teamB")
  
  recruits          RecruitmentPost[]
  
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  @@index([slug])
  @@index([city])
  @@index([category])
}

enum TeamMemberRole {
  OWNER
  PRESIDENT
  MANAGER
  HEAD_COACH
  ASSISTANT_COACH
  CAPTAIN
  PLAYER
  MEDIA_MANAGER
  TREASURER
  MEDICAL_STAFF
}

model TeamMember {
  id            String          @id @default(cuid())
  team          Team            @relation(fields: [teamId], references: [id], onDelete: Cascade)
  teamId        String
  
  player        Player          @relation(fields: [playerId], references: [id], onDelete: Cascade)
  playerId      String
  
  coach         Coach?          @relation(fields: [coachId], references: [id])
  coachId       String?
  
  role          TeamMemberRole
  
  joinedAt      DateTime        @default(now())
  leftAt        DateTime?
  
  isActive      Boolean         @default(true)
  
  // Ownership relation
  ownedTeams    Team[] @relation("owner")
  
  @@unique([teamId, playerId])
  @@index([teamId])
  @@index([playerId])
}

// ============ COACHES ============

model Coach {
  id              String          @id @default(cuid())
  userId          String          @unique
  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  licenseNumber   String?
  experience      Int?            // years
  specialization  String?
  
  teams           Team[]
  teamMembers     TeamMember[]
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

// ============ VENUES ============

enum VenueType {
  INDOOR
  OUTDOOR
  MIXED
}

model Venue {
  id              String          @id @default(cuid())
  name            String
  
  team            Team?           @relation(fields: [teamId], references: [id])
  teamId          String?
  
  address         String
  city            String
  latitude        Float
  longitude       Float
  
  type            VenueType
  capacity        Int?
  
  photos          String[]
  description     String?
  amenities       String[]        // ["parking", "changing_rooms", "lighting"]
  
  isMainVenue     Boolean         @default(false)
  
  matches         Match[]
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  @@index([teamId])
  @@index([city])
}

// ============ MATCHES ============

enum MatchStatus {
  PROPOSED
  ACCEPTED
  DECLINED
  SCHEDULED
  LIVE
  FINISHED
  CANCELLED
  POSTPONED
}

enum MatchFormat {
  FRIENDLY
  LEAGUE
  CUP
  TOURNAMENT
  CHARITY
}

model Match {
  id                String          @id @default(cuid())
  
  // Teams
  teamA            Team            @relation("teamA", fields: [teamAId], references: [id])
  teamAId          String
  teamB            Team            @relation("teamB", fields: [teamBId], references: [id])
  teamBId          String
  
  // Match details
  status            MatchStatus     @default(PROPOSED)
  format            MatchFormat     @default(FRIENDLY)
  category          String?         // U18, U20, etc
  
  // Scheduling
  scheduledAt       DateTime?
  startedAt         DateTime?
  endedAt           DateTime?
  
  // Venue
  venue             Venue           @relation(fields: [venueId], references: [id])
  venueId           String
  
  // Score
  scoreTeamA        Int             @default(0)
  scoreTeamB        Int             @default(0)
  
  // Additional
  arbiter           String?         // Arbiter name
  notes             String?
  
  // Relations
  players           MatchPlayer[]
  events            MatchEvent[]
  
  posts             Post[]
  
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  @@index([teamAId])
  @@index([teamBId])
  @@index([venueId])
  @@index([status])
  @@index([scheduledAt])
}

model MatchPlayer {
  id            String    @id @default(cuid())
  
  match         Match     @relation(fields: [matchId], references: [id], onDelete: Cascade)
  matchId       String
  
  player        Player    @relation(fields: [playerId], references: [id], onDelete: Cascade)
  playerId      String
  
  team          Team      @relation(fields: [teamId], references: [id])
  teamId        String
  
  jerseyNumber  Int
  isStarter     Boolean   @default(false)
  
  stats         PlayerStats?
  
  @@unique([matchId, playerId])
  @@index([matchId])
  @@index([playerId])
}

enum EventType {
  BASKET_2 = "2PT"
  BASKET_3 = "3PT"
  FREE_THROW = "FT"
  FOUL = "FOUL"
  REBOUND = "REBOUND"
  ASSIST = "ASSIST"
  STEAL = "STEAL"
  BLOCK = "BLOCK"
  TURNOVER = "TURNOVER"
  SUBSTITUTION = "SUB"
  TIMEOUT = "TIMEOUT"
}

model MatchEvent {
  id              String      @id @default(cuid())
  
  match           Match       @relation(fields: [matchId], references: [id], onDelete: Cascade)
  matchId         String
  
  eventType       EventType
  quarter         Int         // 1-4
  timestamp       Int         // seconds elapsed
  
  player          Player?     @relation(fields: [playerId], references: [id])
  playerId        String?
  
  team            String      // "A" or "B"
  
  createdAt       DateTime    @default(now())
  
  @@index([matchId])
}

// ============ PLAYER STATS ============

model PlayerStats {
  id              String      @id @default(cuid())
  
  player          Player      @relation(fields: [playerId], references: [id], onDelete: Cascade)
  playerId        String
  
  match           MatchPlayer @relation(fields: [matchPlayerId], references: [id], onDelete: Cascade)
  matchPlayerId   String      @unique
  
  points          Int         @default(0)
  rebounds        Int         @default(0)
  assists         Int         @default(0)
  steals          Int         @default(0)
  blocks          Int         @default(0)
  fouls           Int         @default(0)
  
  fieldGoals      Int         @default(0)
  fieldGoalAttempts Int       @default(0)
  threePointers   Int         @default(0)
  threeAttempts   Int         @default(0)
  freeThrows      Int         @default(0)
  freeThrowAttempts Int       @default(0)
  
  minutesPlayed   Int         @default(0)
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@index([playerId])
  @@index([matchPlayerId])
}

// ============ SEASON STATS ============

model SeasonPlayerStats {
  id              String      @id @default(cuid())
  
  player          Player      @relation("seasonStats", references: [id], onDelete: Cascade)
  playerId        String
  
  season          String      // "2024-2025"
  team            Team        @relation("seasonStats", references: [id])
  teamId          String
  
  matchesPlayed   Int         @default(0)
  
  totalPoints     Int         @default(0)
  avgPoints       Float       @default(0)
  
  totalRebounds   Int         @default(0)
  avgRebounds     Float       @default(0)
  
  totalAssists    Int         @default(0)
  avgAssists      Float       @default(0)
  
  totalSteals     Int         @default(0)
  totalBlocks     Int         @default(0)
  
  fieldGoalPercent Float      @default(0)
  threePercent    Float       @default(0)
  freeThrowPercent Float      @default(0)
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@unique([playerId, season, teamId])
}

// ============ TOURNAMENTS ============

enum TournamentStatus {
  DRAFT
  REGISTRATION
  SCHEDULED
  IN_PROGRESS
  FINISHED
}

enum TournamentFormat {
  LEAGUE
  ELIMINATION
  GROUP_STAGE
  ROUND_ROBIN
  MIXED
}

model Tournament {
  id              String              @id @default(cuid())
  name            String
  slug            String              @unique
  
  organizer       SponsorProfile      @relation(fields: [organizerId], references: [id])
  organizerId     String
  
  description     String?
  logo            String?             // Cloudinary
  
  status          TournamentStatus    @default(DRAFT)
  format          TournamentFormat    @default(LEAGUE)
  
  startDate       DateTime
  endDate         DateTime
  
  location        String
  
  maxTeams        Int
  registrationFee Float?
  
  prizes          Json?               // {first: "1000 USD", second: "500 USD"}
  rules           String?
  
  // Relations
  teams           TournamentTeam[]
  standings       Standing[]
  
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  @@index([organizerId])
  @@index([status])
}

model TournamentTeam {
  id              String          @id @default(cuid())
  tournament      Tournament      @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  tournamentId    String
  
  team            Team            @relation(fields: [teamId], references: [id], onDelete: Cascade)
  teamId          String
  
  group           String?         // Group A, Group B, etc
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  @@unique([tournamentId, teamId])
  @@index([tournamentId])
  @@index([teamId])
}

model Standing {
  id              String          @id @default(cuid())
  
  tournament      Tournament      @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  tournamentId    String
  
  team            Team            @relation(fields: [teamId], references: [id], onDelete: Cascade)
  teamId          String
  
  position        Int
  
  played          Int             @default(0)
  wins            Int             @default(0)
  losses          Int             @default(0)
  
  pointsFor       Int             @default(0)
  pointsAgainst   Int             @default(0)
  pointDifference Int             @default(0)
  
  points          Int             @default(0)  // Table points (2 per win, etc)
  
  @@unique([tournamentId, teamId])
  @@index([tournamentId])
  @@index([position])
}

// ============ SOCIAL / FEED ============

enum PostType {
  TEXT
  IMAGE
  VIDEO
  ALBUM
  POLL
  MATCH_RESULT
  ANNOUNCEMENT
  RECRUITMENT
}

model Post {
  id              String          @id @default(cuid())
  
  author          User            @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId        String
  
  team            Team?           @relation(fields: [teamId], references: [id], onDelete: SetNull)
  teamId          String?
  
  match           Match?          @relation(fields: [matchId], references: [id], onDelete: SetNull)
  matchId         String?
  
  type            PostType        @default(TEXT)
  
  content         String
  medias          PostMedia[]
  
  likesCount      Int             @default(0)
  commentsCount   Int             @default(0)
  sharesCount     Int             @default(0)
  
  isVisible       Boolean         @default(true)
  isPinned        Boolean         @default(false)
  
  // Relations
  likes           Like[]
  comments        Comment[]
  shares          Share[]
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  @@index([authorId])
  @@index([teamId])
  @@index([matchId])
  @@index([createdAt])
}

model PostMedia {
  id              String          @id @default(cuid())
  
  post            Post            @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId          String
  
  url             String          // Cloudinary
  type            String          // image, video
  order           Int
  
  @@index([postId])
}

model Like {
  id              String          @id @default(cuid())
  
  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId          String
  
  post            Post            @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId          String
  
  createdAt       DateTime        @default(now())
  
  @@unique([userId, postId])
  @@index([postId])
  @@index([createdAt])
}

model Comment {
  id              String          @id @default(cuid())
  
  author          User            @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId        String
  
  post            Post            @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId          String
  
  content         String
  
  likes           Int             @default(0)
  
  isDeleted       Boolean         @default(false)
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  @@index([postId])
  @@index([authorId])
  @@index([createdAt])
}

model Share {
  id              String          @id @default(cuid())
  
  user            User            @relation(fields: [userId], references: [id])
  userId          String
  
  post            Post            @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId          String
  
  createdAt       DateTime        @default(now())
  
  @@unique([userId, postId])
}

// ============ STORIES ============

model Story {
  id              String          @id @default(cuid())
  
  team            Team            @relation(fields: [teamId], references: [id], onDelete: Cascade)
  teamId          String
  
  media           String          // Cloudinary URL
  type            String          // image, video
  
  caption         String?
  
  expiresAt       DateTime
  
  viewsCount      Int             @default(0)
  
  createdAt       DateTime        @default(now())
  
  @@index([teamId])
  @@index([expiresAt])
}

// ============ FOLLOWS ============

model Follow {
  id              String          @id @default(cuid())
  
  follower        User            @relation("follower", fields: [followerId], references: [id], onDelete: Cascade)
  followerId      String
  
  followee        User            @relation("followee", fields: [followeeId], references: [id], onDelete: Cascade)
  followeeId      String
  
  team            Team?           @relation(fields: [teamId], references: [id], onDelete: Cascade)
  teamId          String?
  
  createdAt       DateTime        @default(now())
  
  @@unique([followerId, followeeId])
  @@unique([followerId, teamId])
  @@index([followerId])
  @@index([followeeId])
  @@index([teamId])
}

// ============ MESSAGING ============

model Conversation {
  id              String          @id @default(cuid())
  
  participants    User[]          // Usar array para flexibilidade
  
  isGroupChat     Boolean         @default(false)
  groupName       String?
  
  lastMessage     Message?
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

model Message {
  id              String          @id @default(cuid())
  
  sender          User            @relation("sender", fields: [senderId], references: [id], onDelete: Cascade)
  senderId        String
  
  recipient       User            @relation("recipient", fields: [recipientId], references: [id], onDelete: Cascade)
  recipientId     String
  
  content         String
  attachment      String?         // URL
  
  isRead          Boolean         @default(false)
  readAt          DateTime?
  
  createdAt       DateTime        @default(now())
  
  @@index([senderId])
  @@index([recipientId])
  @@index([createdAt])
  @@index([isRead])
}

// ============ RECRUITMENT ============

enum RecruitmentStatus {
  ACTIVE
  CLOSED
  FILLED
}

model RecruitmentPost {
  id              String              @id @default(cuid())
  
  team            Team                @relation(fields: [teamId], references: [id], onDelete: Cascade)
  teamId          String
  
  title           String              // "Recherche meneur U18"
  description     String
  
  position        Position
  ageMin          Int?
  ageMax          Int?
  city            String?
  
  status          RecruitmentStatus   @default(ACTIVE)
  
  applications    RecruitmentApplication[]
  
  createdAt       DateTime            @default(now())
  expiresAt       DateTime
  
  @@index([teamId])
  @@index([status])
}

enum ApplicationStatus {
  PENDING
  ACCEPTED
  REJECTED
  INTERVIEWING
}

model RecruitmentApplication {
  id              String                  @id @default(cuid())
  
  post            RecruitmentPost         @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId          String
  
  applicant       User                    @relation(fields: [applicantId], references: [id], onDelete: Cascade)
  applicantId     String
  
  status          ApplicationStatus       @default(PENDING)
  message         String?
  
  createdAt       DateTime                @default(now())
  updatedAt       DateTime                @updatedAt
  
  @@unique([postId, applicantId])
  @@index([postId])
  @@index([applicantId])
}

// ============ PARTNERSHIPS ============

enum PartnershipType {
  SPORTS
  EVENTS
  SPONSORING
  COLLABORATION
  TOURNAMENT
  FRIENDLY
  EQUIPMENT
}

enum PartnershipStatus {
  PENDING
  ACCEPTED
  REJECTED
  DISCUSSION
  FINALIZED
  EXPIRED
}

model Partnership {
  id              String              @id @default(cuid())
  
  teamA           Team                @relation("teamA", fields: [teamAId], references: [id], onDelete: Cascade)
  teamAId         String
  
  teamB           Team                @relation("teamB", fields: [teamBId], references: [id], onDelete: Cascade)
  teamBId         String
  
  type            PartnershipType
  status          PartnershipStatus   @default(PENDING)
  
  description     String?
  
  startDate       DateTime?
  endDate         DateTime?
  
  notes           String?
  
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  @@unique([teamAId, teamBId, type])
  @@index([teamAId])
  @@index([teamBId])
  @@index([status])
}

// ============ SPONSORING ============

model SponsorProfile {
  id              String          @id @default(cuid())
  
  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId          String          @unique
  
  companyName     String
  logo            String?
  
  industry        String?
  description     String?
  website         String?
  
  sponsorships    Sponsorship[]
  tournaments     Tournament[]
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

enum SponsorshipStatus {
  ACTIVE
  PENDING
  EXPIRED
  CANCELLED
}

model Sponsorship {
  id              String              @id @default(cuid())
  
  sponsor         SponsorProfile      @relation(fields: [sponsorId], references: [id], onDelete: Cascade)
  sponsorId       String
  
  team            Team                @relation(fields: [teamId], references: [id], onDelete: Cascade)
  teamId          String
  
  type            String              // "jersey", "equipment", "travel"
  value           Float
  
  startDate       DateTime
  endDate         DateTime
  
  status          SponsorshipStatus   @default(ACTIVE)
  
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  @@index([sponsorId])
  @@index([teamId])
  @@index([status])
}

// ============ NOTIFICATIONS ============

enum NotificationType {
  LIKE
  COMMENT
  FOLLOW
  MESSAGE
  MATCH
  TOURNAMENT
  PARTNERSHIP
  RECRUITMENT
  MENTION
  SPONSOR
  ACHIEVEMENT
}

model Notification {
  id              String              @id @default(cuid())
  
  user            User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId          String
  
  type            NotificationType
  
  title           String
  message         String
  
  relatedUserId   String?
  relatedTeamId   String?
  relatedPostId   String?
  
  isRead          Boolean             @default(false)
  readAt          DateTime?
  
  actionUrl       String?
  
  createdAt       DateTime            @default(now())
  
  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
}

// ============ ACHIEVEMENTS & BADGES ============

enum BadgeType {
  TOP_SCORER
  MVP
  CHAMPION
  BEST_DEFENDER
  RISING_STAR
  CONSISTENT
  LOYAL_FAN
  VERIFIED
}

model Badge {
  id              String          @id @default(cuid())
  
  type            BadgeType       @unique
  name            String
  description     String
  icon            String          // Cloudinary
  
  criteria        Json            // {minPoints: 1000, etc}
  
  createdAt       DateTime        @default(now())
}

model Achievement {
  id              String          @id @default(cuid())
  
  player          Player          @relation(fields: [playerId], references: [id], onDelete: Cascade)
  playerId        String
  
  badge           Badge           @relation(fields: [badgeId], references: [id])
  badgeId         String
  
  unlockedAt      DateTime        @default(now())
  
  @@unique([playerId, badgeId])
  @@index([playerId])
}

// ============ MODERATION ============

enum ReportReason {
  INAPPROPRIATE
  SPAM
  HARASSMENT
  FALSE_INFO
  COPYRIGHT
  OTHER
}

model Report {
  id              String          @id @default(cuid())
  
  reportingUser   User            @relation("reportingUser", fields: [reportingUserId], references: [id])
  reportingUserId String
  
  reportedUser    User            @relation("reportedUser", fields: [reportedUserId], references: [id])
  reportedUserId  String
  
  reason          ReportReason
  description     String?
  
  status          String          @default("PENDING") // PENDING, REVIEWED, RESOLVED
  
  moderatorNotes  String?
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  @@index([reportedUserId])
  @@index([status])
}

// ============ THEME ============

model ThemeToken {
  id              String          @id @default(cuid())
  
  teamId          String          @unique
  
  primaryColor    String
  secondaryColor  String
  accentColor     String
  
  backgroundColor String
  surfaceColor    String
  
  textPrimary     String
  textSecondary   String
  
  borderColor     String
  
  gradient        Json?           // {angle, colors}
  shadow          String?
  glow            String?
  
  themeVariant    String          @default("dark")
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

// ============ AUDIT LOG ============

model AuditLog {
  id              String          @id @default(cuid())
  
  userId          String?
  action          String
  resource        String
  resourceId      String
  
  oldValue        Json?
  newValue        Json?
  
  ipAddress       String?
  userAgent       String?
  
  createdAt       DateTime        @default(now())
  
  @@index([userId])
  @@index([resource])
  @@index([createdAt])
}
```

---

## 📡 ARCHITECTURE API REST STANDARDISÉE

### Convention Endpoints

```
[METHOD] /api/v1/{resource}/{id}/{sub-resource}

GET     /api/v1/teams                          # List
POST    /api/v1/teams                          # Create
GET     /api/v1/teams/{id}                     # Detail
PATCH   /api/v1/teams/{id}                     # Partial Update
DELETE  /api/v1/teams/{id}                     # Delete

GET     /api/v1/teams/{id}/players             # Relation
GET     /api/v1/teams/{id}/matches             # Relation
POST    /api/v1/teams/{id}/players             # Add relation

# Actions
POST    /api/v1/teams/{id}/verify              # Verify account
POST    /api/v1/teams/{id}/follow              # Follow team
POST    /api/v1/matches/{id}/start-live        # Start live scoring
```

### Response Standard

```javascript
// Success
{
  "success": true,
  "data": { /* resource */ },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "v1"
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      {
        "field": "email",
        "message": "Must be valid email"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req-123"
  }
}

// List with pagination
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": { }
}
```

### Endpoints Critiques MVP

```
# AUTH
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/forgot-password

# USERS
GET    /api/v1/users/me
PATCH  /api/v1/users/me
GET    /api/v1/users/{id}
GET    /api/v1/users/{id}/followers
GET    /api/v1/users/{id}/following
POST   /api/v1/users/{id}/follow
DELETE /api/v1/users/{id}/follow

# TEAMS
GET    /api/v1/teams
POST   /api/v1/teams
GET    /api/v1/teams/{id}
PATCH  /api/v1/teams/{id}
POST   /api/v1/teams/{id}/verify
GET    /api/v1/teams/{id}/players
GET    /api/v1/teams/{id}/matches
GET    /api/v1/teams/{id}/feed
POST   /api/v1/teams/{id}/follow
GET    /api/v1/teams/{id}/analytics

# PLAYERS
GET    /api/v1/players
GET    /api/v1/players/{id}
PATCH  /api/v1/players/{id}
GET    /api/v1/players/{id}/stats
GET    /api/v1/players/{id}/matches

# MATCHES
GET    /api/v1/matches
POST   /api/v1/teams/{id}/matches/propose
GET    /api/v1/matches/{id}
PATCH  /api/v1/matches/{id}/accept
POST   /api/v1/matches/{id}/decline
POST   /api/v1/matches/{id}/start-live
POST   /api/v1/matches/{id}/events
GET    /api/v1/matches/{id}/live

# FEED
GET    /api/v1/feed
GET    /api/v1/feed/explore
POST   /api/v1/posts
GET    /api/v1/posts/{id}
POST   /api/v1/posts/{id}/like
DELETE /api/v1/posts/{id}/like
POST   /api/v1/posts/{id}/comment
GET    /api/v1/posts/{id}/comments

# VENUES
GET    /api/v1/venues
POST   /api/v1/venues
GET    /api/v1/venues/nearby
GET    /api/v1/venues/{id}

# AI SERVICE
POST   /api/v1/ai/theme/analyze-logo
GET    /api/v1/ai/theme/preview
POST   /api/v1/ai/match/summarize
POST   /api/v1/ai/posts/suggest
```

---

## 🔐 STRATÉGIE DE SÉCURITÉ AMÉLIORÉE

### 1. Authentification Multi-Niveaux

```typescript
// JWT Strategy
- Access Token: 15 minutes (short-lived)
- Refresh Token: 30 days (stored in httpOnly cookie)
- Device Fingerprinting pour sécurité supplémentaire

// Rôles & Permissions
- RBAC (Role-Based Access Control)
- Guard par route
- Middleware de vérification

// Login Social
- Google OAuth 2.0
- Facebook OAuth 2.0
```

### 2. Protection des Données

```
- Encryption au repos (PostgreSQL)
- TLS/HTTPS en transit
- PII Redaction (logs)
- GDPR Compliance
  - Right to access
  - Right to delete
  - Data portability
```

### 3. Rate Limiting

```
- Global: 1000 req/hour par IP
- Auth: 5 tentatives/15min
- API: 100 req/min par utilisateur
- Uploads: 50 MB max, 10 fichiers/jour
```

### 4. Validation

```typescript
// DTOs TypeScript
class CreateTeamDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
  
  @IsEmail()
  email: string;
  
  @IsIn(['PROFESSIONAL', 'AMATEUR'])
  category: TeamCategory;
}

// Server-side validation ALWAYS
// Never trust frontend
```

---

## ⚡ CACHING STRATEGY

```
Redis Structure:
- User:{userId} → User profile (TTL: 1h)
- Team:{teamId} → Team data (TTL: 30min)
- Team:{teamId}:feed → Posts (TTL: 5min)
- Match:{matchId}:live → Live score (TTL: 1min)
- Ranking:{sport}:{category} → Rankings (TTL: 1h)

Cache Invalidation:
- On update: Invalidate immediately
- On match event: Update live cache
- Background jobs for TTL management
```

---

## 📊 DATABASE INDEXING STRATEGY

```sql
-- Critical indexes
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_post_createdAt ON posts(createdAt DESC);
CREATE INDEX idx_follow_follower ON follows(followerId);
CREATE INDEX idx_match_scheduled ON matches(scheduledAt DESC);

-- Composite indexes
CREATE INDEX idx_team_city_category ON teams(city, category);
CREATE INDEX idx_match_teams ON matches(teamAId, teamBId);
CREATE INDEX idx_post_feed ON posts(authorId, createdAt DESC);
```

---

## 🧪 TESTING STRATEGY

```
Frontend (Vitest + Playwright):
- Unit: 80%+ coverage
- Integration: Critical paths
- E2E: User workflows

Backend (Jest):
- Unit: Services & utils
- Integration: API endpoints
- E2E: Complete workflows

AI Service (pytest):
- Logo analysis accuracy
- Theme generation quality
- Performance benchmarks
```

---

## 🚀 CI/CD PIPELINE

```yaml
# GitHub Actions
1. Lint & Format (ESLint, Prettier)
2. Type Check (TypeScript)
3. Unit Tests (Jest/Vitest)
4. Build (Vite, NestJS)
5. Security Scan (OWASP, npm audit)
6. Deploy Staging (Docker)
7. Integration Tests
8. Deploy Production (if main branch)

# Staging → Production
- Blue-green deployment
- Database migrations safely
- Rollback capability
- Health checks
```

---

## 📈 MONITORING & OBSERVABILITY

```
Sentry (Errors):
- Source maps
- Session replay
- Performance monitoring

LogRocket (Frontend):
- User sessions
- Redux timeline
- Network activity

Custom (Backend):
- Winston logger
- API response times
- Database queries
- Cache hit rates

Metrics:
- API latency (p50, p95, p99)
- Error rate
- Cache hit rate
- Database connections
```

---

## 🗂️ AMÉLIORATION DES DIRECTIVES DE DÉVELOPPEMENT

### Phase 1: MVP (Semaines 1-8)

**Priorité 1 (Semaines 1-3):**
- [x] Setup projet (Vite + NestJS + PostgreSQL)
- [x] Authentification JWT
- [x] Profil utilisateur
- [x] Modèles User, Team, Player
- [x] API CRUD de base

**Priorité 2 (Semaines 4-6):**
- [x] Feed social (posts, likes, commentaires)
- [x] Profil équipe (logo, bannière, info)
- [x] Système de suivi (follow/followers)
- [x] Matchs (création, acceptance)
- [x] AI Logo Analyzer

**Priorité 3 (Semaines 7-8):**
- [x] Notifications
- [x] Recherche universelle
- [x] Classements simples
- [x] UI responsive mobile

### Phase 2: V1.1 (Semaines 9-16)

- [ ] Tournois & compétitions
- [ ] Statistiques avancées
- [ ] Messagerie
- [ ] Recrutement
- [ ] Partenariats

### Phase 3: V1.2+ (Post-lancement)

- [ ] Live scoring
- [ ] Scouting avancé
- [ ] Billetterie
- [ ] IA avancée
- [ ] Marketplace

---

## 🎯 AMÉLIORATIONS SPÉCIFIQUES À APPORTER

### 1. **Clarifier les Performance Requirements**

```
ADD to prompt:

PERFORMANCE TARGETS:
- Page load: < 2s (LCP)
- API response: < 500ms (p95)
- Database query: < 100ms
- Live score update: < 1s
- Image optimization: JPEG 80%, WebP alternative
- Cache hit rate: > 80%
```

### 2. **Ajouter Failure Scenarios**

```
ADD:

ERROR HANDLING:
- 429 (Rate limit) → Retry after X seconds
- 503 (Service unavailable) → Graceful degradation
- Network timeout → Offline mode
- Image upload failure → Fallback image
- Broadcast disconnect → Reconnect with backoff
```

### 3. **Définir Feature Flags**

```
ADD:

FEATURE FLAGS:
- live_scoring: Boolean (enable/disable live match)
- ai_theme_beta: Boolean (experimental theme generator)
- tournament_v2: Boolean (new tournament engine)
- marketplace_enabled: Boolean (early access)

Permet A/B testing et rollout progressif
```

### 4. **Ajouter Maintenance Strategy**

```
ADD:

MAINTENANCE:
- Database backups: Daily + weekly
- Log retention: 30 days
- Outdated tokens cleanup: Weekly
- Dead image cleanup: Monthly
- Analytics aggregation: Nightly
```

### 5. **Spécifier Internationalization**

```
ADD:

I18N STRATEGY:
- Primary: French (Togo)
- Secondary: English
- Future: Portuguese (Angola)

File structure:
locales/
  fr/
    common.json
    teams.json
    matches.json
  en/
    ...
```

### 6. **Définir SEO Strategy**

```
ADD:

SEO:
- Team profiles: Canonical URLs + structured data
- Match results: JSON-LD markup
- Player profiles: Open Graph cards
- Sitemap generation: Dynamic
- Meta tags: Dynamic based on page
- Robots.txt: Allow crawling
```

---

## 📋 CHECKLIST DE QUALITÉ DE CODE

```
AVANT CHAQUE COMMIT:

□ TypeScript: Zéro erreurs (strict mode)
□ Linting: ESLint 0 warnings
□ Formatting: Prettier applied
□ Tests: 80%+ coverage sur nouveau code
□ Security: Pas de secrets hardcodés
□ Performance: Pas de console.log
□ Comments: Code complexe commenté
□ Naming: Variables bien nommées
□ DRY: Pas de duplication
□ Documentation: Changes documentés
```

---

## 🌍 VARIANTES RÉGIONALES (Future-Proofing)

```
L'architecture doit supporter:

sports = ["basketball", "football", "volleyball"]
countries = ["TG", "BJ", "CI", "SN"]

Abstraction:
- Module global pour sport agnostic
- Config par sport pour règles spécifiques
- Locale-specific pour devises, dates
- Language-specific pour contenus

Schema extension:
- Abstract Tournament
  - BasketballTournament
  - FootballTournament
```

---

## 💡 RECOMMANDATIONS FINALES

### ✅ GARDER ABSOLUMENT

1. Vision claire du produit final
2. MVP bien défini
3. Stack moderne
4. Mobile-first mindset
5. AI personnalization

### 🔧 AMÉLIORER

1. **Architecture**: Monorepo structure
2. **Database**: Schéma Prisma détaillé ✓ (fourni)
3. **API**: Standardisation complète ✓ (fourni)
4. **Security**: RBAC + rate limiting ✓ (fourni)
5. **Testing**: Jest + E2E mandatory
6. **Monitoring**: Sentry + Custom logs
7. **DevOps**: CI/CD automated
8. **Documentation**: Auto-generated (Swagger)

### 🚀 AJOUTER

1. Feature flags system
2. Analytics engine (Mixpanel/Amplitude)
3. Email service (SendGrid)
4. SMS service (Afrimotion/Hubtel pour Togo)
5. Push notifications (Firebase)
6. Image CDN (Cloudinary)
7. Error tracking (Sentry)
8. Performance monitoring (Vercel Analytics)

---

## 📊 MÉTRIQUES DE SUCCÈS À TRACKER

```
PRODUCT:
- MAU (Monthly Active Users)
- DAU (Daily Active Users)
- Session duration
- Return rate
- Content creation rate

TECHNICAL:
- API latency (p50, p95, p99)
- Error rate (< 0.5%)
- Uptime (> 99.9%)
- Cache hit rate (> 80%)
- Database query speed

BUSINESS:
- User acquisition cost
- Retention after 30 days
- NPS (Net Promoter Score)
- Team adoption rate
- Content engagement
```

---

## 🎓 CONCLUSION

**CE PROMPT PEUT RÉELLEMENT T'AIDER À ATTEINDRE TES OBJECTIFS À 85%**

**Points manquants à ajouter:**
- Architecture détaillée ✓ (ajoutée)
- Schéma Prisma complet ✓ (ajouté)
- Routes API standardisées ✓ (ajoutées)
- Strategy de sécurité ✓ (améliorée)
- Directives de développement ✓ (clarifiées)
- Monitoring & observability ✓ (défini)
- Testing strategy ✓ (planifiée)
- Performance targets ✓ (ajoutés)

**Le prompt amélioré est maintenant:**
- ✅ Technique et précis
- ✅ Architecturalement solide
- ✅ Extensible et maintenable
- ✅ Orienté vers la production
- ✅ Documenté complètement

**Prêt pour commencer le développement!**
