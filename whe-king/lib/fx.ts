// Tiny WebAudio blips + haptics. Pure feel, no assets.
let ctx: AudioContext | null = null;
let muted = false;

export const setMuted = (m: boolean) => { muted = m; };

function tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0, slide = 0) {
  if (muted || typeof window === "undefined") return;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq + slide, t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur);
  } catch {}
}

const buzz = (p: number | number[]) => {
  try { navigator.vibrate?.(p); } catch {}
};

export const fx = {
  pick: (streak: number) => { tone(520 + streak * 70, 0.12, "triangle", 0.12); buzz(12); },
  drop: () => { tone(220, 0.1, "sine", 0.1); buzz(6); },
  chip: () => { tone(880, 0.06, "square", 0.04); buzz(5); },
  spin: () => { for (let i = 0; i < 8; i++) tone(400 + i * 90, 0.07, "triangle", 0.07, i * 0.05); buzz([10, 20, 10]); },
  lock: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, "triangle", 0.14, i * 0.09));
    tone(1568, 0.5, "sine", 0.1, 0.4);
    buzz([30, 40, 30, 40, 80]);
  },
  tick: () => tone(1200, 0.04, "square", 0.05),
};
