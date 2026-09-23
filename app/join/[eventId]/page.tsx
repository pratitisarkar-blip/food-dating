"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import confetti from "canvas-confetti";
import type { AudienceView, FoodProfile } from "@/lib/types";
import { bandForScore, resultCopy } from "@/lib/compatibility";
import { getSocket } from "@/lib/useSocket";
import { playTone } from "@/lib/sound";
import { HeartbreakIcon } from "@/components/HeartbreakIcon";
import { MatchIcon } from "@/components/MatchIcon";

function storageKey(eventId: string) {
  return `food-dating:${eventId}:participant`;
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="phone-stage">
      <div className="phone-frame">{children}</div>
    </div>
  );
}

function RotatingLine({ lines }: { lines: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (lines.length < 2) return undefined;
    const id = window.setInterval(() => setI((n) => (n + 1) % lines.length), 4200);
    return () => window.clearInterval(id);
  }, [lines.length]);
  const line = lines[i % Math.max(lines.length, 1)] ?? "Look up. The food is still deciding.";
  return (
    <p className="no-match-chip" key={line}>
      {line}
    </p>
  );
}

function WaitingScreen({ lines }: { lines: string[] }) {
  return (
    <div className="no-match waiting-page">
      <img className="tinder-brand" src="/branding/flirtybites-logo.svg" alt="FlirtyBites" />
      <h1>Look up.</h1>
      <p className="no-match-sub">The food is still choosing who to call on stage.</p>
      <RotatingLine lines={lines} />
    </div>
  );
}

function NoMatchScreen({ lines }: { lines: string[] }) {
  return (
    <div className="no-match">
      <HeartbreakIcon sound />
      <h1>
        Sorry, no food item
        <br />
        matched with you.
      </h1>
      <p className="no-match-sub">Don&apos;t worry - good taste takes time.</p>
      <RotatingLine lines={lines} />
    </div>
  );
}

