let ctx: AudioContext | null = null;

function audioContext() {
  const AudioCtx =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!ctx) ctx = new AudioCtx();
  return ctx;
}

export async function unlockAudio() {
  const audio = audioContext();
  if (audio.state === "suspended") await audio.resume();
  return audio;
}

function env(gain: GainNode, now: number, attack: number, peak: number, duration: number) {
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
}

function tone(
  audio: AudioContext,
  type: OscillatorType,
  freq: number,
  now: number,
  duration: number,
  peak: number,
  slideTo?: number
) {
  const o = audio.createOscillator();
  const g = audio.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, now);
  if (slideTo != null) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
  o.connect(g);
  g.connect(audio.destination);
  env(g, now, 0.018, peak, duration);
  o.start(now);
  o.stop(now + duration + 0.04);
}

function noiseBurst(audio: AudioContext, now: number, duration: number, peak: number, freq: number, q = 4) {
  const length = Math.max(1, Math.floor(audio.sampleRate * duration));
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(freq, now);
  filter.Q.value = q;
  const g = audio.createGain();
  src.connect(filter);
  filter.connect(g);
  g.connect(audio.destination);
  env(g, now, 0.01, peak, duration);
  src.start(now);
  src.stop(now + duration + 0.02);
}

export type ToneKind =
  | "like"
  | "pass"
  | "boom"
  | "sting"
  | "match"
  | "nope"
  | "scan"
  | "slam"
  | "tension"
  | "tick"
  | "rise"
  | "lock"
  | "crack"
  | "aww"
  | "clap"
  | "applause";

function playAww(audio: AudioContext, now: number) {
  const dur = 1.28;
  const master = audio.createGain();
  master.connect(audio.destination);
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.16, now + 0.09);
  master.gain.setValueAtTime(0.14, now + 0.4);
  master.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  const lfo = audio.createOscillator();
  const lfoGain = audio.createGain();
  lfo.frequency.setValueAtTime(5.1, now);
  lfoGain.gain.setValueAtTime(14, now);
  lfo.connect(lfoGain);

  const start = (type: OscillatorType, freqFrom: number, freqTo: number, peak: number, detune = 0) => {
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freqFrom, now);
    o.frequency.linearRampToValueAtTime(freqFrom * 0.86, now + 0.38);
    o.frequency.linearRampToValueAtTime(freqTo, now + dur);
    o.detune.setValueAtTime(detune, now);
    lfoGain.connect(o.detune);
    o.connect(g);
    g.gain.setValueAtTime(peak, now);
    g.connect(master);
    o.start(now);
    o.stop(now + dur + 0.04);
  };

  start("sine", 240, 148, 0.22);
  start("triangle", 240, 148, 0.08, 8);
  start("sine", 620, 480, 0.09);
  start("sine", 980, 760, 0.05);
  start("sine", 1280, 980, 0.02);

  lfo.start(now);
  lfo.stop(now + dur + 0.04);
}

function oneClap(audio: AudioContext, now: number, peak: number) {
  const length = Math.max(1, Math.floor(audio.sampleRate * 0.09));
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length * 0.08));
  }
  const src = audio.createBufferSource();
  src.buffer = buffer;

  const high = audio.createBiquadFilter();
  high.type = "highpass";
  high.frequency.value = 900;
  const mid = audio.createBiquadFilter();
  mid.type = "bandpass";
  mid.frequency.value = 1800;
  mid.Q.value = 0.7;

  const g = audio.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(peak, now + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  src.connect(high);
  high.connect(mid);
  mid.connect(g);
  g.connect(audio.destination);
  src.start(now);
  src.stop(now + 0.1);
  noiseBurst(audio, now, 0.04, peak * 0.45, 3200, 1.2);
}

function playClap(audio: AudioContext, now: number) {
  oneClap(audio, now, 0.28);
  oneClap(audio, now + 0.13, 0.24);
  oneClap(audio, now + 0.24, 0.3);
}

