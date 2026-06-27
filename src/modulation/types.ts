/** Modulation source identifiers (future modulation matrix). */
export type ModSourceId = 'lfo1' | 'lfo2' | 'adsr' | 'random' | 'velocity';

/** Modulation destination identifiers. */
export type ModDestinationId =
  | 'filterCutoff'
  | 'filterQ'
  | 'oscillatorDetune'
  | 'amplitude'
  | 'pan';

/** A single modulation route (placeholder). */
export interface ModRoute {
  source: ModSourceId;
  destination: ModDestinationId;
  amount: number;
}

/** Modular modulation bus scaffold — routing not implemented yet. */
export interface ModulationMatrix {
  readonly routes: readonly ModRoute[];
}

export function createModulationMatrix(): ModulationMatrix {
  return { routes: [] };
}
