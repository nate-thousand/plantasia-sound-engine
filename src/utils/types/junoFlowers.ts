/** Botanical routing blocks from the Juno Flowers signature engine. */
export type JunoBotanicalConfig = {
  morningMist: { mix: number; size: number; damp: number };
  roots: { shelfGain: number; sub: number; sat: number };
  pollen: { width: number; chorusRate: number; chorusDepth: number; shimmer: number };
  photosynthesis: { sat: number; lift: number; clip: number };
  canopy: { spread: number; chorusWidth: number; reverbWidth: number };
  wind: { depth: number; rate: number; drift: number };
};

/** Growth-stage behavior metadata (hold-time bloom stages). */
export type JunoGrowthConfig = {
  speed: number;
  bloomIntensity: number;
  movementAmount: number;
  particleAmount: number;
};
