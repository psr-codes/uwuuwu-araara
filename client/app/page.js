"use client";

import Link from "next/link";
import {
  Video,
  Mic,
  MessageSquare,
  Sparkles,
  Users,
  Shield,
  Zap,
} from "lucide-react";
import { useVisitTracker } from "../hooks/useVisitTracker";

export default function Home() {
  // Track visit to landing page
  useVisitTracker("/");
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-600/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-600/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl">
                <Sparkles size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                RandomChat
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                2.4k online
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          {/* Hero Text */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">
                Connect with strangers
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                instantly
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
              Choose your way to meet new people from around the world. Video,
              audio, or text — the choice is yours.
            </p>
          </div>

          {/* Chat Mode Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
            {/* Video Chat Card */}
            <Link href="/chat/video" className="group">
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-blue-500/25">
                    <Video size={28} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Video Chat</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Face-to-face conversations with video, audio, and text
                    messaging.
                  </p>
                  <div className="flex items-center gap-2 text-blue-400 text-sm font-medium group-hover:gap-3 transition-all">
                    Start Video Chat
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Audio Chat Card */}
            <Link href="/chat/audio" className="group">
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-purple-500/25">
                    <Mic size={28} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Audio Chat</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Voice conversations without video. Perfect for on-the-go
                    chats.
                  </p>
                  <div className="flex items-center gap-2 text-purple-400 text-sm font-medium group-hover:gap-3 transition-all">
                    Start Audio Chat
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Text Chat Card */}
            <Link href="/chat/text" className="group">
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-green-500/25">
                    <MessageSquare size={28} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Text Chat</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Classic text messaging. Quick, anonymous, and easy to use.
                  </p>
                  <div className="flex items-center gap-2 text-green-400 text-sm font-medium group-hover:gap-3 transition-all">
                    Start Text Chat
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Zap size={24} className="text-yellow-400" />
              </div>
              <h4 className="font-medium mb-1">Instant Matching</h4>
              <p className="text-sm text-gray-500">
                Connect in seconds with real-time queue
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Shield size={24} className="text-blue-400" />
              </div>
              <h4 className="font-medium mb-1">Anonymous</h4>
              <p className="text-sm text-gray-500">
                No registration or login required
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Users size={24} className="text-green-400" />
              </div>
              <h4 className="font-medium mb-1">Global Community</h4>
              <p className="text-sm text-gray-500">
                Meet people from around the world
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800/50 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2026 RandomChat. Connect responsibly.</p>
        </div>
      </footer>
    </div>
  );
}
