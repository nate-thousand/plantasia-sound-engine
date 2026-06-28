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
  setMold,
  getMoldValue,
} from './engine/audioEngine.js';

export { presets, presetManifest, getPresetById, getPresetsByCategory } from './presets/loader.js';
export { getPresetMold, getPresetControls } from './presets/moldDefaults.js';
export { PRESET_ID_ALIASES, resolvePresetId } from './presets/aliases.js';
export { getPresetLiveRouting } from './presets/routing.js';
export type { LiveVoiceRouting } from './presets/routing.js';
export {
  HOST_ASCII_THEMES,
  isRegisteredAsciiTheme,
  type HostAsciiTheme,
} from './presets/themeRegistry.js';
export { validatePreset, validateAllPresets, type PresetValidationIssue } from './presets/validatePresets.js';

export {
  ENGINE_PARAMETER_METADATA,
  MOLD_PARAMETER_META,
  MOLD_PROFILES,
  resolveMoldParameters,
  resolveMoldProfile,
  setActiveMoldProfile,
  normalizeMold,
} from './mold/index.js';

export type {
  MoldEffectParams,
  MoldProfile,
  MoldModuleId,
  EngineParameterMeta,
} from './mold/types.js';

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

export type {
  SynthSettings,
  PlantasiaPreset,
  PresetControlDefaults,
  PresetVisualConfig,
  PresetMidiConfig,
  SoundWorldControlSurface,
} from './utils/types/presets.js';

export type { JunoBotanicalConfig, JunoGrowthConfig } from './utils/types/junoFlowers.js';

export type { PlantasonicConfig } from './utils/types/plantasonic.js';

export type { PlantasonicPerformanceState } from './synths/plantasonicAudio.js';

export {
  buildJunoSynthState,
  createJunoLiveVoice,
  ensureJunoRuntime,
  releaseJunoVoice,
  setJunoModeActive,
  stopAllJunoVoices,
  syncJunoBotanical,
  tickJunoLivingVoice,
  toJunoEnginePreset,
  applyJunoMold,
} from './synths/junoFlowersAudio.js';

export type {
  JunoBotanicalGraph,
  JunoEnginePreset,
  JunoLiveVoice,
  JunoSynthState,
} from './synths/junoFlowersAudio.js';

export {
  applyPlantasonicMold,
  buildPlantasonicPerformanceState,
  createPlantasonicLiveVoice,
  ensurePlantasonicRuntime,
  releasePlantasonicVoice,
  setPlantasonicModeActive,
  stopAllPlantasonicVoices,
  syncPlantasonicGraph,
  tickPlantasonicLivingVoice,
  toPlantasonicEnginePreset,
} from './synths/plantasonicAudio.js';

export type {
  PlantasonicEnginePreset,
  PlantasonicGraph,
  PlantasonicLiveVoice,
} from './synths/plantasonicAudio.js';
