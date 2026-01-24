"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

export function useWebRTC(
  initialChatMode = "video",
  initialChannel = "general",
  initialTopics = ["casual"],
) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [chatHistory, setChatHistory] = useState([]);
  const [socketId, setSocketId] = useState(null);
  const [partnerId, setPartnerId] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");
  const [chatMode, setChatMode] = useState(initialChatMode);

  // Upgrade request state
  const [upgradeRequest, setUpgradeRequest] = useState(null);
  const [upgradeStatus, setUpgradeStatus] = useState(null);

  // Game state
  const [gameState, setGameState] = useState({
    active: false,
    gameId: null,
    isMyTurn: false,
  });
  const [gameProposal, setGameProposal] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [lastGameAction, setLastGameAction] = useState(null);

  // Game stats tracking
  const [gameStats, setGameStats] = useState({
    myWins: 0,
    partnerWins: 0,
    draws: 0,
    gamesPlayed: [],
  });

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const partnerIdRef = useRef(null);
  const localStreamRef = useRef(null);
  const isCleaningUp = useRef(false);
  const signalBuffer = useRef([]);
  const chatModeRef = useRef(initialChatMode);

  // Channel state
  const [channel, setChannel] = useState(initialChannel);
  const channelRef = useRef(initialChannel);

  // Topic selection state
  const [selectedTopics, setSelectedTopics] = useState(initialTopics);
  const selectedTopicsRef = useRef(initialTopics);

  useEffect(() => {
    chatModeRef.current = chatMode;
  }, [chatMode]);

  useEffect(() => {
    channelRef.current = channel;
  }, [channel]);

  useEffect(() => {
    selectedTopicsRef.current = selectedTopics;
  }, [selectedTopics]);

  const initializeMedia = useCallback(async (mode = null) => {
    const targetMode = mode || chatModeRef.current;
    if (targetMode === "text") return null;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints = {
        audio: true,
        video:
          targetMode === "video"
            ? { width: { ideal: 640 }, height: { ideal: 480 } }
            : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error("[WEBRTC] Error accessing media devices:", err);
      alert(
        `Please enable ${targetMode === "video" ? "camera and microphone" : "microphone"} to continue.`,
      );
      return null;
    }
  }, []);

  const createPeer = useCallback((initiator, stream, targetPartnerId) => {
    const peer = new SimplePeer({
      initiator,
      trickle: true,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });

    if (stream) {
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    }

    peer.on("signal", (signal) => {
      socketRef.current?.emit("signal", { target: targetPartnerId, signal });
    });

    peer.on("stream", (remoteStreamData) => setRemoteStream(remoteStreamData));
    peer.on("track", (track, stream) => setRemoteStream(stream));
    peer.on("connect", () => setDebugInfo("P2P Connected!"));
    peer.on("error", (err) => console.error("[PEER] Error:", err.message));
    peer.on("close", () => {
      setConnectionStatus("disconnected");
      setRemoteStream(null);
    });

    return peer;
  }, []);

  const cleanup = useCallback(() => {
    if (isCleaningUp.current) return;
    isCleaningUp.current = true;

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    partnerIdRef.current = null;
    signalBuffer.current = [];
    setRemoteStream(null);
    setChatHistory([]);
    setSocketId(null);
    setPartnerId(null);
    setDebugInfo("");
    setUpgradeRequest(null);
    setUpgradeStatus(null);
    setGameState({ active: false, gameId: null, isMyTurn: false });
    setGameProposal(null);
    setGameStatus(null);
    setLastGameAction(null);

    isCleaningUp.current = false;
  }, []);

  const startSearch = useCallback(async () => {
    const stream = await initializeMedia();
    if (chatModeRef.current !== "text" && !stream) return;

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    signalBuffer.current = [];
    setRemoteStream(null);
    setChatHistory([]);
    setUpgradeRequest(null);
    setUpgradeStatus(null);
    setGameState({ active: false, gameId: null, isMyTurn: false });
    setGameProposal(null);
    setGameStatus(null);
    setLastGameAction(null);
    // Keep gameStats across sessions

    await new Promise((resolve) => setTimeout(resolve, 100));
    setConnectionStatus("searching");

    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketId(socket.id);
      socket.emit("join_queue", {
        channel: channelRef.current,
        chatMode: chatModeRef.current,
        topics: selectedTopicsRef.current,
      });
    });

    socket.on("socket_id", (id) => setSocketId(id));

    socket.on("matched", ({ partnerId: matchedPartnerId, initiator }) => {
      setConnectionStatus("connected");
      partnerIdRef.current = matchedPartnerId;
      setPartnerId(matchedPartnerId);

      if (chatModeRef.current === "text") return;

      const currentStream = localStreamRef.current;
      const peer = createPeer(initiator, currentStream, matchedPartnerId);
      peerRef.current = peer;

      signalBuffer.current.forEach((s) => peer.signal(s));
      signalBuffer.current = [];
    });

    socket.on("signal", ({ signal }) => {
      if (peerRef.current) {
        try {
          peerRef.current.signal(signal);
        } catch (err) {
          console.error(err.message);
        }
      } else {
        signalBuffer.current.push(signal);
      }
    });

    socket.on("chat_message", ({ message }) => {
      setChatHistory((prev) => [...prev, { sender: "partner", text: message }]);
    });

    // Upgrade handlers
    socket.on("upgrade_request", ({ from, targetMode }) => {
      setUpgradeRequest({ from, targetMode });
    });

    socket.on("upgrade_response", ({ accepted, targetMode }) => {
      setUpgradeStatus(accepted ? "accepted" : "rejected");
      if (accepted) performUpgrade(targetMode, true);
      setTimeout(() => setUpgradeStatus(null), 3000);
    });

    // Game handlers
    socket.on("game:proposal", ({ from, gameId }) => {
      setGameProposal({ from, gameId });
    });

    socket.on("game:response", ({ accepted, gameId }) => {
      setGameStatus(accepted ? "accepted" : "rejected");
      setTimeout(() => setGameStatus(null), 3000);
    });

    socket.on("game:start", ({ gameId, starterPlayer }) => {
      const isMyTurn = starterPlayer === socket.id;
      setGameState({ active: true, gameId, isMyTurn });
      setGameProposal(null);
      setGameStatus(null);
    });

    socket.on("game:action", ({ from, gameId, payload }) => {
      setLastGameAction({ from, gameId, payload });
      setGameState((prev) => ({ ...prev, isMyTurn: true }));
    });

    socket.on("game:end", ({ gameId, reason }) => {
      setGameState({ active: false, gameId: null, isMyTurn: false });
      setLastGameAction(null);
    });

    socket.on("partner_disconnected", () => {
      setConnectionStatus("disconnected");
      setRemoteStream(null);
      setGameState({ active: false, gameId: null, isMyTurn: false });
    });

    socket.on("disconnect", () => console.log("[SOCKET] Disconnected"));
  }, [initializeMedia, createPeer]);

  const performUpgrade = useCallback(
    async (targetMode, isInitiator = false) => {
      setChatMode(targetMode);
      chatModeRef.current = targetMode;

      if (!peerRef.current) {
        const stream = await initializeMedia(targetMode);
        if (!stream) return;
        const peer = createPeer(isInitiator, stream, partnerIdRef.current);
        peerRef.current = peer;
        return;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await initializeMedia(targetMode);
      if (!stream) return;

      try {
        stream
          .getTracks()
          .forEach((track) => peerRef.current.addTrack(track, stream));
      } catch (err) {
        peerRef.current.destroy();
        const peer = createPeer(isInitiator, stream, partnerIdRef.current);
        peerRef.current = peer;
      }
    },
    [initializeMedia, createPeer],
  );

  const requestUpgrade = useCallback((targetMode) => {
    if (!socketRef.current || !partnerIdRef.current) return;
    setUpgradeStatus("pending");
    socketRef.current.emit("upgrade_request", {
      target: partnerIdRef.current,
      targetMode,
    });
  }, []);

  const respondToUpgrade = useCallback(
    async (accepted) => {
      if (!upgradeRequest || !socketRef.current) return;
      const { from, targetMode } = upgradeRequest;
      socketRef.current.emit("upgrade_response", {
        target: from,
        accepted,
        targetMode,
      });
      if (accepted) await performUpgrade(targetMode, false);
      setUpgradeRequest(null);
    },
    [upgradeRequest, performUpgrade],
  );

  const sendMessage = useCallback((text) => {
    if (!partnerIdRef.current || !socketRef.current) return;
    socketRef.current.emit("chat_message", {
      target: partnerIdRef.current,
      message: text,
    });
    setChatHistory((prev) => [...prev, { sender: "me", text }]);
  }, []);

  // Game methods
  const requestGame = useCallback((gameId) => {
    if (!socketRef.current || !partnerIdRef.current) return;
    setGameStatus("pending");
    socketRef.current.emit("game:request", {
      target: partnerIdRef.current,
      gameId,
    });
  }, []);

  const respondToGame = useCallback(
    (accepted) => {
      if (!gameProposal || !socketRef.current) return;
      const { from, gameId } = gameProposal;
      socketRef.current.emit("game:response", {
        target: from,
        accepted,
        gameId,
      });
      if (!accepted) setGameProposal(null);
    },
    [gameProposal],
  );

  const sendGameAction = useCallback(
    (payload) => {
      if (!socketRef.current || !partnerIdRef.current || !gameState.active)
        return;
      socketRef.current.emit("game:action", {
        target: partnerIdRef.current,
        gameId: gameState.gameId,
        payload,
      });
      setGameState((prev) => ({ ...prev, isMyTurn: false }));
    },
    [gameState.active, gameState.gameId],
  );

  const endGame = useCallback(
    (reason = "completed") => {
      if (!socketRef.current || !partnerIdRef.current) return;
      socketRef.current.emit("game:end", {
        target: partnerIdRef.current,
        gameId: gameState.gameId,
        reason,
      });
      setGameState({ active: false, gameId: null, isMyTurn: false });
      setLastGameAction(null);
    },
    [gameState.gameId],
  );

  // Record game result
  const recordGameResult = useCallback((result, gameId) => {
    setGameStats((prev) => {
      const newStats = { ...prev };
      if (result === "win") newStats.myWins++;
      else if (result === "loss") newStats.partnerWins++;
      else if (result === "draw") newStats.draws++;
      newStats.gamesPlayed.push({ gameId, result, timestamp: Date.now() });
      return newStats;
    });
  }, []);

  const stop = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    cleanup();
    setConnectionStatus("idle");
    setChatMode(initialChatMode);
    chatModeRef.current = initialChatMode;
  }, [cleanup, initialChatMode]);

  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      cleanup();
    };
  }, [cleanup]);

  return {
    localStream,
    remoteStream,
    connectionStatus,
    startSearch,
    stop,
    sendMessage,
    chatHistory,
    socketId,
    partnerId,
    debugInfo,
    chatMode,
    upgradeRequest,
    upgradeStatus,
    requestUpgrade,
    respondToUpgrade,
    gameState,
    gameProposal,
    gameStatus,
    lastGameAction,
    requestGame,
    respondToGame,
    sendGameAction,
    endGame,
    gameStats,
    recordGameResult,
    // Channel and topic selection
    channel,
    setChannel,
    selectedTopics,
    setSelectedTopics,
  };
}
