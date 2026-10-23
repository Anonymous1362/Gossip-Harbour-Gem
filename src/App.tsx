import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameSceneRenderer } from './render/threeScene';
import { PhysicsManager } from './game/physics';
import { LEVELS } from './game/levels';
import { LevelConfig, RenovationItem } from './game/types';
import { evaluateLevelState } from './game/rules';
import { loadSaveData, saveSaveData } from './save/storage';
import { sound } from './audio/soundManager';
import { HUD } from './ui/HUD';
import { WinModal } from './ui/WinModal';
import { RenovationShop } from './ui/RenovationShop';
import { LevelSelectModal } from './ui/LevelSelectModal';
import { AssetPipelineViewer } from './ui/AssetPipelineViewer';
import { NarrativeDecisionModal } from './ui/NarrativeDecisionModal';
import { StoryLogModal } from './ui/StoryLogModal';
import { CameraPreset, StoryBranchPoint, StoryChoice } from './game/narrativeTypes';
import { STORY_BRANCHES, determineEnding } from './game/narrativeData';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRendererRef = useRef<GameSceneRenderer | null>(null);
  const physicsManagerRef = useRef<PhysicsManager | null>(null);

  // Persistent save data
  const [saveData, setSaveData] = useState(() => loadSaveData());

  // Active level state
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const currentLevel = LEVELS[currentLevelIndex] || LEVELS[0];

  // Active game metrics (synced via physics callbacks)
  const [coinsInJar, setCoinsInJar] = useState(0);
  const [coinsSpilled, setCoinsSpilled] = useState(0);
  const [currentStars, setCurrentStars] = useState(0);
  const [isWinModalOpen, setIsWinModalOpen] = useState(false);
  const [isRenovationOpen, setIsRenovationOpen] = useState(false);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState(false);
  const [isPipelineOpen, setIsPipelineOpen] = useState(false);

  // Dynamic Camera System state
  const [cameraMode, setCameraMode] = useState<CameraPreset>('gameplay');

  // Choice-based narrative states
  const [isStoryLogOpen, setIsStoryLogOpen] = useState(false);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);

  // Audio mute state
  const [isMuted, setIsMuted] = useState(saveData.soundMuted);

  // Check URL debug flag
  const [showDebug, setShowDebug] = useState(false);

  // Calculate if any unlocked story chapters are waiting for player decision
  const pendingBranch = STORY_BRANCHES.find(
    (b) => saveData.unlockedLevel >= b.minLevelRequired && !saveData.narrative.chosenOptions[b.id]
  );
  const hasPendingDecision = !!pendingBranch;

  const handleSelectCameraMode = useCallback((mode: CameraPreset) => {
    setCameraMode(mode);
    if (sceneRendererRef.current) {
      sceneRendererRef.current.setCameraMode(mode);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') !== null) {
      setShowDebug(true);
    }
  }, []);

  // Save changes to localStorage
  const updateSave = useCallback((updater: (prev: typeof saveData) => typeof saveData) => {
    setSaveData((prev) => {
      const updated = updater(prev);
      saveSaveData(updated);
      return updated;
    });
  }, []);

  // Sound mute toggle
  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
    updateSave((prev) => ({ ...prev, soundMuted: nextMuted }));
  }, [isMuted, updateSave]);

  // Handle rod pull interaction
  const handleRodClick = useCallback((rodId: string) => {
    sound.init();
    if (physicsManagerRef.current) {
      physicsManagerRef.current.pullRod(rodId);
    }
  }, []);

  // Initialize and load level
  const startLevel = useCallback((level: LevelConfig) => {
    setCoinsInJar(0);
    setCoinsSpilled(0);
    setCurrentStars(0);
    setIsWinModalOpen(false);

    // Reset camera to gameplay focus
    handleSelectCameraMode('gameplay');

    if (physicsManagerRef.current) {
      physicsManagerRef.current.destroy();
    }

    const pm = new PhysicsManager(level, {
      onCoinCollected: (count) => {
        setCoinsInJar(count);
      },
      onCoinSpilled: (count) => {
        setCoinsSpilled(count);
      },
      onJarWobble: () => {
        if (sceneRendererRef.current) {
          sceneRendererRef.current.triggerJarWobble();
          sceneRendererRef.current.triggerCameraShake(1.5);
        }
      },
      onFlowSettled: () => {
        // Evaluate level result
        if (!physicsManagerRef.current) return;
        const inJar = physicsManagerRef.current.coinsInJarCount;
        const spilled = physicsManagerRef.current.coinsSpilledCount;
        const result = evaluateLevelState(level, inJar, spilled, level.coinCount, true);

        if (result.isWin) {
          sound.playWinArpeggio();
          if (sceneRendererRef.current) {
            sceneRendererRef.current.triggerCharacterWinBounce();
          }

          // Smoothly glide camera to cinematic third-person celebration view!
          handleSelectCameraMode('cinematic');

          // Update save data with earned stars and unlocked next stage
          updateSave((prev) => {
            const oldStars = prev.levelStars[level.id] || 0;
            const newStars = Math.max(oldStars, result.stars);
            const nextUnlock = Math.max(prev.unlockedLevel, level.id + 1);
            return {
              ...prev,
              coins: prev.coins + inJar,
              unlockedLevel: nextUnlock,
              levelStars: {
                ...prev.levelStars,
                [level.id]: newStars,
              },
            };
          });

          setCurrentStars(result.stars);
          setIsWinModalOpen(true);
        }
      },
    });

    physicsManagerRef.current = pm;

    if (sceneRendererRef.current) {
      sceneRendererRef.current.setLevel(level, pm);
      sceneRendererRef.current.applyRenovations(saveData.renovations);
    }
  }, [handleSelectCameraMode, saveData.renovations, updateSave]);

  const activeBranch = STORY_BRANCHES.find((b) => b.id === activeBranchId) || null;

  // Confirm player story choice and apply branching consequences
  const handleConfirmStoryChoice = (choice: StoryChoice) => {
    if (!activeBranchId) return;
    const branchId = activeBranchId;
    const goldEarned = choice.consequences.goldDelta || 0;

    updateSave((prev) => {
      const updatedChoices = {
        ...prev.narrative.chosenOptions,
        [branchId]: choice.id,
      };
      const ending = determineEnding(updatedChoices);
      return {
        ...prev,
        coins: prev.coins + goldEarned,
        narrative: {
          ...prev.narrative,
          chosenOptions: updatedChoices,
          activeEndingId: ending?.id,
          history: [
            ...prev.narrative.history,
            { branchId, choiceId: choice.id, timestamp: Date.now() },
          ],
        },
      };
    });

    setActiveBranchId(null);
    handleSelectCameraMode(choice.visualImpact.cameraTarget);
    if (sceneRendererRef.current) {
      sceneRendererRef.current.triggerCameraShake(4.5);
    }
  };

  // Main Three.js Scene Mounting (Mounted once)
  useEffect(() => {
    if (!containerRef.current) return;

    sound.setMuted(saveData.soundMuted);

    const renderer = new GameSceneRenderer({
      container: containerRef.current,
      onRodClick: (rodId) => {
        handleRodClick(rodId);
      },
      debug: showDebug,
    });
    sceneRendererRef.current = renderer;

    // Load initial level
    startLevel(currentLevel);

    // Physics step animation loop
    let lastTime = performance.now();
    let animId: number;

    const gameLoop = (now: number) => {
      animId = requestAnimationFrame(gameLoop);
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      if (physicsManagerRef.current) {
        physicsManagerRef.current.update(dt);
      }
    };
    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      if (physicsManagerRef.current) {
        physicsManagerRef.current.destroy();
      }
      renderer.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update level when index changes
  const switchLevel = (levelId: number) => {
    const idx = LEVELS.findIndex((l) => l.id === levelId);
    if (idx !== -1) {
      setCurrentLevelIndex(idx);
      startLevel(LEVELS[idx]);
    }
  };

  // Renovation purchase handler
  const handleBuyRenovation = (item: RenovationItem): boolean => {
    if (saveData.coins < item.cost || saveData.renovations[item.id]) {
      return false;
    }

    const updatedRenovations = {
      ...saveData.renovations,
      [item.id]: true,
    };

    updateSave((prev) => ({
      ...prev,
      coins: prev.coins - item.cost,
      renovations: updatedRenovations,
    }));

    if (sceneRendererRef.current) {
      sceneRendererRef.current.applyRenovations(updatedRenovations);
    }

    return true;
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans"
      onClick={() => sound.init()}
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Main Gameplay HUD */}
      <HUD
        levelNumber={currentLevel.id}
        levelName={currentLevel.name}
        tutorialHint={currentLevel.tutorialHint}
        coinsInJar={coinsInJar}
        totalCoins={currentLevel.coinCount}
        bankCoins={saveData.coins}
        currentStars={currentStars}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onRestart={() => startLevel(currentLevel)}
        onOpenLevelSelect={() => setIsLevelSelectOpen(true)}
        onOpenRenovation={() => setIsRenovationOpen(true)}
        onOpenAssetPipeline={() => setIsPipelineOpen(true)}
        onOpenStory={() => setIsStoryLogOpen(true)}
        cameraMode={cameraMode}
        onSelectCameraMode={handleSelectCameraMode}
        hasPendingDecision={hasPendingDecision}
        showDebug={showDebug}
      />

      {/* 3D Asset Pipeline Inspector Modal */}
      {isPipelineOpen && (
        <AssetPipelineViewer onClose={() => setIsPipelineOpen(false)} />
      )}

      {/* Level Win Modal */}
      {isWinModalOpen && (
        <WinModal
          levelNumber={currentLevel.id}
          starsEarned={currentStars}
          coinsCollected={coinsInJar}
          totalCoins={currentLevel.coinCount}
          hasNextLevel={currentLevelIndex < LEVELS.length - 1}
          onNextLevel={() => {
            const nextIdx = currentLevelIndex + 1;
            setCurrentLevelIndex(nextIdx);
            startLevel(LEVELS[nextIdx]);
          }}
          onReplay={() => startLevel(currentLevel)}
          onOpenRenovation={() => {
            setIsWinModalOpen(false);
            setIsRenovationOpen(true);
          }}
        />
      )}

      {/* Room Renovation Shop Modal */}
      {isRenovationOpen && (
        <RenovationShop
          bankCoins={saveData.coins}
          renovations={saveData.renovations}
          onBuyRenovation={handleBuyRenovation}
          onClose={() => setIsRenovationOpen(false)}
        />
      )}

      {/* Level Select Modal */}
      {isLevelSelectOpen && (
        <LevelSelectModal
          currentLevelId={currentLevel.id}
          unlockedLevel={saveData.unlockedLevel}
          levelStars={saveData.levelStars}
          onSelectLevel={switchLevel}
          onClose={() => setIsLevelSelectOpen(false)}
        />
      )}

      {/* Choice-Based Narrative Decision Modal */}
      {activeBranch && (
        <NarrativeDecisionModal
          branch={activeBranch}
          onConfirmChoice={handleConfirmStoryChoice}
          onPreviewCamera={handleSelectCameraMode}
          onClose={() => {
            setActiveBranchId(null);
            handleSelectCameraMode('gameplay');
          }}
        />
      )}

      {/* Story Chronicles Log Modal */}
      {isStoryLogOpen && (
        <StoryLogModal
          narrativeState={saveData.narrative}
          unlockedLevel={saveData.unlockedLevel}
          onOpenDecision={(branchId) => {
            setActiveBranchId(branchId);
            setIsStoryLogOpen(false);
            const b = STORY_BRANCHES.find((item) => item.id === branchId);
            if (b) handleSelectCameraMode(b.cameraPreset);
          }}
          onClose={() => setIsStoryLogOpen(false)}
        />
      )}
    </div>
  );
}
