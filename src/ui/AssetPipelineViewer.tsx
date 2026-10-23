import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { X, Play, Pause, Box, Sparkles, Layers, Sliders, RefreshCw, Palette } from 'lucide-react';
import { assetPipeline } from '../render/pipeline/assetLoader';
import { AssetMetadata, AnimatedPropInstance, StaticAssetInstance } from '../render/pipeline/assetTypes';
import { LOW_POLY_PALETTE } from '../render/pipeline/palette';
import { sound } from '../audio/soundManager';

interface AssetPipelineViewerProps {
  onClose: () => void;
}

export const AssetPipelineViewer: React.FC<AssetPipelineViewerProps> = ({ onClose }) => {
  const previewCanvasRef = useRef<HTMLDivElement>(null);

  const assetList = assetPipeline.getBuiltInAssetList();
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assetList[0].id);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1.0);
  const [activeClip, setActiveClip] = useState<string>('idle');
  const [activeTab, setActiveTab] = useState<'preview' | 'palette'>('preview');

  // Three.js Previewer refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const currentAssetRef = useRef<StaticAssetInstance | AnimatedPropInstance | null>(null);
  const modelAnchorRef = useRef<THREE.Group | null>(null);

  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const activeMetadata = assetList.find((a) => a.id === selectedAssetId) || assetList[0];

  // Initialize Three.js Previewer Scene
  useEffect(() => {
    if (!previewCanvasRef.current) return;
    const container = previewCanvasRef.current;
    const w = container.clientWidth || 360;
    const h = container.clientHeight || 280;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0d14);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 1000);
    camera.position.set(0, 30, 85);
    camera.lookAt(0, 18, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const hemi = new THREE.HemisphereLight(0xfff7ed, 0x1e293b, 1.2);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.6);
    keyLight.position.set(40, 60, 40);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    fillLight.position.set(-40, 20, -30);
    scene.add(fillLight);

    // Subtle pedestal grid ring
    const gridGeo = new THREE.RingGeometry(24, 25, 32);
    gridGeo.rotateX(-Math.PI / 2);
    const gridMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.position.y = 0.1;
    scene.add(grid);

    const anchor = new THREE.Group();
    scene.add(anchor);
    modelAnchorRef.current = anchor;

    // Load active asset
    loadAssetIntoScene(selectedAssetId, anchor, scene);

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      // Update animated prop
      if (currentAssetRef.current && 'animator' in currentAssetRef.current) {
        if (isPlaying) {
          currentAssetRef.current.animator.setTimeScale(speed);
          currentAssetRef.current.animator.update(dt);
        }
      }

      // Gentle auto-turntable spin when not dragging
      if (modelAnchorRef.current && !isDraggingRef.current) {
        modelAnchorRef.current.rotation.y += 0.005;
      }

      renderer.render(scene, camera);
    };
    animId = requestAnimationFrame(loop);

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      cameraRef.current.aspect = nw / nh;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAssetIntoScene = (assetId: string, anchor: THREE.Group, scene: THREE.Scene) => {
    // Clear old asset
    while (anchor.children.length > 0) {
      anchor.remove(anchor.children[0]);
    }

    const instance = assetPipeline.createBuiltInAsset(assetId);
    if (!instance) return;

    currentAssetRef.current = instance;
    anchor.add(instance.root);
    anchor.rotation.set(0, 0, 0);

    // Apply wireframe state if enabled
    applyWireframe(instance.root, wireframe);

    // Reset clip
    if ('animator' in instance) {
      const clips = instance.animator.getAvailableClips();
      const firstClip = clips[0] || 'idle';
      setActiveClip(firstClip);
      instance.animator.playClip(firstClip, true, speed);
    }
  };

  const applyWireframe = (root: THREE.Object3D, isWire: boolean) => {
    root.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => (m.wireframe = isWire));
        } else {
          child.material.wireframe = isWire;
        }
      }
    });
  };

  const handleSelectAsset = (id: string) => {
    sound.playTap();
    setSelectedAssetId(id);
    if (modelAnchorRef.current && sceneRef.current) {
      loadAssetIntoScene(id, modelAnchorRef.current, sceneRef.current);
    }
  };

  const handleToggleWireframe = () => {
    sound.playTap();
    const next = !wireframe;
    setWireframe(next);
    if (currentAssetRef.current) {
      applyWireframe(currentAssetRef.current.root, next);
    }
  };

  const handleSelectClip = (clip: string) => {
    sound.playTap();
    setActiveClip(clip);
    if (currentAssetRef.current && 'animator' in currentAssetRef.current) {
      currentAssetRef.current.animator.playClip(clip, true, speed);
      setIsPlaying(true);
    }
  };

  const handleTogglePlay = () => {
    sound.playTap();
    const next = !isPlaying;
    setIsPlaying(next);
    if (currentAssetRef.current && 'animator' in currentAssetRef.current) {
      if (next) {
        currentAssetRef.current.animator.playClip(activeClip, true, speed);
      } else {
        currentAssetRef.current.animator.stop();
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !modelAnchorRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    modelAnchorRef.current.rotation.y += deltaX * 0.012;
    modelAnchorRef.current.rotation.x = Math.max(
      -0.4,
      Math.min(0.6, modelAnchorRef.current.rotation.x + deltaY * 0.008)
    );
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-teal-500/50 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-500/40">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Low-Poly Asset Pipeline</span>
                <span className="text-[10px] bg-teal-900/60 text-teal-300 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                  Three.js + Shaders
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Import pipeline, material palette, character animation controller
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Tabs */}
            <div className="flex bg-slate-800/80 p-0.5 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-teal-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                3D View
              </button>
              <button
                onClick={() => setActiveTab('palette')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTab === 'palette'
                    ? 'bg-teal-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Palette</span>
              </button>
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
        </div>

        {/* Main Content Area */}
        {activeTab === 'preview' ? (
          <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0 pt-3 overflow-hidden">
            {/* Left: Interactive 3D Canvas Viewport */}
            <div className="flex-1 flex flex-col min-h-[260px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative">
              <div
                ref={previewCanvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="w-full h-full cursor-grab active:cursor-grabbing select-none"
                title="Drag to orbit 3D model"
              />

              {/* Viewport Floating Badges */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">
                <span className="bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] font-mono text-teal-300 font-bold">
                  {activeMetadata.triangles} Tris
                </span>
                <span className="bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] font-mono text-amber-300">
                  {activeMetadata.isAnimated ? 'Animated Prop' : 'Static Env'}
                </span>
              </div>

              {/* Wireframe Toggle */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <button
                  onClick={handleToggleWireframe}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border backdrop-blur transition-all cursor-pointer flex items-center gap-1.5 ${
                    wireframe
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                  title="Toggle Wireframe Overlay"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Wireframe</span>
                </button>
              </div>

              <div className="absolute bottom-3 left-3 text-[10px] text-slate-500 pointer-events-none">
                Drag to rotate 3D view
              </div>
            </div>

            {/* Right: Asset Controls & Metadata */}
            <div className="w-full md:w-64 flex flex-col gap-3 overflow-y-auto pr-1">
              {/* Asset Selector */}
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                  Pipeline Assets
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {assetList.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => handleSelectAsset(asset.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        asset.id === selectedAssetId
                          ? 'bg-teal-500/20 border-teal-400 text-teal-200 shadow-md shadow-teal-500/20'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-xs font-black truncate">{asset.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {asset.triangles} tris • {asset.isAnimated ? 'Rigged' : 'Static'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description & Specs */}
              <div className="bg-slate-850/60 p-3 rounded-2xl border border-slate-800 text-xs">
                <div className="font-bold text-white mb-1">{activeMetadata.name}</div>
                <div className="text-slate-300/80 leading-relaxed text-[11px] mb-2">
                  {activeMetadata.description}
                </div>
                {activeMetadata.dimensions && (
                  <div className="text-[10px] text-slate-400 font-mono">
                    Size: {activeMetadata.dimensions.width} × {activeMetadata.dimensions.height} × {activeMetadata.dimensions.depth} units
                  </div>
                )}
              </div>

              {/* Animation Rig Controller (If Animated) */}
              {activeMetadata.isAnimated && activeMetadata.availableClips && (
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-teal-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-teal-300 flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Animation Controller</span>
                    </span>
                    <button
                      onClick={handleTogglePlay}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Clip Selector Tabs */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {activeMetadata.availableClips.map((clip) => (
                      <button
                        key={clip}
                        onClick={() => handleSelectClip(clip)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          activeClip === clip
                            ? 'bg-teal-500 text-slate-950 font-black'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {clip.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Speed Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Speed Scale</span>
                      <span>{speed.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2.5"
                      step="0.1"
                      value={speed}
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      className="w-full accent-teal-400 cursor-pointer h-1 bg-slate-800 rounded"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Palette Inspector Tab */
          <div className="flex-1 overflow-y-auto py-3 pr-1">
            <div className="mb-3">
              <h3 className="text-sm font-bold text-white mb-1">
                Lantern Quay Low-Poly Color Tokens
              </h3>
              <p className="text-xs text-slate-400">
                Shared flat-shaded material library with tuned roughness and metalness for zero texture overhead and high-performance draw calls.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {Object.entries(LOW_POLY_PALETTE).map(([key, hexNum]) => {
                const hexStr = `#${hexNum.toString(16).padStart(6, '0')}`;
                return (
                  <div
                    key={key}
                    className="p-2.5 rounded-xl bg-slate-850 border border-slate-800 flex items-center gap-2.5"
                  >
                    <div
                      className="w-8 h-8 rounded-lg border border-white/20 shadow-inner flex-shrink-0"
                      style={{ backgroundColor: hexStr }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{key}</div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">
                        {hexStr}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-semibold">● Pipeline Active</span>
            <span>All models &lt; 300 tris</span>
          </div>
          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
