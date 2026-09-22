"use client";

import { useEffect, useState } from "react";
import { DEFAULT_EVENT_ID } from "@/lib/types";

type Runtime = { origin: string; lan: string[]; publicUrl: string; joinUrl: string };

export default function HomePage() {
  const id = DEFAULT_EVENT_ID;
  const [runtime, setRuntime] = useState<Runtime | null>(null);

  useEffect(() => {
    fetch("/api/runtime")
      .then((r) => r.json())
      .then(setRuntime)
      .catch(() => undefined);
  }, []);

  return (
    <main className="home-hero">
      <p className="tag">LIVE EVENT</p>
      <h1 className="display">FOOD DATING</h1>
      <p className="serif" style={{ fontSize: 28, maxWidth: 640 }}>
        You don’t choose the food. The food chooses you.
      </p>
      {runtime && (
        <div className="card" style={{ padding: 20, marginTop: 24, maxWidth: 640 }}>
          <p className="tag">PHONE LINK FOR THE AUDIENCE</p>
          <p className="serif" style={{ fontSize: 22, wordBreak: "break-all", margin: "10px 0" }}>
            {runtime.joinUrl}
          </p>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Same Wi-Fi as this laptop works with the LAN address. A public tunnel link works from mobile data too.
          </p>
        </div>
      )}
      <div className="links">
        <a href={`/join/${id}`}>Join as audience</a>
        <a className="ghost" href={`/stage/${id}`}>
          Stage screen
        </a>
        <a className="ghost" href={`/controller/${id}`}>
          Controller
        </a>
        <a className="ghost" href={`/print/${id}`}>
          Print food QRs
        </a>
      </div>
    </main>
  );
}
