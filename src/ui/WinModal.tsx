import React from 'react';
import { Sparkles, ArrowRight, RotateCcw, Home, Award } from 'lucide-react';
import { sound } from '../audio/soundManager';

interface WinModalProps {
  levelNumber: number;
  starsEarned: number;
  coinsCollected: number;
  totalCoins: number;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onOpenRenovation: () => void;
}

export const WinModal: React.FC<WinModalProps> = ({
  levelNumber,
  starsEarned,
  coinsCollected,
  totalCoins,
  hasNextLevel,
  onNextLevel,
  onReplay,
  onOpenRenovation,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-6 text-center shadow-2xl shadow-amber-500/20">
        {/* Glow Header */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black px-6 py-2 rounded-full text-sm uppercase tracking-wider shadow-lg flex items-center gap-1.5 border border-amber-300">
          <Sparkles className="w-4 h-4 fill-slate-950" />
          <span>Stage Clear!</span>
        </div>

        {/* Stars Celebration */}
        <div className="flex justify-center items-center gap-3 mt-6 mb-4">
          {[1, 2, 3].map((starIndex) => {
            const hasStar = starIndex <= starsEarned;
            return (
              <div
                key={starIndex}
                className={`transition-all duration-300 transform ${
                  hasStar ? 'scale-115' : 'scale-90 opacity-40'
                }`}
              >
                <Award
                  className={`w-9 h-9 ${
                    hasStar
                      ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_14px_rgba(251,191,36,0.9)]'
                      : 'text-slate-600 fill-slate-800'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Level Stats */}
        <h2 className="text-2xl font-black text-white tracking-tight mb-1">
          Level {levelNumber} Complete
        </h2>
        <p className="text-sm text-slate-300 mb-5">
          {starsEarned === 3
            ? 'Flawless flow! The quay is thriving.'
            : starsEarned === 2
            ? 'Great catch! Almost every coin collected.'
            : 'Good work! Enough gold to restore the quay.'}
        </p>

        {/* Coins Reward Card */}
        <div className="bg-amber-950/50 border border-amber-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪙</span>
            <div className="text-left">
              <div className="text-xs text-amber-200/70 font-semibold uppercase">Gold Earned</div>
              <div className="text-xl font-black text-amber-300">+{coinsCollected} Coins</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Captured</div>
            <div className="text-sm font-bold text-white">
              {Math.round((coinsCollected / totalCoins) * 100)}%
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {hasNextLevel ? (
            <button
              onClick={() => {
                sound.playTap();
                onNextLevel();
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl shadow-lg shadow-teal-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              <span>Next Puzzle</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => {
                sound.playTap();
                onOpenRenovation();
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              <Sparkles className="w-5 h-5 fill-slate-950" />
              <span>Restore the Room!</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                sound.playTap();
                onOpenRenovation();
              }}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl border border-amber-500/30 text-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Renovate Room</span>
            </button>

            <button
              onClick={() => {
                sound.playTap();
                onReplay();
              }}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 text-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Play Again</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
