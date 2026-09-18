import { prisma } from '../config/database';
import { defaultVenues } from '../config/constants';
import { pushNotificationToUser } from './socketServer.service';

export class MiscService {
  static async listNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  static async markAllNotificationsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  static async listGeneralMessages(clubId: string) {
    const title = `club:${clubId}:general`;
    let conv = await prisma.conversation.findFirst({ where: { title } });
    if (!conv) {
      conv = await prisma.conversation.create({ data: { title } });
    }
    return prisma.message.findMany({
      where: { conversationId: conv.id },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  static async sendGeneralMessage(senderId: string, clubId: string, text: string, mediaUrl?: string) {
    const title = `club:${clubId}:general`;
    let conv = await prisma.conversation.findFirst({ where: { title } });
    if (!conv) {
      conv = await prisma.conversation.create({ data: { title } });
    }
    return prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId,
        text,
        mediaUrl,
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
    });
  }

  static async listTournaments() {
    return prisma.tournament.findMany({
      include: {
        teams: { include: { team: true } },
        standings: { include: { team: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  static async createTournament(data: any) {
    return prisma.tournament.create({
      data: {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        location: data.location || 'Lomé',
        format: data.format || 'LEAGUE',
        maxTeams: data.maxTeams || 8,
        registrationFee: data.registrationFee || 0,
        status: data.status || 'DRAFT',
      },
    });
  }

  static async listRecruitmentPosts() {
    return prisma.recruitmentPost.findMany({
      include: {
        team: true,
        applications: {
          include: {
            playerProfile: { include: { user: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createRecruitmentPost(data: any) {
    return prisma.recruitmentPost.create({
      data: {
        teamId: data.teamId,
        title: data.title,
        description: data.description,
        position: data.position,
        minAge: data.minAge,
        maxAge: data.maxAge,
        minHeightCm: data.minHeightCm,
        city: data.city || 'Lomé',
        status: 'OPEN',
      },
    });
  }

  static async applyToRecruitment(postId: string, playerProfileId: string, message?: string) {
    return prisma.recruitmentApplication.create({
      data: {
        recruitmentPostId: postId,
        playerProfileId,
        message,
        status: 'PENDING',
      },
    });
  }

  static async listScoutShortlist(scoutUserId: string) {
    return prisma.scoutEntry.findMany({
      where: { scoutUserId },
      include: {
        player: { include: { user: true } },
      },
    });
  }

  static async addToScoutShortlist(scoutUserId: string, playerProfileId: string, notes?: string) {
    return prisma.scoutEntry.upsert({
      where: { scoutUserId_playerProfileId: { scoutUserId, playerProfileId } },
      update: { notes },
      create: { scoutUserId, playerProfileId, notes },
    });
  }

  static async removeFromScoutShortlist(scoutUserId: string, playerProfileId: string) {
    return prisma.scoutEntry.deleteMany({
      where: { scoutUserId, playerProfileId },
    });
  }

  static async listBadges() {
    return prisma.badge.findMany();
  }

  static async listPlayerBadges(playerProfileId: string) {
    return prisma.playerBadge.findMany({
      where: { playerProfileId },
      include: { badge: true },
    });
  }

  static async awardBadge(playerProfileId: string, badgeId: string, note?: string) {
    return prisma.playerBadge.create({
      data: { playerProfileId, badgeId, note },
    });
  }

  static async listVenues(city?: string) {
    const venues = await prisma.venue.findMany({
      where: city ? { city } : undefined,
      orderBy: { city: 'asc' },
    });
    return venues.map((v) => ({
      ...v,
      status: v.status === 'AVAILABLE' ? 'Disponible' : v.status === 'RESERVED' ? 'Réservé' : 'En maintenance',
    }));
  }

  static async createVenue(data: any) {
    return prisma.venue.create({
      data: {
        name: data.name.trim(),
        city: data.city.trim(),
        region: data.region || 'Maritime',
        address: data.address.trim(),
        latitude: Number(data.latitude) || 0,
        longitude: Number(data.longitude) || 0,
        owner: data.owner || 'FIRE STONE Basketball Club',
        surface: data.surface || 'Synthétique',
        capacity: data.capacity ? Number(data.capacity) : null,
        status: data.status || 'AVAILABLE',
        indoor: Boolean(data.indoor),
        lighting: Boolean(data.lighting),
        lockerRooms: Boolean(data.lockerRooms),
        parking: Boolean(data.parking),
        imageUrl: data.imageUrl || null,
        description: data.description || null,
        rating: Number(data.rating) || 4.5,
      },
    });
  }

  static async listPlayers() {
    return prisma.playerProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
        badges: { include: { badge: true } },
      },
    });
  }

  static async createPlayerProfile(data: any) {
    return prisma.playerProfile.create({
      data: {
        userId: data.userId,
        jerseyNumber: Number(data.jerseyNumber) || 0,
        position: data.position || 'Ailier',
        heightCm: Number(data.heightCm) || 190,
        weightKg: Number(data.weightKg) || 85,
        age: Number(data.age) || 22,
        category: data.category || 'SENIOR',
        gender: data.gender || 'MASCULIN',
        photoUrl: data.photoUrl,
        experienceYears: Number(data.experienceYears) || 0,
        bio: data.bio,
      },
    });
  }

  static async updatePlayerProfile(id: string, data: any) {
    return prisma.playerProfile.update({
      where: { id },
      data,
    });
  }

  static async deletePlayerProfile(id: string) {
    return prisma.playerProfile.delete({ where: { id } });
  }

  static async listAcademyApplications() {
    return prisma.academyApplication.findMany({
      orderBy: { submittedAt: 'desc' },
    });
  }

  static async applyToAcademy(data: any) {
    return prisma.academyApplication.create({
      data: {
        candidateName: data.candidateName,
        email: data.email,
        age: Number(data.age),
        height: String(data.height),
        preferredPosition: data.preferredPosition,
        videoUrl: data.videoUrl,
        status: 'EN_ATTENTE',
      },
    });
  }

  static async listSponsors() {
    return prisma.sponsorProfile.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  static async createSponsorshipRequest(sponsorId: string, teamId: string, data: any) {
    return prisma.sponsorshipRequest.create({
      data: {
        sponsorId,
        teamId,
        type: data.type || 'FINANCIAL',
        title: data.title,
        message: data.message,
        budget: data.budget ? Number(data.budget) : null,
        status: 'PENDING',
      },
    });
  }

  static async updateApplicationStatus(applicationId: string, status: string) {
    return prisma.recruitmentApplication.update({
      where: { id: applicationId },
      data: { status },
      include: {
        recruitmentPost: true,
        playerProfile: { include: { user: true } },
      },
    });
  }

  static async toggleFollow(followerId: string, followedId: string) {
    if (followerId === followedId) {
      throw new Error('Vous ne pouvez pas vous suivre vous-même.');
    }
    const existing = await prisma.follow.findUnique({
      where: { followerId_followedId: { followerId, followedId } },
    });
    if (existing) {
      await prisma.follow.delete({
        where: { followerId_followedId: { followerId, followedId } },
      });
      return { following: false, message: 'Désabonné avec succès.' };
    }
    await prisma.follow.create({
      data: { followerId, followedId },
    });

    // ✅ Notification temps réel à la personne suivie
    try {
      const follower = await prisma.user.findUnique({
        where: { id: followerId },
        select: { name: true },
      });
      const notif = await prisma.notification.create({
        data: {
          userId: followedId,
          type: 'USER_FOLLOW',
          title: 'Nouveau abonné',
          text: `${follower?.name || 'Quelqu\'un'} a commencé à vous suivre.`,
        },
      });
      pushNotificationToUser(followedId, {
        id: notif.id,
        type: notif.type,
        title: notif.title,
        text: notif.text,
        read: notif.read,
        createdAt: notif.createdAt.toISOString(),
        meta: { senderId: followerId, senderName: follower?.name || 'Utilisateur' },
      });
    } catch (err) {
      console.warn('[MiscService.toggleFollow] notification error', err);
    }

    return { following: true, message: 'Abonné avec succès.' };
  }

  static async createReport(reporterId: string, data: { targetType: string; targetId?: string; reason: string; details?: string }) {
    const reportData: any = {
      reporterId,
      targetType: data.targetType || 'OTHER',
      reason: data.reason || 'SPAM',
      details: data.details,
      status: 'PENDING',
    };
    if (data.targetType === 'USER' && data.targetId) reportData.reportedUserId = data.targetId;
    if (data.targetType === 'POST' && data.targetId) reportData.postId = data.targetId;
    if (data.targetType === 'COMMENT' && data.targetId) reportData.commentId = data.targetId;
    if (data.targetType === 'STATUS' && data.targetId) reportData.statusId = data.targetId;

    return prisma.report.create({ data: reportData });
  }

  static async listClubTransactions(clubId: string) {
    return prisma.financialTransaction.findMany({
      where: { clubId },
      orderBy: { date: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  static async createClubTransaction(clubId: string, userId: string | null, data: any) {
    return prisma.financialTransaction.create({
      data: {
        clubId,
        userId: userId || null,
        description: data.description,
        category: data.category || 'Général',
        amount: Number(data.amount) || 0,
        type: data.type || 'INCOME',
        userOrOrg: data.userOrOrg || 'Club',
        status: data.status || 'PAYÉ',
      },
    });
  }

  static async listClubEvents(clubId: string) {
    return prisma.event.findMany({
      where: { clubId },
      orderBy: { eventDate: 'asc' },
    });
  }

  static async createClubEvent(clubId: string, data: any) {
    return prisma.event.create({
      data: {
        clubId,
        title: data.title,
        type: data.type || 'ENTRAÎNEMENT',
        eventDate: new Date(data.eventDate || data.date || Date.now()),
        time: data.time || '18:00',
        location: data.location || 'Terrain du club',
        description: data.description || '',
      },
    });
  }
}
