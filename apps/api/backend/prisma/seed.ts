import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seed minimal : supprime toutes les données et ne crée que le compte
 * opérateur plateforme (SUPER_ADMIN). Aucune donnée fictive n'est insérée.
 * Les clubs, joueurs, matchs etc. sont créés uniquement via les flows
 * applicatifs normaux (demandes de création, approbations...).
 */
export async function runFullSeed() {
  console.log('🧹 Suppression de toutes les données existantes...');

  // Suppression dans l'ordre inverse des dépendances FK
  await prisma.comment.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.statusView.deleteMany({});
  await prisma.statusReply.deleteMany({});
  await prisma.statusReaction.deleteMany({});
  await prisma.statusMention.deleteMany({});
  await prisma.statusAudience.deleteMany({});
  await prisma.status.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.matchEvent.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.tournamentTeam.deleteMany({});
  await prisma.standing.deleteMany({});
  await prisma.tournament.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.playerBadge.deleteMany({});
  await prisma.scoutEntry.deleteMany({});
  await prisma.recruitmentApplication.deleteMany({});
  await prisma.playerProfile.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.financialTransaction.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.clubMember.deleteMany({});
  await prisma.clubCreationRequest.deleteMany({});
  await prisma.club.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.sponsorProfile.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✅ Base de données vidée.');

  // ── Compte opérateur système (unique entrée bootstrappée) ────────────────
  const passwordHash = await bcrypt.hash('FireStone2026!', 10);

  await prisma.user.create({
    data: {
      email: 'superadmin@firestone.com',
      name: 'Super Administrateur',
      role: 'SUPER_ADMIN',
      passwordHash,
      country: 'Togo',
      city: 'Lomé',
    },
  });

  console.log('👤 Compte SUPER_ADMIN créé : superadmin@firestone.com');
  console.log('🏀 Base prête — aucune donnée fictive. Tout le contenu sera généré via l\'application.');
}

async function main() {
  try {
    await runFullSeed();
  } finally {
    await prisma.$disconnect();
  }
}

main();
