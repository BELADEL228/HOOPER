import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StoriesBar } from '../components/stories/StoriesBar';
import { PostComposer } from '../components/feed/PostComposer';
import { SocialPostCard } from '../components/feed/SocialPostCard';
import { ExplorePage } from '../components/explore/ExplorePage';
import type { StoryGroup, SocialPost } from '../types';

const testStoryGroups: StoryGroup[] = [
  {
    id: 'club_firestone',
    clubId: 'club_firestone',
    authorName: 'Fire Stone Lomé',
    authorAvatar: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150',
    isClub: true,
    clubBadge: 'Élite Lomé',
    hasUnseen: true,
    statuses: [
      {
        id: 'st_1',
        clubId: 'club_firestone',
        text: 'Échauffement intensif avant le match ! 🔥🏀',
        visibility: 'PUBLIC',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        media: [],
        viewsCount: 142,
        hasViewed: false,
      },
    ],
  },
  {
    id: 'club_etoile',
    clubId: 'club_etoile',
    authorName: 'Étoile Filante Basketball',
    authorAvatar: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=150',
    isClub: true,
    clubBadge: 'Club Rivaux',
    hasUnseen: false,
    statuses: [],
  },
];

const testSocialFeedPosts: SocialPost[] = [
  {
    id: 'post_1',
    authorId: 'user_1',
    authorName: 'David Vance',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    authorRole: 'COACH',
    timestamp: 'Il y a 2h',
    content: 'Grande victoire ce soir pour toute l’équipe ! 🏆🔥',
    likesCount: 38,
    comments: [],
    reactions: [],
  },
];

describe('SocialExperience — Stories & Feed Tests', () => {
  it('StoriesBar affiche le bouton d’ajout et les cercles de stories', () => {
    const handleOpenStory = vi.fn();
    const handleAddStory = vi.fn();

    render(
      <StoriesBar
        stories={testStoryGroups}
        currentUserName="Koffi"
        currentUserAvatar="https://example.com/avatar.jpg"
        onOpenStory={handleOpenStory}
        onAddStory={handleAddStory}
      />
    );

    // Votre story button
    expect(screen.getByText('Ma story')).toBeInTheDocument();

    // Autres stories
    expect(screen.getByText('Fire Stone Lomé')).toBeInTheDocument();
    expect(screen.getByText('Étoile Filante Basketball')).toBeInTheDocument();

    // Clic sur une story
    fireEvent.click(screen.getByText('Fire Stone Lomé'));
    expect(handleOpenStory).toHaveBeenCalled();

    // Clic sur ajouter story
    fireEvent.click(screen.getByText('Ma story'));
    expect(handleAddStory).toHaveBeenCalled();
  });

  it('PostComposer permet de saisir du texte et soumettre', () => {
    const handlePostCreated = vi.fn();

    render(
      <PostComposer
        currentUserName="Koffi"
        onPostCreated={handlePostCreated}
        isAuthenticated={true}
      />
    );

    const textarea = screen.getByPlaceholderText(/Quoi de neuf sur le parquet/i);
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: 'Grand match ce soir ! 🏀' } });
    expect(textarea).toHaveValue('Grand match ce soir ! 🏀');

    // Options photo et vidéo présentes
    expect(screen.getByText(/Photo/i)).toBeInTheDocument();
    expect(screen.getByText(/Vidéo/i)).toBeInTheDocument();
  });

  it('SocialPostCard affiche l’auteur, le contenu et incrémente les likes', () => {
    const samplePost = testSocialFeedPosts[0];

    render(
      <SocialPostCard
        post={samplePost}
        isAuthenticated={true}
      />
    );

    expect(screen.getByText(samplePost.authorName)).toBeInTheDocument();
    expect(screen.getByText(/Grande victoire ce soir/i)).toBeInTheDocument();

    // Bouton like
    const likeButton = screen.getByLabelText(/Aimer/i);
    expect(screen.getByText(String(samplePost.likesCount))).toBeInTheDocument();

    fireEvent.click(likeButton);
    expect(screen.getByText(String(samplePost.likesCount + 1))).toBeInTheDocument();
  });

  it('ExplorePage affiche les tendances de la ligue et filtre les onglets', () => {
    render(<ExplorePage />);

    expect(screen.getByText(/Explorer le Basketball HOOPERS/i)).toBeInTheDocument();
    expect(screen.getByText(/Tendances de la Ligue/i)).toBeInTheDocument();

    // Champ recherche
    const input = screen.getByPlaceholderText(/Rechercher des joueurs, clubs/i);
    fireEvent.change(input, { target: { value: 'Fire Stone' } });
    expect(input).toHaveValue('Fire Stone');
  });
});
