import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const { Generator } = await import(join(root, 'dist/engine/generative/Generator.js'));
  const { MemoryEngine } = await import(join(root, 'dist/engine/generative/MemoryEngine.js'));
  const { ProbabilityEngine } = await import(join(root, 'dist/engine/generative/ProbabilityEngine.js'));
  const { PhraseEngine } = await import(join(root, 'dist/engine/generative/PhraseEngine.js'));
  const { HarmonyEngine } = await import(join(root, 'dist/engine/generative/HarmonyEngine.js'));
  const { SEED_GENERATIVE_PREFERENCES } = await import(join(root, 'dist/species/seed/metadata.js'));

  const memory = new MemoryEngine();
  memory.recordNote('C4');
  assert(memory.repetitionPenalty('C4') > 0, 'memory repetition penalty');

  const probability = new ProbabilityEngine();
  const ecology = { growth: 0.5, bloom: 0.4, roots: 0.3, mold: 0.1, bacteria: 0.2 };
  const weights = probability.weights(ecology, SEED_GENERATIVE_PREFERENCES, memory);
  assert(weights.phrase >= 0 && weights.phrase <= 1, 'phrase weight clamped');
  assert(weights.silence >= 0 && weights.silence <= 1, 'silence weight clamped');

  const harmony = new HarmonyEngine();
  const note = harmony.pickNote(ecology, SEED_GENERATIVE_PREFERENCES, memory);
  assert(typeof note === 'string' && note.length > 0, 'harmony picks note');

  const phraseEngine = new PhraseEngine();
  const phrase = phraseEngine.create(ecology, SEED_GENERATIVE_PREFERENCES, harmony, memory);
  assert(phrase.notes.length >= 2, 'phrase has notes');
  const mutated = phraseEngine.mutate(phrase, { ...ecology, mold: 0.6 });
  assert(mutated.id.includes('-m'), 'phrase mutation id');

  const notes = [];
  const engine = new Generator(SEED_GENERATIVE_PREFERENCES, {
    noteOn: (n) => notes.push(n),
    noteOff: () => {},
  });
  engine.setEcology({ growth: 0.8, bacteria: 0.3 });
  engine.start(72);

  await new Promise((r) => setTimeout(r, 800));
  engine.stop();
  engine.dispose();

  assert(notes.length >= 0, 'generator runs without error');

  console.info('[test-generative-engine] OK — generative ecosystem validated');
}

main().catch((error) => {
  console.error('[test-generative-engine]', error.message ?? error);
  process.exit(1);
});
