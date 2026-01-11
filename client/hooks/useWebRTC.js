"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";

// const SOCKET_URL = "http://192.168.29.237:5001";
// get from env
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
console.log("SOCKET_URL", SOCKET_URL);

export function useWebRTC() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [chatHistory, setChatHistory] = useState([]);
  const [socketId, setSocketId] = useState(null);
  const [partnerId, setPartnerId] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const partnerIdRef = useRef(null);
  const localStreamRef = useRef(null);
  const isCleaningUp = useRef(false);
  const signalBuffer = useRef([]);

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

    tracks.forEach((track) => {
      console.log(
        `[VALIDATE ${label}] Track: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState}, muted: ${track.muted}`
      );
    });

    const hasLiveVideo = tracks.some(
      (t) => t.kind === "video" && t.readyState === "live" && t.enabled
    );
    const hasLiveAudio = tracks.some(
      (t) => t.kind === "audio" && t.readyState === "live" && t.enabled
    );

    console.log(
      `[VALIDATE ${label}] Has live video: ${hasLiveVideo}, Has live audio: ${hasLiveAudio}`
    );
    return hasLiveVideo;
  };

  // Initialize media
  const initializeMedia = useCallback(async () => {
    console.log("[WEBRTC] Initializing media...");

    // Stop any existing tracks first
    if (localStreamRef.current) {
      console.log("[WEBRTC] Stopping existing stream tracks");
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: true,
      });

      console.log("[WEBRTC] Got local stream:", stream.id);
      validateStream(stream, "LOCAL");

      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error("[WEBRTC] Error accessing media devices:", err);
      setDebugInfo(`Camera error: ${err.message}`);
      alert("Please enable camera/microphone to use this app.");
      return null;
    }
  }, []);

  const cleanup = useCallback(() => {
    if (isCleaningUp.current) {
      console.log("[WEBRTC] Already cleaning up, skipping...");
      return;
    }
    isCleaningUp.current = true;
    console.log("[WEBRTC] Cleanup started");

    if (peerRef.current) {
      console.log("[WEBRTC] Destroying peer");
      peerRef.current.destroy();
      peerRef.current = null;
    }

    if (socketRef.current) {
      console.log("[WEBRTC] Disconnecting socket");
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

    isCleaningUp.current = false;
    console.log("[WEBRTC] Cleanup complete");
  }, []);

  const startSearch = useCallback(async () => {
    console.log("[WEBRTC] startSearch called");

    // Always get a fresh stream
    const stream = await initializeMedia();
    if (!stream) {
      console.error("[WEBRTC] No stream available, aborting");
      return;
    }

    // Validate the stream is actually working
    if (!validateStream(stream, "BEFORE_PEER")) {
      console.error("[WEBRTC] Stream validation failed!");
      setDebugInfo("Stream has no live video track");
    }

    // Reset previous session (but keep the stream)
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
    setSocketId(null);
    setPartnerId(null);

    // Small delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    setConnectionStatus("searching");
    console.log("[WEBRTC] Status: searching");

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[SOCKET] Connected with ID:", socket.id);
      setSocketId(socket.id);
      socket.emit("join_queue");
    });

    socket.on("socket_id", (id) => {
      console.log("[SOCKET] Received socket_id:", id);
      setSocketId(id);
    });

    socket.on("matched", ({ partnerId: matchedPartnerId, initiator }) => {
      console.log(
        "[SOCKET] Matched! Partner:",
        matchedPartnerId,
        "Initiator:",
        initiator
      );
      setConnectionStatus("connected");
      partnerIdRef.current = matchedPartnerId;
      setPartnerId(matchedPartnerId);

      // Get current stream and validate again
      const currentStream = localStreamRef.current;
      console.log("[WEBRTC] Creating SimplePeer, initiator:", initiator);
      validateStream(currentStream, "PEER_CREATION");

      // Create peer WITHOUT stream first, then add it
      const peer = new SimplePeer({
        initiator: initiator,
        trickle: true,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
          ],
        },
      });

      // Add stream tracks manually
      if (currentStream) {
        console.log("[PEER] Adding stream tracks to peer");
        currentStream.getTracks().forEach((track) => {
          console.log(
            `[PEER] Adding track: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState}`
          );
          peer.addTrack(track, currentStream);
        });
      }

      peer.on("signal", (signal) => {
        console.log("[PEER] Signal generated:", signal.type || "candidate");
        socket.emit("signal", { target: matchedPartnerId, signal });
      });

      peer.on("stream", (remoteStreamData) => {
        console.log(
          "[PEER] *** RECEIVED REMOTE STREAM ***:",
          remoteStreamData.id
        );
        validateStream(remoteStreamData, "REMOTE_RECEIVED");
        setRemoteStream(remoteStreamData);
      });

      peer.on("track", (track, stream) => {
        console.log(
          "[PEER] *** RECEIVED TRACK ***:",
          track.kind,
          "stream:",
          stream.id
        );
        console.log(
          "[PEER] Track state:",
          track.enabled,
          track.readyState,
          track.muted
        );
        // Sometimes stream event doesn't fire but track does
        setRemoteStream(stream);
      });

      peer.on("connect", () => {
        console.log("[PEER] *** P2P CONNECTION ESTABLISHED ***");
        setDebugInfo("P2P Connected!");
      });

      peer.on("error", (err) => {
        console.error("[PEER] Error:", err.message);
        setDebugInfo(`Peer error: ${err.message}`);
      });

      peer.on("close", () => {
        console.log("[PEER] Connection closed");
        setConnectionStatus("disconnected");
        setRemoteStream(null);
        partnerIdRef.current = null;
        setPartnerId(null);
      });

      peerRef.current = peer;

      // Apply any buffered signals
      if (signalBuffer.current.length > 0) {
        console.log(
          "[WEBRTC] Applying",
          signalBuffer.current.length,
          "buffered signals"
        );
        signalBuffer.current.forEach((bufferedSignal) => {
          console.log(
            "[PEER] Applying buffered signal:",
            bufferedSignal.type || "candidate"
          );
          peer.signal(bufferedSignal);
        });
        signalBuffer.current = [];
      }
    });

    socket.on("signal", ({ sender, signal }) => {
      console.log(
        "[SOCKET] Received signal from:",
        sender,
        "type:",
        signal.type || "candidate"
      );

      if (peerRef.current) {
        console.log("[PEER] Applying signal immediately");
        try {
          peerRef.current.signal(signal);
        } catch (err) {
          console.error("[PEER] Error applying signal:", err.message);
        }
      } else {
        console.log("[PEER] Peer not ready, buffering signal");
        signalBuffer.current.push(signal);
      }
    });

    socket.on("chat_message", ({ message }) => {
      console.log("[CHAT] Received message:", message);
      setChatHistory((prev) => [...prev, { sender: "partner", text: message }]);
    });

    socket.on("disconnect", () => {
      console.log("[SOCKET] Disconnected from server");
    });

    socket.on("connect_error", (err) => {
      console.error("[SOCKET] Connection error:", err.message);
    });
  }, [initializeMedia]);

  const sendMessage = useCallback((text) => {
    if (!partnerIdRef.current || !socketRef.current) {
      console.warn("[CHAT] Cannot send message: no partner or socket");
      return;
    }

    console.log("[CHAT] Sending message:", text, "to:", partnerIdRef.current);
    socketRef.current.emit("chat_message", {
      target: partnerIdRef.current,
      message: text,
    });
    setChatHistory((prev) => [...prev, { sender: "me", text }]);
  }, []);

  const stop = useCallback(() => {
    console.log("[WEBRTC] stop called");
    // Also stop the local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    cleanup();
    setConnectionStatus("idle");
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("[WEBRTC] Component unmounting, cleaning up...");
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
  };
}