export default function JoinPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const [name, setName] = useState("");
  const [view, setView] = useState<AudienceView | null>(null);
  const [pid, setPid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flaky, setFlaky] = useState(false);
  const [localSwipes, setLocalSwipes] = useState<Record<string, "left" | "right">>({});
  const [resumeVolunteer, setResumeVolunteer] = useState(false);
  const lock = useRef(new Set<string>());

  useEffect(() => {
    const socket = getSocket();
    const stored = localStorage.getItem(storageKey(eventId));
    if (stored) setPid(stored);
    const resume = new URLSearchParams(window.location.search).get("resume") === "volunteer";
    setResumeVolunteer(resume);

    const onAudience = (data: AudienceView) => setView(data);
    const onJoined = ({ participantId }: { participantId: string }) => {
      localStorage.setItem(storageKey(eventId), participantId);
      setPid(participantId);
    };
    const onErr = (msg: string) => setError(msg);
    const hello = () => {
      setFlaky(false);
      socket.emit("hello", {
        role: "audience",
        eventId,
        participantId: stored || pid || undefined,
        claimVolunteer: resume
      });
    };
    socket.on("audience", onAudience);
    socket.on("joined", onJoined);
    socket.on("error-message", onErr);
    socket.on("connect", hello);
    socket.on("disconnect", () => setFlaky(true));
    hello();
    return () => {
      socket.off("audience", onAudience);
      socket.off("joined", onJoined);
      socket.off("error-message", onErr);
      socket.off("connect", hello);
    };
  }, [eventId, pid]);

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
    } else {
      playTone("pass");
    }
    window.setTimeout(() => lock.current.delete(food.id), 280);
  }

  if (flaky && view?.participant) {
    return (
      <PhoneFrame>
        <div className="no-match">
          <HeartbreakIcon />
          <h1>Connection got a little flaky.</h1>
          <p className="no-match-sub">Reconnecting you to the table...</p>
        </div>
      </PhoneFrame>
    );
  }

  if (!view?.participant) {
    return (
      <PhoneFrame>
        <form className="flirty-welcome" onSubmit={join}>
          <div className="flirty-hero">
            <h1 className="flirty-logo">
              <img src="/branding/flirtybites-logo.svg" alt="FlirtyBites" />
            </h1>
            <p className="flirty-tagline">Swipe right. Take a bite.</p>
          </div>
          <div className="flirty-sheet">
            <h2>Ready to find your soul-food?</h2>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your real name"
              required
              autoComplete="name"
              autoCapitalize="words"
            />
            {error && <p className="flirty-error">{error}</p>}
            <button type="submit">Continue</button>
          </div>
        </form>
      </PhoneFrame>
    );
  }

  const revealing =
    view.isVolunteer &&
    Boolean(view.round) &&
    (view.phase === "COMPATIBILITY_CALCULATION" || view.phase === "RESULT");

  if (revealing && view.round) {
    return (
      <PhoneFrame>
        <CompatibilityScreen view={view} />
      </PhoneFrame>
    );
  }

  if (view.isVolunteer && view.round) {
    return (
      <PhoneFrame>
        <VolunteerPhone view={view} askQuestions={resumeVolunteer} />
      </PhoneFrame>
    );
  }

  const castMatch =
    view.castRevealed &&
    view.matchedFood &&
    !view.usedFoodIds.includes(view.matchedFood.id);
  if (castMatch && view.matchedFood) {
    return (
      <PhoneFrame>
        <MatchSplash food={view.matchedFood} name={view.participant.fullName} />
      </PhoneFrame>
    );
  }

  if (allDone || view.participant.completedAt) {
    return (
      <PhoneFrame>
        {view.volunteerChosen ? (
          <NoMatchScreen lines={view.waitingLines} />
        ) : (
          <WaitingScreen lines={view.waitingLines} />
        )}
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      <div className="tinder-page">
        <div className="tinder-shell">
          {view.testMode && <div className="test-banner">TEST MODE</div>}
          <header className="tinder-head">
            <img className="tinder-brand" src="/branding/flirtybites-logo.svg" alt="FlirtyBites" />
            <p>
              On the menu today · {remaining.length} {remaining.length === 1 ? "dish" : "dishes"} left
            </p>
          </header>
          <div className="tinder-deck">
            <div className="tinder-stack">
              {remaining[2] && (
                <div
                  className="tinder-peek peek-2"
                  aria-hidden
                  style={{ backgroundImage: `url("${remaining[2].image}")` }}
                />
              )}
              {remaining[1] && (
                <div
                  className="tinder-peek peek-1"
                  aria-hidden
                  style={{ backgroundImage: `url("${remaining[1].image}")` }}
                />
              )}
              {current && <SwipeCard key={current.id} food={current} onSwipe={swipe} />}
            </div>
          </div>
          {current && (
            <div className="tinder-actions">
              <button type="button" className="tinder-x" aria-label="Pass" onClick={() => swipe("left")}>
                ×
              </button>
              <button type="button" className="tinder-heart" aria-label="Like" onClick={() => swipe("right")}>
                ♥
              </button>
            </div>
          )}
        </div>
      </div>
    </PhoneFrame>
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
    if (!dragging.current) return;
    const distance = dxRef.current;
    dragging.current = false;
    if (distance > 48) onSwipe("right");
    else if (distance < -48) onSwipe("left");
    dxRef.current = 0;
    setDx(0);
    startX.current = 0;
  }

  useEffect(() => {
    function move(e: PointerEvent) {
      if (!dragging.current) return;
      const next = e.clientX - startX.current;
      dxRef.current = next;
      setDx(next);
    }
    function up() {
      finish();
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  });

  return (
    <div
      className="tinder-card"
      style={{
        transform: `translateX(${dx}px) rotate(${dx / 22}deg)`,
        touchAction: "none",
        backgroundImage: `url("${food.image}")`
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        dragging.current = true;
        startX.current = e.clientX;
        dxRef.current = 0;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* older browsers */
        }
      }}
    >
      {dx > 36 && <div className="swipe-stamp like-stamp">LIKE</div>}
      {dx < -36 && <div className="swipe-stamp pass-stamp">NOPE</div>}
      <div className="tinder-info">
        <h2>{food.name}</h2>
        <p className="tinder-origin">
          <span>{food.originFlag}</span> {food.originLabel}
        </p>
        <p className="tinder-tagline">{food.tagline}</p>
      </div>
    </div>
  );
}

