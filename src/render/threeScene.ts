import * as THREE from 'three';
import { PhysicsManager, RodPhysicsState } from '../game/physics';
import { LevelConfig } from '../game/types';
import { AnimatedPropInstance } from './pipeline/assetTypes';
import { createQuayHarborChest } from './pipeline/models/staticAssets';
import { createMaritimeWindVentProp, createQuayPendulumClock } from './pipeline/models/animatedProps';
import { DynamicCameraSystem } from './cameraSystem';
import { CameraPreset } from '../game/narrativeTypes';

export interface SceneOptions {
  container: HTMLDivElement;
  onRodClick: (rodId: string) => void;
  debug?: boolean;
}

export class GameSceneRenderer {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private onRodClick: (rodId: string) => void;

  // Dynamic Camera Controller
  private cameraSystem: DynamicCameraSystem;

  private coinInstancedMesh: THREE.InstancedMesh | null = null;
  private dummy = new THREE.Object3D();

  // Mesh registries for animated rods
  private rodMeshes: Map<string, {
    group: THREE.Group;
    rodMesh: THREE.Mesh;
    headMesh: THREE.Mesh;
    socketA: THREE.Mesh;
    socketB: THREE.Mesh;
    state: RodPhysicsState;
  }> = new Map();

  // Active pipeline animated props
  private animatedProps: AnimatedPropInstance[] = [];

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private bounds = { width: 1, height: 1 };

  // Room props
  private windowMesh: THREE.Mesh | null = null;
  private bedQuiltMesh: THREE.Mesh | null = null;
  private fireplaceGroup: THREE.Group | null = null;
  private rugMesh: THREE.Mesh | null = null;
  private lampMesh: THREE.Group | null = null;
  private catMesh: THREE.Group | null = null;

  // Character & Jar
  private characterGroup: THREE.Group | null = null;
  private jarGroup: THREE.Group | null = null;
  private jarWobbleTime = 0;
  private characterBounceTime = 0;
  private idleTime = 0;

  // Camera juice nudge
  private cameraBaseY = 0;
  private cameraNudge = 0;

  private dustParticles: THREE.Points | null = null;
  private animFrameId: number | null = null;
  private isDestroyed = false;

  private physicsManager: PhysicsManager | null = null;
  private level: LevelConfig | null = null;

  // Procedural Canvas Textures
  private brickTexture: THREE.CanvasTexture;
  private woodPlanksTexture: THREE.CanvasTexture;
  private rugTexture: THREE.CanvasTexture;

  constructor(options: SceneOptions) {
    this.container = options.container;
    this.onRodClick = options.onRodClick;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f121d); // Deep moody attic night

    // Perspective Camera: FOV 28, portrait layout
    this.camera = new THREE.PerspectiveCamera(28, 1, 10, 3000);
    this.camera.position.set(0, -35, 1680);
    this.cameraBaseY = -35;

    // Initialize Dynamic Camera Controller
    this.cameraSystem = new DynamicCameraSystem(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Cap at 1.5 for steady 60fps
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    this.brickTexture = this.createBrickTexture();
    this.woodPlanksTexture = this.createWoodPlankTexture();
    this.rugTexture = this.createRugTexture();

    this.setupLighting();
    this.setupRoomEnvironment();
    this.setupCharacterAndBed();
    this.setupJar();
    this.setupDustParticles();

    this.handleResize();
    window.addEventListener('resize', this.handleResize);

    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);

