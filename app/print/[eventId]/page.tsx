"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { PRIMARY_FOODS } from "@/lib/foods";

type Runtime = { origin?: string; printOrigin?: string };

export default function PrintPage() {
  const params = useParams<{ eventId: string }>();
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [base, setBase] = useState("");
  const [usingStable, setUsingStable] = useState(false);

  useEffect(() => {
    fetch("/api/runtime")
      .then((r) => r.json())
      .then(async (data: Runtime) => {
        const printBase = (data.printOrigin || "").replace(/\/$/, "");
        const live = (data.origin || window.location.origin).replace(/\/$/, "");
        const origin = printBase || live;
        setBase(origin);
        setUsingStable(Boolean(printBase));
        const joinPath = printBase ? `${origin}/` : `${origin}/join/${params.eventId}`;
        const foodUrl = (slug: string) =>
          printBase ? `${origin}/${slug}.html` : `${origin}/stage-food/${params.eventId}/${slug}`;
        const entries = await Promise.all([
          QRCode.toDataURL(joinPath, { width: 360, margin: 1 }).then((img) => ["join", img] as const),
          ...PRIMARY_FOODS.map(async (f) => {
            const img = await QRCode.toDataURL(foodUrl(f.slug), { width: 360, margin: 1 });
            return [f.id, img] as const;
          })
        ]);
        setCodes(Object.fromEntries(entries));
      });
  }, [params.eventId]);

  return (
    <div style={{ background: "white", color: "#111", padding: 24 }}>
      <h1>Print QRs once — {params.eventId}</h1>
      {usingStable ? (
        <p>
          These codes point at your <b>permanent</b> links ({base}). Print them days ahead. On show
          day you only update <code>docs/config.js</code> with that day’s public URL.
        </p>
      ) : (
        <p>
          These currently point at today’s live server. To print days ahead, publish the{" "}
          <code>docs/</code> folder on GitHub Pages and put that site URL in{" "}
          <code>data/stable-print-origin.txt</code>, then refresh this page.
        </p>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ border: "2px solid #111", padding: 16, textAlign: "center" }}>
          <h2>Audience join</h2>
          {codes.join && <img src={codes.join} alt="Join" />}
          <p>{usingStable ? `${base}/` : `${base}/join/${params.eventId}`}</p>
        </div>
        {PRIMARY_FOODS.map((f) => (
          <div key={f.id} style={{ border: "2px solid #111", padding: 16, textAlign: "center" }}>
            <h2>{f.name}</h2>
            {codes[f.id] && <img src={codes[f.id]} alt={f.name} />}
            <p>{usingStable ? `${base}/${f.slug}.html` : `${base}/stage-food/${params.eventId}/${f.slug}`}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
