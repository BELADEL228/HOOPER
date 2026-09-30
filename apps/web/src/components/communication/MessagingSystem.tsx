import React, { useEffect, useState, useRef, useMemo } from 'react';
import type { Message, UserRole } from '../../types';
import {
  MessageSquare,
  Send,
  Image as ImageIcon,
  Users,
  Shield,
  Search,
  Bell,
  Pin,
  Flame,
  X,
  Hash,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { apiUrl } from '../../services/api';
import { useClub } from '../../context/ClubContext';
import { uploadMedia } from '../../services/uploadService';

interface MessagingSystemProps {
  currentRole: UserRole;
}

interface Channel {
  id: string;
  name: string;
  description: string;
  icon: 'general' | 'announcements' | 'tactics' | 'players';
  unreadCount?: number;
  restrictedToRoles?: UserRole[];
}

export const MessagingSystem: React.FC<MessagingSystemProps> = ({ currentRole }) => {
  const { activeClub } = useClub();
  const clubId = activeClub?.clubId || activeClub?.id;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const channels: Channel[] = useMemo(
    () => [
      {
        id: 'GENERAL',
        name: 'général-club',
        description: `Canal d'échange ouvert à tous les membres de ${activeClub.name}`,
        icon: 'general',
      },
      {
        id: 'ANNOUNCEMENTS',
        name: 'annonces-officielles',
        description: 'Horaires des matchs, convocations et directives du bureau',
        icon: 'announcements',
      },
      {
        id: 'TACTICS',
        name: 'tactique-coaching',
        description: 'Analyses de jeu, systèmes et bilans techniques',
        icon: 'tactics',
        restrictedToRoles: ['SUPER_ADMIN', 'CLUB_ADMIN', 'COACH', 'PLAYER'],
      },
      {
        id: 'LOCKER_ROOM',
        name: 'vestiaire-joueurs',
        description: 'Échanges et cohésion d’équipe entre athlètes',
        icon: 'players',
        restrictedToRoles: ['SUPER_ADMIN', 'CLUB_ADMIN', 'COACH', 'PLAYER'],
      },
    ],
    [activeClub.name]
  );

  const [activeChannelId, setActiveChannelId] = useState<string>('GENERAL');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  // Épinglé en vedette
  const [pinnedAnnouncement, setPinnedAnnouncement] = useState<string | null>(
    `Match ce samedi à 18h30 à l’arène de ${activeClub.city || 'Lomé'}. Présence au vestiaire requise 45 minutes avant le coup d'envoi.`
  );

  const activeChannel = useMemo(
    () => channels.find((c) => c.id === activeChannelId) || channels[0],
    [channels, activeChannelId]
  );

  // Charger les messages du club
  const loadMessages = async () => {
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (!session?.token) return;

    try {
      const response = await fetch(
        apiUrl(`/messages/general?clubId=${encodeURIComponent(clubId)}`),
        { headers: { Authorization: `Bearer ${session.token}` } }
      );
      if (!response.ok) throw new Error('Messagerie indisponible');

      const remoteMessages = await response.json();
      setMessages(
        remoteMessages.map(
          (message: {
            id: string;
            text: string;
            createdAt: string;
            sender: {
              id: string;
              name: string;
              role: UserRole;
              avatarUrl: string | null;
            };
          }) => ({
            id: message.id,
            senderId: message.sender.id,
            senderName: message.sender.name,
            senderAvatar:
              message.sender.avatarUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                message.sender.name
              )}&background=B91C1C&color=fff`,
            senderRole: message.sender.role,
            text: message.text,
            timestamp: new Date(message.createdAt).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            reactions: [],
          })
        )
      );
      setSyncError(null);
    } catch {
      setSyncError('Mode local : vos messages sont stockés temporairement sur votre appareil.');
    }
  };

  useEffect(() => {
    void loadMessages();
  }, [clubId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadMedia(file, 'firestone/messages');
      const url = res.secure_url || res.url;
      setAttachedImage(url);
    } catch {
      setSyncError('Échec du téléversement de la photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedImage) return;

    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    const fullText = attachedImage
      ? `${inputText.trim()} \n[Media: ${attachedImage}]`
      : inputText.trim();

    if (session?.token) {
      try {
        const response = await fetch(apiUrl('/messages/general'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            text: fullText,
            clubId,
          }),
        });

        if (response.ok) {
          const saved = await response.json();
          setMessages((current) => [
            ...current,
            {
              id: saved.id,
              senderId: saved.sender.id,
              senderName: saved.sender.name,
              senderAvatar:
                saved.sender.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  saved.sender.name
                )}&background=B91C1C&color=fff`,
              senderRole: saved.sender.role,
              text: saved.text,
              timestamp: new Date().toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              reactions: [],
            },
          ]);
          setInputText('');
          setAttachedImage(null);
          setSyncError(null);
          return;
        }
      } catch {
        setSyncError('Message local : le serveur de messagerie est temporairement injoignable.');
      }
    }

    // Fallback optimiste local
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      senderId: 'current_user',
      senderName: `Vous (${currentRole})`,
      senderAvatar: `https://ui-avatars.com/api/?name=Vous&background=FF2A3B&color=fff`,
      senderRole: currentRole,
      text: fullText,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      reactions: [],
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    setAttachedImage(null);
  };

  const addReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const existing = msg.reactions.find((r) => r.emoji === emoji);
        if (existing) {
          return {
            ...msg,
            reactions: msg.reactions.map((r) =>
              r.emoji === emoji ? { ...r, count: r.count + 1 } : r
            ),
          };
        }
        return {
          ...msg,
          reactions: [...msg.reactions, { emoji, count: 1 }],
        };
      })
    );
  };

  // Filtrage par recherche
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    return messages.filter(
      (m) =>
        m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* ── En-tête de la Messagerie ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-300 mb-1">
            <MessageSquare className="w-3.5 h-3.5" /> Vestiaire Numérique & Communication
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Messagerie Interne — <span className="text-[#FFB800]">{activeClub.name}</span>
          </h1>
          <p className="text-xs text-slate-400">
            Échangez en temps réel avec le staff technique, les capitaines et l'ensemble de l'effectif.
          </p>
        </div>

        {syncError && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{syncError}</span>
          </div>
        )}
      </header>

      {/* ── Fenêtre Principale de Chat ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 glass-panel rounded-3xl border border-white/10 overflow-hidden h-[640px]">
        {/* Barre Latérale : Canaux & Salons */}
        <div className="lg:col-span-4 bg-black/40 border-r border-white/10 p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Salons d'équipe
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Liste des canaux */}
            <div className="space-y-1.5">
              {channels.map((ch) => {
                const isActive = activeChannelId === ch.id;

                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannelId(ch.id)}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isActive ? 'bg-white/20' : 'bg-black/30'
                        }`}
                      >
                        {ch.icon === 'general' ? (
                          <Users className="w-4 h-4" />
                        ) : ch.icon === 'announcements' ? (
                          <Bell className="w-4 h-4 text-[#FFB800]" />
                        ) : ch.icon === 'tactics' ? (
                          <Shield className="w-4 h-4 text-[#38BDF8]" />
                        ) : (
                          <Flame className="w-4 h-4 text-purple-400" />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-black text-xs">#{ch.name}</div>
                        <div className="text-[10px] opacity-75 truncate max-w-[170px]">
                          {ch.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Statut présence & Membres */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold">Membres Actifs</span>
              <span className="text-emerald-400 font-bold">En direct</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-[11px] text-slate-300">
                Staff technique, capitaines & joueurs connectés
              </span>
            </div>
          </div>
        </div>

        {/* Zone de Conversation */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-[#090A0F]/70 p-4 sm:p-6">
          {/* Header du salon actif */}
          <div className="pb-3 border-b border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10 text-[#FFB800]">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-white text-sm">#{activeChannel.name}</h3>
                <p className="text-[11px] text-slate-400">{activeChannel.description}</p>
              </div>
            </div>

            {/* Recherche locale */}
            <div className="relative w-44 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrer les messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input w-full pl-8 pr-3 py-1.5 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Annonce Épinglée */}
          {pinnedAnnouncement && (
            <div className="my-2 p-3 rounded-2xl bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2 text-slate-200">
                <Pin className="w-4 h-4 text-[#FFB800] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#FFB800]">Note du Staff :</strong> {pinnedAnnouncement}
                </span>
              </div>
              <button
                onClick={() => setPinnedAnnouncement(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Fil des messages */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-2 text-slate-500">
                <MessageSquare className="w-10 h-10 opacity-30" />
                <p className="text-xs">Aucun message pour le moment dans ce salon.</p>
                <p className="text-[10px]">Soyez le premier à lancer la conversation !</p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div key={msg.id} className="flex gap-3 items-start group">
                  <img
                    src={msg.senderAvatar}
                    alt={msg.senderName}
                    className="w-10 h-10 rounded-2xl object-cover border border-white/10 shrink-0 bg-slate-800"
                  />
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-black text-white">{msg.senderName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 text-slate-400 border border-white/5">
                        {msg.senderRole}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-auto">{msg.timestamp}</span>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-xs text-slate-200 leading-relaxed max-w-2xl break-words">
                      {msg.text}
                    </div>

                    {/* Réactions */}
                    <div className="flex items-center gap-2 pt-1">
                      {msg.reactions.map((r, idx) => (
                        <button
                          key={idx}
                          onClick={() => addReaction(msg.id, r.emoji)}
                          className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300 hover:bg-white/10 flex items-center gap-1 cursor-pointer"
                        >
                          <span>{r.emoji}</span>
                          <span className="font-bold">{r.count}</span>
                        </button>
                      ))}

                      <div className="hidden group-hover:flex items-center gap-1.5 text-xs text-slate-400">
                        {(['🔥', '🏀', '💪', '❤️', '👏'] as const).map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => addReaction(msg.id, emoji)}
                            className="hover:scale-125 transition-transform cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prévisualisation média attaché */}
          {attachedImage && (
            <div className="p-2 mb-2 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between w-max gap-3">
              <img src={attachedImage} alt="Média" className="w-12 h-12 rounded-xl object-cover" />
              <span className="text-[10px] text-slate-400">Image prête à l'envoi</span>
              <button
                onClick={() => setAttachedImage(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Formulaire de saisie */}
          <form onSubmit={handleSendMessage} className="pt-3 border-t border-white/10 flex items-center gap-2">
            <label className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0">
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#38BDF8]" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
              <input
                type="file"
                accept="image/*"
                disabled={isUploading}
                className="hidden"
                onChange={handleImageAttach}
              />
            </label>

            <input
              type="text"
              placeholder={`Écrire dans #${activeChannel.name}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="glass-input flex-1 rounded-xl px-4 py-2.5 text-xs"
            />

            <button
              type="submit"
              disabled={isUploading || (!inputText.trim() && !attachedImage)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2A3B] to-[#B91C1C] text-white font-black text-xs hover:brightness-110 transition-all flex items-center gap-1.5 shadow-md disabled:opacity-40 cursor-pointer shrink-0"
            >
              <span>Envoyer</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
