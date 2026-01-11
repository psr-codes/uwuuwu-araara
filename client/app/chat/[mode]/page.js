"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Video,
  Mic,
  MessageSquare,
  UserPlus,
  XCircle,
  Home,
  Send,
  Volume2,
  MessageCircle,
  ArrowUpRight,
  X,
  Check,
} from "lucide-react";
import { useWebRTC } from "../../../hooks/useWebRTC";
import VideoPlayer from "../../../components/VideoPlayer";
import ChatBox from "../../../components/ChatBox";
import { useVisitTracker } from "../../../hooks/useVisitTracker";

const VALID_MODES = ["video", "audio", "text"];

const MODE_CONFIG = {
  video: {
    icon: Video,
    color: "blue",
    bgClass: "bg-blue-600",
    bgHover: "hover:bg-blue-700",
    textClass: "text-blue-500",
    gradientClass: "from-blue-400 to-cyan-500",
    shadowClass: "shadow-blue-500/20",
    label: "Video Chat",
    description: "Face-to-face conversations with strangers worldwide.",
    mediaNote: "Camera and microphone access required",
  },
  audio: {
    icon: Mic,
    color: "purple",
    bgClass: "bg-purple-600",
    bgHover: "hover:bg-purple-700",
    textClass: "text-purple-500",
    gradientClass: "from-purple-400 to-pink-500",
    shadowClass: "shadow-purple-500/20",
    label: "Audio Chat",
    description: "Voice conversations without video. Perfect for on-the-go.",
    mediaNote: "Microphone access required",
  },
  text: {
    icon: MessageSquare,
    color: "green",
    bgClass: "bg-green-600",
    bgHover: "hover:bg-green-700",
    textClass: "text-green-500",
    gradientClass: "from-green-400 to-emerald-500",
    shadowClass: "shadow-green-500/20",
    label: "Text Chat",
    description: "Classic text messaging. Quick, anonymous, and easy.",
    mediaNote: "No camera or microphone needed",
  },
};

