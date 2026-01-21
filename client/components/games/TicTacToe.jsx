"use client";

import { useState, useEffect, useCallback } from "react";

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6], // diagonals
];

function checkWinner(board) {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  if (board.every((cell) => cell !== null)) return { winner: "draw", line: [] };
  return null;
}

export default function TicTacToe({ isMyTurn, lastGameAction, sendGameAction, onEndGame, recordGameResult }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [mySymbol, setMySymbol] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [winningLine, setWinningLine] = useState([]);

  useEffect(() => {
    if (mySymbol === null && isMyTurn) setMySymbol("X");
  }, [isMyTurn, mySymbol]);

  useEffect(() => {
    if (lastGameAction?.payload?.type === "move") {
      const { cellIndex, symbol } = lastGameAction.payload;
      if (mySymbol === null) setMySymbol(symbol === "X" ? "O" : "X");
      setBoard((prev) => {
        const newBoard = [...prev];
        if (newBoard[cellIndex] === null) newBoard[cellIndex] = symbol;
        return newBoard;
      });
    }
    if (lastGameAction?.payload?.type === "reset") {
      setBoard(Array(9).fill(null));
      setGameResult(null);
      setWinningLine([]);
    }
  }, [lastGameAction, mySymbol]);

  useEffect(() => {
    const result = checkWinner(board);
    if (result) {
      setWinningLine(result.line);
      if (result.winner === "draw") {
        setGameResult({ winner: null, isDraw: true, isWin: false });
        recordGameResult?.("draw", "tictactoe");
      } else {
        const isWin = result.winner === mySymbol;
        setGameResult({ winner: result.winner, isDraw: false, isWin });
        recordGameResult?.(isWin ? "win" : "loss", "tictactoe");
      }
    }
  }, [board, mySymbol, recordGameResult]);

  const handleCellClick = useCallback((index) => {
    if (!isMyTurn || board[index] !== null || gameResult) return;
    const symbol = mySymbol || "X";
    setBoard((prev) => { const n = [...prev]; n[index] = symbol; return n; });
    sendGameAction({ type: "move", cellIndex: index, symbol });
  }, [isMyTurn, board, gameResult, mySymbol, sendGameAction]);

  const handlePlayAgain = () => {
    setBoard(Array(9).fill(null));
    setGameResult(null);
    setWinningLine([]);
    sendGameAction({ type: "reset" });
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-gray-400 text-sm mb-1">You are</p>
        <p className={`text-4xl font-bold ${mySymbol === "X" ? "text-blue-400" : "text-pink-400"}`}>{mySymbol || "?"}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-gray-800 p-2 rounded-xl">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleCellClick(index)}
            disabled={!isMyTurn || cell !== null || gameResult !== null}
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-lg text-4xl sm:text-5xl font-bold transition-all duration-200
              ${cell === null && isMyTurn && !gameResult ? "bg-gray-700 hover:bg-gray-600 cursor-pointer" : "bg-gray-700 cursor-not-allowed"}
              ${winningLine.includes(index) ? "ring-2 ring-yellow-400 bg-yellow-500/20" : ""}
              ${cell === "X" ? "text-blue-400" : ""} ${cell === "O" ? "text-pink-400" : ""}`}
          >
            {cell}
          </button>
        ))}
      </div>

      {gameResult ? (
        <div className="text-center space-y-4">
          <p className={`text-2xl font-bold ${gameResult.isDraw ? "text-yellow-400" : gameResult.isWin ? "text-green-400" : "text-red-400"}`}>
            {gameResult.isDraw ? "It's a Draw! 🤝" : gameResult.isWin ? "You Win! 🎉" : "You Lose! 😢"}
          </p>
          <div className="flex gap-3">
            <button onClick={handlePlayAgain} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium">Play Again</button>
            <button onClick={() => onEndGame("completed")} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium">Exit Game</button>
          </div>
        </div>
      ) : (
        <p className="text-gray-400">{isMyTurn ? "Your turn! Tap a cell." : "Waiting for opponent..."}</p>
      )}
    </div>
  );
}
