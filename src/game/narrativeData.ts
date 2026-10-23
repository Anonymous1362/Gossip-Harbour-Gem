import { StoryBranchPoint, StoryEnding, NarrativeSaveState } from './narrativeTypes';

export const STORY_BRANCHES: StoryBranchPoint[] = [
  {
    id: 'ch1_heat_source',
    chapterNumber: 1,
    title: 'Chapter I: The Frigid Gale',
    subtitle: 'A howling blizzard batters the broken loft windows. Frost crawls across the floorboards.',
    situation:
      'Captain Maeve shivers under ragged blankets while frost coats the floorboards. The golden coins poured from the hopper can fund an immediate survival solution. Which path do you forge?',
    minLevelRequired: 1,
    cameraPreset: 'cinematic',
    choices: [
      {
        id: 'c1_stsourcePort',
        label: 'Cast-Iron Hearth & Fire',
        tagline: 'Stoke radiant warmth with salvaged dry driftwood',
        description:
          'Build an artisanal stone hearth downstairs. Warm amber heat fills the rafters, melting window frost and comforting the ginger cat.',
        consequences: {
          goldDelta: 50,
          moralAlignment: 'compassion',
          summary: 'The loft becomes a warm sanctuary. Maeve recovers her vitality and spirits.',
        },
        visualImpact: {
          cameraTarget: 'cinematic',
          soundFx: 'hearth',
          highlightPropId: 'fireplace',
        },
        icon: '🔥',
        accentColor: 'amberLantern',
      },
      {
        id: 'c1_steam_vent',
        label: 'Brass Turbine Steam Vent',
        tagline: 'Engineer an industrial thermal duct from boiler steam',
        description:
          'Install a precision brass ventilation intake linked to the quay steam line. High-pressure steam warms the walls with rhythmic mechanical whistles.',
        consequences: {
          goldDelta: 60,
          moralAlignment: 'industry',
          summary: 'Steam pipes hiss rhythmically with engineered efficiency.',
        },
        visualImpact: {
          cameraTarget: 'strategic',
          soundFx: 'steam',
          highlightPropId: 'vent',
        },
        icon: '⚙️',
        accentColor: 'tealLattice',
      },
    ],
  },
  {
    id: 'ch2_harbor_signal',
    chapterNumber: 2,
    title: 'Chapter II: The Harbor Fog Signal',
    subtitle: 'Thick maritime pea-soup fog rolls in from the bay. Distant distress horns echo.',
    situation:
      'A storm-tossed fishing trawler is lost amidst the jagged rocks outside Lantern Quay. Scavenger skiffs also patrol the mist looking for unprotected gold hoards.',
    minLevelRequired: 2,
    cameraPreset: 'strategic',
    choices: [
      {
        id: 'c2_beacon',
        label: 'Ignite the Golden Beacon',
        tagline: 'Power the maritime lantern to guide the stranded crew home',
        description:
          'Shine a brilliant beam through the attic window into the foggy bay. The trawler docks safely, rewarding the quay with fresh crates and trade connections.',
        consequences: {
          goldDelta: 80,
          moralAlignment: 'compassion',
          summary: 'Grateful sailors hail the quay. The harbor community rallies around your light.',
        },
        visualImpact: {
          cameraTarget: 'cinematic',
          soundFx: 'bell',
          highlightPropId: 'lantern',
        },
        icon: '🏮',
        accentColor: 'amberLantern',
      },
      {
        id: 'c2_blackout',
        label: 'Fortify in Stealth Blackout',
        tagline: 'Douse lights and bolster the quay iron barricades',
        description:
          'Keep Lantern Quay hidden in the shadow of the wharf. The scavengers sail past without detecting your golden cache, preserving absolute security.',
        consequences: {
          goldDelta: 100,
          moralAlignment: 'fortitude',
          summary: 'The quay fortress remains untouched, though lonely echoes linger across the water.',
        },
        visualImpact: {
          cameraTarget: 'strategic',
          soundFx: 'chime',
          highlightPropId: 'chest',
        },
        icon: '🛡️',
        accentColor: 'ironDark',
      },
    ],
  },
  {
    id: 'ch3_quay_destiny',
    chapterNumber: 3,
    title: 'Chapter III: The Destiny of Lantern Quay',
    subtitle: 'Spring thaw approaches. The gold vaults of Lantern Quay overflow with promise.',
    situation:
      'With your coin vaults brimming and the loft restored, the master craftsmen and harbor guild petition Captain Maeve for the final legacy of Lantern Quay.',
    minLevelRequired: 4,
    cameraPreset: 'cinematic',
    choices: [
      {
        id: 'c3_haven',
        label: 'The Lantern Haven Tavern',
        tagline: 'Convert the loft into a warm maritime traveler inn',
        description:
          'A roaring hearth, velvet seating, hot spiced cider, and fiddle music welcome sailors from every sea. Lantern Quay becomes the heartbeat of the coast.',
        consequences: {
          goldDelta: 120,
          moralAlignment: 'compassion',
          summary: 'Laughter and glowing lanterns spill out into the night waters.',
        },
        visualImpact: {
          cameraTarget: 'cinematic',
          soundFx: 'hearth',
          highlightPropId: 'bed',
        },
        icon: '🍻',
        accentColor: 'coralShell',
      },
      {
        id: 'c3_observatory',
        label: 'Clockwork Navigational Bastion',
        tagline: 'Build an automated mechanical observatory tower',
        description:
          'Brass clockwork gears, pendulum chronometers, and astronomical brass lenses calculate ocean tides with unmatched scientific precision.',
        consequences: {
          goldDelta: 140,
          moralAlignment: 'industry',
          summary: 'The precision ticking of giant brass gears echoes across the harbor.',
        },
        visualImpact: {
          cameraTarget: 'strategic',
          soundFx: 'steam',
          highlightPropId: 'clock',
        },
        icon: '🕰️',
        accentColor: 'antiqueBrass',
      },
      {
        id: 'c3_voyage',
        label: 'The Golden Steam Clipper',
        tagline: 'Outfit a grand exploratory vessel to chart the unknown seas',
        description:
          'Commission the flagship "Gilded Horizon" equipped with reinforced copper hulls and steam boilers to sail beyond charted archipelagoes.',
        consequences: {
          goldDelta: 160,
          moralAlignment: 'fortitude',
          summary: 'The deep bellow of the ship horn announces departure into legend.',
        },
        visualImpact: {
          cameraTarget: 'strategic',
          soundFx: 'bell',
          highlightPropId: 'bollard',
        },
        icon: '⛵',
        accentColor: 'iceBlue',
      },
    ],
  },
];