export default function ChatPage() {
  const params = useParams();
  const urlMode = params.mode;

  // Validate mode from URL
  const initialMode = VALID_MODES.includes(urlMode) ? urlMode : "video";

  useVisitTracker(`/chat/${initialMode}`);

  const {
    localStream,
    remoteStream,
    connectionStatus,
    startSearch,
    stop,
    sendMessage,
    chatHistory,
    socketId,
    partnerId,
    chatMode,
    upgradeRequest,
    upgradeStatus,
    requestUpgrade,
    respondToUpgrade,
  } = useWebRTC(initialMode);

  const [mobileTab, setMobileTab] = useState("main");
  const [textInput, setTextInput] = useState("");

  // Update URL when mode changes (from upgrade) - use replaceState to avoid re-render
  useEffect(() => {
    if (chatMode !== urlMode && connectionStatus === "connected") {
      // Use replaceState instead of router.push to avoid component re-mount
      window.history.replaceState(null, "", `/chat/${chatMode}`);
    }
  }, [chatMode, urlMode, connectionStatus]);

  const config = MODE_CONFIG[chatMode] || MODE_CONFIG.video;
  const Icon = config.icon;

  // Get upgrade options based on current mode
  const getUpgradeOptions = () => {
    if (chatMode === "text") return ["audio", "video"];
    if (chatMode === "audio") return ["video"];
    return [];
  };

  const handleSendText = () => {
    if (!textInput.trim() || connectionStatus !== "connected") return;
    sendMessage(textInput);
    setTextInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  // Idle state - Start screen
  if (connectionStatus === "idle") {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4">
        <div className="max-w-md w-full text-center space-y-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <Home size={16} />
            <span className="text-sm">Back to Home</span>
          </Link>

          <div className="flex justify-center mb-6">
            <div
              className={`${config.bgClass} p-4 rounded-full shadow-lg ${config.shadowClass} animate-pulse`}
            >
              <Icon size={48} className="text-white" />
            </div>
          </div>
          <h1
            className={`text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${config.gradientClass}`}
          >
            {config.label}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg px-4">
            {config.description}
          </p>
          <button
            onClick={startSearch}
            className={`w-full ${config.bgClass} ${config.bgHover} text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-2`}
          >
            <Icon size={24} />
            Start {config.label}
          </button>
          <div className="text-sm text-gray-500">{config.mediaNote}</div>
        </div>
      </div>
    );
  }

  // Active chat view
  return (
    <div className="h-screen bg-gray-950 text-white overflow-hidden flex flex-col">
      {/* Upgrade Request Modal */}
      {upgradeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-center space-y-4">
              <div
                className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                  MODE_CONFIG[upgradeRequest.targetMode]?.bgClass ||
                  "bg-blue-600"
                }`}
              >
                {upgradeRequest.targetMode === "video" ? (
                  <Video size={32} />
                ) : (
                  <Mic size={32} />
                )}
              </div>
              <h3 className="text-xl font-bold">
                Upgrade to {MODE_CONFIG[upgradeRequest.targetMode]?.label}?
              </h3>
              <p className="text-gray-400 text-sm">
                Your partner wants to upgrade. This will require{" "}
                {upgradeRequest.targetMode === "video"
                  ? "camera and microphone"
                  : "microphone"}{" "}
                access.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => respondToUpgrade(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <X size={20} />
                  Decline
                </button>
                <button
                  onClick={() => respondToUpgrade(true)}
                  className={`flex-1 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${
                    MODE_CONFIG[upgradeRequest.targetMode]?.bgClass ||
                    "bg-blue-600"
                  } ${
                    MODE_CONFIG[upgradeRequest.targetMode]?.bgHover ||
                    "hover:bg-blue-700"
                  }`}
                >
                  <Check size={20} />
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Status Toast */}
      {upgradeStatus && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full font-medium shadow-lg ${
            upgradeStatus === "pending"
              ? "bg-yellow-600"
              : upgradeStatus === "accepted"
              ? "bg-green-600"
              : "bg-red-600"
          }`}
        >
          {upgradeStatus === "pending" && "Waiting for partner..."}
          {upgradeStatus === "accepted" && "Upgrade accepted! Connecting..."}
          {upgradeStatus === "rejected" && "Partner declined the upgrade"}
        </div>
      )}

      {/* Header */}
      <header className="h-14 sm:h-16 border-b border-gray-800 flex items-center justify-between px-3 sm:px-6 bg-gray-950 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Home size={20} />
          </Link>
          <div className="w-px h-6 bg-gray-700 mx-1" />
          <Icon className={config.textClass} size={20} />
          <span className="font-bold text-lg sm:text-xl hidden sm:inline">
            {config.label}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Upgrade Buttons */}
          {connectionStatus === "connected" &&
            getUpgradeOptions().map((targetMode) => {
              const targetConfig = MODE_CONFIG[targetMode];
              const TargetIcon = targetConfig.icon;
              return (
                <button
                  key={targetMode}
                  onClick={() => requestUpgrade(targetMode)}
                  disabled={upgradeStatus === "pending"}
                  className={`${targetConfig.bgClass}/20 hover:${targetConfig.bgClass}/30 ${targetConfig.textClass} px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition-colors disabled:opacity-50`}
                  title={`Upgrade to ${targetConfig.label}`}
                >
                  <TargetIcon size={16} />
                  <ArrowUpRight size={14} />
                </button>
              );
            })}

          {/* Status */}
          <div
            className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${
              connectionStatus === "connected"
                ? "bg-green-500/10 text-green-400"
                : connectionStatus === "searching"
                ? "bg-yellow-500/10 text-yellow-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-green-500"
                  : connectionStatus === "searching"
                  ? "bg-yellow-500 animate-ping"
                  : "bg-red-500"
              }`}
            />
            <span className="hidden sm:inline">
              {connectionStatus === "connected"
                ? "Connected"
                : connectionStatus === "searching"
                ? "Searching..."
                : "Disconnected"}
            </span>
          </div>

          <button
            onClick={stop}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2 rounded-lg transition-colors"
          >
            <XCircle size={18} />
          </button>
          <button
            onClick={startSearch}
            className={`${config.bgClass} ${config.bgHover} text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 transition-colors`}
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">Next</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Media Area */}
        <div
          className={`${
            mobileTab === "main" ? "flex" : "hidden"
          } md:flex flex-1 relative ${
            chatMode === "video" ? "bg-black" : "bg-gray-900"
          } p-2 sm:p-4`}
        >
          <div className="w-full h-full flex items-center justify-center">
            {connectionStatus === "searching" ? (
              <div className="text-center space-y-4">
                <div
                  className={`animate-spin rounded-full h-16 w-16 border-b-2 border-${config.color}-500 mx-auto`}
                />
                <p className="text-xl font-medium">Finding someone...</p>
                {socketId && (
                  <p className="text-xs text-gray-500 font-mono">
                    Your ID: {socketId.slice(0, 12)}...
                  </p>
                )}
              </div>
            ) : connectionStatus === "disconnected" ? (
              <div className="text-center space-y-4">
                <p className="text-xl font-medium">Partner disconnected</p>
                <button
                  onClick={startSearch}
                  className={`${config.bgClass} ${config.bgHover} text-white px-6 py-3 rounded-xl font-medium`}
                >
                  Find New Partner
                </button>
              </div>
            ) : chatMode === "video" ? (
              <div className="w-full h-full relative rounded-xl sm:rounded-2xl overflow-hidden border border-gray-800">
                <VideoPlayer
                  stream={remoteStream}
                  label="Remote User"
                  muted={false}
                />
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-24 h-18 sm:w-36 sm:h-28 bg-gray-900 rounded-lg sm:rounded-xl overflow-hidden shadow-2xl border border-gray-700 z-20">
                  <VideoPlayer
                    stream={localStream}
                    label="You"
                    muted={true}
                    isLocal={true}
                  />
                </div>
              </div>
            ) : chatMode === "audio" ? (
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-pulse">
                    <Volume2 size={64} className="text-white" />
                  </div>
                  <div className="absolute inset-0 w-32 h-32 sm:w-40 sm:h-40 bg-purple-500/20 rounded-full animate-ping" />
                </div>
                <p className="text-lg font-medium text-gray-300">
                  Speaking with {partnerId?.slice(0, 8)}...
                </p>
                {remoteStream && (
                  <audio
                    autoPlay
                    ref={(el) => {
                      if (el) el.srcObject = remoteStream;
                    }}
                  />
                )}
              </div>
            ) : (
              // Text mode - Full chat area
              <div className="w-full h-full max-w-4xl mx-auto flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatHistory.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>Connected with stranger!</p>
                      <p className="text-sm">
                        Say hello to start the conversation
                      </p>
                    </div>
                  )}
                  {chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        msg.sender === "me" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                          msg.sender === "me"
                            ? "bg-green-600 text-white rounded-br-sm"
                            : "bg-gray-800 text-gray-100 rounded-bl-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-800">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                      placeholder="Type a message..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={connectionStatus !== "connected"}
                    />
                    <button
                      onClick={handleSendText}
                      disabled={
                        connectionStatus !== "connected" || !textInput.trim()
                      }
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white p-3 rounded-xl transition-colors disabled:cursor-not-allowed"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Sidebar - For video/audio modes */}
        {chatMode !== "text" && (
          <div
            className={`${
              mobileTab === "chat" ? "flex h-[50dvh] md:h-auto" : "hidden"
            } md:flex w-full md:w-80 lg:w-96 border-l border-gray-800 bg-gray-950 flex-col`}
          >
            <ChatBox
              messages={chatHistory}
              onSendMessage={sendMessage}
              disabled={connectionStatus !== "connected"}
            />
          </div>
        )}
      </main>

      {/* Mobile Navigation - For video/audio modes */}
      {chatMode !== "text" && (
        <nav className="md:hidden flex border-t border-gray-800 bg-gray-900 shrink-0">
          <button
            onClick={() => setMobileTab("main")}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
              mobileTab === "main"
                ? `${config.textClass} ${config.bgClass}/10`
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {chatMode === "video" ? <Video size={20} /> : <Volume2 size={20} />}
            <span className="text-xs font-medium">
              {chatMode === "video" ? "Video" : "Audio"}
            </span>
          </button>
          <button
            onClick={() => setMobileTab("chat")}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors relative ${
              mobileTab === "chat"
                ? `${config.textClass} ${config.bgClass}/10`
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <MessageCircle size={20} />
            <span className="text-xs font-medium">Chat</span>
            {mobileTab !== "chat" && chatHistory.length > 0 && (
              <span className="absolute top-2 right-1/4 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        </nav>
      )}
    </div>
  );
}
