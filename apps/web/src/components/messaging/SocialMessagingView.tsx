import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  Search,
  Send,
  ArrowLeft,
  Paperclip,
  Circle,
  MoreVertical,
  ShieldCheck,
  MessageSquare,
  Loader2,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Plus,
  CheckCheck,
  Clock,
  Trash2,
  Image as ImageIcon,
  X,
  VolumeX,
  Volume2,
} from 'lucide-react';
import type { UserRole } from '../../types';
import { apiUrl } from '../../services/api';
import { socketService, type SocketMessage } from '../../services/socket';
import { uploadMedia } from '../../services/uploadService';
import { UserSearchModal } from '../common/UserSearchModal';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface ConversationItem {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  isClub?: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  mediaUrl?: string | null;
  timestamp: string;
  createdAt: string;
  isMe: boolean;
  isPending?: boolean;
}

interface SocialMessagingViewProps {
  currentRole: UserRole;
  authUser?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
  onOpenProfile?: (userId: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

const getAuthToken = (): string => {
  try {
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    return session?.token || '';
  } catch {
    return '';
  }
};

function normalizeConversation(raw: any): ConversationItem {
  return {
    id: String(raw?.id ?? ''),
    name: String(raw?.name ?? raw?.title ?? 'Conversation'),
    avatar:
      raw?.avatar ||
      raw?.photoUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        raw?.name || 'Conv'
      )}&background=1E293B&color=fff`,
    role: raw?.role ?? undefined,
    lastMessage: String(raw?.lastMessage ?? raw?.preview ?? ''),
    timestamp: String(raw?.timestamp ?? raw?.updatedAt ?? ''),
    unreadCount: Number(raw?.unreadCount ?? 0),
    isOnline: Boolean(raw?.isOnline),
    isClub: Boolean(raw?.isClub ?? raw?.isGroup),
  };
}

function normalizeMessage(raw: any, currentUserId: string): ChatMessage {
  const senderId = String(raw?.senderId ?? raw?.sender?.id ?? '');
  return {
    id: String(raw?.id ?? `m_${Date.now()}_${Math.random()}`),
    senderId,
    senderName: String(raw?.senderName ?? raw?.sender?.name ?? 'Utilisateur'),
    senderAvatar:
      raw?.senderAvatar ||
      raw?.sender?.avatarUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        raw?.senderName || raw?.sender?.name || 'User'
      )}&background=1E293B&color=fff`,
    text: String(raw?.text ?? raw?.content ?? ''),
    mediaUrl: raw?.mediaUrl || null,
    timestamp: String(raw?.timestamp ?? raw?.createdAt ?? ''),
    createdAt: String(raw?.createdAt ?? new Date().toISOString()),
    isMe: senderId === currentUserId,
  };
}

const QUICK_EMOJIS = ['🏀', '🔥', '👏', '👍', '❤️', '😂'];

// ═══════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════

