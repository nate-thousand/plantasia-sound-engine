/**
 * Modulation engine (ROADMAP decisions for 1.1.0).
 *
 * Global, beside the species manager. Holds routes and their source
 * runtimes, ticks at 30 Hz while the engine runs, and produces a frame of
 * modulated control values and target offsets that the facade hands to the
 * loaded species. Modulation adds to the host's base and never overwrites it.
 */
import { ECOLOGICAL_CONTROLS, clampEcologyValue, type EcologyControlState } from '../EcologyControls.js';
import type { EcologicalControl } from '../SoundWorld.js';
import { audioNow } from '../clock.js';
import { createSource, sourceId, type ModulationEnvironment, type ModulationSource } from './sources.js';
import {
  MODULATABLE_TARGETS,
  MODULATION_TARGET_SPANS,
  type ModulatableTarget,
  type ModulationDestination,
  type ModulationFrame,
  type ModulationRoute,
  type ModulationRouteConfig,
  type ModulationSourceDescriptor,
  type ModulationState,
} from './types.js';

export class ModulationRouteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ModulationRouteError';
  }
}

const CONTROL_SET = new Set<string>(ECOLOGICAL_CONTROLS);
const TARGET_SET = new Set<string>(MODULATABLE_TARGETS);

function parseDestination(destination: string): { control?: EcologicalControl; target?: ModulatableTarget } {
  if (CONTROL_SET.has(destination)) {
    return { control: destination as EcologicalControl };
  }
  if (destination.startsWith('target:')) {
    const target = destination.slice('target:'.length);
    if (TARGET_SET.has(target)) {
      return { target: target as ModulatableTarget };
    }
  }
  throw new ModulationRouteError(
    `Unknown modulation destination "${destination}". Use one of ${ECOLOGICAL_CONTROLS.join(', ')} or target:<${MODULATABLE_TARGETS.join('|')}>.`,
  );
}

function clampDepth(depth: number): number {
  if (!Number.isFinite(depth)) {
    return 0;
  }
  return Math.max(-1, Math.min(1, depth));
}

type RouteRecord = {
  config: ModulationRouteConfig;
  control?: EcologicalControl;
  target?: ModulatableTarget;
};

let routeCount = 0;

export class ModulationEngine {
  private readonly routes = new Map<string, RouteRecord>();
  private readonly sources = new Map<string, ModulationSource>();
  private readonly listeners = new Set<(routes: ModulationRouteConfig[]) => void>();
  private lastFrame: ModulationFrame | null = null;
  /** True once after the last route is removed, so the species gets one clearing frame. */
  private pendingClear = false;

  constructor(
    private readonly env: ModulationEnvironment,
    private readonly getBase: () => EcologyControlState,
  ) {}

  modulate(source: ModulationSourceDescriptor, destination: ModulationDestination, depth: number): ModulationRoute {
    const parsed = parseDestination(destination);
    const id = `route-${++routeCount}`;
    const sid = sourceId(source);
    const descriptor = { ...source, id: sid };
    this.ensureSource(sid, descriptor);
    const config: ModulationRouteConfig = { id, source: descriptor, destination, depth: clampDepth(depth) };
    this.routes.set(id, { config, ...parsed });
    this.pendingClear = false;
    this.notify();
    return this.handle(id);
  }

  remove(id: string): boolean {
    const record = this.routes.get(id);
    if (!record) {
      return false;
    }
    this.routes.delete(id);
    this.pruneSources();
    if (this.routes.size === 0) {
      this.pendingClear = true;
    }
    this.notify();
    return true;
  }

  set(id: string, partial: Partial<Omit<ModulationRouteConfig, 'id'>>): void {
    const record = this.routes.get(id);
    if (!record) {
      throw new ModulationRouteError(`Unknown modulation route "${id}"`);
    }
    if (partial.destination !== undefined) {
      const parsed = parseDestination(partial.destination);
      record.control = parsed.control;
      record.target = parsed.target;
      record.config.destination = partial.destination;
    }
    if (partial.depth !== undefined) {
      record.config.depth = clampDepth(partial.depth);
    }
    if (partial.source !== undefined) {
      const sid = partial.source.id ?? record.config.source.id ?? sourceId(partial.source);
      const descriptor = { ...partial.source, id: sid };
      if (sid !== record.config.source.id) {
        this.ensureSource(sid, descriptor);
        record.config.source = descriptor;
        this.pruneSources();
      } else {
        record.config.source = descriptor;
        const existing = this.sources.get(sid);
        if (existing && existing.descriptor.type === descriptor.type) {
          existing.update(descriptor);
        } else {
          this.sources.set(sid, createSource(sid, descriptor));
        }
      }
    }
    this.notify();
  }

