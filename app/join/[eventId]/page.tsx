"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import confetti from "canvas-confetti";
import type { AudienceView, FoodProfile } from "@/lib/types";
import { getSocket } from "@/lib/useSocket";
import { FoodPickGrid } from "@/components/FoodPickGrid";
import { playTone } from "@/lib/sound";

const LIKE_COPY = ["OOOH. INTERESTING.", "Someone's got taste.", "Noted. Bold of you.", "The food felt that."];
const PASS_COPY = [
  "Brutal.",
  "That's going to hurt.",
  "Ghosted.",
  "Not tonight.",
  "Broccoli will recover.",
  "Samosa has been ghosted."
];

function storageKey(eventId: string) {
  return `food-dating:${eventId}:participant`;
}

export default function JoinPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const [name, setName] = useState("");
  const [view, setView] = useState<AudienceView | null>(null);
  const [pid, setPid] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flaky, setFlaky] = useState(false);
  const [waitLine, setWaitLine] = useState(0);
  const [localSwipes, setLocalSwipes] = useState<Record<string, "left" | "right">>({});
  const lock = useRef(new Set<string>());

  useEffect(() => {
    const socket = getSocket();
    const stored = localStorage.getItem(storageKey(eventId));
    if (stored) setPid(stored);

    const onAudience = (data: AudienceView) => setView(data);
    const onJoined = ({ participantId }: { participantId: string }) => {
      localStorage.setItem(storageKey(eventId), participantId);
      setPid(participantId);
    };
    const onErr = (msg: string) => setError(msg);
    socket.on("audience", onAudience);
    socket.on("joined", onJoined);
    socket.on("error-message", onErr);
    socket.on("connect", () => {
      setFlaky(false);
      socket.emit("hello", { role: "audience", eventId, participantId: stored || pid });
    });
    socket.on("disconnect", () => setFlaky(true));
    socket.emit("hello", { role: "audience", eventId, participantId: stored || undefined });
    return () => {
      socket.off("audience", onAudience);
      socket.off("joined", onJoined);
      socket.off("error-message", onErr);
    };
  }, [eventId, pid]);

  useEffect(() => {
    if (!view?.participant?.completedAt) return;
    const t = setInterval(() => setWaitLine((n) => n + 1), 3500);
    return () => clearInterval(t);
  }, [view?.participant?.completedAt]);

  function join(e: FormEvent) {
    e.preventDefault();
    getSocket().emit("join", { eventId, fullName: name });
  }

  const orderedFoods = useMemo(() => {
    if (!view?.participant) return [];
    const byId = Object.fromEntries(view.foods.map((f) => [f.id, f]));
    const seen = new Set<string>();
    const list: FoodProfile[] = [];
    for (const id of view.participant.foodOrder) {
      const food = byId[id];
      if (food && !seen.has(id)) {
        seen.add(id);
        list.push(food);
      }
    }
    for (const food of view.foods) {
      if (!seen.has(food.id)) {
        seen.add(food.id);
        list.push(food);
      }
    }
    return list;
  }, [view]);

  const swipeByFood = useMemo(() => {
    const map: Record<string, "left" | "right"> = { ...localSwipes };
    for (const s of view?.swipes ?? []) map[s.foodId] = s.direction;
    return map;
  }, [view?.swipes, localSwipes]);

  const remaining = orderedFoods.filter((f) => !swipeByFood[f.id]);
  const current = remaining[0];
  const index = orderedFoods.length - remaining.length;
  const allDone = orderedFoods.length >= 10 && remaining.length === 0;

  function swipe(direction: "left" | "right") {
    if (!current || lock.current.has(current.id)) return;
    const food = current;
    lock.current.add(food.id);
    setLocalSwipes((prev) => ({ ...prev, [food.id]: direction }));
    getSocket().emit("swipe", { foodId: food.id, direction });
    if (direction === "right") {
      playTone("like");
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      setToast(LIKE_COPY[Math.floor(Math.random() * LIKE_COPY.length)]);
    } else {
      playTone("pass");
      const extra = food.name === "Broccoli" ? "Broccoli will recover." : `${food.name} has been ghosted.`;
      const pool = [...PASS_COPY, extra];
      setToast(pool[Math.floor(Math.random() * pool.length)]);
    }
    window.setTimeout(() => {
      setToast(null);
      lock.current.delete(food.id);
    }, 280);
  }

  if (flaky) {
    return (
      <div className="wait">
        <h2 className="display">Connection got a little flaky.</h2>
        <p>Reconnecting you...</p>
      </div>
    );
  }

  if (!view?.participant) {
    return (
      <form className="join-form card" onSubmit={join}>
        <p className="tag">FOOD DATING</p>
        <h1 className="display" style={{ fontSize: 56, margin: "8px 0" }}>
          The food chooses you.
        </h1>
        <p>Enter your actual full name.</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required />
        {error && <p>{error}</p>}
        <button className="btn" type="submit" style={{ width: "100%" }}>
          Enter the experience
        </button>
      </form>
    );
  }

  if (view.isVolunteer && view.round) {
    return <VolunteerPhone view={view} />;
  }

  if (view.volunteerChosen && view.participant.completedAt) {
    return (
      <div className="wait">
        <p className="tag">LIVE</p>
        <h1 className="display">👀 SOMEONE HAS BEEN CHOSEN.</h1>
        <p className="serif">This is getting serious.</p>
      </div>
    );
  }

  if (allDone || view.participant.completedAt) {
    const lines = view.waitingLines;
    return (
      <div className="wait">
        <p className="tag">YOU'RE DONE.</p>
        <h1 className="display">YOU'RE DONE.</h1>
        <p className="serif" style={{ fontSize: 28 }}>
          {lines[waitLine % lines.length]}
        </p>
      </div>
    );
  }

  return (
    <div className="swipe-shell">
      {view.testMode && <div className="test-banner">TEST MODE</div>}
      <div className="progress">
        <span className="tag">FOOD DATING</span>
        <span>
          {Math.min(index + 1, 10)} / 10
        </span>
      </div>
      {toast && <div className="toast">{toast}</div>}
      {current && <SwipeCard key={current.id} food={current} onSwipe={swipe} />}
      <p className="swipe-hint">Swipe right if you’re interested · swipe left to pass</p>
    </div>
  );
}

