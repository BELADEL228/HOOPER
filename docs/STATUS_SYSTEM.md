# Documentation Technique — Système de Status / Stories (24h)

## 1. Vue d'Ensemble & Architecture

Le système de **Status / Stories** de la plateforme **HOOPERS** permet aux utilisateurs individuels (`User`) et aux clubs de basketball (`Club`) de publier des contenus éphémères visibles pendant **exactement 24 heures**.

L'architecture respecte le pattern en couches du backend de HOOPERS :
```text
Requête HTTP
   ↓
Middleware d'Authentification (requireAuth)
   ↓
Routeur Express (status.routes.ts)
   ↓
Contrôleur Express (status.controller.ts)
   ↓
Validateur des Entrées (status.validator.ts)
   ↓
Service Métier (status.service.ts)
   ↓
ORM & Base de données (Prisma Client + SQLite / PostgreSQL)
```

---

## 2. Règle Fondamentale : User ≠ Club

Dans HOOPERS, un `User` et un `Club` sont deux entités distinctes. Un Status appartient directement à un utilisateur **OU** à un club, jamais aux deux simultanément :
- Si `userId` est renseigné, `clubId` est `null`.
- Si `clubId` est renseigné, `userId` est `null`.
- Un membre de club ne peut publier ou supprimer au nom du Club que s'il détient les droits de gestion (`PRESIDENT` ou `CLUB_ADMIN` dans `ClubMember`, ou la plateforme `SUPER_ADMIN`).

---

## 3. Modèles Prisma & Schéma Relationnel

### Entité Principale : `Status`
```prisma
model Status {
  id          String           @id @default(uuid())
  userId      String?
  clubId      String?
  text        String?
  visibility  String           @default("PUBLIC") // PUBLIC, FOLLOWERS, FRIENDS, PRIVATE, CUSTOM
  createdAt   DateTime         @default(now())
  expiresAt   DateTime

  user        User?            @relation(fields: [userId], references: [id], onDelete: Cascade)
  club        Club?            @relation(fields: [clubId], references: [id], onDelete: Cascade)

  media       StatusMedia[]
  reactions   StatusReaction[]
  replies     StatusReply[]
  views       StatusView[]
  mentions    StatusMention[]
  audiences   StatusAudience[]
  reports     Report[]

  @@index([userId, expiresAt])
  @@index([clubId, expiresAt])
  @@index([expiresAt])
}
```

### Entités Associées
* **`StatusMedia`** : Médias multiples (images ou vidéos). `position` (0, 1, 2...) préserve l'ordre.
* **`StatusReaction`** : Réactions émojis (`LIKE`, `LOVE`, `HAHA`, `WOW`, `SAD`, `ANGRY`, `FIRE`, `CLAP`). Contrainte `@@unique([statusId, userId])` assurant une réaction unique sans duplication.
* **`StatusReply`** : Réponses textuelles aux stories.
* **`StatusView`** : Vues uniques. Contrainte `@@unique([statusId, userId])` assurant qu'un viewer n'est compté qu'une seule fois.
* **`StatusMention`** : Mentions ciblant un utilisateur ou un club (`userId?`, `clubId?`).
* **`StatusAudience`** : Liste blanche des utilisateurs autorisés pour la visibilité `CUSTOM`.

---

## 4. Règles de Confidentialité & Visibilité

| Visibilité | Règle d'accès |
| :--- | :--- |
| **`PUBLIC`** | Accessible à tous les utilisateurs connectés. |
| **`FOLLOWERS`** | Pour un User : accessible à ses abonnés réels (`Follow`). Pour un Club : accessible aux membres (`ClubMember`). |
| **`FRIENDS`** | Suivi mutuel réciproque (A suit B ET B suit A). Pour un Club : membres du club. |
| **`PRIVATE`** | Accessible uniquement à l'auteur (ou managers du club). |
| **`CUSTOM`** | Accessible uniquement aux utilisateurs définis dans `StatusAudience`. |

---

## 5. Expiration (24h) & Nettoyage

* **Expiration à la création** : `createdAt = now()`, `expiresAt = createdAt + 24 heures`.
* **Filtre systématique** : Toutes les requêtes de lecture et de feed appliquent conceptuellement `expiresAt > NOW()`.
* **Service de purge (`StatusCleanupService`)** :
  * Détecte les status où `expiresAt <= NOW()`.
  * Supprime les fichiers médias locaux correspondants.
  * Supprime en base de données les status expirés (la cascade Prisma nettoie automatiquement médias, vues, réactions, réponses, mentions et audiences).
* **Déclenchement** :
  * Automatique : intervalle d'arrière-plan de 15 minutes configuré dans `server.ts`.
  * Manuel : endpoint administrateur `POST /statuses/cleanup`.

---

## 6. Limites & Validations Médias

