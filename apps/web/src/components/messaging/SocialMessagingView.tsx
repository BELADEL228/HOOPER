import React, { useEffect, useState, useCallback, useRef } from 'react';
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
} from 'lucide-react';
import type { UserRole } from '../../types';
import { apiUrl } from '../../services/api';
import { socketService, type SocketMessage } from '../../services/socket';
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
  timestamp: string;
  createdAt: string;        // ✅ Ajouté pour la comparaison "Vu"
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
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS (hors composant — pas de hooks ici)
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
      )}&background=FF2A3B&color=fff`,
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
      )}&background=FF2A3B&color=fff`,
    text: String(raw?.text ?? raw?.content ?? ''),
    timestamp: String(raw?.timestamp ?? raw?.createdAt ?? ''),
    createdAt: String(raw?.createdAt ?? new Date().toISOString()),
    isMe: senderId === currentUserId,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// COMPOSANT
// ═══════════════════════════════════════════════════════════════════════

export const SocialMessagingView: React.FC<SocialMessagingViewProps> = ({
  currentRole: _currentRole,
  authUser,
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // ═══════════════════════════════════════════════════════════════════
  // 📌 HELPERS DANS LE COMPOSANT (hooks autorisés ici)
  // ═══════════════════════════════════════════════════════════════════

  // ✅ Callback REST pour persister le read côté serveur
  const markConversationReadViaREST = useCallback(async (convId: string) => {
    const token = getAuthToken();
    if (!token || !convId) return;
    try {
      await fetch(apiUrl(`/conversations/${convId}/read`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Le socket broadcast aussi aux autres participants
      socketService.markAsRead(convId);
    } catch (err) {
      console.warn('[Messaging] markAsRead', err);
    }
  }, []);

  // ✅ Marque une conversation comme lue (local + serveur)
  const markConversationRead = useCallback(
    (convId: string) => {
      // Mise à jour locale instantanée (UX)
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      );
      // Persistance côté serveur
      void markConversationReadViaREST(convId);
    },
    [markConversationReadViaREST]
  );

  // ═══════════════════════════════════════════════════════════════════
  // 📡 CHARGEMENT DES DONNÉES
  // ═══════════════════════════════════════════════════════════════════

  const loadConversations = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setLoadingConversations(false);
      setErrorConversations('Connectez-vous pour accéder à votre messagerie.');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // ✅ Nouveau message
    const offNewMessage = socketService.onNewMessage((msg: SocketMessage) => {
      setMessages((prev) => {
        if (msg.conversationId !== activeConvId) return prev;
        if (prev.some((m) => m.id === msg.id)) return prev;

        const withoutPending = prev.filter((m) => {
          if (!m.isPending) return true;
          if (m.senderId !== msg.senderId) return true;
          if (m.text !== msg.text) return true;
          return false;
        });

        const realAvatar =
          msg.senderAvatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            msg.senderName || 'User'
          )}&background=FF2A3B&color=fff`;

        return [
          ...withoutPending,
          {
            id: msg.id,
            senderId: msg.senderId,
            senderName: msg.senderName,
            senderAvatar: realAvatar,
            text: msg.text,
            timestamp: msg.timestamp,
            createdAt: msg.createdAt ?? new Date().toISOString(),
            isMe: msg.senderId === currentUserId,
          },
        ];
      });

      // Mise à jour du dernier message + badge unread
      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversationId
            ? {
              ...c,
              lastMessage: msg.text,
              timestamp: msg.timestamp,
              unreadCount:
                msg.conversationId === activeConvId ||
                  msg.senderId === currentUserId
                  ? 0
                  : c.unreadCount + 1,
            }
            : c
        )
      );
    });

    // ✅ Typing indicator
    const offTypingStart = socketService.onTypingStart((data) => {
      if (data.userId === currentUserId) return;
      if (data.conversationId !== activeConvId) return;
      setTypingUser(data.userName);
    });

    const offTypingStop = socketService.onTypingStop((data) => {
      if (data.userId === currentUserId) return;
      if (data.conversationId !== activeConvId) return;
      setTypingUser(null);
    });

    // ✅ Messages lus par un autre participant
    const offMessagesRead = socketService.onMessagesRead((data) => {
      if (data.conversationId !== activeConvId) return;
      if (data.userId === currentUserId) return;
      setLastReadAt(data.readAt);
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      offNewMessage();
      offTypingStart();
      offTypingStop();
      offMessagesRead();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, activeConvId, currentUserId]);

  // ═══════════════════════════════════════════════════════════════════
  // 🔄 EFFETS DE CYCLE
  // ═══════════════════════════════════════════════════════════════════

  // Rejoindre la conversation active + marquer comme lue
  useEffect(() => {
    if (!activeConvId) return;
    socketService.joinConversation(activeConvId);
    markConversationRead(activeConvId);

    return () => {
      socketService.leaveConversation(activeConvId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId]);

  // ✅ Auto-mark : quand un message arrive sur la conv active → read
  useEffect(() => {
    if (!activeConvId || messages.length === 0) return;

    const last = messages[messages.length - 1];
    if (!last || last.isMe) return;

    const conv = conversations.find((c) => c.id === activeConvId);
    if (!conv || conv.unreadCount === 0) return;

    markConversationRead(activeConvId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, activeConvId]);

  // Scroll auto vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  // ═══════════════════════════════════════════════════════════════════
  // 🎬 HANDLERS
  // ═══════════════════════════════════════════════════════════════════

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId) return;

    const text = inputText.trim();

    const tempMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      senderId: currentUserId,
      senderName: authUser?.name || 'Moi',
      senderAvatar:
        authUser?.avatarUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          authUser?.name || 'Moi'
        )}&background=FF2A3B&color=fff`,
      text,
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

    socketService.sendMessage(activeConvId, text);
    socketService.stopTyping(activeConvId);
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

  const activeConv =
    conversations.find((c) => c.id === activeConvId) || null;

  // ✅ Détermine si un message a été lu par l'autre participant
  const isMessageRead = (msg: ChatMessage): boolean => {
    if (!msg.isMe) return false;
    if (!lastReadAt) return false;
    return new Date(msg.createdAt) <= new Date(lastReadAt);
  };

  // ═══════════════════════════════════════════════════════════════════
  // 🖼️ RENDU
  // ═══════════════════════════════════════════════════════════════════

  if (!authUser) {
    return (
      <div className="social-card-border rounded-3xl p-12 text-center space-y-4 max-w-2xl mx-auto">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FF2A3B]/20 border border-[#FF2A3B]/30 flex items-center justify-center">
          <MessageSquare className="w-8 h-8 text-[#FF2A3B]" />
        </div>
        <h3 className="text-xl font-black text-white">Messagerie privée</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Connectez-vous pour discuter avec les joueurs, coachs et clubs de la
          ligue HOOPERS.
        </p>
      </div>
    );
  }

  return (
    <div className="social-card-border rounded-3xl overflow-hidden h-[78vh] flex shadow-2xl">
      {/* ── LISTE ── */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-white/10 flex flex-col bg-[#0B0E17] ${isMobileChatOpen ? 'hidden md:flex' : 'flex'
          }`}
      >
        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#FF2A3B]" />
              Messagerie
              <span
                className={`ml-1 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isSocketConnected
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                  }`}
              >
                {isSocketConnected ? (
                  <>
                    <Wifi className="w-2.5 h-2.5" /> Live
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
              <span className="text-xs">Chargement…</span>
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
              {q
                ? 'Aucune conversation trouvée.'
                : 'Aucune conversation pour le moment.'}
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
                      className="w-11 h-11 rounded-full object-cover bg-slate-800"
                    />
                    {conv.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0B0E17]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        {conv.name}
                        {conv.isClub && (
                          <ShieldCheck className="w-3.5 h-3.5 text-[#FFB800]" />
                        )}
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

      {/* ── DISCUSSION ACTIVE ── */}
      <div
        className={`flex-1 flex flex-col bg-[#090A0F] ${isMobileChatOpen ? 'flex' : 'hidden md:flex'
          }`}
      >
        {activeConv ? (
          <>
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-[#0D111A]">
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
                  className="w-9 h-9 rounded-full object-cover bg-slate-800"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {activeConv.name}
                    </span>
                    {activeConv.isClub && (
                      <ShieldCheck className="w-3.5 h-3.5 text-[#FFB800]" />
                    )}
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

              <button
                aria-label="Menu"
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs">Chargement des messages…</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs italic">
                  <MessageSquare className="w-6 h-6 mb-2 opacity-50" />
                  Aucun message pour le moment. Lancez la discussion !
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${msg.isMe ? 'justify-end' : 'justify-start'
                      }`}
                  >
                    {!msg.isMe && (
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        className="w-7 h-7 rounded-full object-cover mb-1 shrink-0 bg-slate-800"
                      />
                    )}
                    <div
                      className={`max-w-[80%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${msg.isMe
                          ? `bg-linear-to-r from-[#FF2A3B] to-[#E60023] text-white rounded-br-none shadow-md shadow-[#FF2A3B]/20 ${msg.isPending ? 'opacity-70' : ''
                          }`
                          : 'bg-white/10 text-slate-100 rounded-bl-none border border-white/10'
                        }`}
                    >
                      {!msg.isMe && (
                        <span className="block text-[10px] font-bold text-[#FFB800] mb-0.5">
                          {msg.senderName}
                        </span>
                      )}
                      <p>{msg.text}</p>
                      <span
                        className={`block text-[9px] mt-1 text-right ${msg.isMe ? 'text-white/75' : 'text-slate-400'
                          }`}
                      >
                        {msg.timestamp}
                        {msg.isPending && ' • Envoi…'}
                        {msg.isMe && !msg.isPending && isMessageRead(msg) && (
                          <span className="ml-1 text-white/90"> • Vu ✓</span>
                        )}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-white/10 bg-[#0D111A]"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Joindre un fichier"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="flex-1 px-4 py-2 text-xs sm:text-sm rounded-full bg-white/10 text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:border-[#FF2A3B]"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  aria-label="Envoyer"
                  className="w-9 h-9 rounded-full bg-[#FF2A3B] text-white flex items-center justify-center hover:bg-[#E60023] disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-500 italic">
            Sélectionnez une conversation pour commencer.
          </div>
        )}
      </div>

      {/* ✅ Modal de recherche d'utilisateur */}
      <UserSearchModal
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        title="Nouveau message"
        placeholder="Chercher un utilisateur par nom ou ville..."
        onSelectUser={handleSelectUser}
      />
    </div>
  );
};