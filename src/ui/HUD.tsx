import React, { useEffect, useState } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Layers,
  Box,
  BookOpen,
  Camera,
  Video,
  Globe,
  Compass,
} from 'lucide-react';
import { CameraPreset } from '../game/narrativeTypes';
import { sound } from '../audio/soundManager';

interface HUDProps {
  levelNumber: number;
  levelName: string;
  tutorialHint?: string;
  coinsInJar: number;
  totalCoins: number;
  bankCoins: number;
  currentStars: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onRestart: () => void;
  onOpenLevelSelect: () => void;
  onOpenRenovation: () => void;
  onOpenAssetPipeline: () => void;
  onOpenStory: () => void;
  cameraMode: CameraPreset;
  onSelectCameraMode: (mode: CameraPreset) => void;
  hasPendingDecision?: boolean;
  showDebug?: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  levelNumber,
  levelName,
  tutorialHint,
  coinsInJar,
  totalCoins,
  bankCoins,
  currentStars,
  isMuted,
  onToggleMute,
  onRestart,
  onOpenLevelSelect,
  onOpenRenovation,
  onOpenAssetPipeline,
  onOpenStory,
  cameraMode,
  onSelectCameraMode,
  hasPendingDecision = false,
  showDebug = false,
}) => {
  const [popCounter, setPopCounter] = useState(false);
  const [fps, setFps] = useState(60);

  // Trigger bounce animation when coins increment
  useEffect(() => {
    if (coinsInJar > 0) {
      setPopCounter(true);
      const timer = setTimeout(() => setPopCounter(false), 160);
      return () => clearTimeout(timer);
    }
  }, [coinsInJar]);

  // FPS calculation for debug mode
  useEffect(() => {
    if (!showDebug) return;
    let frames = 0;
    let lastTime = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      setFps(Math.round(frames / delta));
      frames = 0;
      lastTime = now;
    }, 500);

    const frameLoop = () => {
      frames++;
      reqId = requestAnimationFrame(frameLoop);
    };
    let reqId = requestAnimationFrame(frameLoop);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(reqId);
    };
  }, [showDebug]);

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 select-none z-10">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full max-w-lg mx-auto">
        {/* Level badge */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-500/30 shadow-lg text-white">
          <button
            onClick={() => {
              sound.playTap();
              onOpenLevelSelect();
            }}
            className="flex items-center gap-1.5 hover:text-amber-300 transition-colors cursor-pointer"
            title="Select Level"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm tracking-wide">Level {levelNumber}</span>
          </button>

          {/* Star rating preview */}
          <div className="flex items-center gap-0.5 ml-1">
            {[1, 2, 3].map((star) => (
              <span
                key={star}
                className={`text-xs transition-transform duration-200 ${
                  star <= currentStars ? 'text-amber-400 font-bold scale-110' : 'text-slate-600'
                }`}
              >
                {star <= currentStars ? '★' : '☆'}
              </span>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          {/* Story Decisions / Chronicles Button */}
          <button
            onClick={() => {
              sound.playTap();
              onOpenStory();
            }}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg active:scale-95 transition-all cursor-pointer text-xs font-bold border ${
              hasPendingDecision
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/40 animate-pulse'
                : 'bg-slate-900/85 hover:bg-slate-800 text-amber-300 border-amber-500/40'
            }`}
            title="Open Chronicles & Story Choices"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Story</span>
            {hasPendingDecision && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white" />
            )}
          </button>

          {/* 3D Asset Pipeline Inspector Button */}
          <button
            onClick={() => {
              sound.playTap();
              onOpenAssetPipeline();
            }}
            className="flex items-center gap-1.5 bg-slate-900/85 hover:bg-slate-800 text-teal-300 border border-teal-500/40 font-bold px-2.5 sm:px-3 py-1.5 rounded-full shadow-lg active:scale-95 transition-all cursor-pointer text-xs"
            title="Open Low-Poly 3D Asset Pipeline Inspector"
          >
            <Box className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">3D</span>
            <span>Assets</span>
          </button>

          {/* Renovation Shop Button */}
          <button
            onClick={() => {
              sound.playTap();
              onOpenRenovation();
            }}
            className="relative flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-2.5 sm:px-3 py-1.5 rounded-full shadow-lg shadow-amber-500/20 active:scale-95 transition-transform cursor-pointer text-xs"
            title="Room Renovation"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Room</span>
            <span className="bg-amber-950/40 text-amber-100 px-1.5 py-0.5 rounded-full text-[10px]">
              🪙 {bankCoins}
            </span>
          </button>

          {/* Restart Level */}
          <button
            onClick={() => {
              sound.playTap();
              onRestart();
            }}
            className="p-2 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700 active:scale-90 transition-transform cursor-pointer"
            title="Restart Level"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Audio Toggle */}
          <button
            onClick={() => {
              sound.playTap();
              onToggleMute();
            }}
            className="p-2 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700 active:scale-90 transition-transform cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Floating Dynamic Camera System Switcher */}
      <div className="pointer-events-auto absolute top-16 right-4 flex items-center bg-slate-900/85 backdrop-blur-md p-1 rounded-2xl border border-slate-700/70 shadow-xl">
        <button
          onClick={() => {
            sound.playTap();
            onSelectCameraMode('gameplay');
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            cameraMode === 'gameplay'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Gameplay Focused Camera Angle"
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Play</span>
        </button>

        <button
          onClick={() => {
            sound.playTap();
            onSelectCameraMode('cinematic');
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            cameraMode === 'cinematic'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Cinematic Third-Person Perspective"
        >
          <Video className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cinematic</span>
        </button>

        <button
          onClick={() => {
            sound.playTap();
            onSelectCameraMode('strategic');
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            cameraMode === 'strategic'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Strategic Overhead Cutaway View"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Overhead</span>
        </button>
      </div>

      {/* Tutorial / Level Subtitle Hint */}
      {tutorialHint && (
        <div className="w-full max-w-sm mx-auto text-center pointer-events-none mt-2">
          <div className="inline-block bg-slate-900/85 backdrop-blur-md px-4 py-1.5 rounded-full border border-teal-500/40 shadow-lg text-teal-200 text-xs font-medium animate-pulse">
            💡 {tutorialHint}
          </div>
        </div>
      )}

      {/* Floating Dynamic Jar Coin Counter (Positioned beside the 3D Jar!) */}
      <div className="absolute bottom-[20%] left-[52%] -translate-x-1/2 pointer-events-none">
        <div
          className={`flex items-center gap-1.5 bg-amber-950/85 backdrop-blur-md px-3.5 py-1 rounded-full border border-amber-400/70 shadow-xl shadow-amber-500/25 transition-transform duration-150 ${
            popCounter ? 'scale-125 bg-amber-900 border-amber-300' : 'scale-100'
          }`}
        >
          <span className="text-lg">🪙</span>
          <span className="text-amber-300 font-black text-lg tracking-tight">
            {coinsInJar}
          </span>
          <span className="text-amber-200/50 text-xs font-bold">
            / {totalCoins}
          </span>
        </div>
      </div>

      {/* Bottom Info / Debug / Build version */}
      <div className="flex items-end justify-between w-full max-w-lg mx-auto text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="bg-slate-950/60 px-2.5 py-1 rounded backdrop-blur border border-slate-800">
            <span className="text-slate-300 font-semibold">{levelName}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">v1.0.4-lq</span>
        </div>

        {showDebug && (
          <div className="bg-slate-950/80 px-2.5 py-1 rounded text-emerald-400 font-mono text-[11px] border border-emerald-500/40">
            {fps} FPS | Matter.js 2D | Three.js 3D
          </div>
        )}
      </div>
    </div>
  );
};
