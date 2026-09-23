import { useEffect, useId } from "react";
import confetti from "canvas-confetti";
import { playTone, unlockAudio } from "@/lib/sound";

export function MatchIcon({ large, sound }: { large?: boolean; sound?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const fillId = `${uid}-fill`;
  const softId = `${uid}-soft`;

  useEffect(() => {
    const burst = () => {
      const colors = ["#ff5a3a", "#ffb44a", "#7ed957", "#ff8aa0", "#3b82f6", "#f5c542"];
      confetti({ particleCount: 140, spread: 86, startVelocity: 48, origin: { y: 0.38 }, colors });
      confetti({ particleCount: 90, angle: 60, spread: 58, origin: { x: 0, y: 0.55 }, colors });
      confetti({ particleCount: 90, angle: 120, spread: 58, origin: { x: 1, y: 0.55 }, colors });
    };
    const t0 = window.setTimeout(burst, 360);
    const t1 = window.setTimeout(burst, 900);

    let cancelled = false;
    let ding = 0;
    let clap = 0;
    let crowd = 0;
    if (sound) {
      void unlockAudio().then(() => {
        if (cancelled) return;
        ding = window.setTimeout(() => playTone("match"), 320);
        clap = window.setTimeout(() => playTone("clap"), 360);
        crowd = window.setTimeout(() => playTone("applause"), 700);
      });
    }

    return () => {
      cancelled = true;
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(ding);
      window.clearTimeout(clap);
      window.clearTimeout(crowd);
    };
  }, [sound]);

  return (
    <div className={`heartbreak match-icon ${large ? "heartbreak--stage" : ""}`} aria-hidden>
      <img className="heartbreak-plate" src="/branding/heartbreak-plate.png" alt="" />
      <span className="match-icon-glow" />
      <svg className="heartbreak-svg" viewBox="0 0 331 220" fill="none">
        <defs>
          <linearGradient id={fillId} x1="140" y1="48" x2="190" y2="142" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF7A82" />
            <stop offset="45%" stopColor="#FF3D4A" />
            <stop offset="100%" stopColor="#E02436" />
          </linearGradient>
          <filter id={softId} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#8B1020" floodOpacity="0.28" />
          </filter>
        </defs>
        <g className="match-icon-heart" filter={`url(#${softId})`}>
          <path
            fill={`url(#${fillId})`}
            d="M165.5 71.2C157.2 50.8 128 47.2 119.2 67.8C110.4 88.6 127.8 115.2 165.5 140.2C203.2 115.2 220.6 88.6 211.8 67.8C203 47.2 173.8 50.8 165.5 71.2Z"
          />
          <path
            fill="#fff"
            fillOpacity="0.4"
            d="M138 67c6.5-9.2 17.2-11.8 23-5.4 2.8 3.2 2.6 8.6-1.4 14.6-6 8.6-17 7.4-21.4-1.2-1.8-3.6-1.8-5.8-0.2-8Z"
          />
        </g>
        <g className="match-sparks">
          <circle className="spark s1" cx="118" cy="78" r="3.2" fill="#FF8A3D" />
          <circle className="spark s2" cx="214" cy="74" r="2.6" fill="#7ED957" />
          <circle className="spark s3" cx="165" cy="48" r="2.2" fill="#F5C542" />
          <circle className="spark s4" cx="108" cy="112" r="2" fill="#FF8AA0" />
          <circle className="spark s5" cx="222" cy="108" r="2.4" fill="#3B82F6" />
        </g>
      </svg>
    </div>
  );
}
