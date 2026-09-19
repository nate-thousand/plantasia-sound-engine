import { DEFAULT_ECOLOGY_STATE } from '../EcologyControls.js';
import type { EngineScheduler } from '../scheduler/EngineScheduler.js';
import { createEngineScheduler } from '../scheduler/EngineScheduler.js';
import { HarmonyEngine } from './HarmonyEngine.js';
import { MemoryEngine } from './MemoryEngine.js';
import { PhraseEngine } from './PhraseEngine.js';
import { ProbabilityEngine } from './ProbabilityEngine.js';
import { RhythmEngine } from './RhythmEngine.js';
import type {
  GenerativeCallbacks,
  GenerativeEcology,
  GenerativeEventKind,
  GenerativeNoteEmit,
  GenerativePreferences,
} from './types.js';

export type GeneratorOptions = {
  scheduler?: EngineScheduler;
};

/**
 * Central generative orchestration — schedules composition events without
 * knowing about oscillators or Tone.js. Species supply {@link GenerativePreferences}.
 */
export class Generator {
  private readonly harmony = new HarmonyEngine();
  private readonly rhythm = new RhythmEngine();
  private readonly probability = new ProbabilityEngine();
  private readonly memory = new MemoryEngine();
  private readonly phraseEngine = new PhraseEngine();
  private readonly scheduler: EngineScheduler;

  private ecology: GenerativeEcology = { ...DEFAULT_ECOLOGY_STATE };
  private running = false;
  private tickTimerId: number | null = null;
  private backgroundTimerId: number | null = null;
  private releaseTimerIds = new Set<number>();

  constructor(
    private readonly preferences: GenerativePreferences,
    private readonly callbacks: GenerativeCallbacks,
    options: GeneratorOptions = {},
  ) {
    this.scheduler = options.scheduler ?? createEngineScheduler();
  }

  setEcology(partial: Partial<GenerativeEcology>): void {
    this.ecology = { ...this.ecology, ...partial };
    this.memory.recordEcology(this.ecology);
  }

  getEcology(): Readonly<GenerativeEcology> {
    return { ...this.ecology };
  }

  /** Manual performance trigger — localized burst at a note. */
  triggerAtNote(note: string, velocity: number): void {
    const count = 2 + Math.floor(this.ecology.growth * 4);
    const emits: GenerativeNoteEmit[] = [];
    for (let i = 0; i < count; i += 1) {
      emits.push({
        note,
        velocity: velocity * (0.65 + Math.random() * 0.35),
        holdMs: 120 + Math.random() * 280,
        kind: 'particle',
        delayMs: i * (25 + Math.random() * 40),
      });
    }
    this.dispatch(emits);
  }

  start(tempo = this.preferences.preferredTempo): void {
    this.stop();
    this.running = true;
    void tempo;
    this.scheduleTick();

    if (this.preferences.rhythmStyle === 'swarm' || this.ecology.bacteria > 0.25) {
      this.backgroundTimerId = this.scheduler.setInterval(() => {
        if (!this.running) {
          return;
        }
        this.backgroundMicroTick();
      }, 240, 'generator-background');
    }
  }

  stop(): void {
    this.running = false;
    if (this.tickTimerId != null) {
      this.scheduler.clearTimeout(this.tickTimerId);
      this.tickTimerId = null;
    }
    if (this.backgroundTimerId != null) {
      this.scheduler.clearInterval(this.backgroundTimerId);
      this.backgroundTimerId = null;
    }
    for (const id of this.releaseTimerIds) {
      this.scheduler.clearTimeout(id);
    }
    this.releaseTimerIds.clear();
  }

  dispose(): void {
    this.stop();
    this.phraseEngine.reset();
    this.rhythm.reset();
    this.probability.reset();
  }

  private emitGeneratorEvent(
    kind: GenerativeEventKind,
    extra?: { note?: string; velocity?: number; intensity?: number },
  ): void {
    this.callbacks.onGeneratorEvent?.({ kind, ...extra });
  }

  private scheduleTick(): void {
    if (!this.running) {
      return;
    }

    const plan = this.rhythm.nextPlan(this.ecology, this.preferences);
    this.tickTimerId = this.scheduler.setTimeout(() => {
      this.tickTimerId = null;
      if (!this.running) {
        return;
      }
      this.probability.advanceTick();
      this.compose(plan);
      this.scheduleTick();
    }, plan.intervalMs, 'generator-tick');
  }

