import Matter from 'matter-js';
import { LevelConfig, RodConfig } from './types';
import { sound } from '../audio/soundManager';

const { Engine, World, Bodies, Body, Composite } = Matter;

export interface RodPhysicsState {
  config: RodConfig;
  body: Matter.Body | null;
  pulled: boolean;
  pulling: boolean;
  pullProgress: number; // 0 to 1
  pullSpeed: number;
  currentX1: number;
  currentY1: number;
  currentX2: number;
  currentY2: number;
  flyOffset: number;
  flyAngle: number;
}

export interface CoinData {
  body: Matter.Body;
  inJar: boolean;
  spilled: boolean;
  settled: boolean;
}

export interface PhysicsWorldCallbacks {
  onCoinCollected: (count: number) => void;
  onCoinSpilled: (count: number) => void;
  onJarWobble: () => void;
  onFlowSettled: () => void;
}

export class PhysicsManager {
  private engine: Matter.Engine;
  private level: LevelConfig;
  private callbacks: PhysicsWorldCallbacks;

  public rods: Map<string, RodPhysicsState> = new Map();
  public coins: CoinData[] = [];
  public coinsInJarCount = 0;
  public coinsSpilledCount = 0;

  private jarBounds = { x: -75, y: 245, width: 78, height: 75 };
  private flowActiveTime = 0;
  private lastMovementTime = 0;
  private hasReportedSettled = false;
  private isDestroyed = false;

  constructor(level: LevelConfig, callbacks: PhysicsWorldCallbacks) {
    this.level = level;
    this.callbacks = callbacks;
    this.jarBounds.x = level.exitX;

    this.engine = Engine.create({
      gravity: { x: 0, y: 1.15, scale: 0.001 },
      enableSleeping: false,
    });

    this.setupHopperBoundaries();
    this.setupRods();
    this.setupJar();
    this.spawnCoins();
    this.lastMovementTime = performance.now();
  }

  private setupHopperBoundaries(): void {
    const world = this.engine.world;
    const wallOptions: Matter.IChamferableBodyDefinition = {
      isStatic: true,
      friction: 0.02,
      restitution: 0.05,
      render: { visible: false },
    };

    // Upper bulb side walls (narrower top bowl)
    const w1 = Bodies.rectangle(-120, -240, 24, 180, { ...wallOptions, angle: 0.1 });
    const w2 = Bodies.rectangle(120, -240, 24, 180, { ...wallOptions, angle: -0.1 });
    const topCap = Bodies.rectangle(0, -345, 260, 25, wallOptions);

    // Steep funnel down into neck (neck at y = -115, width ~ 85)
    // Angles around 0.85 rad (~49 deg) so coins slide down freely without sticking
    const funnelL = Bodies.rectangle(-75, -135, 110, 22, { ...wallOptions, angle: -0.85 });
    const funnelR = Bodies.rectangle(75, -135, 110, 22, { ...wallOptions, angle: 0.85 });

    // Lower chamber side walls (y = -100 to 125)
    const chamberL = Bodies.rectangle(-130, 15, 24, 230, { ...wallOptions, angle: -0.1 });
    const chamberR = Bodies.rectangle(130, 15, 24, 230, { ...wallOptions, angle: 0.1 });

    // Sloped bottom floor directing all coins toward the left exit chute (-75)
    // Left floor lip: from -130 to exit left edge (-110)
    const floorL = Bodies.rectangle(-122, this.level.exitY + 6, 28, 22, {
      ...wallOptions,
      angle: 0.35,
    });

    // Right floor slope: runs from right wall (130, 60) down to exit right edge (-40, 135)
    // Steeper angle (-0.46 rad) and low friction ensures all coins slide rapidly toward the exit!
    const floorR = Bodies.rectangle(48, this.level.exitY - 18, 175, 22, {
      ...wallOptions,
      angle: -0.46,
      friction: 0.005,
    });

    // Vertical Exit Chute Guide: directs coins straight down into the jar, nullifying lateral momentum
    const chuteL = Bodies.rectangle(this.level.exitX - this.level.exitWidth / 2 - 2, this.level.exitY + 28, 8, 40, wallOptions);
    const chuteR = Bodies.rectangle(this.level.exitX + this.level.exitWidth / 2 + 2, this.level.exitY + 28, 8, 40, wallOptions);

    World.add(world, [w1, w2, topCap, funnelL, funnelR, chamberL, chamberR, floorL, floorR, chuteL, chuteR]);
  }

