import React from 'react';
import { X, BookOpen, Award, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { STORY_BRANCHES, STORY_ENDINGS, determineEnding } from '../game/narrativeData';
import { NarrativeSaveState } from '../game/narrativeTypes';
import { sound } from '../audio/soundManager';

interface StoryLogModalProps {
  narrativeState: NarrativeSaveState;
  unlockedLevel: number;
  onOpenDecision: (branchId: string) => void;
  onClose: () => void;
}

export const StoryLogModal: React.FC<StoryLogModalProps> = ({
  narrativeState,
  unlockedLevel,
  onOpenDecision,
  onClose,
}) => {
  const ending = determineEnding(narrativeState.chosenOptions);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/40">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>The Chronicles of Lantern Quay</span>
              </h2>
              <p className="text-xs text-slate-400">Choice-based narrative tree & endings</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            aria-label="Close story log"
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Narrative Ending Banner (If completed) */}
        {ending && (
          <div className="my-3 p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-850 border border-amber-400/50 shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{ending.icon}</span>
              <div>
                <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {ending.badge}
                </span>
                <h3 className="text-base font-black text-amber-300">{ending.title}</h3>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-2">{ending.description}</p>
            <div className="text-[11px] text-amber-200/90 italic bg-amber-950/40 p-2 rounded-xl border border-amber-500/20">
              &quot;{ending.epilogue}&quot;
            </div>
          </div>
        )}

        {/* Chapter Decision Points */}
        <div className="space-y-3 overflow-y-auto flex-1 my-3 pr-1">
          {STORY_BRANCHES.map((branch) => {
            const chosenId = narrativeState.chosenOptions[branch.id];
            const choice = branch.choices.find((c) => c.id === chosenId);
            const isUnlocked = unlockedLevel >= branch.minLevelRequired;

            return (
              <div
                key={branch.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  chosenId
                    ? 'bg-slate-850/80 border-amber-500/40'
                    : isUnlocked
                    ? 'bg-slate-800/70 border-teal-500/50 ring-1 ring-teal-500/20'
                    : 'bg-slate-900/40 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                        {branch.title.split(':')[0]}
                      </span>
                      {chosenId && (
                        <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Decided</span>
                        </span>
                      )}
                      {!chosenId && isUnlocked && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold animate-pulse">
                          Decision Awaiting
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-white mt-0.5">
                      {branch.title.split(':')[1]?.trim() || branch.title}
                    </h4>
                  </div>

                  {/* Action button if ready or review */}
                  {isUnlocked && (
                    <button
                      onClick={() => {
                        sound.playTap();
                        onOpenDecision(branch.id);
                        onClose();
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                        chosenId
                          ? 'bg-slate-850 text-slate-300 hover:text-white border border-slate-700'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                      }`}
                    >
                      <span>{chosenId ? 'Re-examine' : 'Choose Path'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {choice ? (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center gap-2.5 text-xs">
                    <span className="text-xl p-1 bg-slate-900 rounded-lg">{choice.icon}</span>
                    <div>
                      <span className="font-bold text-amber-300">{choice.label}</span>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        {choice.consequences.summary}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-400 leading-relaxed">
                    {isUnlocked
                      ? branch.situation
                      : `Unlocks after clearing Level ${branch.minLevelRequired}.`}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Every choice steers Captain Maeve&apos;s story and unlocks unique visual quay transformations.
          </p>
        </div>
      </div>
    </div>
  );
};
