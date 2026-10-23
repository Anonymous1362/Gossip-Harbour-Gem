import React from 'react';
import { X, Lock, Star } from 'lucide-react';
import { LEVELS } from '../game/levels';
import { sound } from '../audio/soundManager';

interface LevelSelectModalProps {
  currentLevelId: number;
  unlockedLevel: number;
  levelStars: Record<number, number>;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  currentLevelId,
  unlockedLevel,
  levelStars,
  onSelectLevel,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-teal-500/40 rounded-3xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-black text-white">Select Puzzle</h2>
            <p className="text-xs text-slate-400">10 progressive pin lattice challenges</p>
          </div>
          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level Grid */}
        <div className="grid grid-cols-5 gap-2.5 max-h-[60vh] overflow-y-auto p-1">
          {LEVELS.map((level) => {
            const isUnlocked = level.id <= unlockedLevel;
            const isCurrent = level.id === currentLevelId;
            const stars = levelStars[level.id] || 0;

            return (
              <button
                key={level.id}
                disabled={!isUnlocked}
                onClick={() => {
                  sound.playTap();
                  onSelectLevel(level.id);
                  onClose();
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-teal-500 text-slate-950 border-teal-300 shadow-lg shadow-teal-500/30 scale-105 font-black'
                    : isUnlocked
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 hover:border-teal-500/50'
                    : 'bg-slate-900/60 text-slate-600 border-slate-800/80 cursor-not-allowed'
                }`}
              >
                {isUnlocked ? (
                  <>
                    <span className="text-base font-black">{level.id}</span>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3].map((s) => (
                        <span
                          key={s}
                          className={`text-[9px] ${
                            s <= stars
                              ? isCurrent
                                ? 'text-slate-950 font-bold'
                                : 'text-amber-400'
                              : isCurrent
                              ? 'text-teal-800'
                              : 'text-slate-600'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mb-1 text-slate-600" />
                    <span className="text-xs font-semibold">{level.id}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-3 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Earn 3 stars by capturing &gt;92% gold with no spills!
          </p>
        </div>
      </div>
    </div>
  );
};
