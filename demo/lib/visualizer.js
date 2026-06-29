/** Visualization loop — waveform, level meters, live feed chips. */

export function createVisualizer(bridge, elements) {
  const { waveformCanvas, liveFeed, meters } = elements;
  const wfCtx = waveformCanvas.getContext('2d');
  let peak = 0;
  let rms = 0;
  let bass = 0;
  let mid = 0;
  let treble = 0;
  let animId = 0;

  function setMeter(name, value) {
    const el = meters[name];
    if (!el) return;
    const pct = Math.min(100, Math.max(0, value * 100));
    el.fill.style.width = pct + '%';
    el.value.textContent = pct.toFixed(0);
  }

  function drawWaveform(data) {
    const w = waveformCanvas.width = waveformCanvas.clientWidth * devicePixelRatio;
    const h = waveformCanvas.height = waveformCanvas.clientHeight * devicePixelRatio;
    wfCtx.clearRect(0, 0, w, h);
    wfCtx.strokeStyle = '#4ade80';
    wfCtx.lineWidth = 1.5 * devicePixelRatio;
    wfCtx.beginPath();
    const len = data.length;
    for (let i = 0; i < len; i++) {
      const x = (i / len) * w;
      const y = ((1 - data[i]) / 2) * h;
      if (i === 0) wfCtx.moveTo(x, y);
      else wfCtx.lineTo(x, y);
    }
    wfCtx.stroke();
  }

  function analyzeBands(data) {
    if (!data.length) return;
    const third = Math.floor(data.length / 3);
    let b = 0, m = 0, t = 0;
    for (let i = 0; i < third; i++) b += Math.abs(data[i] - 0.5);
    for (let i = third; i < third * 2; i++) m += Math.abs(data[i] - 0.5);
    for (let i = third * 2; i < data.length; i++) t += Math.abs(data[i] - 0.5);
    bass = b / third * 4;
    mid = m / third * 4;
    treble = t / (data.length - third * 2) * 4;
  }

  function updateLiveFeed() {
    liveFeed.replaceChildren();
    const chips = [];

    if (bridge.generativeRunning) chips.push(`Generative (${bridge.engine.getState()})`);
    else if (bridge.engine.getState() === 'running') chips.push('Running');
    else if (bridge.engine.getState() === 'loaded') chips.push('Loaded');
    else if (!bridge.audioStarted) chips.push('Audio locked');
    const species = bridge.engine.getCurrentSpecies();
    if (species) chips.push(species.name);

    for (const note of bridge.activeNotes) {
      chips.push(note);
    }

    const lastEvent = bridge.eventLog[0];
    if (lastEvent) {
      chips.push(lastEvent.type);
    }

    for (const text of chips.slice(0, 12)) {
      const chip = document.createElement('span');
      chip.className = 'chip active';
      chip.textContent = text;
      liveFeed.appendChild(chip);
    }
  }

  function tick() {
    if (bridge.audioStarted) {
      const wf = bridge.engine.getWaveform();
      if (wf.length) {
        drawWaveform(wf);
        analyzeBands(wf);
        let sum = 0;
        for (let i = 0; i < wf.length; i++) sum += (wf[i] - 0.5) ** 2;
        rms = Math.sqrt(sum / wf.length) * 4;
      }
      const level = bridge.engine.getLevel();
      peak = Math.max(peak * 0.95, level);
      setMeter('master', level);
      setMeter('peak', peak);
      setMeter('rms', rms);
      setMeter('bass', bass);
      setMeter('mid', mid);
      setMeter('treble', treble);
    }
    updateLiveFeed();
    animId = requestAnimationFrame(tick);
  }

  return {
    start() {
      cancelAnimationFrame(animId);
      tick();
    },
    stop() {
      cancelAnimationFrame(animId);
    },
  };
}
