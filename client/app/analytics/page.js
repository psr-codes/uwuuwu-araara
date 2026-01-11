"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  Users,
  Eye,
  Video,
  Mic,
  MessageSquare,
  Home,
  RefreshCw,
} from "lucide-react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5001";

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/analytics/stats`);
      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ icon: Icon, label, value, color, subValue }) => (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value ?? "—"}</p>
          {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800/50 backdrop-blur-sm sticky top-0 z-10 bg-gray-950/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Home size={20} />
              </Link>
              <div className="w-px h-6 bg-gray-700" />
              <div className="flex items-center gap-2">
                <BarChart3 className="text-blue-500" size={24} />
                <span className="text-xl font-bold">Analytics</span>
              </div>
            </div>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Last Updated */}
        {lastUpdated && (
          <p className="text-sm text-gray-500 mb-6">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}

        {/* Overview Stats */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 text-gray-300">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              icon={Eye}
              label="Total Visits"
              value={stats?.totalVisits?.toLocaleString()}
              color="bg-blue-600"
            />
            <StatCard
              icon={Users}
              label="Total Connections"
              value={stats?.totalConnections?.toLocaleString()}
              color="bg-green-600"
              subValue="Successful matches"
            />
            <StatCard
              icon={Users}
              label="Active Now"
              value="—"
              color="bg-purple-600"
              subValue="Coming soon"
            />
          </div>
        </section>

        {/* Connections by Mode */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 text-gray-300">
            Connections by Mode
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={Video}
              label="Video Chats"
              value={stats?.connectionsByMode?.video?.toLocaleString() ?? 0}
              color="bg-blue-500"
            />
            <StatCard
              icon={Mic}
              label="Audio Chats"
              value={stats?.connectionsByMode?.audio?.toLocaleString() ?? 0}
              color="bg-purple-500"
            />
            <StatCard
              icon={MessageSquare}
              label="Text Chats"
              value={stats?.connectionsByMode?.text?.toLocaleString() ?? 0}
              color="bg-green-500"
            />
          </div>
        </section>

        {/* Connection Distribution */}
        {stats?.totalConnections > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 text-gray-300">
              Connection Distribution
            </h2>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-6">
              <div className="flex gap-2 h-8 rounded-lg overflow-hidden">
                {Object.entries(stats?.connectionsByMode || {}).map(
                  ([mode, count]) => {
                    const percentage = (count / stats.totalConnections) * 100;
                    const colors = {
                      video: "bg-blue-500",
                      audio: "bg-purple-500",
                      text: "bg-green-500",
                    };
                    return (
                      <div
                        key={mode}
                        className={`${colors[mode]} flex items-center justify-center text-xs font-medium`}
                        style={{ width: `${percentage}%` }}
                        title={`${mode}: ${count} (${percentage.toFixed(1)}%)`}
                      >
                        {percentage > 10 && `${percentage.toFixed(0)}%`}
                      </div>
                    );
                  }
                )}
              </div>
              <div className="flex gap-6 mt-4">
                {Object.entries(stats?.connectionsByMode || {}).map(
                  ([mode, count]) => {
                    const colors = {
                      video: "bg-blue-500",
                      audio: "bg-purple-500",
                      text: "bg-green-500",
                    };
                    return (
                      <div key={mode} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${colors[mode]}`} />
                        <span className="text-sm text-gray-400 capitalize">
                          {mode}: {count}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
