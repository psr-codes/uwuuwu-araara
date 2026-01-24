"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Video, Mic, MessageSquare, ArrowLeft, Loader2 } from "lucide-react";
import TopicSelector from "../../components/TopicSelector";
import { useVisitTracker } from "../../hooks/useVisitTracker";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

const MODE_CONFIG = {
  video: {
    icon: Video,
    label: "Video Chat",
    description: "Face-to-face with camera",
    bgClass: "from-blue-500 to-blue-600",
    hoverClass: "hover:shadow-blue-500/30",
  },
  audio: {
    icon: Mic,
    label: "Audio Chat",
    description: "Voice only, no video",
    bgClass: "from-purple-500 to-purple-600",
    hoverClass: "hover:shadow-purple-500/30",
  },
  text: {
    icon: MessageSquare,
    label: "Text Chat",
    description: "Classic text messaging",
    bgClass: "from-green-500 to-green-600",
    hoverClass: "hover:shadow-green-500/30",
  },
};

export default function ChannelPage() {
  const params = useParams();
  const router = useRouter();
  const channelId = params.channel;

  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState(["casual"]);

  useVisitTracker(`/${channelId}`);

  // Fetch channel info
  useEffect(() => {
    fetch(`${SOCKET_URL}/api/channels`)
      .then((res) => res.json())
      .then((channels) => {
        const found = channels.find((c) => c.id === channelId);
        if (found) {
          setChannel(found);
        } else {
          // Channel not found, redirect to home
          router.push("/");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load channel:", err);
        setLoading(false);
      });
  }, [channelId, router]);

  const handleModeSelect = (mode) => {
    // Store selected topics in sessionStorage for the chat page
    sessionStorage.setItem("selectedChannel", channelId);
    sessionStorage.setItem("selectedTopics", JSON.stringify(selectedTopics));
    router.push(`/${channelId}/chat/${mode}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!channel) {
    return null; // Will redirect
  }

  return (
    <div
      className="min-h-screen bg-gray-950 text-white"
      style={{
        backgroundImage: channel.backgroundImage
          ? `linear-gradient(to bottom, rgba(3, 7, 18, 0.9), rgba(3, 7, 18, 0.98)), url(${channel.backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Accent glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top, ${channel.accentColor}15, transparent 50%)`,
        }}
      />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Back to Channels</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-12 sm:py-20">
        {/* Channel Header */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl text-4xl mb-6 shadow-2xl"
            style={{ backgroundColor: `${channel.accentColor}30` }}
          >
            {channel.icon}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">
            {channel.name}
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            {channel.description}
          </p>
        </div>

        {/* Topic Selection */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">🏷️ Select Topics</h2>
            <span className="text-sm text-gray-500">
              Match with similar interests
            </span>
          </div>
          <TopicSelector
            selectedTopics={selectedTopics}
            onTopicsChange={setSelectedTopics}
            disabled={false}
          />
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(MODE_CONFIG).map(([mode, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={mode}
                onClick={() => handleModeSelect(mode)}
                className={`group relative bg-gradient-to-br ${config.bgClass} rounded-2xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl ${config.hoverClass}`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                    <Icon size={28} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">{config.label}</h3>
                  <p className="text-sm text-white/70">{config.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Topics Preview */}
        {selectedTopics.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Matching with:{" "}
            {selectedTopics.map((t, i) => (
              <span key={t} className="text-gray-300">
                {t}
                {i < selectedTopics.length - 1 ? ", " : ""}
              </span>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