function playApplause(audio: AudioContext, now: number) {
  const master = audio.createGain();
  master.connect(audio.destination);
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.22, now + 0.12);
  master.gain.setValueAtTime(0.18, now + 0.9);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

  for (let i = 0; i < 42; i++) {
    const t = now + 0.04 + i * 0.048 + (Math.random() * 0.03);
    const length = Math.max(1, Math.floor(audio.sampleRate * 0.045));
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let s = 0; s < data.length; s++) data[s] = (Math.random() * 2 - 1) * Math.exp(-s / (length * 0.18));
    const src = audio.createBufferSource();
    src.buffer = buffer;
    const filter = audio.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1400 + Math.random() * 1600, t);
    filter.Q.value = 0.9;
    const g = audio.createGain();
    g.gain.setValueAtTime(0.08 + Math.random() * 0.07, t);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + 0.06);
  }
  tone(audio, "sine", 90, now, 2.1, 0.035, 70);
}

export function playTone(kind: ToneKind, detail = 0) {
  const audio = audioContext();
  void audio.resume();
  const now = audio.currentTime;

  if (kind === "like") {
    tone(audio, "triangle", 440, now, 0.16, 0.07);
    tone(audio, "sine", 660, now + 0.05, 0.14, 0.04);
    return;
  }
  if (kind === "pass") {
    tone(audio, "sine", 210, now, 0.2, 0.06, 140);
    return;
  }
  if (kind === "boom") {
    tone(audio, "sine", 90, now, 0.45, 0.14, 42);
    noiseBurst(audio, now, 0.22, 0.05, 180, 1.2);
    return;
  }
  if (kind === "sting") {
    tone(audio, "triangle", 520, now, 0.22, 0.07);
    tone(audio, "sine", 780, now + 0.08, 0.28, 0.05);
    return;
  }
  if (kind === "scan") {
    noiseBurst(audio, now, 0.55, 0.045, 1400, 8);
    tone(audio, "sine", 880, now, 0.12, 0.035);
    tone(audio, "sine", 1320, now + 0.16, 0.12, 0.03);
    tone(audio, "sine", 1760, now + 0.32, 0.1, 0.025);
    return;
  }
  if (kind === "slam") {
    const freq = [196, 247, 311][Math.max(0, Math.min(2, detail))] ?? 311;
    tone(audio, "square", freq, now, 0.16, 0.045);
    tone(audio, "sine", freq / 2, now, 0.28, 0.08);
    noiseBurst(audio, now, 0.12, 0.04, 420, 2);
    return;
  }
  if (kind === "tension") {
    tone(audio, "sine", 62, now, 1.35, 0.09, 48);
    tone(audio, "triangle", 124, now + 0.08, 1.2, 0.035, 98);
    noiseBurst(audio, now + 0.2, 0.8, 0.02, 240, 1.4);
    return;
  }
  if (kind === "tick") {
    const freq = 540 + (detail % 12) * 28;
    tone(audio, "square", freq, now, 0.045, 0.028);
    return;
  }
  if (kind === "rise") {
    tone(audio, "sawtooth", 180, now, 0.55, 0.03, 420);
    tone(audio, "sine", 90, now, 0.4, 0.05);
    return;
  }
  if (kind === "lock") {
    tone(audio, "sine", 70, now, 0.55, 0.16, 36);
    tone(audio, "triangle", 220, now, 0.22, 0.07);
    tone(audio, "sine", 440, now + 0.08, 0.28, 0.05);
    noiseBurst(audio, now, 0.18, 0.06, 160, 1);
    return;
  }
  if (kind === "crack") {
    noiseBurst(audio, now, 0.16, 0.055, 1600, 3);
    noiseBurst(audio, now + 0.04, 0.18, 0.04, 640, 1.6);
    tone(audio, "sine", 160, now + 0.03, 0.32, 0.05, 70);
    return;
  }
  if (kind === "aww") {
    playAww(audio, now);
    return;
  }
  if (kind === "clap") {
    playClap(audio, now);
    return;
  }
  if (kind === "match") {
    tone(audio, "triangle", 523, now, 0.22, 0.07);
    tone(audio, "triangle", 659, now + 0.12, 0.24, 0.07);
    tone(audio, "triangle", 784, now + 0.24, 0.4, 0.08);
    tone(audio, "sine", 1046, now + 0.28, 0.45, 0.04);
    return;
  }
  if (kind === "applause") {
    playApplause(audio, now);
    return;
  }
  if (kind === "nope") {
    tone(audio, "triangle", 220, now, 0.28, 0.07, 175);
    tone(audio, "sine", 165, now + 0.16, 0.45, 0.08, 90);
    tone(audio, "sine", 98, now + 0.28, 0.55, 0.06, 55);
    return;
  }
}
