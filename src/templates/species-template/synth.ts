/**
 * Template synth graph — replace with Tone.js voices, filters, and routing.
 *
 * Responsibilities:
 * - createTemplateSynth() — build nodes
 * - disposeTemplateSynth() — release nodes
 * - Export constants for base levels used by performanceApply
 */

// import * as Tone from 'tone';

export type TemplateSynthNodes = {
  // poly: Tone.PolySynth;
  // filter: Tone.Filter;
};

export function createTemplateSynth(): TemplateSynthNodes {
  throw new Error('Template synth not implemented — copy and implement for your species');
}

export function disposeTemplateSynth(_nodes: TemplateSynthNodes): void {
  // nodes.poly.dispose();
}