export const STORY_ENDINGS: Record<string, StoryEnding> = {
  haven: {
    id: 'haven',
    title: 'Ending I: The Hearth of the Coast',
    subtitle: 'The Haven of Fellowship & Warmth',
    description:
      'Lantern Quay transformed from a cold, forsaken attic into the most beloved waypoint in the northern seas. Sailors cross stormy oceans just to see the warm amber lanterns shining in your window.',
    icon: '🏮',
    badge: 'Beacon of Fellowship',
    epilogue:
      'Maeve and her companion smile beside the roaring hearth as fiddle melodies float out across the tranquil quay.',
  },
  observatory: {
    id: 'observatory',
    title: 'Ending II: The Clockwork Citadel',
    subtitle: 'The Triumph of Mechanical Mastery',
    description:
      'Lantern Quay is recognized as the world premiere navigational center. Its precision brass clockworks and steam-driven turbines chart ocean currents and weather patterns for all seafaring vessels.',
    icon: '⚙️',
    badge: 'Master Architect',
    epilogue:
      'A symphony of polished brass gears, pendulum sweeps, and golden dials operates with perpetual clockwork harmony.',
  },
  voyage: {
    id: 'voyage',
    title: 'Ending III: Horizon Sovereign',
    subtitle: 'The Voyage of the Gilded Horizon',
    description:
      'Armed with fortune and fearlessness, the crew of Lantern Quay departed into the boundless western oceans, discovering legendary uncharted islands and founding prosperous trading harbors.',
    icon: '⛵',
    badge: 'Legendary Voyager',
    epilogue:
      'As the ship sails toward the sunset, the golden compass points true toward boundless wonders.',
  },
};

/**
 * Pure function to calculate the resulting story ending based on player choices.
 */
export function determineEnding(chosenOptions: Record<string, string>): StoryEnding | null {
  const ch3Choice = chosenOptions['ch3_quay_destiny'];
  if (!ch3Choice) return null;

  if (ch3Choice === 'c3_haven') {
    return STORY_ENDINGS.haven;
  }
  if (ch3Choice === 'c3_observatory') {
    return STORY_ENDINGS.observatory;
  }
  if (ch3Choice === 'c3_voyage') {
    return STORY_ENDINGS.voyage;
  }
  return STORY_ENDINGS.haven;
}
