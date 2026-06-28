/** Legacy / display-name aliases → canonical preset ids. */
export const PRESET_ID_ALIASES: Record<string, string> = {
  moss: 'seed',
  roots: 'root',
  canopy: 'fern',
  rainforest: 'vine',
  desert: 'coral',
  winter: 'crystal',
  'night-bloom': 'juno-flowers',
  'juno-flowers': 'juno-flowers',
};

export function resolvePresetId(idOrAlias: string): string {
  return PRESET_ID_ALIASES[idOrAlias] ?? idOrAlias;
}
