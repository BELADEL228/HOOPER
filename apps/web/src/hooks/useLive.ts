import { useEffect, useRef, useCallback, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { LiveComment, LiveReaction } from '../types/live';

// ─── Config ICE servers (STUN public + TURN si dispo) ────────────────────────
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // Pour prod : ajouter un TURN server (coturn self-hosted ou Twilio)
  // { urls: 'turn:your-turn-server.com:3478', username: 'xxx', credential: 'xxx' },
];

interface UseLiveStreamerOptions {
  sessionId: string;
  socket: Socket | null;
  onError?: (err: string) => void;
}

interface UseLiveViewerOptions {
  sessionId: string;
  socket: Socket | null;
  onError?: (err: string) => void;
}

// ══════════════════════════════════════════════════════════════════════════════
// Hook STREAMER — Capture la caméra/micro et diffuse via WebRTC
// ══════════════════════════════════════════════════════════════════════════════
export function useLiveStreamer({ sessionId, socket, onError }: UseLiveStreamerOptions) {
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  // ── Démarre la capture caméra/micro ──────────────────────────────────────
  const startStream = useCallback(async (videoEl: HTMLVideoElement | null) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      localStreamRef.current = stream;
      if (videoEl) {
        videoEl.srcObject = stream;
        videoEl.muted = true;
        await videoEl.play().catch(() => {});
      }

      setIsStreaming(true);
      socket?.emit('live:started', { sessionId });
      return stream;
    } catch (err: any) {
      onError?.(err.message || "Impossible d'accéder à la caméra.");
      return null;
    }
  }, [sessionId, socket, onError]);

  // ── Arrête le stream ──────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    setIsStreaming(false);
    socket?.emit('live:ended', { sessionId });
  }, [sessionId, socket]);

  // ── Crée une connexion peer pour un nouveau viewer ────────────────────────
  const createPeerForViewer = useCallback(async (viewerId: string) => {
    if (!localStreamRef.current || !socket) return;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peersRef.current.set(viewerId, pc);

    // Ajoute les tracks locaux
    localStreamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // ICE candidates
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('live:ice_candidate', {
          sessionId,
          candidate: e.candidate.toJSON(),
          targetId: viewerId,
        });
      }
    };

    // Crée l'offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit('live:offer', { sessionId, sdp: offer, targetId: viewerId });
    return pc;
  }, [sessionId, socket]);

  // ── Gestion des events Socket.IO (côté streamer) ─────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleViewerJoined = async ({ userId }: { userId: string }) => {
      setViewerCount((v) => v + 1);
      await createPeerForViewer(userId);
    };

    const handleViewerLeft = ({ userId }: { userId: string }) => {
      setViewerCount((v) => Math.max(0, v - 1));
      const pc = peersRef.current.get(userId);
      pc?.close();
      peersRef.current.delete(userId);
    };

    const handleAnswer = async ({ sdp, viewerId }: { sdp: RTCSessionDescriptionInit; viewerId: string }) => {
      const pc = peersRef.current.get(viewerId);
      if (pc && pc.signalingState !== 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    };

    const handleIceCandidate = async ({ candidate, fromId }: { candidate: RTCIceCandidateInit; fromId: string }) => {
      const pc = peersRef.current.get(fromId);
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }
    };

    const handleViewersCount = ({ count }: { count: number }) => {
      setViewerCount(count);
    };

    socket.on('live:viewer_joined', handleViewerJoined);
    socket.on('live:viewer_left', handleViewerLeft);
    socket.on('live:answer', handleAnswer);
    socket.on('live:ice_candidate', handleIceCandidate);
    socket.on('live:viewers_count', handleViewersCount);

    return () => {
      socket.off('live:viewer_joined', handleViewerJoined);
      socket.off('live:viewer_left', handleViewerLeft);
      socket.off('live:answer', handleAnswer);
      socket.off('live:ice_candidate', handleIceCandidate);
      socket.off('live:viewers_count', handleViewersCount);
    };
  }, [socket, createPeerForViewer]);

  return { startStream, stopStream, isStreaming, viewerCount, localStreamRef };
}

