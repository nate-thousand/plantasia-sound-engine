export { PlantasiaEngine } from './engine/plantasiaEngine.js';

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
  setPlantasonicPerformance,
} from './engine/audioEngine.js';

export { presets } from './presets/loader.js';

export {
  junoFlowersPreset,
  JUNO_FLOWERS_BOTANICAL,
  JUNO_FLOWERS_GROWTH,
  JUNO_FLOWERS_SCALE,
} from './synths/junoFlowers.js';

export {
  plantasonicPreset,
  PLANTASONIC_CONFIG,
  PLANTASONIC_SCALE,
} from './synths/plantasonic.js';

export type {
  BotanicalControlKey,
  BotanicalControls,
  SpeciesName,
  OrganismState,
} from './utils/types/botanical.js';

export { initialBotanicalControls } from './utils/types/botanical.js';

export type { SynthSettings, PlantasiaPreset } from './utils/types/presets.js';

export type { JunoBotanicalConfig, JunoGrowthConfig } from './utils/types/junoFlowers.js';

export type { PlantasonicConfig } from './utils/types/plantasonic.js';

export type { PlantasonicPerformanceState } from './synths/plantasonicAudio.js';