export const SocialMessagingView: React.FC<SocialMessagingViewProps> = ({
  currentRole: _currentRole,
  authUser,
  onOpenProfile,
}) => {
  const currentUserId = authUser?.id ?? '';

  // ── État global ────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [errorConversations, setErrorConversations] = useState<string>('');

  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const [showUserSearch, setShowUserSearch] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);

  // ── Pièce jointe & Cloudinary ──────────────────────────────────────
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedPreview, setAttachedPreview] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [expandedMediaUrl, setExpandedMediaUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Menu options discussion ─────────────────────────────────────────
  const [showConvOptions, setShowConvOptions] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [searchInConv, setSearchInConv] = useState('');
  const [isSearchingInConv, setIsSearchingInConv] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // ═══════════════════════════════════════════════════════════════════
  // 📥 CHARGEMENT DES CONVERSATIONS
  // ═══════════════════════════════════════════════════════════════════
  const loadConversations = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setLoadingConversations(false);
      return;
    }

    setLoadingConversations(true);
    setErrorConversations('');

    try {
      const res = await fetch(apiUrl('/conversations'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.conversations)
          ? data.conversations
          : [];
      const normalized = list.map(normalizeConversation);
      setConversations(normalized);
      if (normalized.length > 0 && !activeConvId) {
        setActiveConvId(normalized[0].id);
      }
    } catch (err) {
      console.warn('[Messaging] loadConversations', err);
      setErrorConversations('Impossible de charger vos conversations.');
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  }, [activeConvId]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(
    async (convId: string) => {
      const token = getAuthToken();
      if (!token || !convId) return;

      setLoadingMessages(true);

      try {
        const res = await fetch(apiUrl(`/conversations/${convId}/messages`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.messages)
            ? data.messages
            : [];
        const normalized = list.map((m: any) =>
          normalizeMessage(m, currentUserId)
        );
        setMessages(normalized);
      } catch (err) {
        console.warn('[Messaging] loadMessages', err);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [currentUserId]
  );

  useEffect(() => {
    if (activeConvId) void loadMessages(activeConvId);
    else setMessages([]);
  }, [activeConvId, loadMessages]);

  // ═══════════════════════════════════════════════════════════════════
  // 🔌 SOCKET — Connexion + listeners
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!authUser) return;

    const socket = socketService.connect();
    if (!socket) return;

    const handleConnect = () => setIsSocketConnected(true);
    const handleDisconnect = () => setIsSocketConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    setIsSocketConnected(socket.connected);

    // Nouveau message
    const offNewMessage = socketService.onNewMessage((msg: SocketMessage) => {
      setMessages((prev) => {
        if (msg.conversationId !== activeConvId) return prev;
        if (prev.some((m) => m.id === msg.id)) return prev;

        const withoutPending = prev.filter((m) => {
          if (!m.isPending) return true;
          return m.text !== msg.text;
        });

        return [
          ...withoutPending,
          normalizeMessage(msg, currentUserId),
        ];
      });

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== msg.conversationId) return c;
          const isCurrentChat = c.id === activeConvId;
          return {
            ...c,
            lastMessage: msg.text,
            timestamp: new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            unreadCount: isCurrentChat ? 0 : c.unreadCount + 1,
          };
        })
      );

      if (msg.conversationId === activeConvId) {
        socketService.markAsRead(activeConvId);
      }
    });

    const offTyping = socketService.onUserTyping((data) => {
      if (data.conversationId !== activeConvId) return;
      if (data.userId === currentUserId) return;
      setTypingUser(data.userName);
    });

    const offStopTyping = socketService.onUserStopTyping((data) => {
      if (data.conversationId !== activeConvId) return;
      setTypingUser(null);
    });

    return () => {
      offNewMessage();
      offTyping();
      offStopTyping();
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [authUser, activeConvId, currentUserId]);

  useEffect(() => {
    if (!activeConvId) return;

    socketService.joinConversation(activeConvId);
    socketService.markAsRead(activeConvId);

    setConversations((prev) =>
      prev.map((c) => (c.id === activeConvId ? { ...c, unreadCount: 0 } : c))
    );

    const token = getAuthToken();
    if (token) {
      fetch(apiUrl(`/conversations/${activeConvId}/read`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.lastReadAt) setLastReadAt(data.lastReadAt);
        })
        .catch(() => undefined);
    }

    return () => {
      socketService.leaveConversation(activeConvId);
    };
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ═══════════════════════════════════════════════════════════════════
  // 📤 GESTION FICHIERS & CLOUDINARY
  // ═══════════════════════════════════════════════════════════════════
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedFile(file);
    if (file.type.startsWith('image/')) {
      setAttachedPreview(URL.createObjectURL(file));
    } else {
      setAttachedPreview(null);
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    setAttachedPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ═══════════════════════════════════════════════════════════════════
  // 💬 ENVOI D'UN MESSAGE (AVEC OU SANS FICHIER CLOUDINARY)
  // ═══════════════════════════════════════════════════════════════════
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId) return;
    if (!inputText.trim() && !attachedFile) return;

    const token = getAuthToken();
    const text = inputText.trim();
    let uploadedMediaUrl: string | null = null;

    if (attachedFile) {
      setIsUploadingMedia(true);
      try {
        const uploadRes = await uploadMedia(attachedFile, 'firestone/messages');
        uploadedMediaUrl = uploadRes.url;
      } catch (err) {
        console.warn('[Messaging] Échec upload média:', err);
      } finally {
        setIsUploadingMedia(false);
      }
    }

    const tempMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      senderId: currentUserId,
      senderName: authUser?.name || 'Moi',
      senderAvatar:
        authUser?.avatarUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          authUser?.name || 'Moi'
        )}&background=1E293B&color=fff`,
      text: text || (uploadedMediaUrl ? '📷 Photo' : ''),
      mediaUrl: uploadedMediaUrl,
      timestamp: new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      createdAt: new Date().toISOString(),
      isMe: true,
      isPending: true,
    };

    setMessages((prev) => [...prev, tempMsg]);
    setInputText('');
    removeAttachment();

    // Envoi par fallback REST avec mediaUrl si présent
    if (token) {
      try {
        const res = await fetch(apiUrl(`/conversations/${activeConvId}/messages`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: text || (uploadedMediaUrl ? '📷 Photo' : ''),
            mediaUrl: uploadedMediaUrl,
          }),
        });

        if (res.ok) {
          const savedMsg = await res.json();
          setMessages((prev) =>
            prev.map((m) => (m.id === tempMsg.id ? normalizeMessage(savedMsg, currentUserId) : m))
          );
        }
      } catch (err) {
        console.warn('[Messaging] Erreur envoi REST:', err);
      }
    }

    socketService.sendMessage(activeConvId, text || '📷 Photo');
    socketService.stopTyping(activeConvId);
  };

  // ═══════════════════════════════════════════════════════════════════
  // 🗑️ SUPPRESSION D'UN MESSAGE
  // ═══════════════════════════════════════════════════════════════════
  const handleDeleteMessage = async (messageId: string) => {
    if (!activeConvId) return;
    const token = getAuthToken();

    // Suppression optimiste locale
    setMessages((prev) => prev.filter((m) => m.id !== messageId));

    if (token) {
      try {
        await fetch(apiUrl(`/conversations/${activeConvId}/messages/${messageId}`), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.warn('[Messaging] Erreur suppression message:', err);
      }
    }
  };

  const handleInputChange = (value: string) => {
    setInputText(value);
    if (!activeConvId) return;

    socketService.startTyping(activeConvId);
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      socketService.stopTyping(activeConvId);
    }, 2000);
  };

  const handleSelectUser = async (user: { id: string; name: string }) => {
    const token = getAuthToken();
    if (!token) return;

    setCreatingConversation(true);
    try {
      const res = await fetch(apiUrl('/conversations'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'DIRECT',
          title: user.name,
          participantIds: [user.id],
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const conv = await res.json();

      await loadConversations();
      if (conv?.id) {
        setActiveConvId(conv.id);
        setIsMobileChatOpen(true);
      }
    } catch (err) {
      console.warn('[Messaging] create conversation', err);
      setErrorConversations('Impossible de créer la conversation.');
    } finally {
      setCreatingConversation(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 🧮 CALCULS DÉRIVÉS
  // ═══════════════════════════════════════════════════════════════════
  const q = searchQuery.toLowerCase().trim();
  const filteredConversations = conversations.filter((c) => {
    if (!q) return true;
    return c.name?.toLowerCase().includes(q) ?? false;
  });

  const activeConv = conversations.find((c) => c.id === activeConvId) || null;

  const isMessageRead = (msg: ChatMessage): boolean => {
    if (!msg.isMe) return false;
    if (!lastReadAt) return false;
    return new Date(msg.createdAt) <= new Date(lastReadAt);
  };

  // Filtrage des messages si recherche locale active
  const displayedMessages = useMemo(() => {
    if (!isSearchingInConv || !searchInConv.trim()) return messages;
    const term = searchInConv.toLowerCase();
    return messages.filter((m) => m.text.toLowerCase().includes(term));
  }, [messages, isSearchingInConv, searchInConv]);

  if (!authUser) {
    return (
      <div className="rounded-3xl p-12 text-center space-y-4 max-w-2xl mx-auto bg-[#0E121D] border border-white/10">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FF2A3B]/20 border border-[#FF2A3B]/30 flex items-center justify-center">
          <MessageSquare className="w-8 h-8 text-[#FF2A3B]" />
        </div>
        <h3 className="text-xl font-black text-white">Messagerie privée</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Connectez-vous pour discuter avec les joueurs, coachs et clubs de la ligue HOOPERS.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl overflow-hidden h-[82vh] flex shadow-2xl border border-white/10 bg-[#0B0E17]">
      {/* ── LISTE DES CONVERSATIONS ── */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-white/10 flex flex-col bg-[#0C101A] ${isMobileChatOpen ? 'hidden md:flex' : 'flex'
          }`}
      >
        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#FF2A3B]" />
              Discussions
              <span
                className={`ml-1 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isSocketConnected
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                  }`}
              >
                {isSocketConnected ? (
                  <>
                    <Wifi className="w-2.5 h-2.5" /> En direct
                  </>
                ) : (
                  <>
                    <WifiOff className="w-2.5 h-2.5" /> Hors ligne
                  </>
                )}
              </span>
            </h2>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowUserSearch(true)}
                disabled={creatingConversation}
                aria-label="Nouveau message"
                title="Nouveau message"
                className="p-1.5 rounded-lg bg-[#FF2A3B] hover:bg-[#E60023] text-white transition-colors cursor-pointer disabled:opacity-60"
              >
                {creatingConversation ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={loadConversations}
                aria-label="Rafraîchir"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une discussion..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF2A3B]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {loadingConversations ? (
            <div className="p-8 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs">Chargement des discussions…</span>
            </div>
          ) : errorConversations ? (
            <div className="p-6 text-center space-y-3">
              <AlertCircle className="w-7 h-7 text-amber-400 mx-auto" />
              <p className="text-xs text-slate-400">{errorConversations}</p>
              <button
                onClick={loadConversations}
                className="text-xs text-[#FF2A3B] hover:underline font-bold"
              >
                Réessayer
              </button>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 italic">
              {q ? 'Aucune discussion trouvée.' : 'Aucune discussion pour le moment.'}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === activeConvId;
              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    setIsMobileChatOpen(true);
                  }}
                  className={`w-full p-3.5 flex items-center gap-3 text-left transition-colors cursor-pointer ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={conv.avatar}
                      alt={conv.name}
                      className="w-11 h-11 rounded-full object-cover bg-slate-800 border border-white/10"
                    />
                    {conv.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0B0E17]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        {conv.name}
                        {conv.isClub && <ShieldCheck className="w-3.5 h-3.5 text-[#FFB800]" />}
                      </span>
                      <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                        {conv.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {conv.lastMessage || 'Aucun message'}
                    </p>
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#FF2A3B] text-white shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── DISCUSSION ACTIVE (STYLE WHATSAPP) ── */}
      <div
        className={`flex-1 flex flex-col bg-[#080B12] ${isMobileChatOpen ? 'flex' : 'hidden md:flex'
          }`}
      >
        {activeConv ? (
          <>
            {/* EN-TÊTE CHAT */}
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-[#0E1320]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMobileChatOpen(false)}
                  aria-label="Retour"
                  className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <img
                  src={activeConv.avatar}
                  alt={activeConv.name}
                  className="w-10 h-10 rounded-full object-cover bg-slate-800 border border-white/10"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {activeConv.name}
                    </span>
                    {activeConv.isClub && <ShieldCheck className="w-3.5 h-3.5 text-[#FFB800]" />}
                  </div>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <Circle className="w-2 h-2 fill-emerald-400" />
                    {typingUser
                      ? `${typingUser} écrit…`
                      : activeConv.isOnline
                        ? 'En ligne'
                        : 'Actif récemment'}
                  </span>
                </div>
              </div>

              {/* Options & menu */}
              <div className="relative flex items-center gap-1">
                <button
                  onClick={() => setIsSearchingInConv(!isSearchingInConv)}
                  aria-label="Rechercher"
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowConvOptions(!showConvOptions)}
                  aria-label="Menu conversation"
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {/* Dropdown Options */}
                {showConvOptions && (
                  <div className="absolute right-0 top-10 z-30 w-52 rounded-2xl bg-[#111522] border border-white/15 p-1.5 shadow-2xl space-y-1 text-xs text-slate-200">
                    <button
                      onClick={() => {
                        setShowConvOptions(false);
                        setIsMuted(!isMuted);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-left cursor-pointer"
                    >
                      {isMuted ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
                      <span>{isMuted ? 'Activer notifications' : 'Mode silencieux'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowConvOptions(false);
                        setMessages([]);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-500/15 text-red-400 text-left cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Vider la discussion</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Barre de recherche dans la discussion */}
            {isSearchingInConv && (
              <div className="p-2.5 bg-[#0C101A] border-b border-white/10 flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 ml-2" />
                <input
                  type="text"
                  value={searchInConv}
                  onChange={(e) => setSearchInConv(e.target.value)}
                  placeholder="Rechercher dans cette discussion..."
                  className="flex-1 px-3 py-1.5 text-xs bg-white/5 rounded-xl text-white placeholder-slate-500 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setIsSearchingInConv(false);
                    setSearchInConv('');
                  }}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* FENÊTRE DES MESSAGES STYLE WHATSAPP */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-radial from-[#101422] to-[#07090F]">
              {loadingMessages ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs">Chargement des messages…</span>
                </div>
              ) : displayedMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs italic">
                  <MessageSquare className="w-6 h-6 mb-2 opacity-40" />
                  Aucun message pour le moment. Lancez la discussion !
                </div>
              ) : (
                displayedMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 group ${msg.isMe ? 'justify-end' : 'justify-start'
                      }`}
                  >
                    {!msg.isMe && (
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        className="w-7 h-7 rounded-full object-cover mb-1 shrink-0 bg-slate-800 border border-white/10"
                      />
                    )}

                    {/* BULLE STYLE WHATSAPP */}
                    <div
                      className={`relative max-w-[85%] sm:max-w-md px-3.5 py-2 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${msg.isMe
                        ? 'bg-[#005c4b] text-white rounded-br-xs border border-emerald-500/20'
                        : 'bg-[#1F2533] text-slate-100 rounded-bl-xs border border-white/10'
                        }`}
                    >
                      {/* En-tête expéditeur si reçu */}
                      {!msg.isMe && (
                        <span className="block text-[10px] font-bold text-[#FFB800] mb-1">
                          {msg.senderName}
                        </span>
                      )}

                      {/* Média joint si présent */}
                      {msg.mediaUrl && (
                        <div
                          onClick={() => setExpandedMediaUrl(msg.mediaUrl || null)}
                          className="mb-2 rounded-xl overflow-hidden cursor-pointer bg-black/40 border border-white/10"
                        >
                          {msg.mediaUrl.endsWith('.mp4') || msg.mediaUrl.includes('video') ? (
                            <video
                              src={msg.mediaUrl}
                              controls
                              className="max-h-56 w-full object-cover"
                            />
                          ) : (
                            <img
                              src={msg.mediaUrl}
                              alt="Pièce jointe"
                              className="max-h-56 w-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          )}
                        </div>
                      )}

                      {/* Texte du message */}
                      {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                      {/* Horodatage + coches WhatsApp dans le coin inférieur droit */}
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] select-none">
                        <span className={msg.isMe ? 'text-emerald-200/70' : 'text-slate-400'}>
                          {msg.timestamp}
                        </span>

                        {msg.isMe && (
                          msg.isPending ? (
                            <Clock className="w-3 h-3 text-emerald-300/60 animate-spin" />
                          ) : isMessageRead(msg) ? (
                            <span title="Vu" className="text-[#38BDF8] flex items-center">
                              <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                            </span>
                          ) : (
                            <span title="Distribué" className="text-slate-300/70 flex items-center">
                              <CheckCheck className="w-3.5 h-3.5" />
                            </span>
                          )
                        )}
                      </div>

                      {/* Bouton de suppression rapide au survol */}
                      {msg.isMe && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          title="Supprimer le message"
                          className="absolute -top-2 -left-2 p-1 rounded-full bg-red-600/90 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* PREVIEW DU FICHIER EN COURS D'ATTACHEMENT */}
            {attachedFile && (
              <div className="p-3 bg-[#0F1420] border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {attachedPreview ? (
                    <img
                      src={attachedPreview}
                      alt="Preview"
                      className="w-12 h-12 rounded-xl object-cover border border-white/15"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-bold text-white block truncate max-w-xs">
                      {attachedFile.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {(attachedFile.size / 1024).toFixed(1)} Ko • Prêt à envoyer via Cloudinary
                    </span>
                  </div>
                </div>
                <button
                  onClick={removeAttachment}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* BARRE DE SAISIE & EMOJIS */}
            <div className="border-t border-white/10 bg-[#0E1320] p-2 sm:p-3 space-y-2">
              {/* Emojis d'accès rapide */}
              <div className="flex items-center gap-1.5 px-2">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setInputText((prev) => prev + emoji)}
                    className="p-1 text-sm hover:scale-125 transition-transform cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                {/* Input fichier caché */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelected}
                  accept="image/*,video/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Joindre un média (Cloudinary)"
                  title="Joindre une photo ou vidéo"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-full bg-white/10 text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:border-[#005c4b]"
                />

                <button
                  type="submit"
                  disabled={(!inputText.trim() && !attachedFile) || isUploadingMedia}
                  aria-label="Envoyer"
                  className="w-10 h-10 rounded-full bg-[#005c4b] text-white flex items-center justify-center hover:bg-[#00705a] disabled:opacity-40 transition-colors cursor-pointer shrink-0 shadow-md shadow-emerald-950/40"
                >
                  {isUploadingMedia ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-sm text-slate-500 italic space-y-2">
            <MessageSquare className="w-10 h-10 opacity-30" />
            <span>Sélectionnez une discussion pour commencer à échanger.</span>
          </div>
        )}
      </div>

      {/* ✅ Modal de zoom média */}
      {expandedMediaUrl && (
        <div
          onClick={() => setExpandedMediaUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <img
            src={expandedMediaUrl}
            alt="Plein écran"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl"
          />
        </div>
      )}

      {/* ✅ Modal de recherche d'utilisateur */}
      <UserSearchModal
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        title="Nouveau message"
        placeholder="Chercher un joueur ou dirigeant..."
        onSelectUser={handleSelectUser}
      />
    </div>
  );
};