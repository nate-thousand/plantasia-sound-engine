import type { PlantasiaPreset } from '../utils/types/presets.js';
import { isRegisteredAsciiTheme } from './themeRegistry.js';

export type PresetValidationIssue = {
  presetId: string;
  field: string;
  message: string;
};

function clampIssue(
  presetId: string,
  field: string,
  value: number,
  min: number,
  max: number,
): PresetValidationIssue | null {
  if (value < min || value > max) {
    return {
      presetId,
      field,
      message: `${field} must be ${min}–${max}, got ${value}`,
    };
  }
  return null;
}

/** Validate Sound World metadata on a single preset. */
export function validatePreset(preset: PlantasiaPreset): PresetValidationIssue[] {
  const issues: PresetValidationIssue[] = [];
  const id = preset.id;

  if (!preset.name?.trim()) {
    issues.push({ presetId: id, field: 'name', message: 'name is required' });
  }

  const theme = preset.visual?.asciiTheme;
  if (theme && !isRegisteredAsciiTheme(theme)) {
    issues.push({
      presetId: id,
      field: 'visual.asciiTheme',
      message: `"${theme}" is not in HOST_ASCII_THEMES — add to themeRegistry.ts and host THEME_TEMPLATES`,
    });
  }

  const intensity = preset.visual?.visualIntensity;
  if (intensity != null) {
    const issue = clampIssue(id, 'visual.visualIntensity', intensity, 0, 1);
    if (issue) {
      issues.push(issue);
    }
  }

  const controls = preset.controls;
  if (controls) {
    for (const [key, value] of Object.entries(controls)) {
      if (typeof value === 'number') {
        const issue = clampIssue(id, `controls.${key}`, value, 0, 100);
        if (issue) {
          issues.push(issue);
        }
      }
    }
  }

  const midi = preset.midi;
  if (midi?.program != null && (midi.program < 0 || midi.program > 127)) {
    issues.push({
      presetId: id,
      field: 'midi.program',
      message: `midi.program must be 0–127, got ${midi.program}`,
    });
  }

  return issues;
}

/** Validate all bundled presets; throws on failure when strict. */
export function validateAllPresets(
  presets: PlantasiaPreset[],
  options: { strict?: boolean } = {},
): PresetValidationIssue[] {
  const issues = presets.flatMap(validatePreset);

  if (issues.length > 0) {
    const summary = issues.map((i) => `  [${i.presetId}] ${i.field}: ${i.message}`).join('\n');
    const message = `Preset validation failed (${issues.length} issue(s)):\n${summary}`;

    if (options.strict) {
      throw new Error(message);
    }
    console.warn(message);
  }

  return issues;
}
