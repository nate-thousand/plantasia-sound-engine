export type BotanicalControlKey =
  | 'energy'
  | 'growth'
  | 'density'
  | 'evolution'
  | 'random'
  | 'life'
  | 'space'
  | 'texture'
  | 'harmony'
  | 'resonance'
  | 'mold';

export type BotanicalControls = Record<BotanicalControlKey, number>;

export type SpeciesName =
  | 'Fern'
  | 'Moss'
  | 'Coral'
  | 'Flower'
  | 'Tree'
  | 'Vine'
  | 'Crystal'
  | 'Alien'
  | 'Mushroom'
  | 'Juno Flowers'
  | 'Plantasonic';

/** Organism lifecycle state referenced by presets (audio metadata only). */
export type OrganismState =
  | 'seed'
  | 'growth'
  | 'bloom'
  | 'mutation'
  | 'mycelium'
  | 'ecosystem';

export const initialBotanicalControls: BotanicalControls = {
  energy: 62,
  growth: 48,
  density: 54,
  evolution: 36,
  random: 22,
  life: 68,
  space: 44,
  texture: 57,
  harmony: 72,
  resonance: 46,
  mold: 0,
};