Centralisées dans `src/config/status.config.ts` :
* **Nombre de médias** : 10 max par status.
* **Images** : Max 15 Mo. Types MIME acceptés : `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
* **Vidéos** : Max 50 Mo. Durée max 60 secondes. Types MIME acceptés : `video/mp4`, `video/webm`, `video/quicktime`.

---

## 7. Endpoints API REST

Toutes les routes sont accessibles avec le préfixe `/statuses` ou `/api/statuses` et nécessitent un token Bearer (`requireAuth`).

| Méthode | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/statuses` | Créer un status (User ou Club) |
| `GET` | `/statuses/feed` | Récupérer le feed des Stories actives groupées par auteur |
| `GET` | `/statuses/:id` | Récupérer un status individuel |
| `DELETE` | `/statuses/:id` | Supprimer un status (propriétaire ou club manager) |
| `POST` | `/statuses/:id/view` | Enregistrer la vue d'un status |
| `GET` | `/statuses/:id/views` | Lister les spectateurs (réservé au propriétaire) |
| `POST` | `/statuses/:id/reactions` | Ajouter / modifier sa réaction (`LIKE`, `FIRE`...) |
| `DELETE` | `/statuses/:id/reactions` | Supprimer sa réaction |
| `POST` | `/statuses/:id/replies` | Répondre à un status |
| `DELETE` | `/statuses/:id/replies/:replyId` | Supprimer sa réponse ou une réponse sur sa story |
| `POST` | `/statuses/cleanup` | Purger immédiatement les status expirés |

---

## 8. Exemples de Requêtes & Réponses

### 8.1 Création d'un Status avec médias ordonnés
**`POST /statuses`**
```json
{
  "text": "Entraînement intensif avant le tournoi !",
  "visibility": "PUBLIC",
  "media": [
    {
      "type": "IMAGE",
      "url": "https://cdn.hoopers.club/stories/img_01.jpg",
      "position": 0,
      "mimeType": "image/jpeg"
    },
    {
      "type": "VIDEO",
      "url": "https://cdn.hoopers.club/stories/dunk_01.mp4",
      "position": 1,
      "duration": 12.5,
      "size": 8450000,
      "mimeType": "video/mp4"
    }
  ],
  "mentions": [
    { "userId": "f8a7e021-39bb-4c22-9018-9128fef65011" }
  ]
}
```

**Réponse (201 Created)** :
```json
{
  "id": "b1532cb1-628d-4e92-a1f4-3d968ca2a188",
  "userId": "93a67d02-e2ff-46b5-a3d8-552be4ec257b",
  "clubId": null,
  "text": "Entraînement intensif avant le tournoi !",
  "visibility": "PUBLIC",
  "createdAt": "2026-09-16T11:20:00.000Z",
  "expiresAt": "2026-09-17T11:20:00.000Z",
  "author": {
    "id": "93a67d02-e2ff-46b5-a3d8-552be4ec257b",
    "name": "Marcus Vance",
    "avatarUrl": "https://images.unsplash.com/photo-1546519638-68e109498ffc",
    "type": "USER"
  },
  "media": [
    {
      "id": "media-1",
      "type": "IMAGE",
      "url": "https://cdn.hoopers.club/stories/img_01.jpg",
      "position": 0
    },
    {
      "id": "media-2",
      "type": "VIDEO",
      "url": "https://cdn.hoopers.club/stories/dunk_01.mp4",
      "position": 1,
      "duration": 12.5
    }
  ],
  "reactionsCount": 0,
  "viewsCount": 0,
  "isOwner": true
}
```

### 8.2 Feed Stories regroupé par Auteur
**`GET /statuses/feed`**

**Réponse (200 OK)** :
```json
[
  {
    "author": {
      "id": "93a67d02-e2ff-46b5-a3d8-552be4ec257b",
      "name": "Marcus Vance",
      "avatarUrl": "https://images.unsplash.com/photo-1546519638-68e109498ffc",
      "type": "USER"
    },
    "hasUnseenStatus": true,
    "statuses": [
      {
        "id": "b1532cb1-628d-4e92-a1f4-3d968ca2a188",
        "text": "Entraînement intensif avant le tournoi !",
        "visibility": "PUBLIC",
        "createdAt": "2026-09-16T11:20:00.000Z",
        "expiresAt": "2026-09-17T11:20:00.000Z",
        "media": [...],
        "reactionsCount": 5,
        "viewsCount": 18,
        "isViewed": false
      }
    ]
  },
  {
    "author": {
      "id": "club-001",
      "name": "AS OTR Basketball",
      "avatarUrl": "https://cdn.hoopers.club/logos/as_otr.png",
      "type": "CLUB",
      "slug": "as-otr"
    },
    "hasUnseenStatus": false,
    "statuses": [...]
  }
]
```

### 8.3 Réagir à un Status
**`POST /statuses/:id/reactions`**
```json
{
  "type": "FIRE"
}
```

**Réponse (200 OK)** :
```json
{
  "id": "react-981",
  "statusId": "b1532cb1-628d-4e92-a1f4-3d968ca2a188",
  "userId": "93a67d02-e2ff-46b5-a3d8-552be4ec257b",
  "type": "FIRE",
  "createdAt": "2026-09-16T11:25:00.000Z"
}
```

---

## 9. Modération & Signalements

Les Status s'intègrent nativement au module `Report` via `targetType: "STATUS"` :
**`POST /api/reports`**
```json
{
  "targetType": "STATUS",
  "targetId": "b1532cb1-628d-4e92-a1f4-3d968ca2a188",
  "reason": "SPAM",
  "details": "Story abusive non sollicitée"
}
```
L'administrateur retrouve ce signalement dans la console de modération (`/api/admin/reports`).
