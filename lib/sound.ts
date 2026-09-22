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

export function playTone(kind: "like" | "pass" | "boom" | "sting" | "match" | "nope") {
  const audio = audioContext();
  void audio.resume();
  const o = audio.createOscillator();
  const g = audio.createGain();
  o.connect(g);
  g.connect(audio.destination);
  const now = audio.currentTime;
  const map = {
    like: { f: 440, t: 0.16 },
    pass: { f: 180, t: 0.18 },
    boom: { f: 140, t: 0.4 },
    sting: { f: 520, t: 0.5 },
    match: { f: 660, t: 0.55 },
    nope: { f: 110, t: 0.6 }
  };
  o.frequency.setValueAtTime(map[kind].f, now);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, now + map[kind].t);
  o.start(now);
  o.stop(now + map[kind].t + 0.02);
}