function CompatibilityScreen({ view }: { view: AudienceView }) {
  const round = view.round!;
  const score = round.compatibilityScore ?? 0;
  const kind = round.result ?? bandForScore(score).kind;
  const copy = resultCopy(round.foodName ?? "The Food", kind);
  const ready = view.phase === "RESULT" && round.compatibilityScore != null;
  const who = round.volunteerName || "you";
  const miss = kind === "not-a-match";
  const hit = kind === "match" || kind === "strong";

  return (
    <div className={`no-match volunteer-result ${ready ? "has-score" : ""}`}>
      <p className="phone-compat-kicker">Overall compatibility</p>
      {ready ? (
        <>
          <div className="phone-pct">
            {score}
            <span>%</span>
          </div>
          {miss ? (
            <>
              <HeartbreakIcon sound />
              <h1>You &amp; {round.foodName ?? "this food"} want different things!</h1>
              <p className="no-match-sub">{copy.sub}</p>
            </>
          ) : hit ? (
            <>
              <MatchIcon sound />
              <h1>It&apos;s a date, {who}!</h1>
              <p className="no-match-sub">{copy.sub}</p>
            </>
          ) : (
            <>
              <h1>{copy.title}</h1>
              <p className="no-match-sub">{copy.sub}</p>
            </>
          )}
        </>
      ) : (
        <p className="no-match-sub">The food is deciding.</p>
      )}
    </div>
  );
}

function pickMatchFood(view: AudienceView) {
  const round = view.round;
  if (round?.foodId) return view.foods.find((f) => f.id === round.foodId) ?? null;
  const used = new Set(view.usedFoodIds ?? []);
  const unused = view.foods.filter((f) => f.isPrimary && !used.has(f.id));
  const liked = unused.filter((f) =>
    view.swipes.some((s) => s.foodId === f.id && s.direction === "right")
  );
  return liked[0] ?? unused[0] ?? null;
}

function MatchSplash({ food, name }: { food: FoodProfile; name?: string }) {
  return (
    <div className="match-page">
      <span className="match-speckle s1" />
      <span className="match-speckle s2" />
      <span className="match-speckle s3" />
      <span className="match-speckle s4" />
      <span className="match-speckle s5" />
      <span className="match-speckle s6" />
      <span className="match-speckle s7" />
      <p className="match-kicker">
        <span className="match-pip orange" />
        IT&apos;S A
        <span className="match-pip green" />
      </p>
      <h1 className="match-title">
        Match<span className="match-bang">!</span>
      </h1>
      {name ? <h2 className="match-person">{name}</h2> : null}
      <div className="match-card-wrap">
        <div
          className={`match-card match-card--${food.id}`}
          style={{ backgroundImage: `url("${food.image}")` }}
          role="img"
          aria-label={food.name}
        />
        <div className="match-heart" aria-hidden>
          ♥
        </div>
      </div>
      <p className="match-wait">
        Wait until {food.name}
        <br />
        starts a conversation
      </p>
    </div>
  );
}

function VolunteerPhone({ view, askQuestions }: { view: AudienceView; askQuestions: boolean }) {
  const food = pickMatchFood(view);
  const round = view.round!;

  useEffect(() => {
    if (view.round?.foodId || !food) return;
    getSocket().emit("scan-food", { eventId: view.eventId, foodSlug: food.slug });
  }, [view.round?.foodId, food, view.eventId]);

  const asking =
    askQuestions ||
    view.phase === "QUESTION" ||
    view.phase === "ANSWER_REVEAL";

  if (asking && food) {
    const q = view.questions[round.currentQuestion];
    const existing = round.answers.find((a) => a.questionId === q?.id);
    return (
      <div className="volunteer-ask">
        <img className="tinder-brand" src="/branding/flirtybites-logo.svg" alt="FlirtyBites" />
        <p className="tag">
          {food.name} • Q {round.currentQuestion + 1} / {round.totalQuestions}
        </p>
        <h2>{q?.prompt ?? "Look up — the next question is coming."}</h2>
        {q && (
          <div className="question-grid">
            {q.options.map((opt) => (
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
        )}
        {existing && <p className="volunteer-locked">Locked in. Look up.</p>}
      </div>
    );
  }

  if (!food) {
    return (
      <div className="match-page">
        <p className="match-kicker">IT&apos;S A</p>
        <h1 className="match-title">
          Match<span className="match-bang">!</span>
        </h1>
        <p className="match-wait">Look up. Your date is on the way.</p>
      </div>
    );
  }

  return <MatchSplash food={food} name={round.volunteerName} />;
}