function SwipeCard({
  food,
  onSwipe
}: {
  food: FoodProfile;
  onSwipe: (d: "left" | "right") => void;
}) {
  const startX = useRef(0);
  const dragging = useRef(false);
  const dxRef = useRef(0);
  const [dx, setDx] = useState(0);

  function finish() {
    const distance = dxRef.current;
    if (distance > 50) onSwipe("right");
    else if (distance < -50) onSwipe("left");
    dragging.current = false;
    dxRef.current = 0;
    setDx(0);
    startX.current = 0;
  }

  return (
    <div
      className="card food-card"
      style={{
        transform: `translateX(${dx}px) rotate(${dx / 18}deg)`,
        touchAction: "none"
      }}
      onPointerDown={(e) => {
        dragging.current = true;
        startX.current = e.clientX;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        const next = e.clientX - startX.current;
        dxRef.current = next;
        setDx(next);
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
    >
      {dx > 36 && <div className="swipe-stamp like-stamp">YES</div>}
      {dx < -36 && <div className="swipe-stamp pass-stamp">NOPE</div>}
      <img src={food.image} alt={food.name} draggable={false} />
      <div className="food-body">
        <h2 className="display">{food.name}</h2>
        <div className="traits">
          {food.personality.map((t) => (
            <span className="chip" key={t}>
              {t}
            </span>
          ))}
        </div>
        <p className="bio serif">“{food.bio}”</p>
        <div className="flag">
          <b>Green flag:</b> {food.greenFlag}
        </div>
        <div className="flag">
          <b>Red flag:</b> {food.redFlag}
        </div>
        <div className="flag">
          <b>Love language:</b> {food.loveLanguage}
        </div>
      </div>
    </div>
  );
}

function VolunteerPhone({ view }: { view: AudienceView }) {
  const round = view.round!;
  const primaries = view.foods.filter((f) => f.isPrimary);
  if (!round.foodId) {
    return (
      <div className="swipe-shell">
        <p className="tag">YOU'RE ON</p>
        <h1 className="display" style={{ fontSize: 42, margin: "8px 0" }}>
          PICK YOUR DATE.
        </h1>
        <p>Tap one food. That&apos;s who you&apos;re sitting with.</p>
        <FoodPickGrid
          foods={primaries}
          usedFoodIds={view.usedFoodIds ?? []}
          onPick={(slug) =>
            getSocket().emit("scan-food", { eventId: view.eventId, foodSlug: slug })
          }
        />
      </div>
    );
  }
  const q = view.questions[round.currentQuestion];
  const existing = round.answers.find((a) => a.questionId === q?.id);
  return (
    <div className="swipe-shell">
      <p className="tag">
        {round.foodName} • Q {round.currentQuestion + 1} / {round.totalQuestions}
      </p>
      <h2 className="serif">{q?.prompt}</h2>
      <div className="question-grid">
        {q?.options.map((opt) => (
          <button
            key={opt.key}
            className={`qopt ${existing?.answer === opt.key ? "picked" : ""}`}
            disabled={Boolean(existing)}
            onClick={() =>
              getSocket().emit("volunteer-answer", { questionId: q.id, answer: opt.key })
            }
          >
            {opt.key}. {opt.label}
          </button>
        ))}
      </div>
      {existing && <p>Locked in. Look up.</p>}
    </div>
  );
}