  private setupRods(): void {
    const world = this.engine.world;

    for (const rod of this.level.rods) {
      const cx = (rod.x1 + rod.x2) / 2;
      const cy = (rod.y1 + rod.y2) / 2;
      const dx = rod.x2 - rod.x1;
      const dy = rod.y2 - rod.y1;
      const length = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      // Collider is 1.5x thicker than visual (approx 7px) to avoid tunneling
      const body = Bodies.rectangle(cx, cy, length, 7.5, {
        isStatic: true,
        angle: angle,
        friction: 0.05,
        restitution: 0.02,
        label: `rod_${rod.id}`,
      });

      World.add(world, body);

      this.rods.set(rod.id, {
        config: rod,
        body,
        pulled: false,
        pulling: false,
        pullProgress: 0,
        pullSpeed: 0.05,
        currentX1: rod.x1,
        currentY1: rod.y1,
        currentX2: rod.x2,
        currentY2: rod.y2,
        flyOffset: 0,
        flyAngle: 0,
      });
    }
  }

  private setupJar(): void {
    const world = this.engine.world;
    const jarOpt: Matter.IChamferableBodyDefinition = {
      isStatic: true,
      friction: 0.1,
      restitution: 0.0,
      render: { visible: false },
    };

    const jx = this.jarBounds.x;
    const jy = this.jarBounds.y;
    const jw = this.jarBounds.width;
    const jh = this.jarBounds.height;

    // Jar bottom floor
    const bottom = Bodies.rectangle(jx, jy + jh / 2, jw + 6, 14, jarOpt);
    // Jar left wall
    const wallL = Bodies.rectangle(jx - jw / 2 + 2, jy, 8, jh, jarOpt);
    // Jar right wall
    const wallR = Bodies.rectangle(jx + jw / 2 - 2, jy, 8, jh, jarOpt);

    // Inward-sloped invisible catch funnel so coins glide smoothly into jar rim
    const funnelL = Bodies.rectangle(jx - jw / 2 - 16, jy - jh / 2 + 6, 52, 10, {
      ...jarOpt,
      angle: 0.95,
    });
    const funnelR = Bodies.rectangle(jx + jw / 2 + 16, jy - jh / 2 + 6, 52, 10, {
      ...jarOpt,
      angle: -0.95,
    });

    World.add(world, [bottom, wallL, wallR, funnelL, funnelR]);
  }

