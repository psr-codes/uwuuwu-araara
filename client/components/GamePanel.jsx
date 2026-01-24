"use client";

import { useState } from "react";
import { X, Gamepad2, Trophy } from "lucide-react";
import TicTacToe from "./games/TicTacToe";

const GAME_COMPONENTS = { tictactoe: TicTacToe };
const GAME_NAMES = { tictactoe: "Tic Tac Toe" };

export default function GamePanel({ gameId, isMyTurn, lastGameAction, sendGameAction, onEndGame, socketId, gameStats, recordGameResult, hideHeader = false }) {
  const [showStatsTooltip, setShowStatsTooltip] = useState(false);
  const GameComponent = GAME_COMPONENTS[gameId];
  const gameName = GAME_NAMES[gameId] || gameId;

  if (!GameComponent) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-xl">Game not found: {gameId}</p>
          <button onClick={() => onEndGame("error")} className="mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg">Exit</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
      {/* Game Header - Hidden when using external GameHeaderBar */}
      {!hideHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-950">
          <div className="flex items-center gap-3">
            <Gamepad2 className="text-purple-400" size={20} />
            <span className="font-semibold text-white">{gameName}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isMyTurn ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
              {isMyTurn ? "Your Turn" : "Opponent's Turn"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {/* Game Stats with Hover Tooltip */}
            {gameStats && (
              <div 
                className="relative"
                onMouseEnter={() => setShowStatsTooltip(true)}
                onMouseLeave={() => setShowStatsTooltip(false)}
              >
                <div className="hidden sm:flex items-center gap-3 text-xs cursor-pointer hover:bg-gray-800 px-2 py-1 rounded-lg transition-colors">
                  <span className="text-green-400">You: {gameStats.myWins}</span>
                  <span className="text-gray-500">-</span>
                  <span className="text-red-400">Partner: {gameStats.partnerWins}</span>
                  {gameStats.draws > 0 && <span className="text-yellow-400">Draws: {gameStats.draws}</span>}
                </div>
                
                {/* Hover Tooltip */}
                {showStatsTooltip && gameStats.gamesPlayed.length > 0 && (
                  <div className="absolute top-full right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-4 z-50 min-w-[220px]">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
                      <Trophy size={16} className="text-yellow-400" />
                      <span className="font-medium text-white text-sm">Game History</span>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {gameStats.gamesPlayed.slice().reverse().map((game, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">{GAME_NAMES[game.gameId] || game.gameId}</span>
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            game.result === "win" ? "bg-green-500/20 text-green-400" :
                            game.result === "loss" ? "bg-red-500/20 text-red-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {game.result === "win" ? "You Won 🎉" : game.result === "loss" ? "Partner Won" : "Draw 🤝"}
                          </span>
                        </div>
                      ))}
                    </div>
                    {gameStats.gamesPlayed.length === 0 && (
                      <p className="text-gray-500 text-xs text-center">No games played yet</p>
                    )}
                  </div>
                )}
              </div>
            )}
            <button onClick={() => onEndGame("forfeit")} className="text-gray-400 hover:text-red-400 transition-colors p-1" title="End Game">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Game Content */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <GameComponent
          isMyTurn={isMyTurn}
          lastGameAction={lastGameAction}
          sendGameAction={sendGameAction}
          onEndGame={onEndGame}
          socketId={socketId}
          recordGameResult={recordGameResult}
        />
      </div>
    </div>
  );
}
