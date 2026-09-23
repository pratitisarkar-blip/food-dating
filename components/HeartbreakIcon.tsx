import { useEffect, useId } from "react";
import { playTone, unlockAudio } from "@/lib/sound";

export function HeartbreakIcon({ large, sound }: { large?: boolean; sound?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const leftId = `${uid}-left`;
  const rightId = `${uid}-right`;
  const softId = `${uid}-soft`;

  useEffect(() => {
    if (!sound) return;
    let cancelled = false;
    let crack = 0;
    let aww = 0;
    void unlockAudio().then(() => {
      if (cancelled) return;
      crack = window.setTimeout(() => playTone("crack"), 380);
      aww = window.setTimeout(() => playTone("aww"), 420);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(crack);
      window.clearTimeout(aww);
    };
  }, [sound]);

  return (
    <div className={`heartbreak ${large ? "heartbreak--stage" : ""}`} aria-hidden>
      <img className="heartbreak-plate" src="/branding/heartbreak-plate.png" alt="" />
      <span className="heartbreak-glow" />
      <svg className="heartbreak-svg" viewBox="0 0 331 220" fill="none">
        <defs>
          <linearGradient id={leftId} x1="120" y1="52" x2="168" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF6B73" />
            <stop offset="45%" stopColor="#FF3D4A" />
            <stop offset="100%" stopColor="#E02436" />
          </linearGradient>
          <linearGradient id={rightId} x1="210" y1="52" x2="164" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF7A80" />
            <stop offset="45%" stopColor="#FF4452" />
            <stop offset="100%" stopColor="#D91F32" />
          </linearGradient>
          <filter id={softId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#8B1020" floodOpacity="0.28" />
          </filter>
        </defs>

        <g className="heartbreak-half is-left" filter={`url(#${softId})`}>
          <path
            fill={`url(#${leftId})`}
            d="M164.2 71.5C156 50.5 127.5 47 118.8 67.5C110.2 88 126.5 114.5 164.2 139.5L158.2 126.5L166.4 116.2L156.8 104.8L164.6 94.2L155.5 82.6L164.2 71.5Z"
          />
          <path
            fill="#fff"
            fillOpacity="0.38"
            d="M136.5 68c6.2-9 16.5-11.5 22.2-5.2 2.8 3.1 2.6 8.4 -1.4 14.2 -5.8 8.4 -16.6 7.2 -20.8 -1.2 -1.8 -3.6 -1.8 -5.8 0 -7.8Z"
          />
          <path
            stroke="#9B1424"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M164.2 71.5L155.5 82.6L164.6 94.2L156.8 104.8L166.4 116.2L158.2 126.5L164.2 139.5"
          />
        </g>

        <g className="heartbreak-half is-right" filter={`url(#${softId})`}>
          <path
            fill={`url(#${rightId})`}
            d="M167.2 71.5C175.4 50.5 204 47 212.6 67.5C221.2 88 205 114.5 167.2 139.5L173.6 126.2L165 116.2L175.2 104.6L167.2 94.2L176.4 82.4L167.2 71.5Z"
          />
          <path
            fill="#fff"
            fillOpacity="0.42"
            d="M192 66.5c-5.8-8.4-16-11.2-21.8-5.2-2.6 2.8-2.6 7.8 1 13.6 5.4 8.6 16.4 8 20.8 -0.4 1.8 -3.4 1.8 -5.6 0 -8Z"
          />
          <path
            stroke="#9B1424"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M167.2 71.5L176.4 82.4L167.2 94.2L175.2 104.6L165 116.2L173.6 126.2L167.2 139.5"
          />
        </g>

        <g className="heartbreak-shards">
          <circle className="shard s1" cx="165" cy="98" r="2.4" fill="#FF5A62" />
          <circle className="shard s2" cx="168" cy="112" r="1.8" fill="#FF8A90" />
          <circle className="shard s3" cx="161" cy="86" r="1.6" fill="#FF3D4A" />
          <path className="shard s4" fill="#FF4452" d="M170 104l4.5 1.2-2.2 4.4-3.6-2.8z" />
          <path className="shard s5" fill="#E02436" d="M157 118l3.8-.6 1.2 3.6-3.4 1.2z" />
        </g>
      </svg>
    </div>
  );
}
