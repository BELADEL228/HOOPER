import { prisma } from '../config/database';

export class MatchService {
  static async listMatches(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    const matches = await prisma.match.findMany({
      where,
      include: {
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { matchDate: 'asc' },
    });

    return matches.map((match) => ({
      id: match.id,
      opponent: match.opponent,
      opponentLogo: match.opponentLogo,
      isHome: match.isHome,
      date: match.matchDate.toISOString().slice(0, 10),
      time: match.time,
      venue: match.venue,
      address: match.address,
      category: match.category,
      status: match.status,
      scoreTeam: match.scoreTeam ?? undefined,
      scoreOpponent: match.scoreOpponent ?? undefined,
      quarterScoresTeam: match.quarterScoresJson ? JSON.parse(match.quarterScoresJson)?.team : undefined,
      quarterScoresOpponent: match.quarterScoresJson ? JSON.parse(match.quarterScoresJson)?.opponent : undefined,
      summary: match.summary ?? undefined,
      mvpPlayerName: match.mvpPlayerName ?? undefined,
      videoUrl: match.videoUrl ?? undefined,
      photos: match.photosJson ? JSON.parse(match.photosJson) : [],
    }));
  }

  static async createMatch(data: any) {
    const match = await prisma.match.create({
      data: {
        clubId: data.clubId || null,
        teamId: data.teamId || null,
        opponent: data.opponent,
        opponentLogo: data.opponentLogo || '🏀',
        isHome: data.isHome ?? true,
        matchDate: new Date(data.date || data.matchDate),
        time: data.time || '20:30',
        venue: data.venue || 'Terrain Principal',
        address: data.address || 'Lomé',
        category: data.category || 'SENIOR',
        status: data.status || 'UPCOMING',
        scoreTeam: data.scoreTeam,
        scoreOpponent: data.scoreOpponent,
        quarterScoresJson: data.quarterScoresTeam ? JSON.stringify({ team: data.quarterScoresTeam, opponent: data.quarterScoresOpponent }) : null,
        summary: data.summary,
        mvpPlayerName: data.mvpPlayerName,
        videoUrl: data.videoUrl,
        photosJson: JSON.stringify(data.photos || []),
      },
    });
    return match;
  }

  static async updateMatch(id: string, data: any) {
    const updateData: any = {};
    if (data.opponent) updateData.opponent = data.opponent;
    if (data.opponentLogo) updateData.opponentLogo = data.opponentLogo;
    if (data.isHome !== undefined) updateData.isHome = data.isHome;
    if (data.date || data.matchDate) updateData.matchDate = new Date(data.date || data.matchDate);
    if (data.time) updateData.time = data.time;
    if (data.venue) updateData.venue = data.venue;
    if (data.address) updateData.address = data.address;
    if (data.category) updateData.category = data.category;
    if (data.status) updateData.status = data.status;
    if (data.scoreTeam !== undefined) updateData.scoreTeam = data.scoreTeam;
    if (data.scoreOpponent !== undefined) updateData.scoreOpponent = data.scoreOpponent;
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.mvpPlayerName !== undefined) updateData.mvpPlayerName = data.mvpPlayerName;
    if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl;
    if (data.photos) updateData.photosJson = JSON.stringify(data.photos);

    return prisma.match.update({
      where: { id },
      data: updateData,
    });
  }

  static async deleteMatch(id: string) {
    return prisma.match.delete({ where: { id } });
  }

  static async listEvents(matchId: string) {
    return prisma.matchEvent.findMany({
      where: { matchId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async addEvent(matchId: string, data: any) {
    return prisma.matchEvent.create({
      data: {
        matchId,
        quarter: data.quarter || 1,
        clock: data.clock || '10:00',
        kind: data.kind || 'SCORE',
        playerName: data.playerName,
        points: data.points || 0,
      },
    });
  }

  static async listMatchRequestsForUser(userId: string, role: string) {
    const managedClubIds = role === 'SUPER_ADMIN'
      ? undefined
      : (await prisma.clubMember.findMany({
          where: { userId, role: { in: ['PRESIDENT', 'CLUB_ADMIN'] } },
          select: { clubId: true },
        })).map((membership) => membership.clubId);

    if (managedClubIds && managedClubIds.length === 0) return [];
    return prisma.matchRequest.findMany({
      where: managedClubIds ? {
        OR: [
          { requesterTeam: { clubId: { in: managedClubIds } } },
          { targetTeam: { clubId: { in: managedClubIds } } },
        ],
      } : undefined,
      include: {
        requesterTeam: true,
        targetTeam: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createMatchRequest(data: any) {
    return prisma.matchRequest.create({
      data: {
        requesterTeamId: data.requesterTeamId,
        targetTeamId: data.targetTeamId,
        proposedDate: new Date(data.proposedDate),
        proposedTime: data.proposedTime || '16:00',
        venue: data.venue || 'Terrain Principal',
        category: data.category || 'SENIOR',
        message: data.message,
      },
    });
  }

  static async updateMatchRequestStatus(id: string, status: string) {
    return prisma.matchRequest.update({
      where: { id },
      data: { status },
    });
  }
}
