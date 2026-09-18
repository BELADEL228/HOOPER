import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function runFullSeed() {
  console.log('🧹 Nettoyage des anciennes données...');
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

  const passwordHash = await bcrypt.hash('FireStone2026!', 10);

  console.log('👤 Création des utilisateurs clés...');
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

  const coachKoffi = await prisma.user.create({
    data: {
      email: 'coach.koffi@firestone.com',
      name: 'Koffi Amouzou',
      role: 'COACH',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      bio: 'Entraîneur diplômé FIBA, plus de 12 ans d’expérience en ligue nationale togolaise.',
      country: 'Togo',
      city: 'Lomé',
    },
  });

  const presidentAbalo = await prisma.user.create({
    data: {
      email: 'president@firestone.com',
      name: 'Abalo Mensah',
      role: 'CLUB_MANAGER',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      bio: 'Président du Fire Stone Basketball Club. Bâtisseur de projets sportifs et éducatifs.',
      country: 'Togo',
      city: 'Lomé',
    },
  });

  const playerMarcus = await prisma.user.create({
    data: {
      email: 'marcus.vance@firestone.com',
      name: 'Marcus Vance',
      role: 'PLAYER',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600',
      country: 'Togo',
      city: 'Lomé',
    },
  });

  const playerDavid = await prisma.user.create({
    data: {
      email: 'david.lawson@firestone.com',
      name: 'David Lawson',
      role: 'PLAYER',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600',
      country: 'Togo',
      city: 'Lomé',
    },
  });

  const playerSamuel = await prisma.user.create({
    data: {
      email: 'samuel.kpogo@firestone.com',
      name: 'Samuel Kpogo',
      role: 'PLAYER',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600',
      country: 'Togo',
      city: 'Lomé',
    },
  });

  const playerAlex = await prisma.user.create({
    data: {
      email: 'alex.amegan@firestone.com',
      name: 'Alex Amegan',
      role: 'PLAYER',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600',
      country: 'Togo',
      city: 'Lomé',
    },
  });

  console.log('🏛️ Création des Clubs réels...');

  // 1. FIRE STONE BASKETBALL CLUB
  const fireStoneClub = await prisma.club.create({
    data: {
      name: 'Fire Stone Basketball Club',
      slug: 'fire-stone-lome',
      shortName: 'FSBC',
      logoUrl: '/logo.jpeg',
      bannerUrl: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=1600&auto=format&fit=crop&q=80',
      description: 'Club phare et référence du basketball togolais fondé avec la vision de former l’élite sportive et citoyenne. Rigueur, intensité et excellence tactique.',
      city: 'Lomé',
      country: 'Togo',
      address: 'Boulevard Circulaire, Quartier Nyékonakpoè',
      arena: 'Palais des Congrès de Lomé & Stadium Municipal',
      email: 'contact@firestone-basketball.tg',
      phoneNumber: '+228 90 12 34 56',
      website: 'https://firestone-basketball.tg',
      foundedYear: 2018,
      primaryColor: '#FF2A3B',
      secondaryColor: '#FFB800',
      accentColor: '#38BDF8',
      themeType: 'dark',
      isVerified: true,
    },
  });

  // Membres Club Fire Stone
  await prisma.clubMember.createMany({
    data: [
      { clubId: fireStoneClub.id, userId: presidentAbalo.id, role: 'PRESIDENT' },
      { clubId: fireStoneClub.id, userId: coachKoffi.id, role: 'COACH' },
      { clubId: fireStoneClub.id, userId: playerMarcus.id, role: 'PLAYER' },
      { clubId: fireStoneClub.id, userId: playerDavid.id, role: 'PLAYER' },
      { clubId: fireStoneClub.id, userId: playerSamuel.id, role: 'PLAYER' },
      { clubId: fireStoneClub.id, userId: playerAlex.id, role: 'PLAYER' },
    ],
  });

  // Équipes Fire Stone
  const fireStoneSenior = await prisma.team.create({
    data: {
      clubId: fireStoneClub.id,
      name: 'Fire Stone Lomé - Senior D1',
      slug: 'fire-stone-senior-d1',
      category: 'SENIOR',
      division: 'Division 1 Nationale',
      coachName: 'Koffi Amouzou',
      record: '8V - 2D',
      city: 'Lomé',
      description: 'L’équipe première professionnelle engagée en première division togolaise.',
      logoUrl: '/logo.jpeg',
      primaryColor: '#FF2A3B',
      secondaryColor: '#FFB800',
    },
  });

  await prisma.team.create({
    data: {
      clubId: fireStoneClub.id,
      name: 'Fire Stone Académie U20',
      slug: 'fire-stone-academie-u20',
      category: 'ESPOIRS',
      division: 'Ligue Espoirs U20',
      coachName: 'Abalo Mensah',
      record: '6V - 1D',
      city: 'Lomé',
      description: 'Centre de formation et pépinière de jeunes talents pour la relève sportive.',
      logoUrl: '/logo.jpeg',
      primaryColor: '#FF2A3B',
      secondaryColor: '#FFB800',
    },
  });

  // Profils Joueurs et affectation équipe Senior
  await prisma.playerProfile.create({
    data: {
      userId: playerMarcus.id,
      jerseyNumber: 7,
      position: 'Meneur (PG)',
      heightCm: 188,
      weightKg: 82,
      age: 24,
      category: 'SENIOR',
      photoUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600',
      bio: 'Capitaine et organisateur de jeu. Vision périphérique exceptionnelle et clutch player.',
      experienceYears: 6,
      ppg: 22.4,
      rpg: 5.6,
      apg: 8.8,
      spg: 2.1,
      bpg: 0.4,
      efficiency: 26.5,
      fgPct: 48.5,
      threePtPct: 41.2,
      ftPct: 87.0,
      achievementsJson: JSON.stringify(['MVP Finale Coupe du Togo 2025', 'Meilleur Passeur Ligue D1']),
    },
  });

  await prisma.playerProfile.create({
    data: {
      userId: playerDavid.id,
      jerseyNumber: 11,
      position: 'Arrière Tireur (SG)',
      heightCm: 194,
      weightKg: 88,
      age: 22,
      category: 'SENIOR',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600',
      bio: 'Tireur d’élite à 3 points capable de débloquer les défenses de zone.',
      experienceYears: 4,
      ppg: 17.8,
      rpg: 4.2,
      apg: 3.1,
      efficiency: 18.2,
      fgPct: 45.2,
      threePtPct: 42.8,
      ftPct: 83.5,
    },
  });

  await prisma.playerProfile.create({
    data: {
      userId: playerSamuel.id,
      jerseyNumber: 15,
      position: 'Pivot (C)',
      heightCm: 206,
      weightKg: 104,
      age: 26,
      category: 'SENIOR',
      photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600',
      bio: 'Protecteur d’arceau dominateur, meilleur rebondeur de la ligue.',
      experienceYears: 7,
      ppg: 14.5,
      rpg: 12.8,
      apg: 1.8,
      bpg: 2.7,
      efficiency: 23.4,
      fgPct: 56.4,
      ftPct: 70.2,
    },
  });

  await prisma.playerProfile.create({
    data: {
      userId: playerAlex.id,
      jerseyNumber: 3,
      position: 'Ailier (SF)',
      heightCm: 198,
      weightKg: 92,
      age: 21,
      category: 'SENIOR',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600',
      bio: 'Athlète polyvalent, très fort en transition et en défense individuelle.',
      experienceYears: 3,
      ppg: 12.6,
      rpg: 6.4,
      apg: 2.9,
      efficiency: 15.0,
      fgPct: 46.0,
      threePtPct: 34.5,
      ftPct: 76.0,
    },
  });

  await prisma.teamMember.createMany({
    data: [
      { teamId: fireStoneSenior.id, userId: playerMarcus.id, role: 'PLAYER' },
      { teamId: fireStoneSenior.id, userId: playerDavid.id, role: 'PLAYER' },
      { teamId: fireStoneSenior.id, userId: playerSamuel.id, role: 'PLAYER' },
      { teamId: fireStoneSenior.id, userId: playerAlex.id, role: 'PLAYER' },
    ],
  });

  // Matchs Fire Stone
  const now = new Date();
  const pastMatch1 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const pastMatch2 = new Date(now.getTime() - 3 * 24 * 3600 * 1000);
  const futureMatch1 = new Date(now.getTime() + 4 * 24 * 3600 * 1000);

  await prisma.match.createMany({
    data: [
      {
        clubId: fireStoneClub.id,
        teamId: fireStoneSenior.id,
        opponent: 'Étoile Filante',
        opponentLogo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=100',
        isHome: true,
        matchDate: pastMatch1,
        time: '18:30',
        venue: 'Palais des Congrès',
        address: 'Place des Fêtes, Lomé',
        status: 'FINISHED',
        scoreTeam: 82,
        scoreOpponent: 74,
        summary: 'Victoire intense avec un run décisif au 4e quart-temps porté par Marcus Vance.',
        mvpPlayerName: 'Marcus Vance',
      },
      {
        clubId: fireStoneClub.id,
        teamId: fireStoneSenior.id,
        opponent: 'Dynamos de Lomé',
        opponentLogo: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=100',
        isHome: false,
        matchDate: pastMatch2,
        time: '16:00',
        venue: 'Adétikopé Stadium',
        address: 'Adétikopé, Grand Lomé',
        status: 'FINISHED',
        scoreTeam: 76,
        scoreOpponent: 70,
        summary: 'Défense de fer en déplacement. Dominance aux rebonds de Samuel Kpogo.',
        mvpPlayerName: 'Samuel Kpogo',
      },
      {
        clubId: fireStoneClub.id,
        teamId: fireStoneSenior.id,
        opponent: 'Racing Club de Lomé',
        opponentLogo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100',
        isHome: true,
        matchDate: futureMatch1,
        time: '20:00',
        venue: 'Stadium Municipal de Lomé',
        address: 'Rue du Commerce, Lomé',
        status: 'UPCOMING',
        summary: 'Grand classique de la ligue D1 togolaise. Billetterie ouverte.',
      },
    ],
  });

  // Publications Officielles Fire Stone
  await prisma.post.createMany({
    data: [
      {
        authorId: presidentAbalo.id,
        clubId: fireStoneClub.id,
        content: '🏆 Belle prestation de nos guerriers ce week-end ! L’état d’esprit est irréprochable et nous continuons notre marche vers le titre national. Merci à tous les supporters présents au Palais des Congrès !',
        createdAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
      },
      {
        authorId: coachKoffi.id,
        clubId: fireStoneClub.id,
        content: '🏀 Séance tactique vidéo et travail d’adresse ce mercredi à 17h00. Focus total sur le choc de samedi contre le Racing Club.',
        createdAt: new Date(now.getTime() - 1 * 24 * 3600 * 1000),
      },
    ],
  });

  // 2. ÉTOILE FILANTE BASKETBALL
  const etoileClub = await prisma.club.create({
    data: {
      name: 'Étoile Filante Basketball',
      slug: 'etoile-filante-lome',
      shortName: 'EFBC',
      logoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1600&auto=format&fit=crop&q=80',
      description: 'L’un des clubs historiques les plus titrés de la capitale togolaise, réputé pour son jeu rapide et sa ferveur populaire.',
      city: 'Lomé',
      country: 'Togo',
      address: 'Quartier Bè-Kpota, Lomé',
      arena: 'Complexe Omnisports d’Adéwui',
      email: 'contact@etoilefilante.tg',
      phoneNumber: '+228 91 22 33 44',
      foundedYear: 1965,
      primaryColor: '#2563EB',
      secondaryColor: '#F59E0B',
      accentColor: '#60A5FA',
      isVerified: true,
    },
  });

  await prisma.team.create({
    data: {
      clubId: etoileClub.id,
      name: 'Étoile Filante Senior',
      slug: 'etoile-filante-senior',
      category: 'SENIOR',
      division: 'Division 1 Nationale',
      coachName: 'Jean-Baptiste Tossou',
      record: '7V - 3D',
      city: 'Lomé',
      primaryColor: '#2563EB',
      secondaryColor: '#F59E0B',
    },
  });

  // 3. DYNAMOS DE LOMÉ
  const dynamosClub = await prisma.club.create({
    data: {
      name: 'Dynamos Basketball Club',
      slug: 'dynamos-lome',
      shortName: 'DBC',
      logoUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=400&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1600&auto=format&fit=crop&q=80',
      description: 'Formation dynamique reconnue pour sa rigueur défensive et son engagement auprès des jeunes des quartiers nord de Lomé.',
      city: 'Lomé',
      country: 'Togo',
      address: 'Adétikopé, Route Nationale 1',
      arena: 'Adétikopé Sports Center',
      foundedYear: 2012,
      primaryColor: '#10B981',
      secondaryColor: '#047857',
      isVerified: true,
    },
  });

  await prisma.team.create({
    data: {
      clubId: dynamosClub.id,
      name: 'Dynamos Senior Masculin',
      slug: 'dynamos-senior',
      category: 'SENIOR',
      division: 'Division 1',
      coachName: 'Eric Lawson',
      record: '5V - 5D',
      city: 'Lomé',
      primaryColor: '#10B981',
      secondaryColor: '#047857',
    },
  });

  // 4. RACING CLUB DE LOMÉ
  const racingClub = await prisma.club.create({
    data: {
      name: 'Racing Club de Lomé',
      slug: 'racing-club-lome',
      shortName: 'RCL',
      logoUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=1600&auto=format&fit=crop&q=80',
      description: 'Franchise ambitieuse alliant basket moderne, technologies d’entraînement de pointe et scouting panafricain.',
      city: 'Lomé',
      country: 'Togo',
      address: 'Zone Portuaire, Lomé',
      arena: 'Agora Port Arena',
      foundedYear: 2020,
      primaryColor: '#8B5CF6',
      secondaryColor: '#EC4899',
      isVerified: true,
    },
  });

  await prisma.team.create({
    data: {
      clubId: racingClub.id,
      name: 'Racing Club D1',
      slug: 'racing-club-d1',
      category: 'SENIOR',
      division: 'Division 1 Nationale',
      coachName: 'Patrice Mensah',
      record: '6V - 4D',
      city: 'Lomé',
      primaryColor: '#8B5CF6',
      secondaryColor: '#EC4899',
    },
  });

  console.log('✅ Seed terminé avec succès : 4 clubs officiels réels créés avec équipes, joueurs, matchs et publications !');
}

if (require.main === module) {
  runFullSeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
