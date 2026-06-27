export { PlantasiaEngine } from './plantasiaEngine.js';

export {
  initAudio,
  playPreset,
  stopAudio,
  applyBotanicalControls,
  triggerChord,
  setTempo,
  getWaveform,
  getLevel,
  updateParameter,
  defaultNotePool,
} from './audio/audioEngine.js';

export { presets } from './data/presets.js';

export {
  junoFlowersPreset,
  JUNO_FLOWERS_BOTANICAL,
  JUNO_FLOWERS_GROWTH,
  JUNO_FLOWERS_SCALE,
} from './species/junoFlowers.js';

export type {
  BotanicalControlKey,
  BotanicalControls,
  SpeciesName,
  OrganismState,
} from './types/botanical.js';

export { initialBotanicalControls } from './types/botanical.js';

export type { SynthSettings, PlantasiaPreset } from './types/presets.js';

export type { JunoBotanicalConfig, JunoGrowthConfig } from './types/junoFlowers.js';
