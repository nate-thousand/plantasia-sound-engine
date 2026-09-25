/**
 * Seed control depths: every constant in the ecology mapping, named, so the
 * lab can tune them live and the sound pass can write them back (ROADMAP
 * decision 10 after 1.1.0). Keys read `<what>_<control>`; `<what>_base` is the
 * value at every control 0. Units are the target's own.
 */
export const SEED_DEPTHS = {
  filter_growth: 0.22,
  filter_bloom: 0.12,
  filter_roots: -0.1,
  drift_base: 0.1,
  drift_mold: 0.08,
  driftRate_base: 0.04,
  driftRate_bacteria: 0.12,
  tapeWet_base: 0.1,
  tapeWet_mold: 0.22,
  tapeDrive_base: 0.1,
  tapeDrive_mold: 0.2,
  chorusWet_base: 0.18,
  chorusWet_bloom: 0.35,
  reverbWet_base: 0.22,
  reverbWet_bloom: 0.42,
  delayWet_base: 0.08,
  delayWet_bloom: 0.18,
  delayFeedback_base: 0.1,
  delayFeedback_mold: 0.14,
  release_bloom: 0.45,
  release_roots: 0.2,
};
export type SeedDepths = { [K in keyof typeof SEED_DEPTHS]: number };
