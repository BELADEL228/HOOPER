import { prisma } from '../config/database';
import { CreateTeamInput } from '../validators/team.validator';
import { BrandingService } from './branding.service';

export class TeamService {
  static async listTeams(filters: { clubId?: string; city?: string; category?: string }) {
    const where: any = {};
    if (filters.clubId) where.clubId = filters.clubId;
    if (filters.city) where.city = filters.city;
    if (filters.category) where.category = filters.category;

    const teams = await prisma.team.findMany({
      where,
      include: {
        club: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
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
      orderBy: { createdAt: 'desc' },
    });

    return teams.map((team) => ({
      ...team,
      clubName: team.club?.name || null,
      membersCount: team.members.length,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    }));
  }

  static async getTeamById(idOrSlug: string) {
    const team = await prisma.team.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        club: true,
        members: {
          include: {
            user: {
              include: {
                player: true,
              },
            },
          },
        },
      },
    });

    if (!team) return null;

    return {
      ...team,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    };
  }

  static async createTeam(input: CreateTeamInput) {
    let themeTokens = null;
    if (input.logoUrl || input.name) {
      themeTokens = await BrandingService.extractThemeFromLogo(input.logoUrl || '', input.name);
    }

    const team = await prisma.team.create({
      data: {
        clubId: input.clubId,
        name: input.name,
        slug: input.slug || input.name.toLowerCase().replace(/\s+/g, '-'),
        description: input.description,
        city: input.city || 'Lomé',
        category: input.category || 'SENIOR',
        foundedYear: input.foundedYear,
        logoUrl: input.logoUrl,
        primaryColor: input.primaryColor || themeTokens?.primary || '#FF2A3B',
        secondaryColor: input.secondaryColor || themeTokens?.secondary || '#FFB800',
        accentColor: input.accentColor || themeTokens?.accent || '#38BDF8',
        themeType: input.themeType || themeTokens?.themeType || 'dark',
        themeJson: JSON.stringify(themeTokens || input.themeJson || {}),
      },
    });

    return team;
  }

  static async patchTeamTheme(teamId: string, data: { primaryColor?: string; secondaryColor?: string; accentColor?: string; themeType?: string; themeJson?: any }) {
    const updateData: any = {};
    if (data.primaryColor) updateData.primaryColor = data.primaryColor;
    if (data.secondaryColor) updateData.secondaryColor = data.secondaryColor;
    if (data.accentColor) updateData.accentColor = data.accentColor;
    if (data.themeType) updateData.themeType = data.themeType;
    if (data.themeJson) {
      updateData.themeJson = typeof data.themeJson === 'object' ? JSON.stringify(data.themeJson) : data.themeJson;
    }

    const updated = await prisma.team.update({
      where: { id: teamId },
      data: updateData,
    });

    return updated;
  }
}
