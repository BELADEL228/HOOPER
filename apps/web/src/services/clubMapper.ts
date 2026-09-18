import type { Club, Team } from '../types';
import type { ApiClub } from './clubApi';

/** Converts the API contract to the view model used by the React routing layer. */
export function toFrontendClub(api: ApiClub): Club {
  return {
    id: api.id,
    name: api.name,
    slug: api.slug,
    shortName: api.shortName,
    logoUrl: api.logoUrl,
    bannerUrl: api.bannerUrl,
    description: api.description,
    city: api.city,
    country: api.country,
    address: api.address,
    arena: api.arena,
    email: api.email,
    phoneNumber: api.phoneNumber,
    website: api.website,
    foundedYear: api.foundedYear,
    primaryColor: api.primaryColor,
    secondaryColor: api.secondaryColor,
    accentColor: api.accentColor,
    themeType: api.themeType,
    isVerified: api.isVerified,
    teams: api.teams.map((team) => toFrontendTeam(team, api)),
  };
}

export function toFrontendTeam(team: ApiClub['teams'][number], club: Pick<ApiClub, 'id' | 'name' | 'city'>): Team {
  return {
    id: team.id,
    clubId: club.id,
    clubName: club.name,
    name: team.name,
    slug: team.slug,
    category: team.category,
    division: team.division ?? undefined,
    coachName: team.coachName ?? undefined,
    record: team.record ?? undefined,
    description: team.description ?? undefined,
    logoUrl: team.logoUrl ?? undefined,
    city: club.city,
    primaryColor: team.primaryColor ?? undefined,
    secondaryColor: team.secondaryColor ?? undefined,
    accentColor: team.accentColor ?? undefined,
  };
}