// ══════════════════════════════════════════════════════════════════════════════
// Hook VIEWER — Reçoit le stream du streamer via WebRTC
// ══════════════════════════════════════════════════════════════════════════════
export function useLiveViewer({ sessionId, socket, onError }: UseLiveViewerOptions) {
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [chat, setChat] = useState<LiveComment[]>([]);
  const [reactions, setReactions] = useState<{ id: string; emoji: string; userName: string }[]>([]);

  // ── Rejoindre le live ─────────────────────────────────────────────────────
  const joinLive = useCallback(() => {
    socket?.emit('live:join', { sessionId });
  }, [sessionId, socket]);

  // ── Quitter le live ───────────────────────────────────────────────────────
  const leaveLive = useCallback(() => {
    socket?.emit('live:leave', { sessionId });
    peerRef.current?.close();
    peerRef.current = null;
    setRemoteStream(null);
    setIsConnected(false);
  }, [sessionId, socket]);

  // ── Envoyer un message chat ───────────────────────────────────────────────
  const sendChat = useCallback((text: string) => {
    socket?.emit('live:chat', { sessionId, text });
  }, [sessionId, socket]);

  // ── Envoyer une réaction emoji ────────────────────────────────────────────
  const sendReaction = useCallback((emoji: string) => {
    socket?.emit('live:reaction', { sessionId, emoji });
  }, [sessionId, socket]);

  // ── Gestion des events Socket.IO (côté viewer) ────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ sdp, streamerId }: { sdp: RTCSessionDescriptionInit; streamerId: string }) => {
      try {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        peerRef.current = pc;

        const ms = new MediaStream();
        setRemoteStream(ms);

        pc.ontrack = (e) => {
          e.streams[0]?.getTracks().forEach((t) => ms.addTrack(t));
          setRemoteStream(new MediaStream(ms.getTracks()));
          setIsConnected(true);
        };

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit('live:ice_candidate', {
              sessionId,
              candidate: e.candidate.toJSON(),
              targetId: streamerId,
            });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'failed') {
            onError?.('Connexion au live perdue.');
            setIsConnected(false);
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('live:answer', { sessionId, sdp: answer, targetId: streamerId });
      } catch (err: any) {
        onError?.(err.message || 'Erreur connexion WebRTC.');
      }
    };

    const handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (peerRef.current && candidate) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }
    };

    const handleChat = (comment: LiveComment) => {
      setChat((prev) => [...prev.slice(-200), comment]);
    };

    const handleReaction = (r: LiveReaction) => {
      const id = `${Date.now()}-${Math.random()}`;
      setReactions((prev) => [...prev, { id, emoji: r.emoji, userName: r.userName }]);
      setTimeout(() => setReactions((prev) => prev.filter((x) => x.id !== id)), 3000);
    };

    const handleViewersCount = ({ count }: { count: number }) => setViewerCount(count);
    const handleEnded = () => { setIsConnected(false); peerRef.current?.close(); };

    socket.on('live:offer', handleOffer);
    socket.on('live:ice_candidate', handleIceCandidate);
    socket.on('live:chat', handleChat);
    socket.on('live:reaction', handleReaction);
    socket.on('live:viewers_count', handleViewersCount);
    socket.on('live:ended', handleEnded);

    return () => {
      socket.off('live:offer', handleOffer);
      socket.off('live:ice_candidate', handleIceCandidate);
      socket.off('live:chat', handleChat);
      socket.off('live:reaction', handleReaction);
      socket.off('live:viewers_count', handleViewersCount);
      socket.off('live:ended', handleEnded);
    };
  }, [socket, sessionId, onError]);

  return {
    joinLive,
    leaveLive,
    sendChat,
    sendReaction,
    remoteStream,
    isConnected,
    viewerCount,
    chat,
    reactions,
  };
}
