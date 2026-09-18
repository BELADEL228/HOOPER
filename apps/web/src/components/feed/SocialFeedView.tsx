import React, { useEffect, useState } from 'react';
import { StoriesBar } from '../stories/StoriesBar';
import { StoryViewerModal } from '../stories/StoryViewerModal';
import { PostComposer } from './PostComposer';
import { SocialPostCard } from './SocialPostCard';
import { CreateContentModal } from '../common/CreateContentModal';
import { statusApi } from '../../services/statusApi';
import { socialApi } from '../../services/socialApi';

import type { StoryGroup, SocialPost, StatusItem, UserRole } from '../../types';
import { Flame, RefreshCw } from 'lucide-react';

interface SocialFeedViewProps {
  currentRole: UserRole;
  authUser?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string | null;
  } | null;
  onOpenAuth?: () => void;
  onNavigateToMatches?: () => void;
  /** ✅ Callback pour ouvrir le profil d'un auteur */
  onOpenProfile?: (userId: string) => void;
}

export const SocialFeedView: React.FC<SocialFeedViewProps> = ({
  currentRole,
  authUser,
  onOpenAuth,
  onNavigateToMatches: _onNavigateToMatches,
  onOpenProfile,   // ✅ Nouveau
}) => {
  const isAuthenticated = Boolean(authUser);

  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [activeStoryGroupIndex, setActiveStoryGroupIndex] = useState<number | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const userName = authUser?.name || 'Visiteur';
  const userAvatar =
    authUser?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=FF2A3B&color=fff`;

  // ─── Chargement des données réelles ─────────────────────────────────
  const loadFeedData = async () => {
    setLoadingPosts(true);
    try {
      const storiesFromApi = await statusApi.getFeed();
      setStoryGroups(Array.isArray(storiesFromApi) ? storiesFromApi : []);

      const postsFromApi = await socialApi.fetchPosts();
      setPosts(Array.isArray(postsFromApi) ? postsFromApi : []);
    } catch (err) {
      console.warn('[SocialFeedView] Impossible de charger le feed', err);
      setStoryGroups([]);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadFeedData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadFeedData();
  };

  const handleOpenStory = (group: StoryGroup) => {
    const idx = storyGroups.findIndex((g) => g.id === group.id);
    if (idx !== -1) {
      setActiveStoryGroupIndex(idx);
    }
  };

  const handleAddStory = () => {
    if (!isAuthenticated) {
      onOpenAuth?.();
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handlePostCreated = (newPost: SocialPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleStoryCreated = (_newStory: StatusItem) => {
    void loadFeedData();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* ── 1. Barre des Stories ── */}
      <section className="social-card-border rounded-3xl p-3 sm:p-4 shadow-xl">
        <div className="flex items-center justify-between px-2 mb-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Stories 24h
          </span>
          <button
            onClick={handleRefresh}
            aria-label="Actualiser les flux"
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#FF2A3B]' : ''
                }`}
            />
          </button>
        </div>

        <StoriesBar
          stories={storyGroups}
          currentUserName={userName}
          currentUserAvatar={userAvatar}
          onOpenStory={handleOpenStory}
          onAddStory={handleAddStory}
        />
      </section>

      {/* ── 2. Compositeur de Post ── */}
      <section>
        <PostComposer
          currentUserAvatar={userAvatar}
          currentUserName={userName}
          onPostCreated={handlePostCreated}
          onOpenAuth={onOpenAuth}
          isAuthenticated={isAuthenticated}
        />
      </section>

      {/* ── 3. Fil d'actualité ── */}
      <section className="space-y-4">
        {loadingPosts ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="social-card-border rounded-3xl p-5 space-y-3 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-32 h-3 bg-white/10 rounded" />
                    <div className="w-20 h-2 bg-white/10 rounded" />
                  </div>
                </div>
                <div className="w-full h-16 bg-white/5 rounded-xl" />
                <div className="w-full h-44 bg-white/5 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="social-card-border rounded-3xl p-8 text-center space-y-3">
            <Flame className="w-8 h-8 text-[#FF2A3B] mx-auto" />
            <h3 className="text-base font-bold text-white">
              Le parquet est calme
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Soyez le premier à partager une action, une photo ou une analyse de
              match sur HOOPERS !
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <SocialPostCard
              key={post.id}
              post={post}
              onOpenAuth={onOpenAuth}
              isAuthenticated={isAuthenticated}
              onOpenProfile={onOpenProfile}   // ✅ Nouveau
            />
          ))
        )}
      </section>

      {/* ── Modal Visionneuse de Story ── */}
      {activeStoryGroupIndex !== null && (
        <StoryViewerModal
          isOpen={activeStoryGroupIndex !== null}
          storyGroups={storyGroups}
          activeGroupIndex={activeStoryGroupIndex}
          onClose={() => setActiveStoryGroupIndex(null)}
          onGroupChange={(newIdx) => setActiveStoryGroupIndex(newIdx)}
          currentUserId={authUser?.id || null}
          onStatusDelete={(deletedStatusId) => {
            setStoryGroups((prevGroups) =>
              prevGroups
                .map((group) => ({
                  ...group,
                  statuses: group.statuses.filter(
                    (status) => status.id !== deletedStatusId
                  ),
                }))
                .filter((group) => group.statuses.length > 0)
            );
          }}
        />
      )}

      {/* ── Modal Création (Post / Story) ── */}
      <CreateContentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
        onStoryCreated={handleStoryCreated}
        isClubManager={
          currentRole === 'CLUB_MANAGER' || currentRole === 'ADMIN'
        }
      />
    </div>
  );
};