  private spawnCoins(): void {
    const world = this.engine.world;
    const count = this.level.coinCount;
    const coinRadius = 4.2;

    const cols = 15;
    const spacingX = 9.2;
    const spacingY = 8.8;
    const startX = -((cols - 1) * spacingX) / 2;
    const startY = -325;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const jitterX = (Math.random() - 0.5) * 1.2;
      const jitterY = (Math.random() - 0.5) * 1.2;
      const x = startX + col * spacingX + jitterX;
      const y = startY + row * spacingY + jitterY;

      const body = Bodies.circle(x, y, coinRadius, {
        restitution: 0.02,
        friction: 0.04,
        frictionAir: 0.005,
        density: 0.002,
        collisionFilter: {
          category: 0x0001,
          mask: 0xffff,
        },
      });

      World.add(world, body);
      this.coins.push({
        body,
        inJar: false,
        spilled: false,
        settled: false,
      });
    }
  }

  public pullRod(rodId: string): boolean {
    const rod = this.rods.get(rodId);
    if (!rod || rod.pulled || rod.pulling) return false;

    rod.pulling = true;
    sound.playWhoosh();

    // Remove collider from physics world so coins can immediately begin streaming through!
    if (rod.body) {
      World.remove(this.engine.world, rod.body);
      rod.body = null;
    }

    return true;
  }

  public update(dtSeconds: number): void {
    if (this.isDestroyed) return;

    // Substep physics simulation (2-3 substeps per frame for solid collision without tunneling)
    const substeps = 3;
    const stepDelta = (dtSeconds * 1000) / substeps;
    for (let i = 0; i < substeps; i++) {
      Engine.update(this.engine, stepDelta);
    }

    // Update animated rod positions
    for (const rod of this.rods.values()) {
      if (rod.pulling && !rod.pulled) {
        rod.pullProgress += dtSeconds * 3.5; // pull animation takes ~0.28s
        if (rod.pullProgress >= 1) {
          rod.pullProgress = 1;
          rod.pulled = true;
        }

        // Slide along axis
        const dx = rod.config.x2 - rod.config.x1;
        const dy = rod.config.y2 - rod.config.y1;
        const dir = rod.config.pullDirection;
        const slideDistance = rod.pullProgress * 120 * dir;

        const len = Math.hypot(dx, dy);
        const ux = dx / len;
        const uy = dy / len;

        rod.currentX1 = rod.config.x1 + ux * slideDistance;
        rod.currentY1 = rod.config.y1 + uy * slideDistance;
        rod.currentX2 = rod.config.x2 + ux * slideDistance;
        rod.currentY2 = rod.config.y2 + uy * slideDistance;

        // Fly away spin
        if (rod.pullProgress > 0.5) {
          rod.flyOffset += dtSeconds * 300;
          rod.flyAngle += dtSeconds * 12;
        }
      }
    }

    // Process coins state & collection
    const jx = this.jarBounds.x;
    const jy = this.jarBounds.y;
    const jw = this.jarBounds.width;
    const jh = this.jarBounds.height;

    let hasFastMovingCoin = false;
    let newlyCollected = 0;
    let newlySpilled = 0;

    for (const coin of this.coins) {
      const b = coin.body;

      // Check jar collection
      if (!coin.inJar && !coin.spilled) {
        const inJarX = b.position.x >= jx - jw / 2 - 6 && b.position.x <= jx + jw / 2 + 6;
        const inJarY = b.position.y >= jy - jh / 2 - 10 && b.position.y <= jy + jh / 2 + 25;

        if (inJarX && inJarY) {
          coin.inJar = true;
          this.coinsInJarCount++;
          newlyCollected++;
        } else if (b.position.y > 340) {
          // Fallen down past jar without landing in jar -> spill!
          coin.spilled = true;
          this.coinsSpilledCount++;
          newlySpilled++;
        } else {
          // Only check movement for coins that are still in flight or in hopper
          const speed = Math.hypot(b.velocity.x, b.velocity.y);
          if (speed > 0.75) {
            hasFastMovingCoin = true;
          }
        }
      }
    }

    if (newlyCollected > 0) {
      this.callbacks.onCoinCollected(this.coinsInJarCount);
      sound.playCoinClink();
      if (this.coinsInJarCount % 8 === 0) {
        sound.playJarPlink();
        this.callbacks.onJarWobble();
      }
    }

    if (newlySpilled > 0) {
      this.callbacks.onCoinSpilled(this.coinsSpilledCount);
    }

    const now = performance.now();
    if (hasFastMovingCoin) {
      this.lastMovementTime = now;
      this.flowActiveTime += dtSeconds;
    } else {
      // Flow has stalled / quieted down
      const quietDuration = (now - this.lastMovementTime) / 1000;

      // Nudge coins gently towards exit if flow stalled with open gaps
      if (quietDuration > 1.2 && quietDuration < 2.5) {
        for (const coin of this.coins) {
          if (!coin.inJar && !coin.spilled && coin.body.position.y < this.level.exitY) {
            Body.applyForce(coin.body, coin.body.position, {
              x: -0.0006, // direct left toward exit!
              y: 0.0003,
            });
          }
        }
      }

      if (quietDuration > 1.0 && !this.hasReportedSettled && this.coinsInJarCount > 0) {
        this.hasReportedSettled = true;
        this.callbacks.onFlowSettled();
      }
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    World.clear(this.engine.world, false);
    Engine.clear(this.engine);
  }
}
