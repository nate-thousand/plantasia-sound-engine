export { seedSpecies, createSeedSoundWorld } from './seed/index.js';
export { flowersSpecies, createFlowersSoundWorld } from './flowers/index.js';
export { moldSpecies, createMoldSoundWorld } from './mold/index.js';
export { bacteriaSpecies, createBacteriaSoundWorld } from './bacteria/index.js';
import { SEED_DEPTHS } from './seed/depths.js';
import { FLOWERS_DEPTHS } from './flowers/depths.js';
import { MOLD_DEPTHS } from './mold/depths.js';
import { BACTERIA_DEPTHS } from './bacteria/depths.js';
export { SEED_DEPTHS, FLOWERS_DEPTHS, MOLD_DEPTHS, BACTERIA_DEPTHS };

/** Default control depths per built in species (lab and sound pass; ROADMAP decision 10 after 1.1.0). */
export const CONTROL_DEPTH_DEFAULTS: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  seed: SEED_DEPTHS,
  flowers: FLOWERS_DEPTHS,
  mold: MOLD_DEPTHS,
  bacteria: BACTERIA_DEPTHS,
};
