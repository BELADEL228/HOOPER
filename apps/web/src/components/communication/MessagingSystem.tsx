import React, { useEffect, useState } from 'react';
import type { Message, UserRole } from '../../types';
import { MessageSquare, Send, Paperclip, Image as ImageIcon, Users, Shield } from 'lucide-react';
import { apiUrl } from '../../services/api';
import { useClub } from '../../context/ClubContext';

interface MessagingSystemProps {
  currentRole: UserRole;
}

export const MessagingSystem: React.FC<MessagingSystemProps> = ({ currentRole }) => {
  const { activeClub } = useClub();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeChannel, setActiveChannel] = useState<'GENERAL' | 'PRIVATE'>('GENERAL');
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (!session?.token) return;
    fetch(apiUrl(`/messages/general?clubId=${encodeURIComponent(activeClub.clubId || activeClub.id)}`), { headers: { Authorization: `Bearer ${session.token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Messagerie indisponible');
        const remoteMessages = await response.json();
        setMessages(remoteMessages.map((message: { id: string; text: string; createdAt: string; sender: { id: string; name: string; role: UserRole; avatarUrl: string | null } }) => ({
          id: message.id,
          senderId: message.sender.id,
          senderName: message.sender.name,
          senderAvatar: message.sender.avatarUrl || '',
          senderRole: message.sender.role,
          text: message.text,
          timestamp: new Date(message.createdAt).toLocaleString('fr-FR'),
          reactions: [],
        })));
      })
      .catch(() => setSyncError('Mode local actif : les messages seront synchronisés à la reconnexion.'));
  }, [activeClub.clubId, activeClub.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const session = JSON.parse(localStorage.getItem('firestone-auth') || '{}');
    if (session?.token) {
      const response = await fetch(apiUrl('/messages/general'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ text: inputText, clubId: activeClub.clubId || activeClub.id }),
      }).catch(() => null);
      if (response?.ok) {
        const data = await response.json();
        const saved = data;
        setMessages((current) => [...current, { id: saved.id, senderId: saved.sender.id, senderName: saved.sender.name, senderAvatar: saved.sender.avatarUrl || '', senderRole: saved.sender.role, text: saved.text, timestamp: 'À l’instant', reactions: [] }]);
        setInputText('');
        setSyncError(null);
        return;
      }
      setSyncError('Message local uniquement : le serveur est indisponible.');
    }

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      senderId: 'current_user',
      senderName: `Vous (${currentRole})`,
      senderAvatar: '',
      senderRole: currentRole,
      text: inputText,
      timestamp: 'À l\'instant',
      reactions: [],
    };

    setMessages([...messages, newMessage]);
    setInputText('');
  };

  const addReaction = (messageId: string, emoji: string) => {
    setMessages(
      messages.map((msg) => {
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

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
          <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> Messagerie Équipe & Privée
        </div>
        <h2 className="text-3xl font-extrabold text-white">Centre de Communication</h2>
        <p className="text-slate-400 text-sm">Discutez en direct avec le staff, les entraîneurs et vos coéquipiers.</p>
          {syncError && <p className="mt-2 text-xs text-amber-300">{syncError}</p>}
      </div>

      {/* Main Messaging Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-162.5 glass-panel rounded-3xl border border-white/10 overflow-hidden">
        
        {/* Left Sidebar: Channels & Contacts */}
        <div className="lg:col-span-4 bg-black/40 border-r border-white/10 p-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Canaux de discussion</div>
            
            <button
              onClick={() => setActiveChannel('GENERAL')}
              className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all ${
                activeChannel === 'GENERAL'
                  ? 'bg-linear-to-r from-[#FF2A3B] to-[#E60023] text-white font-bold shadow-md'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                <div className="text-left text-xs">
                  <div className="font-bold"># general-team</div>
                  <div className="text-[10px] opacity-80">Tous les membres (15 en ligne)</div>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </button>

            <button
              onClick={() => setActiveChannel('PRIVATE')}
              className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all ${
                activeChannel === 'PRIVATE'
                  ? 'bg-linear-to-r from-[#FF2A3B] to-[#E60023] text-white font-bold shadow-md'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#FFB800]" />
                <div className="text-left text-xs">
                  <div className="font-bold"># staff-coaching</div>
                  <div className="text-[10px] opacity-80">Coach & Capitaines</div>
                </div>
              </div>
            </button>
          </div>

          {/* Members Online Status */}
          <div className="space-y-2 pt-3 border-t border-white/10">
            <div className="text-xs font-bold text-slate-400">Membres Connectés</div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-slate-300 font-medium">12 Joueurs & Staff actifs</span>
            </div>
          </div>
        </div>

        {/* Right Area: Chat Conversation */}
        <div className="lg:col-span-8 flex flex-col justify-between p-4 sm:p-6 bg-[#090A0F]/60">
          
          {/* Chat Header */}
          <div className="pb-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#FF2A3B]" />
              <div>
                <h3 className="font-bold text-white text-sm"># general-team</h3>
                <div className="text-[11px] text-slate-400">Discussion officielle de l'équipe FIRE STONE</div>
              </div>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3 items-start group">
                <img
                  src={msg.senderAvatar}
                  alt={msg.senderName}
                  className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-white">{msg.senderName}</span>
                    <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-xs text-slate-200 leading-relaxed max-w-xl">
                    {msg.text}
                  </div>

                  {/* Reaction Pills */}
                  <div className="flex items-center gap-2 pt-1">
                    {msg.reactions.map((r, idx) => (
                      <button
                        key={idx}
                        onClick={() => addReaction(msg.id, r.emoji)}
                        className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300 hover:bg-white/10 flex items-center gap-1"
                      >
                        <span>{r.emoji}</span>
                        <span className="font-bold">{r.count}</span>
                      </button>
                    ))}

                    <div className="hidden group-hover:flex items-center gap-1 text-[11px] text-slate-400">
                      <button onClick={() => addReaction(msg.id, '🔥')} className="hover:scale-125 transition-transform">🔥</button>
                      <button onClick={() => addReaction(msg.id, '💪')} className="hover:scale-125 transition-transform">💪</button>
                      <button onClick={() => addReaction(msg.id, '❤️')} className="hover:scale-125 transition-transform">❤️</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="pt-3 border-t border-white/10 flex items-center gap-2">
            <button type="button" className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors">
              <Paperclip className="w-4 h-4" />
            </button>
            <button type="button" className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors">
              <ImageIcon className="w-4 h-4" />
            </button>
            <input
              type="text"
              placeholder="Écrivez votre message à l'équipe..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#FF2A3B] text-white font-bold text-xs hover:bg-red-600 shadow-md flex items-center gap-1.5"
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
