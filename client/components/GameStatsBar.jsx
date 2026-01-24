"use client";

import { useState } from "react";
import { Gamepad2, Trophy, ChevronUp, ChevronDown } from "lucide-react";

const GAME_NAMES = { tictactoe: "Tic Tac Toe" };
const AVAILABLE_GAMES = [
  { id: "tictactoe", name: "Tic Tac Toe", icon: "🎮" },
];

/**
 * GameStatsBar - Shows game stats and invitation even when not playing
 * Displays persistently at the bottom of the video/media area
 */
export default function GameStatsBar({ 
  gameStats, 
  onRequestGame,
  isConnected = false,
  gameStatus = null 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showGameMenu, setShowGameMenu] = useState(false);
  
  const totalGames = gameStats?.gamesPlayed?.length || 0;
  const hasStats = totalGames > 0 || gameStats?.myWins > 0 || gameStats?.partnerWins > 0;

  // If waiting for game response
  if (gameStatus === "pending") {
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          <Gamepad2 className="text-purple-400 animate-pulse" size={18} />
          <span className="text-sm text-gray-300">Waiting for partner to accept...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-800">
      {/* Main Bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Gamepad2 className="text-purple-400" size={18} />
            <span className="text-xs sm:text-sm font-medium text-gray-200">Games</span>
          </div>
          
          {/* Quick Stats */}
          {hasStats ? (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
              <span className="px-1.5 sm:px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                W: {gameStats.myWins}
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                L: {gameStats.partnerWins}
              </span>
              {gameStats.draws > 0 && (
                <span className="px-1.5 sm:px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full hidden sm:inline-block">
                  D: {gameStats.draws}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-500 hidden sm:inline">No games yet</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* History Toggle */}
          {hasStats && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors hidden sm:block"
              title="Game History"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          )}

          {/* Play Button with dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowGameMenu(!showGameMenu)}
              disabled={!isConnected}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <span>🎮</span>
              <span>Play</span>
            </button>
            
            {/* Game Selection Dropdown */}
            {showGameMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50 min-w-[140px]">
                {AVAILABLE_GAMES.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => {
                      onRequestGame(game.id);
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
        </div>
      </div>

      {/* Expanded History */}
      {isExpanded && hasStats && (
        <div className="px-4 pb-3 pt-1 border-t border-gray-800/50">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={14} className="text-yellow-400" />
            <span className="text-xs font-medium text-gray-300">Recent Games</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {gameStats.gamesPlayed.slice(-5).reverse().map((game, idx) => (
              <div
                key={idx}
                className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1.5 ${
                  game.result === "win"
                    ? "bg-green-500/20 text-green-400"
                    : game.result === "loss"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                <span>{GAME_NAMES[game.gameId] || game.gameId}</span>
                <span>
                  {game.result === "win" ? "✓" : game.result === "loss" ? "✗" : "−"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

