import { prisma } from '../config/database';
import { BrandingService } from './branding.service';
import { CreateClubInput } from '../validators/club.validator';

export class ClubService {
  static async getClubMembers(clubId: string) {
    return prisma.clubMember.findMany({
      where: { clubId }, orderBy: { joinedAt: 'asc' },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true, isSuspended: true } } },
    });
  }

  static async updateClubMemberRole(clubId: string, userId: string, role: string) {
    const allowed = ['PRESIDENT', 'CLUB_ADMIN', 'COACH', 'TREASURER', 'PLAYER', 'MEMBER'];
    if (!allowed.includes(role)) throw new Error('Rôle de club invalide.');
    return prisma.clubMember.update({ where: { clubId_userId: { clubId, userId } }, data: { role } });
  }

  static async isClubManager(clubId: string, userId: string, platformRole: string) {
    if (platformRole === 'SUPER_ADMIN') return true;
    const member = await prisma.clubMember.findUnique({ where: { clubId_userId: { clubId, userId } } });
    return Boolean(member && ['PRESIDENT', 'CLUB_ADMIN'].includes(member.role));
  }

  static async listClubs(query: { search?: string; city?: string; country?: string }) {
    const where: any = {};

    if (query.city) {
      where.city = { contains: query.city };
    }

    if (query.country) {
      where.country = { contains: query.country };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { description: { contains: query.search } },
        { city: { contains: query.search } },
      ];
    }

    const clubs = await prisma.club.findMany({
      where,
      include: {
        _count: {
          select: {
            teams: true,
            posts: true,
            members: true,
          },
        },
        teams: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            division: true,
            coachName: true,
            record: true,
            description: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limite pour éviter les problèmes de performance
    });

    return clubs.map((club) => ({
      id: club.id,
      name: club.name,
      slug: club.slug,
      shortName: club.shortName,
      logoUrl: club.logoUrl,
      bannerUrl: club.bannerUrl,
      description: club.description,
      city: club.city,
      country: club.country,
      address: club.address,
      arena: club.arena,
      email: club.email,
      phoneNumber: club.phoneNumber,
      website: club.website,
      foundedYear: club.foundedYear,
      primaryColor: club.primaryColor,
      secondaryColor: club.secondaryColor,
      accentColor: club.accentColor,
      themeType: club.themeType,
      themeJson: club.themeJson ? JSON.parse(club.themeJson) : null,
      isVerified: club.isVerified,
      teamsCount: club._count.teams,
      postsCount: club._count.posts,
      membersCount: club._count.members,
      teams: club.teams,
      createdAt: club.createdAt.toISOString(),
    }));
  }

  static async getClubByIdOrSlug(identifier: string) {
    const club = await prisma.club.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: {
        teams: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    role: true,
                    player: true,
                  },
                },
              },
            },
          },
        },
        posts: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                role: true,
              },
            },
            likes: true,
            comments: {
              include: {
                author: {
                  select: { id: true, name: true, avatarUrl: true },
                },
              },
            },
          },
        },
        members: {
          take: 50, // Limite pour éviter les problèmes de performance
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!club) {
      return null;
    }

    return {
      id: club.id,
      name: club.name,
      slug: club.slug,
      shortName: club.shortName,
      logoUrl: club.logoUrl,
      bannerUrl: club.bannerUrl,
      description: club.description,
      city: club.city,
      country: club.country,
      address: club.address,
      arena: club.arena,
      email: club.email,
      phoneNumber: club.phoneNumber,
      website: club.website,
      foundedYear: club.foundedYear,
      primaryColor: club.primaryColor,
      secondaryColor: club.secondaryColor,
      accentColor: club.accentColor,
      themeType: club.themeType,
      themeTokens: club.themeJson ? JSON.parse(club.themeJson) : null,
      isVerified: club.isVerified,
      teams: club.teams,
      posts: club.posts,
      members: club.members,
      createdAt: club.createdAt.toISOString(),
    };
  }

  static async createClub(input: CreateClubInput, creatorUserId?: string) {
    // Si un logo est renseigné, analyser les couleurs pour créer l'identité visuelle
    let themeTokens = null;
    if (input.logoUrl || input.name) {
      themeTokens = await BrandingService.extractThemeFromLogo(input.logoUrl || '', input.name);
    }

    const primary = input.primaryColor || themeTokens?.primary || '#FF2A3B';
    const secondary = input.secondaryColor || themeTokens?.secondary || '#FFB800';
    const accent = input.accentColor || themeTokens?.accent || '#38BDF8';
    const themeType = input.themeType || themeTokens?.themeType || 'dark';

    const club = await prisma.club.create({
      data: {
        name: input.name,
        slug: input.slug || input.name.toLowerCase().replace(/\s+/g, '-'),
        shortName: input.shortName,
        description: input.description,
        city: input.city,
        country: input.country || 'Togo',
        address: input.address,
        email: input.email,
        phoneNumber: input.phoneNumber,
        website: input.website,
        foundedYear: input.foundedYear,
        logoUrl: input.logoUrl,
        bannerUrl: input.bannerUrl,
        primaryColor: primary,
        secondaryColor: secondary,
        accentColor: accent,
        themeType,
        themeJson: JSON.stringify(themeTokens || input.themeJson || {}),
        isVerified: true,
      },
    });

    // Assigner le créateur comme président du club
    if (creatorUserId) {
      await prisma.clubMember.create({
        data: {
          clubId: club.id,
          userId: creatorUserId,
          role: 'PRESIDENT',
        },
      });
    }

    return club;
  }

  static async updateClubTheme(clubId: string, tokens: any) {
    const primary = tokens.primary || '#FF2A3B';
    const secondary = tokens.secondary || '#FFB800';
    const accent = tokens.accent || '#38BDF8';
    const themeType = tokens.themeType || 'dark';

    const updated = await prisma.club.update({
      where: { id: clubId },
      data: {
        primaryColor: primary,
        secondaryColor: secondary,
        accentColor: accent,
        themeType,
        themeJson: typeof tokens === 'string' ? tokens : JSON.stringify(tokens),
        ...(typeof tokens?.logoUrl === 'string' ? { logoUrl: tokens.logoUrl } : {}),
      },
    });

    return updated;
  }

  static async getClubRoster(identifier: string, teamId?: string) {
    const club = await prisma.club.findFirst({
      where: { OR: [{ id: identifier }, { slug: identifier }] },
      include: { teams: true },
    });
    if (!club) return [];

    let targetTeamIds: string[] = club.teams.map((t) => t.id);
    if (teamId) {
      targetTeamIds = targetTeamIds.filter((id) => id === teamId);
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId: { in: targetTeamIds } },
      include: {
        team: true,
        user: {
          include: {
            player: true,
          },
        },
      },
    });

    return members
      .filter((m) => m.user.player !== null)
      .map((m) => {
        const p = m.user.player!;
        return {
          id: p.id,
          userId: m.user.id,
          teamId: m.teamId,
          teamName: m.team.name,
          name: m.user.name,
          number: p.jerseyNumber,
          position: p.position,
          category: p.category,
          gender: p.gender,
          height: `${(p.heightCm / 100).toFixed(2)}m`,
          weight: `${p.weightKg}kg`,
          age: p.age,
          photo: p.photoUrl || m.user.avatarUrl || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600',
          bio: p.bio || '',
          experienceYears: p.experienceYears,
          seasonStats: {
            ppg: p.ppg,
            rpg: p.rpg,
            apg: p.apg,
            spg: p.spg,
            bpg: p.bpg,
            efficiency: p.efficiency,
            fgPct: p.fgPct,
            threePtPct: p.threePtPct,
            ftPct: p.ftPct,
          },
          achievements: JSON.parse(p.achievementsJson || '[]'),
        };
      });
  }

  static async getClubMatches(identifier: string, teamId?: string) {
    const club = await prisma.club.findFirst({
      where: { OR: [{ id: identifier }, { slug: identifier }] },
      include: { teams: true },
    });
    if (!club) return [];

    const targetTeamIds = teamId ? [teamId] : club.teams.map((t) => t.id);

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { clubId: club.id },
          { teamId: { in: targetTeamIds } },
        ],
      },
      orderBy: { matchDate: 'desc' },
      include: {
        team: true,
      },
    });

    return matches.map((m) => ({
      id: m.id,
      teamId: m.teamId,
      teamName: m.team?.name || club.name,
      opponent: m.opponent,
      opponentLogo: m.opponentLogo,
      isHome: m.isHome,
      date: m.matchDate.toISOString().split('T')[0],
      time: m.time,
      venue: m.venue,
      address: m.address,
      status: m.status,
      scoreTeam: m.scoreTeam,
      scoreOpponent: m.scoreOpponent,
      summary: m.summary,
      mvpPlayerName: m.mvpPlayerName,
    }));
  }

  static async getClubNews(identifier: string) {
    const club = await prisma.club.findFirst({
      where: { OR: [{ id: identifier }, { slug: identifier }] },
    });
    if (!club) return [];

    const posts = await prisma.post.findMany({
      where: { clubId: club.id },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true, role: true },
        },
      },
    });

    return posts.map((p) => ({
      id: p.id,
      clubId: p.clubId,
      content: p.content,
      authorName: p.author.name,
      authorAvatar: p.author.avatarUrl,
      authorRole: p.author.role,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  static async getClubStats(identifier: string) {
    const matches = await ClubService.getClubMatches(identifier);
    const finished = matches.filter((m: any) => m.status === 'FINISHED');
    const wins = finished.filter((m: any) => (m.scoreTeam ?? 0) > (m.scoreOpponent ?? 0)).length;
    const losses = finished.length - wins;
    const avgPtsScored = finished.length > 0
      ? (finished.reduce((acc: number, m: any) => acc + (m.scoreTeam ?? 0), 0) / finished.length).toFixed(1)
      : '0';
    const avgPtsAllowed = finished.length > 0
      ? (finished.reduce((acc: number, m: any) => acc + (m.scoreOpponent ?? 0), 0) / finished.length).toFixed(1)
      : '0';

    return {
      wins,
      losses,
      played: finished.length,
      avgPointsScored: Number(avgPtsScored),
      avgPointsAllowed: Number(avgPtsAllowed),
      winRate: finished.length > 0 ? `${Math.round((wins / finished.length) * 100)}%` : '0%',
    };
  }
}
