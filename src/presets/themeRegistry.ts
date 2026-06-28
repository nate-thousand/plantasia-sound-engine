/**
 * ASCII theme keys that host applications must implement.
 * Every preset `visual.asciiTheme` must appear here — validated at engine build.
 */
export const HOST_ASCII_THEMES = [
  'plantasonic',
  'moss',
  'roots',
  'root',
  'bloom',
  'canopy',
  'fern',
  'rainforest',
  'vine',
  'desert',
  'coral',
  'winter',
  'crystal',
  'night-bloom',
  'juno',
  'mycelium',
  'mutation',
  'seed',
] as const;

export type HostAsciiTheme = (typeof HOST_ASCII_THEMES)[number];

export function isRegisteredAsciiTheme(theme: string): theme is HostAsciiTheme {
  return (HOST_ASCII_THEMES as readonly string[]).includes(theme);
}
