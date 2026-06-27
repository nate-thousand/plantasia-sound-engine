import { PlantasiaEngine } from 'plantasia-sound-engine';

const engine = new PlantasiaEngine();

function preset(id: string) {
  return engine.presets.find((p) => p.id === id);
}

document.getElementById('btn-init')?.addEventListener('click', () => {
  void engine.init();
});

document.getElementById('btn-seed')?.addEventListener('click', () => {
  const p = preset('seed');
  if (p) engine.playPreset(p);
});

document.getElementById('btn-bloom')?.addEventListener('click', () => {
  const p = preset('bloom');
  if (p) engine.playPreset(p);
});

document.getElementById('btn-juno')?.addEventListener('click', () => {
  const p = preset('juno-flowers');
  if (p) engine.playPreset(p);
});

document.getElementById('btn-stop')?.addEventListener('click', () => {
  engine.stop();
});
