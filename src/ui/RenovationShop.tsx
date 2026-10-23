import React, { useState } from 'react';
import { Sparkles, Check, X, ArrowLeft } from 'lucide-react';
import { RENOVATION_ITEMS } from '../game/levels';
import { RenovationItem } from '../game/types';
import { sound } from '../audio/soundManager';

interface RenovationShopProps {
  bankCoins: number;
  renovations: Record<string, boolean>;
  onBuyRenovation: (item: RenovationItem) => boolean;
  onClose: () => void;
}

export const RenovationShop: React.FC<RenovationShopProps> = ({
  bankCoins,
  renovations,
  onBuyRenovation,
  onClose,
}) => {
  const [justPurchasedId, setJustPurchasedId] = useState<string | null>(null);

  const purchasedCount = Object.values(renovations).filter(Boolean).length;
  const totalCount = RENOVATION_ITEMS.length;
  const progressPercent = Math.round((purchasedCount / totalCount) * 100);

  const handlePurchase = (item: RenovationItem) => {
    if (bankCoins < item.cost || renovations[item.id]) return;
    const success = onBuyRenovation(item);
    if (success) {
      sound.playRenovateChime();
      setJustPurchasedId(item.id);
      setTimeout(() => setJustPurchasedId(null), 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playTap();
                onClose();
              }}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-1.5">
                <span>Quay Restoration</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <div className="text-xs text-slate-400">Transform the dilapidated loft</div>
            </div>
          </div>

          {/* Current Coin Balance */}
          <div className="flex items-center gap-1.5 bg-amber-950/80 px-3 py-1.5 rounded-full border border-amber-500/40 text-amber-300 font-black text-sm">
            <span>🪙</span>
            <span>{bankCoins}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 mb-4 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-slate-300">Renovation Progress</span>
            <span className="text-amber-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Renovation Items List */}
        <div className="overflow-y-auto space-y-3 pr-1 flex-1">
          {RENOVATION_ITEMS.map((item) => {
            const isOwned = !!renovations[item.id];
            const canAfford = bankCoins >= item.cost;
            const isSparkling = justPurchasedId === item.id;

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                  isSparkling
                    ? 'bg-amber-500/20 border-amber-400 scale-[1.02] shadow-lg shadow-amber-500/20'
                    : isOwned
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400'
                    : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                {/* Item Icon & Description */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${
                      isOwned
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-amber-300'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-1.5">
                      {item.name}
                      {isOwned && (
                        <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded font-semibold">
                          Restored
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-300/80 leading-relaxed max-w-[210px] mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </div>

                {/* Purchase Action */}
                <div>
                  {isOwned ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePurchase(item)}
                      disabled={!canAfford}
                      className={`px-3 py-2 rounded-xl font-black text-xs flex items-center gap-1 cursor-pointer transition-all ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60 border border-slate-700'
                      }`}
                    >
                      <span>🪙</span>
                      <span>{item.cost}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Back to Game Button */}
        <div className="pt-4 mt-2 border-t border-slate-800">
          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
          >
            Back to Quay
          </button>
        </div>
      </div>
    </div>
  );
};
