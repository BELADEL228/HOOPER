import { prisma, fallbackUsers, isDatabaseAvailable } from '../config/database';
import { toRole } from '../middlewares/auth.middleware';
import { UserRole } from '../config/constants';

export class AdminService {
  static async getSupervision() {
    const [users, clubs, teams, posts, matches, tournaments, reportsPending, requestsPending, auditLogs, recentUsers, database] = await Promise.all([
      prisma.user.count(), prisma.club.count(), prisma.team.count(), prisma.post.count(), prisma.match.count(), prisma.tournament.count(),
      prisma.report.count({ where: { status: 'PENDING' } }), prisma.clubCreationRequest.count({ where: { status: 'PENDING' } }),
      prisma.auditLog.findMany({ take: 8, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, role: true } } } }),
      prisma.user.findMany({ take: 6, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, role: true, createdAt: true, isSuspended: true } }),
      prisma.$queryRawUnsafe('SELECT 1').then(() => 'ONLINE').catch(() => 'OFFLINE'),
    ]);
    return {
      generatedAt: new Date().toISOString(), database,
      system: { uptimeSeconds: Math.floor(process.uptime()), memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), environment: process.env.NODE_ENV || 'development' },
      inventory: { users, clubs, teams, posts, matches, tournaments },
      attention: { reportsPending, requestsPending },
      auditLogs: auditLogs.map((log) => ({ ...log, createdAt: log.createdAt.toISOString() })),
      recentUsers: recentUsers.map((user) => ({ ...user, createdAt: user.createdAt.toISOString() })),
    };
  }

  static async getMetrics() {
    const totalUsers = !isDatabaseAvailable() ? fallbackUsers.length : await prisma.user.count();
    const suspendedUsers = !isDatabaseAvailable()
      ? fallbackUsers.filter((u) => u.isSuspended).length
      : await prisma.user.count({ where: { isSuspended: true } });

    const totalPosts = await prisma.post.count().catch(() => 0);
    const totalMatches = await prisma.match.count().catch(() => 0);
    const totalTournaments = await prisma.tournament.count().catch(() => 0);
    const totalTeams = await prisma.team.count().catch(() => 0);
    const totalClubs = await prisma.club.count().catch(() => 0);
    const pendingReports = await prisma.report.count({ where: { status: 'PENDING' } }).catch(() => 0);
    const resolvedReports = await prisma.report.count({ where: { status: 'RESOLVED' } }).catch(() => 0);

    return {
      users: {
        total: totalUsers,
        active: Math.max(0, totalUsers - suspendedUsers),
        suspended: suspendedUsers,
      },
      content: {
        posts: totalPosts,
        matches: totalMatches,
        tournaments: totalTournaments,
        teams: totalTeams,
        clubs: totalClubs,
      },
      moderation: {
        pendingReports,
        resolvedReports,
      },
      system: {
        uptime: process.uptime(),
        memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        environment: process.env.NODE_ENV || 'development',
      },
    };
  }

  static async listUsers(search?: string, roleFilter?: string) {
    if (!isDatabaseAvailable()) {
      let filtered = fallbackUsers;
      if (roleFilter && roleFilter !== 'ALL') {
        filtered = filtered.filter((u) => u.role === roleFilter);
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
      }
      return filtered.map((u) => ({
        ...u,
        createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
      }));
    }

    const where: any = {};
    if (roleFilter && roleFilter !== 'ALL') where.role = roleFilter;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        _count: {
          select: {
            posts: true,
            comments: true,
            reportsReceived: true,
          },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      avatarUrl: u.avatarUrl,
      country: u.country,
      city: u.city,
      isSuspended: u.isSuspended,
      suspendReason: u.suspendReason,
      suspendedUntil: u.suspendedUntil ? u.suspendedUntil.toISOString() : null,
      createdAt: u.createdAt.toISOString(),
      postsCount: u._count.posts,
      commentsCount: u._count.comments,
      reportsReceivedCount: u._count.reportsReceived,
    }));
  }

  static async changeUserRole(targetUserId: string, newRole: string) {
    const role: UserRole = toRole(newRole);
    if (!isDatabaseAvailable()) {
      const u = fallbackUsers.find((user) => user.id === targetUserId);
      if (!u) throw new Error('Utilisateur non trouvé.');
      u.role = role;
      return u;
    }
    return prisma.user.update({
      where: { id: targetUserId },
      data: { role },
    });
  }

  static async changeUserStatus(targetUserId: string, isSuspended: boolean, reason?: string, suspendedUntil?: string) {
    if (!isDatabaseAvailable()) {
      const u = fallbackUsers.find((user) => user.id === targetUserId);
      if (!u) throw new Error('Utilisateur non trouvé.');
      u.isSuspended = isSuspended;
      u.suspendReason = isSuspended ? reason || null : null;
      u.suspendedUntil = isSuspended && suspendedUntil ? new Date(suspendedUntil) : null;
      return u;
    }

    return prisma.user.update({
      where: { id: targetUserId },
      data: {
        isSuspended,
        suspendReason: isSuspended ? reason || null : null,
        suspendedUntil: isSuspended && suspendedUntil ? new Date(suspendedUntil) : null,
      },
    });
  }

  static async deleteUser(targetUserId: string) {
    if (!isDatabaseAvailable()) {
      const idx = fallbackUsers.findIndex((u) => u.id === targetUserId);
      if (idx !== -1) fallbackUsers.splice(idx, 1);
      return { success: true };
    }
    await prisma.user.delete({ where: { id: targetUserId } });
    return { success: true };
  }

  static async listReports(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return prisma.report.findMany({
      where,
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        reportedUser: { select: { id: true, name: true, email: true, isSuspended: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateReport(id: string, status: string, resolutionNote?: string, resolvedBy?: string) {
    return prisma.report.update({
      where: { id },
      data: { status, resolutionNote, resolvedBy },
    });
  }

  static async listAuditLogs(limit: number = 100) {
    return prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }
}