  resetSource(id: string, phase?: number): void {
    this.sources.get(id)?.reset(phase);
  }

  list(): ModulationRouteConfig[] {
    return Array.from(this.routes.values(), (r) => ({ ...r.config, source: { ...r.config.source } }));
  }

  hasRoutes(): boolean {
    return this.routes.size > 0;
  }

  onChange(handler: (routes: ModulationRouteConfig[]) => void): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  /**
   * Advance every source by `dtSec` and compute the frame. Returns null when
   * there is nothing to apply (no routes, and the clearing frame already sent).
   */
  tick(dtSec: number): ModulationFrame | null {
    const base = this.getBase();
    if (this.routes.size === 0) {
      if (!this.pendingClear) {
        this.lastFrame = null;
        return null;
      }
      this.pendingClear = false;
      const clear: ModulationFrame = { controls: { ...base }, targets: {}, routes: 0 };
      this.lastFrame = clear;
      return clear;
    }

    for (const source of this.sources.values()) {
      source.tick(dtSec, this.env);
    }

    const controls: EcologyControlState = { ...base };
    const targets: Partial<Record<ModulatableTarget, number>> = {};
    for (const record of this.routes.values()) {
      const source = this.sources.get(record.config.source.id ?? '');
      if (!source || !source.active) {
        continue;
      }
      const amount = record.config.depth * source.value;
      if (record.control) {
        controls[record.control] = clampEcologyValue(controls[record.control] + amount);
      } else if (record.target) {
        targets[record.target] = (targets[record.target] ?? 0) + amount * MODULATION_TARGET_SPANS[record.target];
      }
    }
    const frame = { controls, targets, routes: this.routes.size };
    this.lastFrame = frame;
    return frame;
  }

  getState(): ModulationState {
    const base = this.getBase();
    const frame = this.lastFrame;
    const controls = {} as ModulationState['controls'];
    for (const control of ECOLOGICAL_CONTROLS) {
      controls[control] = { base: base[control], modulated: frame?.controls[control] ?? base[control] };
    }
    const sources: ModulationState['sources'] = {};
    for (const [id, source] of this.sources) {
      sources[id] = { type: source.descriptor.type, value: source.value, active: source.active };
    }
    return {
      time: audioNow(),
      sources,
      controls,
      targets: { ...(frame?.targets ?? {}) },
      routes: this.list(),
    };
  }

  dispose(): void {
    this.routes.clear();
    this.sources.clear();
    this.listeners.clear();
    this.lastFrame = null;
    this.pendingClear = false;
  }

  private handle(id: string): ModulationRoute {
    return {
      id,
      set: (partial) => this.set(id, partial),
      remove: () => {
        this.remove(id);
      },
    };
  }

  private ensureSource(id: string, descriptor: ModulationSourceDescriptor): void {
    const existing = this.sources.get(id);
    if (!existing) {
      this.sources.set(id, createSource(id, descriptor));
      return;
    }
    if (existing.descriptor.type !== descriptor.type) {
      throw new ModulationRouteError(
        `Source "${id}" is already a ${existing.descriptor.type}; a new route cannot make it a ${descriptor.type}.`,
      );
    }
  }

  private pruneSources(): void {
    const used = new Set<string>();
    for (const record of this.routes.values()) {
      if (record.config.source.id) {
        used.add(record.config.source.id);
      }
    }
    for (const id of Array.from(this.sources.keys())) {
      if (!used.has(id)) {
        this.sources.delete(id);
      }
    }
  }

  private notify(): void {
    const routes = this.list();
    for (const handler of this.listeners) {
      handler(routes);
    }
  }
}
