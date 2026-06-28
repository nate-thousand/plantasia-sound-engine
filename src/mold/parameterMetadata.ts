import type { EngineParameterMeta } from './types.js';

export const MOLD_PARAMETER_META: EngineParameterMeta = {
  id: 'mold',
  name: 'Mold',
  description:
    'Introduces evolving tape wear, granular mutation, delay corruption, spectral decay, and organic sonic degradation.',
  min: 0,
  max: 100,
  defaultValue: 0,
  automatable: true,
  midiLearn: true,
};

/** Exported parameter metadata for hosts, MIDI, and automation. */
export const ENGINE_PARAMETER_METADATA: EngineParameterMeta[] = [MOLD_PARAMETER_META];
