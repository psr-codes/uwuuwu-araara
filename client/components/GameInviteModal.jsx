"use client";

import { X, Check } from "lucide-react";

const GAME_INFO = {
  tictactoe: { name: "Tic Tac Toe", icon: "🎮", description: "Classic 3x3 grid game. Get three in a row to win!" },
};

export default function GameInviteModal({ gameProposal, onRespond }) {
  if (!gameProposal) return null;
  const gameInfo = GAME_INFO[gameProposal.gameId] || { name: gameProposal.gameId, icon: "🎲", description: "A fun mini-game!" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 text-4xl">
            {gameInfo.icon}
          </div>
          <h3 className="text-xl font-bold text-white">Play {gameInfo.name}?</h3>
          <p className="text-gray-400 text-sm">Your partner wants to play!<br />{gameInfo.description}</p>
          <div className="flex gap-3 pt-2">
            <button onClick={() => onRespond(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
              <X size={20} /> Decline
            </button>
            <button onClick={() => onRespond(true)} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
              <Check size={20} /> Play!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
