import { prisma } from '../config/database';
import { ClubService } from './club.service';
import { validateCreateClubInput } from '../validators/club.validator';

export class ClubRequestError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const requestInclude = {
  requester: { select: { id: true, name: true, email: true, avatarUrl: true } },
};

export class ClubRequestService {
  static async submitRequest(requesterId: string, input: unknown) {
    const validation = validateCreateClubInput(input);
    if (!validation.valid || !validation.data) {
      throw new ClubRequestError(validation.error || 'Données de demande invalides.');
    }

    const membership = await prisma.clubMember.findFirst({ where: { userId: requesterId } });
    if (membership) throw new ClubRequestError('Vous êtes déjà membre d’un club.');

    const pending = await prisma.clubCreationRequest.findFirst({
      where: { requesterId, status: 'PENDING' },
    });
    if (pending) throw new ClubRequestError('Une demande est déjà en cours d’examen.', 409);

    const data = validation.data;
    return prisma.clubCreationRequest.create({
      data: {
        requesterId,
        clubName: data.name,
        shortName: data.shortName,
        city: data.city,
        country: data.country || 'Togo',
        description: data.description,
        logoUrl: data.logoUrl,
        email: data.email,
        phoneNumber: data.phoneNumber,
        website: data.website,
        foundedYear: data.foundedYear,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
      },
      include: requestInclude,
    });
  }

  static async listRequests(status?: string) {
    return prisma.clubCreationRequest.findMany({
      where: status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status) ? { status } : undefined,
      include: requestInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  static async myRequests(requesterId: string) {
    return prisma.clubCreationRequest.findMany({
      where: { requesterId }, include: requestInclude, orderBy: { createdAt: 'desc' },
    });
  }

  static async approveRequest(requestId: string, superAdminId: string) {
    const request = await prisma.clubCreationRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new ClubRequestError('Demande introuvable.', 404);
    if (request.status !== 'PENDING') throw new ClubRequestError('Cette demande a déjà été traitée.', 409);

    const duplicate = await prisma.club.findFirst({ where: { name: request.clubName } });
    if (duplicate) throw new ClubRequestError('Un club portant ce nom existe déjà.', 409);

    const validation = validateCreateClubInput({
      name: request.clubName, shortName: request.shortName, city: request.city, country: request.country,
      description: request.description, logoUrl: request.logoUrl, email: request.email,
      phoneNumber: request.phoneNumber, website: request.website, foundedYear: request.foundedYear,
      primaryColor: request.primaryColor, secondaryColor: request.secondaryColor,
    });
    if (!validation.valid || !validation.data) throw new ClubRequestError('La demande contient des données invalides.');

    // ClubService centralise la création et l'identité visuelle; les mutations restantes sont atomiques.
    const club = await ClubService.createClub(validation.data, request.requesterId);
    try {
      await prisma.$transaction([
        prisma.user.update({ where: { id: request.requesterId }, data: { role: 'ADMIN' } }),
        prisma.clubCreationRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED', reviewedBy: superAdminId, reviewedAt: new Date() },
        }),
        prisma.notification.create({
          data: {
            userId: request.requesterId, type: 'CLUB_REQUEST_APPROVED', title: 'Club approuvé',
            text: `Votre demande pour « ${club.name} » a été approuvée. Votre espace club est prêt.`,
          },
        }),
      ]);
    } catch (error) {
      await prisma.club.delete({ where: { id: club.id } }).catch(() => undefined);
      throw error;
    }
    return { club, request: await prisma.clubCreationRequest.findUnique({ where: { id: requestId }, include: requestInclude }) };
  }

  static async rejectRequest(requestId: string, superAdminId: string, note?: string) {
    const request = await prisma.clubCreationRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new ClubRequestError('Demande introuvable.', 404);
    if (request.status !== 'PENDING') throw new ClubRequestError('Cette demande a déjà été traitée.', 409);
    if (!note?.trim()) throw new ClubRequestError('Une note de refus est obligatoire.');

    const [, updated] = await prisma.$transaction([
      prisma.notification.create({
        data: { userId: request.requesterId, type: 'CLUB_REQUEST_REJECTED', title: 'Demande de club refusée', text: note.trim() },
      }),
      prisma.clubCreationRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED', adminNote: note.trim(), reviewedBy: superAdminId, reviewedAt: new Date() },
        include: requestInclude,
      }),
    ]);
    return updated;
  }
}
