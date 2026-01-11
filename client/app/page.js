"use client";

import { Video, MonitorPlay, UserPlus, XCircle, Bug } from "lucide-react";
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
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Random Chat
          </h1>
          <p className="text-gray-400 text-lg">
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
      {/* Header */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-950 z-10">
        <div className="flex items-center gap-2">
          <Video className="text-blue-500" size={24} />
          <span className="font-bold text-xl">RandomChat</span>
        </div>

        {/* Status + Debug Info */}
        <div className="flex items-center gap-4">
          {/* Debug Panel */}
          <div className="hidden md:flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg text-xs font-mono">
            <Bug size={14} className="text-yellow-500" />
            <span className="text-gray-400">Me:</span>
            <span className="text-green-400">
              {socketId?.slice(0, 8) || "..."}
            </span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">Peer:</span>
            <span className="text-blue-400">
              {partnerId?.slice(0, 8) || "..."}
            </span>
          </div>

          {/* Connection Status */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
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
            {connectionStatus === "connected"
              ? "Connected"
              : connectionStatus === "searching"
              ? "Searching..."
              : "Disconnected"}
          </div>

          <button
            onClick={stop}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2 rounded-lg transition-colors"
            title="Stop Chat"
          >
            <XCircle size={20} />
          </button>
          <button
            onClick={startSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <UserPlus size={16} />
            Next
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 relative bg-black p-4">
          <div className="w-full h-full relative rounded-2xl overflow-hidden border border-gray-800">
            {/* Remote Video (Main) */}
            <VideoPlayer
              stream={remoteStream}
              label="Remote User"
              muted={false}
            />

            {/* Overlays for states */}
            {connectionStatus === "searching" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                  <p className="text-xl font-medium">Looking for someone...</p>
                  {socketId && (
                    <p className="text-xs text-gray-500 font-mono">
                      Your ID: {socketId}
                    </p>
                  )}
                </div>
              </div>
            )}

            {connectionStatus === "disconnected" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
                <div className="text-center space-y-4">
                  <p className="text-xl font-medium">
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

            {/* Local Video (PiP) */}
            <div className="absolute top-4 right-4 w-48 h-36 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700 transition-all hover:scale-105 z-20">
              <VideoPlayer
                stream={localStream}
                label="You"
                muted={true}
                isLocal={true}
              />
            </div>
          </div>
        </div>

        {/* Chat Area (Sidebar) */}
        <div className="w-80 border-l border-gray-800 bg-gray-950 flex flex-col h-full">
          <ChatBox
            messages={chatHistory}
            onSendMessage={sendMessage}
            disabled={connectionStatus !== "connected"}
          />
        </div>
      </main>

      {/* Mobile Debug Footer */}
      <div className="md:hidden border-t border-gray-800 px-4 py-2 bg-gray-900 text-xs font-mono flex justify-between">
        <span>
          <span className="text-gray-500">Me:</span>{" "}
          <span className="text-green-400">
            {socketId?.slice(0, 12) || "..."}
          </span>
        </span>
        <span>
          <span className="text-gray-500">Peer:</span>{" "}
          <span className="text-blue-400">
            {partnerId?.slice(0, 12) || "..."}
          </span>
        </span>
      </div>
    </div>
  );
}
