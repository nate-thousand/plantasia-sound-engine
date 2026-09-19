import type { EcologicalControl } from '../engine/SoundWorld.js';
import type { GenerativeEcology } from '../engine/generative/types.js';

type EcologyAwareGenerator = {
  setEcology: (partial: Partial<GenerativeEcology>) => void;
};

/** Push species control state (0–100) into the shared Generative Engine (0–1). */
export function syncGeneratorEcology(
  generator: EcologyAwareGenerator | null,
  controls: Record<EcologicalControl, number>,
): void {
  if (!generator) {
    return;
  }
  generator.setEcology({
    growth: controls.growth / 100,
    bloom: controls.bloom / 100,
    roots: controls.roots / 100,
    mold: controls.mold / 100,
    bacteria: controls.bacteria / 100,
  });
}
