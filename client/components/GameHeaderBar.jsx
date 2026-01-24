"use client";

import { useState } from "react";
import { Gamepad2, Trophy, X } from "lucide-react";

const GAME_NAMES = { tictactoe: "Tic Tac Toe" };
const AVAILABLE_GAMES = [
  { id: "tictactoe", name: "Tic Tac Toe", icon: "🎮" },
];

/**
 * GameHeaderBar - Unified top bar for games
 * Shows stats + play option when not playing
 * Shows game info + turn when playing
 * Hover shows game history in both scenarios
 */
export default function GameHeaderBar({
  gameStats,
  gameState,
  isMyTurn,
  onRequestGame,
  onEndGame,
  isConnected = false,
  gameStatus = null,
}) {
  const [showStatsTooltip, setShowStatsTooltip] = useState(false);
  const [showGameMenu, setShowGameMenu] = useState(false);

  const hasStats = gameStats?.myWins > 0 || gameStats?.partnerWins > 0 || gameStats?.draws > 0;
  const isPlaying = gameState?.active;
  const gameName = GAME_NAMES[gameState?.gameId] || gameState?.gameId;

  // Don't show if not connected
  if (!isConnected) return null;

  // Waiting for game acceptance
  if (gameStatus === "pending") {
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-4 py-2.5 flex items-center justify-center gap-3">
        <Gamepad2 className="text-purple-400 animate-pulse" size={18} />
        <span className="text-sm text-gray-300">Waiting for partner to accept...</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-3 sm:px-4 py-2.5 relative z-20">
      <div className="flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <Gamepad2 className="text-purple-400" size={18} />
          
          {isPlaying ? (
            <>
              <span className="font-semibold text-white text-sm sm:text-base">{gameName}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  isMyTurn
                    ? "bg-green-500/20 text-green-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {isMyTurn ? "Your Turn" : "Opponent's Turn"}
              </span>
            </>
          ) : (
            <span className="font-medium text-gray-200 text-sm">Games</span>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Stats with hover tooltip */}
          <div
            className="relative"
            onMouseEnter={() => setShowStatsTooltip(true)}
            onMouseLeave={() => setShowStatsTooltip(false)}
          >
            <div className="flex items-center gap-2 sm:gap-3 text-xs cursor-pointer hover:bg-gray-800 px-2 py-1 rounded-lg transition-colors">
              <span className="text-green-400">You: {gameStats?.myWins || 0}</span>
              <span className="text-gray-500">-</span>
              <span className="text-red-400">Partner: {gameStats?.partnerWins || 0}</span>
              {(gameStats?.draws || 0) > 0 && (
                <span className="text-yellow-400 hidden sm:inline">Draws: {gameStats?.draws}</span>
              )}
            </div>

            {/* Hover Tooltip */}
            {showStatsTooltip && (
              <div className="absolute top-full right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-4 z-[100] min-w-[220px]">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
                  <Trophy size={16} className="text-yellow-400" />
                  <span className="font-medium text-white text-sm">Game History</span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {gameStats?.gamesPlayed?.length > 0 ? (
                    gameStats.gamesPlayed.slice().reverse().slice(0, 5).map((game, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">{GAME_NAMES[game.gameId] || game.gameId}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-medium ${
                            game.result === "win"
                              ? "bg-green-500/20 text-green-400"
                              : game.result === "loss"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {game.result === "win" ? "You Won 🎉" : game.result === "loss" ? "Partner Won" : "Draw 🤝"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-xs text-center">No games played yet</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Play button or End game button */}
          {isPlaying ? (
            <button
              onClick={() => onEndGame?.("forfeit")}
              className="text-gray-400 hover:text-red-400 transition-colors p-1"
              title="End Game"
            >
              <X size={20} />
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowGameMenu(!showGameMenu)}
                className=" bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <span>🎮</span>
                <span className="hidden sm:inline">Play</span>
              </button>

              {/* Game Selection Dropdown */}
              {showGameMenu && (
                <div className="absolute top-full right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-[100] min-w-[140px]">
                  {AVAILABLE_GAMES.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => {
                        onRequestGame?.(game.id);
                        setShowGameMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center gap-2 text-sm text-white"
                    >
                      <span>{game.icon}</span>
                      <span>{game.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
