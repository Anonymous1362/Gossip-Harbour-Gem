import React, { useState } from 'react';
import { Sparkles, ArrowRight, Shield, Flame, Compass, CheckCircle2 } from 'lucide-react';
import { StoryBranchPoint, StoryChoice, CameraPreset } from '../game/narrativeTypes';
import { sound } from '../audio/soundManager';

interface NarrativeDecisionModalProps {
  branch: StoryBranchPoint;
  onConfirmChoice: (choice: StoryChoice) => void;
  onPreviewCamera: (preset: CameraPreset) => void;
  onClose?: () => void;
}

export const NarrativeDecisionModal: React.FC<NarrativeDecisionModalProps> = ({
  branch,
  onConfirmChoice,
  onPreviewCamera,
  onClose,
}) => {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>(branch.choices[0].id);
  const selectedChoice = branch.choices.find((c) => c.id === selectedChoiceId) || branch.choices[0];

  const handleSelect = (choice: StoryChoice) => {
    sound.playTap();
    setSelectedChoiceId(choice.id);
    onPreviewCamera(choice.visualImpact.cameraTarget);
  };

  const handleConfirm = () => {
    // Play appropriate sound effect based on choice
    if (selectedChoice.visualImpact.soundFx === 'hearth') {
      sound.playHearthFire();
    } else if (selectedChoice.visualImpact.soundFx === 'steam') {
      sound.playSteamHiss();
    } else if (selectedChoice.visualImpact.soundFx === 'bell') {
      sound.playShipBell();
    } else {
      sound.playDecisionStinger();
    }

    onConfirmChoice(selectedChoice);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl text-white flex flex-col max-h-[92vh]">
        {/* Story Chapter Header */}
        <div className="text-center pb-3 border-b border-slate-800">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[11px] font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Narrative Choice Point</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {branch.title}
          </h2>
          <p className="text-xs text-amber-200/80 mt-1 max-w-md mx-auto leading-relaxed">
            {branch.subtitle}
          </p>
        </div>

        {/* Narrative Situation Brief */}
        <div className="my-3 p-3.5 rounded-2xl bg-slate-850/70 border border-slate-800 text-xs sm:text-[13px] text-slate-300 leading-relaxed">
          {branch.situation}
        </div>

        {/* Choice Cards (At least 2-3 distinct choices) */}
        <div className="space-y-2.5 overflow-y-auto flex-1 pr-1 my-1">
          {branch.choices.map((choice) => {
            const isSelected = choice.id === selectedChoiceId;
            return (
              <div
                key={choice.id}
                onClick={() => handleSelect(choice)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-950/60 to-slate-850 border-amber-400 ring-2 ring-amber-400/30 scale-[1.01] shadow-lg shadow-amber-500/15'
                    : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-2xl p-2 rounded-xl bg-slate-900/80 border border-slate-700 flex-shrink-0">
                      {choice.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm sm:text-base text-white">
                          {choice.label}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                        )}
                      </div>
                      <div className="text-xs text-amber-300 font-semibold mt-0.5">
                        {choice.tagline}
                      </div>
                      <div className="text-xs text-slate-300/80 mt-1.5 leading-relaxed">
                        {choice.description}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Consequence Tags */}
                <div className="mt-3 pt-2.5 border-t border-slate-700/40 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 font-semibold capitalize flex items-center gap-1">
                      {choice.consequences.moralAlignment === 'compassion' && (
                        <Flame className="w-3 h-3 text-rose-400" />
                      )}
                      {choice.consequences.moralAlignment === 'industry' && (
                        <Compass className="w-3 h-3 text-teal-400" />
                      )}
                      {choice.consequences.moralAlignment === 'fortitude' && (
                        <Shield className="w-3 h-3 text-amber-400" />
                      )}
                      <span>{choice.consequences.moralAlignment} Path</span>
                    </span>
                    {choice.consequences.goldDelta && (
                      <span className="text-amber-400 font-bold font-mono">
                        +{choice.consequences.goldDelta} 🪙
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 text-[10px] italic">
                    {choice.consequences.summary}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
          {onClose && (
            <button
              onClick={() => {
                sound.playTap();
                onClose();
              }}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Decide Later
            </button>
          )}

          <button
            onClick={handleConfirm}
            className="flex-1 py-3.5 px-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <span>Confirm: {selectedChoice.label}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
