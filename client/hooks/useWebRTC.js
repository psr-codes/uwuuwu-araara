"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

export function useWebRTC(initialChatMode = "video") {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [chatHistory, setChatHistory] = useState([]);
  const [socketId, setSocketId] = useState(null);
  const [partnerId, setPartnerId] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");
  const [chatMode, setChatMode] = useState(initialChatMode);

  // Upgrade request state
  const [upgradeRequest, setUpgradeRequest] = useState(null); // { from, targetMode }
  const [upgradeStatus, setUpgradeStatus] = useState(null); // 'pending' | 'accepted' | 'rejected'

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const partnerIdRef = useRef(null);
  const localStreamRef = useRef(null);
  const isCleaningUp = useRef(false);
  const signalBuffer = useRef([]);
  const chatModeRef = useRef(initialChatMode);

  // Update chatMode ref when state changes
  useEffect(() => {
    chatModeRef.current = chatMode;
  }, [chatMode]);

  // Check if stream tracks are valid
  const validateStream = (stream, label) => {
    if (!stream) {
      console.log(`[VALIDATE ${label}] Stream is null`);
      return false;
    }

    const tracks = stream.getTracks();
    console.log(
      `[VALIDATE ${label}] Stream ID: ${stream.id}, Tracks: ${tracks.length}`
    );

    // For text mode, no stream is needed
    if (chatModeRef.current === "text") return true;

    // For audio mode, only need audio
    if (chatModeRef.current === "audio") {
      return tracks.some(
        (t) => t.kind === "audio" && t.readyState === "live" && t.enabled
      );
    }

    // For video mode, need video
    return tracks.some(
      (t) => t.kind === "video" && t.readyState === "live" && t.enabled
    );
  };

  // Initialize media based on chat mode
  const initializeMedia = useCallback(async (mode = null) => {
    const targetMode = mode || chatModeRef.current;
    console.log(`[WEBRTC] Initializing media for mode: ${targetMode}`);

    if (targetMode === "text") {
      console.log("[WEBRTC] Text mode - no media needed");
      return null;
    }

    // Stop any existing tracks first
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

      console.log("[WEBRTC] Requesting media with constraints:", constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error("[WEBRTC] Error accessing media devices:", err);
      alert(
        `Please enable ${
          targetMode === "video" ? "camera and microphone" : "microphone"
        } to continue.`
      );
      return null;
    }
  }, []);

  // Create WebRTC peer connection
  const createPeer = useCallback((initiator, stream, targetPartnerId) => {
    console.log("[WEBRTC] Creating SimplePeer, initiator:", initiator);

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

    // Add stream tracks
    if (stream) {
      stream.getTracks().forEach((track) => {
        console.log(`[PEER] Adding track: ${track.kind}`);
        peer.addTrack(track, stream);
      });
    }

    peer.on("signal", (signal) => {
      console.log("[PEER] Signal generated:", signal.type || "candidate");
      socketRef.current?.emit("signal", { target: targetPartnerId, signal });
    });

    peer.on("stream", (remoteStreamData) => {
      console.log("[PEER] *** RECEIVED REMOTE STREAM ***");
      setRemoteStream(remoteStreamData);
    });

    peer.on("track", (track, stream) => {
      console.log("[PEER] *** RECEIVED TRACK ***:", track.kind);
      setRemoteStream(stream);
    });

    peer.on("connect", () => {
      console.log("[PEER] *** P2P CONNECTION ESTABLISHED ***");
      setDebugInfo("P2P Connected!");
    });

    peer.on("error", (err) => {
      console.error("[PEER] Error:", err.message);
    });

    peer.on("close", () => {
      console.log("[PEER] Connection closed");
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

    isCleaningUp.current = false;
  }, []);

  const startSearch = useCallback(async () => {
    console.log(`[WEBRTC] startSearch called for mode: ${chatModeRef.current}`);

    const stream = await initializeMedia();
    if (chatModeRef.current !== "text" && !stream) {
      console.error("[WEBRTC] No stream available, aborting");
      return;
    }

    // Reset previous session
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

    await new Promise((resolve) => setTimeout(resolve, 100));
    setConnectionStatus("searching");

    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[SOCKET] Connected with ID:", socket.id);
      setSocketId(socket.id);
      socket.emit("join_queue", { chatMode: chatModeRef.current });
    });

    socket.on("socket_id", (id) => setSocketId(id));

    socket.on("matched", ({ partnerId: matchedPartnerId, initiator }) => {
      console.log("[SOCKET] Matched! Partner:", matchedPartnerId);
      setConnectionStatus("connected");
      partnerIdRef.current = matchedPartnerId;
      setPartnerId(matchedPartnerId);

      // Text mode: No WebRTC needed
      if (chatModeRef.current === "text") {
        console.log("[WEBRTC] Text mode - skipping WebRTC peer creation");
        return;
      }

      const currentStream = localStreamRef.current;
      const peer = createPeer(initiator, currentStream, matchedPartnerId);
      peerRef.current = peer;

      // Apply buffered signals
      signalBuffer.current.forEach((s) => peer.signal(s));
      signalBuffer.current = [];
    });

    socket.on("signal", ({ sender, signal }) => {
      if (peerRef.current) {
        try {
          peerRef.current.signal(signal);
        } catch (err) {
          console.error("[PEER] Error applying signal:", err.message);
        }
      } else {
        signalBuffer.current.push(signal);
      }
    });

    socket.on("chat_message", ({ message }) => {
      setChatHistory((prev) => [...prev, { sender: "partner", text: message }]);
    });

    // ========== UPGRADE HANDLERS ==========

    socket.on("upgrade_request", ({ from, targetMode }) => {
      console.log(
        `[UPGRADE] Received upgrade request to ${targetMode} from ${from}`
      );
      setUpgradeRequest({ from, targetMode });
    });

    socket.on("upgrade_response", ({ from, accepted, targetMode }) => {
      console.log(
        `[UPGRADE] Partner ${
          accepted ? "accepted" : "rejected"
        } upgrade to ${targetMode}`
      );
      setUpgradeStatus(accepted ? "accepted" : "rejected");

      if (accepted) {
        // Upgrade our mode and initialize media
        // Requester is the initiator
        performUpgrade(targetMode, true);
      }

      // Clear status after 3 seconds
      setTimeout(() => setUpgradeStatus(null), 3000);
    });

    socket.on("partner_disconnected", () => {
      console.log("[SOCKET] Partner disconnected");
      setConnectionStatus("disconnected");
      setRemoteStream(null);
    });

    socket.on("disconnect", () =>
      console.log("[SOCKET] Disconnected from server")
    );
  }, [initializeMedia, createPeer]);

  // Perform the actual upgrade by adding tracks to existing peer
  const performUpgrade = useCallback(
    async (targetMode, isInitiator = false) => {
      console.log(
        `[UPGRADE] Performing upgrade to ${targetMode}, initiator: ${isInitiator}`
      );

      // Update mode
      setChatMode(targetMode);
      chatModeRef.current = targetMode;

      // For text→audio or text→video, we need to create a peer first
      // since text mode has no peer
      if (!peerRef.current) {
        console.log("[UPGRADE] No existing peer, creating new one");
        const stream = await initializeMedia(targetMode);
        if (!stream) {
          console.error("[UPGRADE] Failed to get media for upgrade");
          return;
        }
        const peer = createPeer(isInitiator, stream, partnerIdRef.current);
        peerRef.current = peer;
        return;
      }

      // For audio→video upgrade, we just need to add video track
      // The existing peer connection stays alive
      console.log("[UPGRADE] Adding new tracks to existing peer");

      // Stop old tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Get new media with video
      const stream = await initializeMedia(targetMode);
      if (!stream) {
        console.error("[UPGRADE] Failed to get media for upgrade");
        return;
      }

      // Add new tracks to existing peer
      // SimplePeer will handle renegotiation automatically
      try {
        stream.getTracks().forEach((track) => {
          console.log(`[UPGRADE] Adding track: ${track.kind}`);
          peerRef.current.addTrack(track, stream);
        });
      } catch (err) {
        console.error("[UPGRADE] Error adding tracks:", err);
        // Fallback: destroy and recreate peer
        peerRef.current.destroy();
        const peer = createPeer(isInitiator, stream, partnerIdRef.current);
        peerRef.current = peer;
      }
    },
    [initializeMedia, createPeer]
  );

  // Request to upgrade chat mode
  const requestUpgrade = useCallback((targetMode) => {
    if (!socketRef.current || !partnerIdRef.current) {
      console.warn("[UPGRADE] Cannot request upgrade: no connection");
      return;
    }

    console.log(`[UPGRADE] Requesting upgrade to ${targetMode}`);
    setUpgradeStatus("pending");

    socketRef.current.emit("upgrade_request", {
      target: partnerIdRef.current,
      targetMode,
    });
  }, []);

  // Respond to upgrade request
  const respondToUpgrade = useCallback(
    async (accepted) => {
      if (!upgradeRequest || !socketRef.current) return;

      const { from, targetMode } = upgradeRequest;
      console.log(
        `[UPGRADE] Responding ${
          accepted ? "accept" : "reject"
        } to upgrade to ${targetMode}`
      );

      socketRef.current.emit("upgrade_response", {
        target: from,
        accepted,
        targetMode,
      });

      if (accepted) {
        // Accepter is NOT the initiator (the requester is)
        await performUpgrade(targetMode, false);
      }

      setUpgradeRequest(null);
    },
    [upgradeRequest, performUpgrade]
  );

  const sendMessage = useCallback((text) => {
    if (!partnerIdRef.current || !socketRef.current) return;

    socketRef.current.emit("chat_message", {
      target: partnerIdRef.current,
      message: text,
    });
    setChatHistory((prev) => [...prev, { sender: "me", text }]);
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
    // Upgrade functionality
    upgradeRequest,
    upgradeStatus,
    requestUpgrade,
    respondToUpgrade,
  };
}