  private backgroundMicroTick(): void {
    if (this.ecology.bacteria < 0.15) {
      return;
    }
    if (
      this.probability.roll('particle', this.ecology, this.preferences, this.memory) ||
      this.probability.roll('ornament', this.ecology, this.preferences, this.memory)
    ) {
      const note = this.harmony.pickNote(this.ecology, this.preferences, this.memory, true);
      this.dispatch([
        {
          note,
          velocity: this.harmony.velocityForKind('ornament', this.ecology),
          holdMs: 100 + Math.random() * 220,
          kind: 'ornament',
        },
      ]);
    }
  }

  private compose(plan: ReturnType<RhythmEngine['nextPlan']>): void {
    const { ecology, preferences: prefs, memory, harmony, probability, phraseEngine } = this;

    if (probability.roll('glitch', ecology, prefs, memory)) {
      const intensity = ecology.mold * 0.5 + ecology.bacteria * 0.35;
      this.callbacks.onGlitch?.(intensity);
      this.emitGeneratorEvent('glitch', { intensity });
    }

    if (probability.roll('silence', ecology, prefs, memory)) {
      this.emitGeneratorEvent('silence');
      return;
    }

    const emits: GenerativeNoteEmit[] = [];

    if (probability.roll('particle', ecology, prefs, memory) && plan.cluster) {
      const center = harmony.pickNote(ecology, prefs, memory);
      const swarmSize = Math.round(2 + ecology.bacteria * 6 + ecology.growth * 3);
      for (let i = 0; i < swarmSize; i += 1) {
        emits.push({
          note: center,
          velocity: harmony.velocityForKind('particle', ecology),
          holdMs: this.rhythm.holdMs(180, plan, ecology),
          kind: 'particle',
          delayMs: i * (18 + Math.random() * 35),
        });
      }
    } else if (probability.roll('drone', ecology, prefs, memory)) {
      const chord = harmony.pickChord(ecology, prefs, memory);
      const degraded = harmony.applyMoldDegradation(chord, ecology);
      for (const note of degraded) {
        emits.push({
          note,
          velocity: harmony.velocityForKind('drone', ecology),
          holdMs: this.rhythm.holdMs(8000, plan, ecology),
          kind: 'drone',
        });
      }
    } else if (probability.roll('chord', ecology, prefs, memory)) {
      const chord = harmony.pickChord(ecology, prefs, memory);
      const degraded = harmony.applyMoldDegradation(chord, ecology);
      for (const note of degraded) {
        emits.push({
          note,
          velocity: harmony.velocityForKind('chord', ecology),
          holdMs: this.rhythm.holdMs(4200, plan, ecology),
          kind: 'chord',
        });
      }
    } else if (probability.roll('phrase', ecology, prefs, memory)) {
      const phrase = phraseEngine.getOrEvolve(ecology, prefs, harmony, memory);
      const notes = harmony.applyMoldDegradation(phrase.notes, ecology);
      notes.forEach((note, i) => {
        emits.push({
          note,
          velocity: harmony.velocityForKind('phrase', ecology),
          holdMs: this.rhythm.holdMs(1400, plan, ecology),
          kind: 'phrase',
          delayMs: i * plan.stepMs,
        });
      });
    } else if (probability.roll('ornament', ecology, prefs, memory)) {
      emits.push({
        note: harmony.pickNote(ecology, prefs, memory, true),
        velocity: harmony.velocityForKind('ornament', ecology),
        holdMs: this.rhythm.holdMs(280, plan, ecology),
        kind: 'ornament',
      });
    }

    this.dispatch(emits);
  }

  private dispatch(emits: GenerativeNoteEmit[]): void {
    for (const emit of emits) {
      const play = () => {
        if (!this.running) {
          return;
        }
        this.callbacks.noteOn(emit.note, emit.velocity);
        this.emitGeneratorEvent(emit.kind, { note: emit.note, velocity: emit.velocity });
        const releaseId = this.scheduler.setTimeout(() => {
          this.releaseTimerIds.delete(releaseId);
          this.callbacks.noteOff(emit.note);
        }, emit.holdMs, 'generator-release');
        this.releaseTimerIds.add(releaseId);
      };

      if (emit.delayMs && emit.delayMs > 0) {
        this.scheduler.setTimeout(play, emit.delayMs, 'generator-delay');
      } else {
        play();
      }
    }
  }
}

export type {
  GenerativeCallbacks,
  GenerativeEcology,
  GenerativeNoteEmit,
  GenerativePreferences,
  HarmonyStyle,
  RhythmStyle,
} from './types.js';
