# AI STUDIO MASTER PROMPT: Lantern Quay (paste as one message)

Before pasting: in Build mode choose **Web app, React (TypeScript)**, model Gemini 3.8 Flash, thinking at max. Attach the screen-recorded ad video (the .mp4), plus the clean frame sheets if you have room. If it refuses a big file, use the 2 clips (`gossip_part1.mp4`, `gossip_part2.mp4`).

---

Build an original mobile-portrait physics puzzle game called **Lantern Quay**, in React + TypeScript, client-side only (no server, no Firebase, no Gemini API calls inside the game). Use npm packages **three** and **matter-js**.

## 1. Study the attached video first
Watch the whole video frame by frame. It is a mobile game ad. **Ignore every ad overlay**: the corner logo, the "Google Play" badge, the "PLAY NOW" button, the install end card. Reproduce only the gameplay look and mechanic you see. Before writing code, write a short numbered description of what you observed (hopper shape, pin lattice, how pins are pulled, coin flow, jar and character, room, lighting, reward screen). Then build to that description.

Key observations to confirm (correct me if the video shows otherwise):
- A glossy red-orange **hourglass hopper**: top bulb packed with hundreds of small glossy gold coins, narrow neck, a pentagon-shaped lower chamber with lighter-orange interior.
- Inside the lower chamber: a **lattice of thin teal rods with round heads**, two sets crossing diagonally into a diamond mesh that holds the coins back. Exit at the lower-left, directly above a jar.
- Tapping a rod slides it out along its axis (head leading), then it flies away with a whoosh. Coins pour through gaps, slide down remaining diagonal rods, and stream out the exit into the jar.
- A small glass jar (gold lid) held at chest height by a character lying propped on a bed, right under the exit. A coin icon and counter beside it tick up.
- Dark brick cutaway room: wooden floor, ladder, loft bed, pipes, window glow, a cat. Cool blue-teal shadows; the hopper is the brightest, most saturated object.
- Afterwards, coins fund restoring the room (shop panel with prices, bed turns clean and warm, sparkles).
- **No lava and no hazards.** Difficulty comes from which rods you pull and in what order.

## 2. Architecture (must be export-friendly to GitHub)
- `src/game/` (physics, levels, rules), `src/render/` (three.js scene, hopper, rods, coins, room, character, vfx), `src/audio/` (WebAudio synth, no files), `src/ui/` (React HUD, overlays), `src/save/` (localStorage, try/catch).
- The game loop and three.js scene live outside React state: React only renders the HUD and overlays. No React re-render per frame.
- Physics is 2D (matter-js), rendering is 3D (three.js), fixed perspective camera, FOV about 28, slight top-down tilt, portrait layout that fits the whole hopper, jar, bed and loft with margin on a 390x844 phone.
- Fixed timestep with 2 to 4 physics substeps; thin rods get colliders at least 1.5x thicker than their visuals to prevent tunneling.
- Static build, relative asset paths, PWA manifest and service worker with versioned cache, a small build number in a screen corner.

## 3. Mechanics
- Coins: small, 220 to 320 per level (provide a low-end tier with fewer), restitution about 0.02, friction about 0.15. Pour about 6 to 8 coins/s once a channel is open; if flow stalls for more than 1.5 s with open gaps, nudge nearby coins gently.
- Lattice: two sets of diagonal rods (35 to 45 degrees), 7 to 11 per set, mesh cells smaller than a coin diameter so the intact mesh holds coins; pulling the right rods opens a gap of at least 1.4x coin diameter.
- Rod roles: `gate` rods block the exit; `support` rods hold coins on a slope, and pulling one dumps coins past the jar (spill). Wrong pulls cost stars, not instant failure.
- Jar: thin rim colliders with restitution 0, plus an inward-sloped invisible catch funnel so coins never bounce off the rim. Coins pile naturally.
- Levels as JSON (`src/levels/*.json`): rods, roles, exit, jar, coin count, star thresholds (3 stars at 92%+ in the jar and at most 2 spills, 2 stars at 75%+, 1 star at 50%+). Author 10 levels with a real difficulty curve (L1: one gate rod; L3-5: order matters; L6-8: decoy support rods; L9-10: two exits).
- Win when at least 50% of coins are in the jar and flow has stopped for 1 s. Add a headless solvability test for every level.

## 4. Look
- Hopper: glossy shell with specular streaks, rear rim light, lighter interior, cream glow where gold touches the glass.
- Coins: small glossy warm gold, one shared material, instanced, tiny sparkles; not pale or over-exposed.
- Rods: thin teal emissive, round heads, soft halo, socket caps where they pass through the shell. No rod ever floats in mid-air.
- Character: original low-poly figure (copper-red bob, mustard top, jeans), reclining on the bed, both hands holding the jar; breathing idle, happy bounce on win. Under 300 triangles per prop, flat shaded.
- Room: procedural canvas textures (brick, planks), ladder, loft bed, pipes, shelves, a cat silhouette; warm pendant lamp on the hopper, cool blue window fill, soft vignette, floating dust specks. At most 3 lights; low tier uses baked vertex colors.
- Juice: pin-pull slide-out and fly-off with spin, small camera nudge, haptic tick, stream glow trail, jar wobble every 10 coins, counter pop, win slow-mo with coin confetti and stars.
- Audio (WebAudio only): whoosh, coin clink with rising pitch, jar plink, win arpeggio, UI tap, quiet ambience, saved mute, unlock on first tap.

## 5. Work plan (stop after each stage and wait for my screenshot)
- **Stage 1:** scene layout, hopper, lattice, coins, jar, counter, levels 1 to 3, win/lose, basic sounds.
- **Stage 2:** full visual pass against the video (materials, character, room, lighting, VFX).
- **Stage 3:** levels 4 to 10, stars, save, settings, tutorial hint.
- **Stage 4:** room-restoration shop screen with before/after reveal.
- **Stage 5:** performance tiers, PWA polish, export notes.
Target 60 fps, 30 fps floor on a Redmi 9-class phone; pixel ratio capped at 1.5; `?debug` shows FPS.

## 6. Rules
- Original names, characters and art only; do not copy another game's branding.
- State plainly what you verified and what you could not (real phone GPU, audio).
- After each stage, list the specific visual differences from the video that remain.
- Begin with the numbered observation list, then Stage 1.
