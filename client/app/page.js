"use client";

import { useState } from "react";
import {
  Video,
  MonitorPlay,
  UserPlus,
  XCircle,
  MessageCircle,
  VideoIcon,
} from "lucide-react";
import { useWebRTC } from "../hooks/useWebRTC";
import VideoPlayer from "../components/VideoPlayer";
import ChatBox from "../components/ChatBox";

export default function Home() {
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
  } = useWebRTC();

  // Mobile tab state: 'video' or 'chat'
  const [mobileTab, setMobileTab] = useState("video");

  console.log(
    "[PAGE] Render - status:",
    connectionStatus,
    "local:",
    !!localStream,
    "remote:",
    !!remoteStream
  );

  // Landing Page
  if (connectionStatus === "idle") {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-full shadow-lg shadow-blue-500/20 animate-pulse">
              <Video size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Random Chat
          </h1>
          <p className="text-gray-400 text-base sm:text-lg px-4">
            Connect with strangers worldwide for random video and text chats.
          </p>
          <button
            onClick={startSearch}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-2"
          >
            <MonitorPlay size={24} />
            Start Video Chat
          </button>
          <div className="text-sm text-gray-500">100+ users online now</div>
        </div>
      </div>
    );
  }

  // Chat View
  return (
    <div className="h-screen bg-gray-950 text-white overflow-hidden flex flex-col">
      {/* Header - Compact on mobile */}
      <header className="h-14 sm:h-16 border-b border-gray-800 flex items-center justify-between px-3 sm:px-6 bg-gray-950 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Video className="text-blue-500" size={20} />
          <span className="font-bold text-lg sm:text-xl hidden sm:inline">
            RandomChat
          </span>
        </div>

        {/* Status + Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Connection Status */}
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
            title="Stop Chat"
          >
            <XCircle size={18} />
          </button>
          <button
            onClick={startSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 transition-colors"
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">Next</span>
          </button>
        </div>
      </header>

      {/* Main Content - Responsive Layout */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Video Area */}
        <div className="flex flex-1 relative bg-black p-2 sm:p-4">
          <div className="w-full h-full relative rounded-xl sm:rounded-2xl overflow-hidden border border-gray-800">
            {/* Remote Video (Main) */}
            <VideoPlayer
              stream={remoteStream}
              label="Remote User"
              muted={false}
            />

            {/* Overlays for states */}
            {connectionStatus === "searching" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
                <div className="text-center space-y-4 px-4">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-white mx-auto"></div>
                  <p className="text-lg sm:text-xl font-medium">
                    Looking for someone...
                  </p>
                  {socketId && (
                    <p className="text-xs text-gray-500 font-mono">
                      Your ID: {socketId.slice(0, 12)}...
                    </p>
                  )}
                </div>
              </div>
            )}

            {connectionStatus === "disconnected" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
                <div className="text-center space-y-4 px-4">
                  <p className="text-lg sm:text-xl font-medium">
                    Your partner disconnected.
                  </p>
                  <button
                    onClick={startSearch}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium"
                  >
                    Find New Partner
                  </button>
                </div>
              </div>
            )}

            {/* Local Video (PiP) - Smaller on mobile */}
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-24 h-18 sm:w-36 sm:h-28 md:w-48 md:h-36 bg-gray-900 rounded-lg sm:rounded-xl overflow-hidden shadow-2xl border border-gray-700 z-20">
              <VideoPlayer
                stream={localStream}
                label="You"
                muted={true}
                isLocal={true}
              />
            </div>
          </div>
        </div>

        {/* Chat Area */}
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
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden flex border-t border-gray-800 bg-gray-900 shrink-0">
        <button
          onClick={() => setMobileTab("video")}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
            mobileTab === "video"
              ? "text-blue-500 bg-blue-500/10"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <VideoIcon size={20} />
          <span className="text-xs font-medium">Video</span>
        </button>
        <button
          onClick={() => setMobileTab("chat")}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors relative ${
            mobileTab === "chat"
              ? "text-blue-500 bg-blue-500/10"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <MessageCircle size={20} />
          <span className="text-xs font-medium">Chat</span>
          {/* Unread indicator */}
          {mobileTab !== "chat" && chatHistory.length > 0 && (
            <span className="absolute top-2 right-1/4 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>
      </nav>

      {/* Mobile Debug Footer - only show on video tab */}
      {mobileTab === "video" && (
        <div className="md:hidden border-t border-gray-800 px-3 py-1.5 bg-gray-950 text-[10px] font-mono flex justify-between shrink-0">
          <span>
            <span className="text-gray-500">Me:</span>{" "}
            <span className="text-green-400">
              {socketId?.slice(0, 10) || "..."}
            </span>
          </span>
          <span>
            <span className="text-gray-500">Peer:</span>{" "}
            <span className="text-blue-400">
              {partnerId?.slice(0, 10) || "..."}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