    this.animate = this.animate.bind(this);
    this.animFrameId = requestAnimationFrame(this.animate);
  }

  private handleResize = () => {
    if (!this.container || this.isDestroyed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.bounds.width = w;
    this.bounds.height = h;

    this.camera.aspect = w / h;

    // In portrait layout (e.g. 390x844), distance ~1720 fits hopper + jar + character + loft perfectly
    const isPortrait = h > w;
    const distanceFactor = isPortrait ? Math.max(1, 800 / h) : Math.max(1, 480 / h);
    this.camera.position.z = 1680 * (w < 440 ? 1.08 : 1.0) * distanceFactor;
    this.camera.position.y = -35;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);
  };

  private setupLighting(): void {
    // 1. Ambient warm & cool fill
    const hemiLight = new THREE.HemisphereLight(0xffedd5, 0x111827, 0.85);
    this.scene.add(hemiLight);

    // 2. Focused warm spotlight on the hopper
    const spotHopper = new THREE.DirectionalLight(0xfdba74, 1.6);
    spotHopper.position.set(50, 180, 400);
    this.scene.add(spotHopper);

    // 3. Cool blue window rim light from the upper-left
    const windowLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    windowLight.position.set(-350, 260, 200);
    this.scene.add(windowLight);
  }

  private setupRoomEnvironment(): void {
    // Back Brick Wall (cutaway room)
    const wallGeo = new THREE.PlaneGeometry(1000, 1400);
    const wallMat = new THREE.MeshStandardMaterial({
      map: this.brickTexture,
      roughness: 0.88,
      metalness: 0.1,
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 0, -220);
    this.scene.add(backWall);

    // Floor Planks
    const floorGeo = new THREE.BoxGeometry(950, 28, 550);
    const floorMat = new THREE.MeshStandardMaterial({
      map: this.woodPlanksTexture,
      roughness: 0.65,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    // In Three.js: -Y is down, so floor is at y = -390
    floor.position.set(0, -390, 0);
    this.scene.add(floor);

    // Upper Loft Platform on upper-right/mid
    const loftGeo = new THREE.BoxGeometry(360, 18, 300);
    const loftMat = new THREE.MeshStandardMaterial({
      color: 0x3d271d,
      roughness: 0.7,
    });
    const loft = new THREE.Mesh(loftGeo, loftMat);
    loft.position.set(220, 240, -60);
    this.scene.add(loft);

    // Loft Wooden Ladder
    const ladderGroup = new THREE.Group();
    const railMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.7 });
    const railGeo = new THREE.CylinderGeometry(3.5, 3.5, 360, 8);

    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(-20, 0, 0);
    ladderGroup.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(16, 0, 0);
    ladderGroup.add(rightRail);

    // Ladder rungs
    const rungGeo = new THREE.CylinderGeometry(2.5, 2.5, 36, 8);
    for (let r = 0; r < 7; r++) {
      const rung = new THREE.Mesh(rungGeo, railMat);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(-2, -130 + r * 44, 0);
      ladderGroup.add(rung);
    }
    ladderGroup.position.set(140, 60, -30);
    ladderGroup.rotation.z = -0.06;
    this.scene.add(ladderGroup);

    // Cat on ladder/shelf
    const catGroup = new THREE.Group();
    const catMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.8 }); // ginger cat
    const catBody = new THREE.Mesh(new THREE.BoxGeometry(16, 12, 22), catMat);
    const catHead = new THREE.Mesh(new THREE.SphereGeometry(7, 8, 8), catMat);
    catHead.position.set(0, 8, 10);
    const catTail = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 18, 6), catMat);
    catTail.position.set(0, 4, -12);
    catTail.rotation.x = -0.6;
    catGroup.add(catBody, catHead, catTail);
    catGroup.position.set(140, 110, -10);
    this.catMesh = catGroup;
    this.scene.add(catGroup);

    // Attic Window Frame & Glass in upper left
    const windowGroup = new THREE.Group();
    const frameGeo = new THREE.BoxGeometry(110, 160, 14);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    windowGroup.add(frame);

    const glassGeo = new THREE.PlaneGeometry(94, 144);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      roughness: 0.2,
      metalness: 0.3,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.85,
    });
    this.windowMesh = new THREE.Mesh(glassGeo, glassMat);
    this.windowMesh.position.z = 2;
    windowGroup.add(this.windowMesh);

    windowGroup.position.set(-220, 240, -140);
    this.scene.add(windowGroup);

    // Woven Quay Floor Rug
    const rugGeo = new THREE.PlaneGeometry(320, 180);
    const rugMat = new THREE.MeshStandardMaterial({
      map: this.rugTexture,
      roughness: 0.9,
      transparent: true,
      opacity: 0.35,
    });
    this.rugMesh = new THREE.Mesh(rugGeo, rugMat);
    this.rugMesh.rotation.x = -Math.PI / 2;
    this.rugMesh.position.set(20, -376, 50);
    this.scene.add(this.rugMesh);

    // PIPELINE ASSET 1: Static Environmental Asset (Quay Harbor Chest)
    const chest = createQuayHarborChest();
    chest.root.position.set(195, -374, 70);
    chest.root.rotation.y = -0.35;
    this.scene.add(chest.root);

    // PIPELINE ASSET 2: Basic Animated Prop (Maritime Wind Vent)
    const windVent = createMaritimeWindVentProp();
    windVent.root.position.set(-200, 310, -90);
    windVent.root.rotation.y = 0.45;
    this.scene.add(windVent.root);
    this.animatedProps.push(windVent);

    // PIPELINE ASSET 3: Basic Animated Prop (Quay Pendulum Clock)
    const clock = createQuayPendulumClock();
    clock.root.position.set(215, 140, -210);
    this.scene.add(clock.root);
    this.animatedProps.push(clock);
  }

  private setupCharacterAndBed(): void {
    // Bed frame under the chute at bottom left
    const bedGroup = new THREE.Group();

    // Wooden bed frame
    const bedBaseGeo = new THREE.BoxGeometry(230, 36, 120);
    const bedBaseMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 });
    const bedBase = new THREE.Mesh(bedBaseGeo, bedBaseMat);
    bedGroup.add(bedBase);

    // Mattress / Quilt
    const quiltGeo = new THREE.BoxGeometry(212, 28, 108);
    const quiltMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // cool ragged blanket initially
      roughness: 0.8,
    });
    this.bedQuiltMesh = new THREE.Mesh(quiltGeo, quiltMat);
    this.bedQuiltMesh.position.set(0, 16, 0);
    bedGroup.add(this.bedQuiltMesh);

    // Pillow
    const pillowGeo = new THREE.BoxGeometry(45, 18, 90);
    const pillowMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 });
    const pillow = new THREE.Mesh(pillowGeo, pillowMat);
    pillow.position.set(75, 26, 0);
    bedGroup.add(pillow);

    // Stylized Character reclining propped on bed holding jar
    this.characterGroup = new THREE.Group();

    // Body / Mustard sweatshirt
    const torsoGeo = new THREE.BoxGeometry(42, 28, 30);
    const torsoMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.7 });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.set(35, 34, 0);
    torso.rotation.z = 0.32;
    this.characterGroup.add(torso);

    // Head / Face
    const headGeo = new THREE.SphereGeometry(14, 12, 12);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.8 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(58, 52, 0);
    this.characterGroup.add(head);

    // Hair Bob (styled emerald green / teal hair bob from the ad video!)
    const hairGeo = new THREE.BoxGeometry(28, 26, 28);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.6 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(62, 56, 0);
    this.characterGroup.add(hair);

    // Legs / Jeans
    const legGeo = new THREE.BoxGeometry(70, 18, 24);
    const jeansMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.7 });
    const legs = new THREE.Mesh(legGeo, jeansMat);
    legs.position.set(-15, 22, 0);
    this.characterGroup.add(legs);

    // Hands reaching forward to hold the jar
    const armGeo = new THREE.CylinderGeometry(4.5, 4.5, 36, 8);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.7 });

    const arm1 = new THREE.Mesh(armGeo, armMat);
    arm1.rotation.z = -1.1;
    arm1.position.set(18, 32, 14);
    this.characterGroup.add(arm1);

    const arm2 = new THREE.Mesh(armGeo, armMat);
    arm2.rotation.z = -1.1;
    arm2.position.set(18, 32, -14);
    this.characterGroup.add(arm2);

    bedGroup.add(this.characterGroup);

    // In Three.js: jar is at y = -245, so bed sits at y = -295
    bedGroup.position.set(-15, -295, 20);
    this.scene.add(bedGroup);
  }

  private setupJar(): void {
    // Glass Jar held right under the exit chute (-75, -245 in Three.js)
    this.jarGroup = new THREE.Group();

    // Transparent glass body
    const glassGeo = new THREE.CylinderGeometry(36, 34, 72, 24, 1, true);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      opacity: 0.9,
      transparent: true,
      roughness: 0.1,
      metalness: 0.05,
      ior: 1.5,
      thickness: 1.8,
    });
    const glassBody = new THREE.Mesh(glassGeo, glassMat);
    this.jarGroup.add(glassBody);

    // Jar bottom plate
    const bottomGeo = new THREE.CylinderGeometry(34, 34, 5, 24);
    const bottomMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      roughness: 0.2,
    });
    const jarBottom = new THREE.Mesh(bottomGeo, bottomMat);
    jarBottom.position.y = -35;
    this.jarGroup.add(jarBottom);

    // Golden metallic neck rim
    const rimGeo = new THREE.TorusGeometry(36, 3.5, 12, 32);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 36;
    this.jarGroup.add(rim);

    this.jarGroup.position.set(-75, -245, 15);
    this.scene.add(this.jarGroup);
  }

  private setupDustParticles(): void {
    const count = 120;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 600;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 700;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200 + 40;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 3.5,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    this.dustParticles = new THREE.Points(geo, mat);
    this.scene.add(this.dustParticles);
  }

  /**
   * Initializes the Hopper casing and instanced coins for the active level.
   */
  public setLevel(level: LevelConfig, physicsManager: PhysicsManager): void {
    this.level = level;
    this.physicsManager = physicsManager;

    // Reposition jar according to level exit (-level.exitX, -245)
    if (this.jarGroup) {
      this.jarGroup.position.set(level.exitX, -245, 15);
    }

    this.buildHopperCasing(level);
    this.buildRods(level, physicsManager);
    this.buildCoins(level, physicsManager);
  }

  private hopperGroup: THREE.Group | null = null;

  private buildHopperCasing(level: LevelConfig): void {
    if (this.hopperGroup) {
      this.scene.remove(this.hopperGroup);
    }
    this.hopperGroup = new THREE.Group();

    // 1. Glossy Coral/Red-Orange Shell Outline
    const shellMat = new THREE.MeshStandardMaterial({
      color: 0xf87171, // Glossy vivid coral red-orange
      roughness: 0.18,
      metalness: 0.25,
      emissive: 0xb91c1c,
      emissiveIntensity: 0.18,
    });

    const interiorBackMat = new THREE.MeshStandardMaterial({
      color: 0xfed7aa, // Lighter orange-cream interior
      roughness: 0.65,
      metalness: 0.05,
    });

    // Top bulb casing: curved rounded dome (Three.js coordinates: Y from 115 to 330)
    const upperShape = new THREE.Shape();
    upperShape.moveTo(-35, 115);
    upperShape.quadraticCurveTo(-140, 210, -130, 320);
    upperShape.quadraticCurveTo(0, 345, 130, 320);
    upperShape.quadraticCurveTo(140, 210, 35, 115);
    upperShape.lineTo(-35, 115);

    const upperBackGeo = new THREE.ShapeGeometry(upperShape);
    const upperBack = new THREE.Mesh(upperBackGeo, interiorBackMat);
    upperBack.position.z = -12;
    this.hopperGroup.add(upperBack);

    // Lower chamber casing: pentagon/trapezoid chamber (Three.js coordinates: Y from 115 down to -135)
    const lowerShape = new THREE.Shape();
    lowerShape.moveTo(-35, 115);
    lowerShape.lineTo(35, 115);
    lowerShape.lineTo(135, -15);
    lowerShape.lineTo(135, -135);
    lowerShape.lineTo(-135, -135);
    lowerShape.lineTo(-135, -15);
    lowerShape.closePath();

    const lowerBackGeo = new THREE.ShapeGeometry(lowerShape);
    const lowerBack = new THREE.Mesh(lowerBackGeo, interiorBackMat);
    lowerBack.position.z = -12;
    this.hopperGroup.add(lowerBack);

    // Glossy Tubular Rim Border around the hopper
    const tubeRadius = 9;

    // Left border curve (from top dome around left side down to exit chute)
    const borderPointsLeft: THREE.Vector3[] = [
      new THREE.Vector3(0, 345, 0),
      new THREE.Vector3(-130, 320, 0),
      new THREE.Vector3(-140, 210, 0),
      new THREE.Vector3(-45, 120, 0),
      new THREE.Vector3(-135, -15, 0),
      new THREE.Vector3(-135, -135, 0),
      new THREE.Vector3(level.exitX - level.exitWidth / 2, -135, 0),
    ];
    const curveLeft = new THREE.CatmullRomCurve3(borderPointsLeft);
    const tubeGeoL = new THREE.TubeGeometry(curveLeft, 40, tubeRadius, 10, false);
    const tubeL = new THREE.Mesh(tubeGeoL, shellMat);
    this.hopperGroup.add(tubeL);

    // Right border curve (from top dome around right side down to floor)
    const borderPointsRight: THREE.Vector3[] = [
      new THREE.Vector3(0, 345, 0),
      new THREE.Vector3(130, 320, 0),
      new THREE.Vector3(140, 210, 0),
      new THREE.Vector3(45, 120, 0),
      new THREE.Vector3(135, -15, 0),
      new THREE.Vector3(135, -135, 0),
      new THREE.Vector3(level.exitX + level.exitWidth / 2, -135, 0),
    ];
    const curveRight = new THREE.CatmullRomCurve3(borderPointsRight);
    const tubeGeoR = new THREE.TubeGeometry(curveRight, 40, tubeRadius, 10, false);
    const tubeR = new THREE.Mesh(tubeGeoR, shellMat);
    this.hopperGroup.add(tubeR);

    // Glass front cover
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      roughness: 0.08,
      metalness: 0.05,
      transparent: true,
      opacity: 0.2,
    });
    const glassCoverL = new THREE.Mesh(lowerBackGeo, glassMat);
    glassCoverL.position.z = 10;
    this.hopperGroup.add(glassCoverL);

    this.scene.add(this.hopperGroup);
  }

  private buildRods(level: LevelConfig, physicsManager: PhysicsManager): void {
    // Clear old rods
    for (const item of this.rodMeshes.values()) {
      this.scene.remove(item.group);
    }
    this.rodMeshes.clear();

    for (const rod of level.rods) {
      const rodState = physicsManager.rods.get(rod.id);
      if (!rodState) continue;

      const group = new THREE.Group();

      const dx = rod.x2 - rod.x1;
      const dy = -(rod.y2 - rod.y1); // inverted dy for Three.js
      const length = Math.hypot(dx, dy);

      // Rod body: glowing teal cylinder
      const rodGeo = new THREE.CylinderGeometry(3.6, 3.6, length, 12);
      const rodMat = new THREE.MeshStandardMaterial({
        color: rod.role === 'decoy' ? 0xf43f5e : 0x2dd4bf,
        emissive: rod.role === 'decoy' ? 0xe11d48 : 0x0d9488,
        emissiveIntensity: 0.65,
        roughness: 0.3,
        metalness: 0.8,
      });
      const rodMesh = new THREE.Mesh(rodGeo, rodMat);
      rodMesh.castShadow = true;
      group.add(rodMesh);

      // Spherical Handle Head at the pull endpoint
      const headGeo = new THREE.SphereGeometry(9.5, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({
        color: rod.role === 'decoy' ? 0xff1744 : 0x14b8a6,
        emissive: rod.role === 'decoy' ? 0xff0033 : 0x059669,
        emissiveIntensity: 0.85,
        roughness: 0.2,
        metalness: 0.9,
      });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.userData = { rodId: rod.id, isHead: true };
      rodMesh.userData = { rodId: rod.id, isRod: true };

      // Position head at rod endpoint
      const headAtEnd2 = rod.pullDirection === 1;
      headMesh.position.set(0, (headAtEnd2 ? 1 : -1) * (length / 2 + 5), 0);
      group.add(headMesh);

      // Socket caps where rod penetrates the frame
      const socketGeo = new THREE.CylinderGeometry(6.5, 6.5, 8, 12);
      const socketMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
      const socketA = new THREE.Mesh(socketGeo, socketMat);
      socketA.position.set(0, -length / 2, 0);
      group.add(socketA);

      const socketB = new THREE.Mesh(socketGeo, socketMat);
      socketB.position.set(0, length / 2, 0);
      group.add(socketB);

      // Position group at midpoint and orient along axis
      const cx = (rod.x1 + rod.x2) / 2;
      const cy = -((rod.y1 + rod.y2) / 2);
      const angle = Math.atan2(dy, dx);

      group.position.set(cx, cy, 6);
      group.rotation.z = angle - Math.PI / 2;

      this.scene.add(group);
      this.rodMeshes.set(rod.id, {
        group,
        rodMesh,
        headMesh,
        socketA,
        socketB,
        state: rodState,
      });
    }
  }

  private buildCoins(level: LevelConfig, physicsManager: PhysicsManager): void {
    if (this.coinInstancedMesh) {
      this.scene.remove(this.coinInstancedMesh);
      this.coinInstancedMesh.geometry.dispose();
      this.coinInstancedMesh = null;
    }

    const count = physicsManager.coins.length;
    // Coin geometry: small disc with rounded beveled edge
    const coinGeo = new THREE.CylinderGeometry(4.2, 4.2, 2.2, 14);
    coinGeo.rotateX(Math.PI / 2); // face forward towards camera

    // Rich warm golden metallic material
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.88,
      roughness: 0.22,
      emissive: 0xd97706,
      emissiveIntensity: 0.18,
    });

    this.coinInstancedMesh = new THREE.InstancedMesh(coinGeo, coinMat, count);
    this.coinInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.coinInstancedMesh.position.z = 2;
    this.scene.add(this.coinInstancedMesh);
  }

  private onPointerDown = (event: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check intersections with all rods and heads
    const interactiveObjects: THREE.Object3D[] = [];
    for (const item of this.rodMeshes.values()) {
      if (!item.state.pulled && !item.state.pulling) {
        interactiveObjects.push(item.headMesh, item.rodMesh);
      }
    }

    const intersects = this.raycaster.intersectObjects(interactiveObjects, false);
    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const rodId = hit.userData.rodId;
      if (rodId) {
        this.cameraNudge = 3.5;
        this.onRodClick(rodId);
      }
    }
  };

  public triggerJarWobble(): void {
    this.jarWobbleTime = 0.28;
  }

  public triggerCharacterWinBounce(): void {
    this.characterBounceTime = 1.2;
  }

  /**
   * Applies renovated visual assets into the 3D scene.
   */
  public applyRenovations(renovations: Record<string, boolean>): void {
    // 1. Stained Glass Window
    if (this.windowMesh) {
      const mat = this.windowMesh.material as THREE.MeshStandardMaterial;
      if (renovations.renovate_window) {
        mat.color.setHex(0xfbbf24);
        mat.emissive.setHex(0xd97706);
        mat.emissiveIntensity = 0.85;
      } else {
        mat.color.setHex(0x93c5fd);
        mat.emissive.setHex(0x0284c7);
        mat.emissiveIntensity = 0.4;
      }
    }

    // 2. Bed Quilt
    if (this.bedQuiltMesh) {
      const mat = this.bedQuiltMesh.material as THREE.MeshStandardMaterial;
      if (renovations.renovate_bed) {
        mat.color.setHex(0x831843); // Rich royal velvet crimson
        mat.roughness = 0.5;
      } else {
        mat.color.setHex(0x475569);
        mat.roughness = 0.8;
      }
    }

    // 3. Floor Rug
    if (this.rugMesh) {
      const mat = this.rugMesh.material as THREE.MeshStandardMaterial;
      mat.opacity = renovations.renovate_carpet ? 0.95 : 0.35;
    }
  }

  public setCameraMode(mode: CameraPreset): void {
    this.cameraSystem.setMode(mode);
  }

  public getCameraMode(): CameraPreset {
    return this.cameraSystem.getMode();
  }

  public triggerCameraShake(intensity = 4.0): void {
    this.cameraSystem.triggerShake(intensity);
  }

  private animate(): void {
    if (this.isDestroyed) return;
    this.animFrameId = requestAnimationFrame(this.animate);

    const dt = 0.016;
    this.idleTime += dt;

    // Update dynamic camera positioning, smooth transition interpolation, and breathing drift
    const isPortrait = this.bounds.height > this.bounds.width;
    const aspectMult = isPortrait
      ? Math.max(1, 800 / this.bounds.height) * (this.bounds.width < 440 ? 1.08 : 1.0)
      : Math.max(1, 480 / this.bounds.height);
    this.cameraSystem.update(dt, aspectMult);

    // Character breathing idle animation
    if (this.characterGroup) {
      const breath = Math.sin(this.idleTime * 2.5) * 1.2;
      this.characterGroup.position.y = breath;

      if (this.characterBounceTime > 0) {
        this.characterBounceTime -= dt;
        const jump = Math.abs(Math.sin(this.characterBounceTime * 14)) * 12;
        this.characterGroup.position.y += jump;
      }
    }

    // Jar wobble animation
    if (this.jarGroup) {
      if (this.jarWobbleTime > 0) {
        this.jarWobbleTime -= dt;
        const wobble = Math.sin(this.jarWobbleTime * 35) * 0.08;
        this.jarGroup.rotation.z = wobble;
        this.jarGroup.scale.set(1 + Math.abs(wobble) * 0.5, 1 - Math.abs(wobble) * 0.5, 1);
      } else {
        this.jarGroup.rotation.z = 0;
        this.jarGroup.scale.set(1, 1, 1);
      }
    }

    // Update animated rod groups
    for (const item of this.rodMeshes.values()) {
      const state = item.state;
      if (state.pulling) {
        const cx = (state.currentX1 + state.currentX2) / 2;
        const cy = -((state.currentY1 + state.currentY2) / 2); // inverted Y
        const dx = state.currentX2 - state.currentX1;
        const dy = -(state.currentY2 - state.currentY1); // inverted Y
        const angle = Math.atan2(dy, dx);

        item.group.position.set(cx, cy, 6 + state.flyOffset);
        item.group.rotation.z = angle - Math.PI / 2 + state.flyAngle;

        if (state.pulled) {
          item.group.position.z += 800;
        }
      }
    }

    // Update InstancedMesh of Coins (Invert Y from Matter.js)
    if (this.coinInstancedMesh && this.physicsManager) {
      const coins = this.physicsManager.coins;
      for (let i = 0; i < coins.length; i++) {
        const c = coins[i];
        const pos = c.body.position;
        const angle = c.body.angle;

        this.dummy.position.set(pos.x, -pos.y, 4);
        this.dummy.rotation.set(0, 0, -angle);
        this.dummy.updateMatrix();

        this.coinInstancedMesh.setMatrixAt(i, this.dummy.matrix);
      }
      this.coinInstancedMesh.instanceMatrix.needsUpdate = true;
    }

    // Update pipeline animated props
    for (const prop of this.animatedProps) {
      prop.animator.update(dt);
    }

    this.renderer.render(this.scene, this.camera);
  }


  // --- Procedural Canvas Texture Generators ---

  private createBrickTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1e2430';
    ctx.fillRect(0, 0, 512, 512);

    const rows = 16;
    const rowH = 512 / rows;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * 32;
      for (let x = -32 + offset; x < 544; x += 64) {
        ctx.fillStyle = r % 3 === 0 ? '#262f3f' : r % 2 === 0 ? '#2d3748' : '#1f2937';
        ctx.fillRect(x + 2, r * rowH + 2, 60, rowH - 4);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 3);
    return tex;
  }

  private createWoodPlankTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#3f2817';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#4a301c' : '#392211';
      ctx.fillRect(0, i * 64 + 2, 512, 60);

      // Wood grain lines
      ctx.strokeStyle = '#2b190c';
      ctx.lineWidth = 1;
      for (let g = 0; g < 4; g++) {
        ctx.beginPath();
        ctx.moveTo(0, i * 64 + 10 + g * 12);
        ctx.lineTo(512, i * 64 + 10 + g * 12 + (Math.random() - 0.5) * 6);
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    return tex;
  }

  private createRugTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#065f46'; // emerald velvet
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 236, 236);

    ctx.fillStyle = '#d97706';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(128, 128, 30 + i * 20, 0, Math.PI * 2);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
