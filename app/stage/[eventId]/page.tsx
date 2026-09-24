"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { getSocket } from "@/lib/useSocket";
import type { FoodProfile, StageView } from "@/lib/types";
import { bandForScore, dimensionScores, resultCopy, teaseScores } from "@/lib/compatibility";
import { playTone, unlockAudio } from "@/lib/sound";
import { HeartbreakIcon } from "@/components/HeartbreakIcon";
import { MatchIcon } from "@/components/MatchIcon";

export default function StagePage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const [view, setView] = useState<StageView | null>(null);
  const [audioOn, setAudioOn] = useState(true);
  const [qr, setQr] = useState<string>("");
  const [step, setStep] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    const onStage = (data: StageView) => setView(data);
    socket.on("stage", onStage);
    socket.on("connect", () => socket.emit("hello", { role: "stage", eventId }));
    socket.emit("hello", { role: "stage", eventId });
    return () => {
      socket.off("stage", onStage);
    };
  }, [eventId]);

  useEffect(() => {
    fetch("/api/runtime")
      .then((r) => r.json())
      .then((data: { origin?: string; lan?: string[]; joinUrl?: string }) => {
        const here = window.location.origin;
        const lan = data.lan?.[0];
        const origin =
          here.includes("localhost") || here.includes("127.0.0.1")
            ? lan || data.origin || here
            : here;
        const join = data.joinUrl || `${origin}/join/${eventId}`;
        return QRCode.toDataURL(join, { width: 420, margin: 1 });
      })
      .then(setQr)
      .catch(() => {
        QRCode.toDataURL(`${window.location.origin}/join/${eventId}`, { width: 420, margin: 1 }).then(setQr);
      });
  }, [eventId]);

  useEffect(() => {
    void unlockAudio();
    const unlock = () => {
      void unlockAudio();
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    if (!view) return;
    if (view.phase === "RESULT") {
      setStep((s) => Math.max(s, 5));
      return;
    }
    setStep(0);
    if (view.phase === "INTRO") {
      const t = [800, 2200, 4200];
      const ids = t.map((ms, i) => window.setTimeout(() => setStep(i + 1), ms));
      return () => ids.forEach(clearTimeout);
    }
    if (view.phase === "VOLUNTEER_ANNOUNCEMENT") {
      if (audioOn) playTone("boom");
      const ids = [1200, 2800].map((ms, i) => window.setTimeout(() => setStep(i + 1), ms));
      return () => ids.forEach(clearTimeout);
    }
    if (view.phase === "COMPATIBILITY_CALCULATION") {
      if (audioOn) playTone("scan");
      const ids = [1100, 2400, 3700, 5200, 6400].map((ms, i) =>
        window.setTimeout(() => setStep(i + 1), ms)
      );
      return () => ids.forEach(clearTimeout);
    }
  }, [view?.phase, view?.round?.id, audioOn]);

  if (!view) {
    return (
      <div className="stage stage--sunset">
        <img className="stage-logo" src="/branding/flirtybites-logo.svg" alt="FlirtyBites" />
        <p className="stage-tagline">Swipe right. Take a bite.</p>
      </div>
    );
  }

  const gathering =
    view.phase === "INTRO" ||
    view.phase === "QR_JOIN" ||
    view.phase === "SWIPING_LIVE" ||
    view.phase === "WAITING" ||
    view.phase === "ROUND_TRANSITION";
  const sunset =
    gathering ||
    view.phase === "CAST_REVEAL" ||
    (view.phase === "INTRO" && view.aggregates.totalParticipants === 0);

  return (
    <div className={`stage ${sunset ? "stage--sunset" : "stage--light"}`}>
      {view.testMode && <div className="test-banner">TEST MODE</div>}
      <button
        className="stage-audio"
        onClick={() => {
          setAudioOn((v) => {
            const next = !v;
            if (next) {
              void unlockAudio();
              playTone("like");
            }
            return next;
          });
        }}
      >
        {audioOn ? "Sound on" : "Sound off"}
      </button>
      <StageBody view={view} qr={qr} step={step} audioOn={audioOn} />
    </div>
  );
}

function StageBody({
  view,
  qr,
  step,
  audioOn
}: {
  view: StageView;
  qr: string;
  step: number;
  audioOn: boolean;
}) {
  const round = view.round;
  const food = view.foods.find((f) => f.id === round?.foodId);
  const question = view.questions[round?.currentQuestion ?? 0];
  const answer = question && round?.answers.find((a) => a.questionId === question.id);

  if (view.phase === "INTRO" && view.aggregates.totalParticipants === 0) {
    return (
      <div className="stage-panel stage-intro">
        <img className="stage-logo" src="/branding/flirtybites-logo.svg" alt="FlirtyBites" />
        <p className="stage-tagline">Swipe right. Take a bite.</p>
        {step >= 1 && <h2 className="stage-line">You don&apos;t choose the food.</h2>}
        {step >= 2 && <h1 className="stage-display">The food chooses you.</h1>}
      </div>
    );
  }

  if (view.phase === "CAST_REVEAL") {
    const pairs = view.castPairs ?? [];
    return (
      <div className="stage-cast">
        <img className="stage-logo stage-logo-cast" src="/branding/flirtybites-logo.svg" alt="FlirtyBites" />
        <p className="stage-kicker">Tonight&apos;s dates</p>
        <div className="stage-cast-grid">
          {pairs.map((pair) => (
            <div key={pair.foodId} className={`stage-cast-card ${pair.done ? "done" : ""}`}>
              <div className="stage-cast-photo">
                <img src={pair.image} alt={pair.foodName} />
              </div>
              <div className="stage-cast-copy">
                <strong>{pair.foodName}</strong>
                <span>{pair.volunteerName || "—"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const gathering =
    view.phase === "INTRO" ||
    view.phase === "QR_JOIN" ||
    view.phase === "SWIPING_LIVE" ||
    view.phase === "WAITING" ||
    view.phase === "ROUND_TRANSITION";

  if (gathering) {
    const n = view.aggregates.totalParticipants;
    const showFeed = n >= 5;
    const card = view.entertainment;
    if (!showFeed) {
      return (
        <div className="stage-panel">
          <img className="stage-logo" src="/branding/flirtybites-logo.svg" alt="FlirtyBites" />
          <p className="stage-kicker">Scan to enter</p>
          <h1 className="stage-display">What&apos;s on the menu today?</h1>
          <p className="stage-tagline">Swipe right. Take a bite.</p>
          {qr && (
            <div className="qr-box">
              <img src={qr} alt="Join QR" width={420} height={420} />
            </div>
          )}
          <p className="stage-meta">
            {n} {n === 1 ? "person is" : "people are"} in the pool
          </p>
        </div>
      );
    }
    return (
      <div className="join-plus-feed">
        <div className="feed-copy">
          <img className="stage-logo stage-logo-left" src="/branding/flirtybites-logo.svg" alt="FlirtyBites" />
          <p className="stage-kicker">{n} people in the pool</p>
          <h1 className="stage-display">
            {card?.headline ?? `${n} people are currently hunting for soul-food.`}
          </h1>
          <p className="stage-tagline">{card?.body ?? "Keep swiping. The menu is judging you back."}</p>
        </div>
        <div className="feed-qr">
          <p className="stage-kicker">Still open</p>
          {qr && (
            <div className="qr-box">
              <img src={qr} alt="Join QR" width={420} height={420} />
            </div>
          )}
          <p className="stage-meta">Scan to join</p>
        </div>
      </div>
    );
  }

  if (view.phase === "VOLUNTEER_ANNOUNCEMENT" || view.phase === "FOOD_SELECTION") {
    return (
      <div className="stage-match">
        <p className="match-kicker">
          <span className="match-pip orange" />
          IT&apos;S A
          <span className="match-pip green" />
        </p>
        <h1 className="match-title">
          Match<span className="match-bang">!</span>
        </h1>
        {food && (
          <div className="match-card-wrap stage-match-card">
            <StageFoodHero food={food} />
            <div className="match-heart" aria-hidden>
              ♥
            </div>
          </div>
        )}
        <h2 className="stage-volunteer-name">{round?.volunteerName}</h2>
        <p className="match-wait">
          {food ? `Wait until ${food.name} starts a conversation` : "Your date is on the way."}
        </p>
      </div>
    );
  }

  if (view.phase === "QUESTION" || view.phase === "ANSWER_REVEAL") {
    return (
      <div className="stage-ask">
        {food && <StageFoodHero food={food} compact />}
        <p className="stage-kicker">
          {round?.foodName} • Q {(round?.currentQuestion ?? 0) + 1} / {round?.totalQuestions}
        </p>
        <h2 className="stage-question">{question?.prompt}</h2>
        <div className="options-stage">
          {question?.options.map((opt) => (
            <div
              key={opt.key}
              className={`opt-card ${view.phase === "ANSWER_REVEAL" && answer?.answer === opt.key ? "on" : ""}`}
            >
              {opt.key}. {opt.label}
            </div>
          ))}
        </div>
        {view.phase === "ANSWER_REVEAL" && answer && (
          <p className="stage-chose">They chose {answer.answer}</p>
        )}
      </div>
    );
  }

  if (view.phase === "COMPATIBILITY_CALCULATION" || view.phase === "RESULT") {
    return (
      <Reveal
        view={view}
        step={step}
        audioOn={audioOn}
        resultPhase={view.phase === "RESULT"}
      />
    );
  }

  if (view.phase === "ROUND_TRANSITION") {
    return (
      <div className="stage-panel">
        <img className="stage-logo" src="/branding/flirtybites-logo.svg" alt="FlirtyBites" />
        <p className="stage-kicker">Next</p>
        <h1 className="stage-display">The food is still hungry.</h1>
        <p className="stage-tagline">Who&apos;s next?</p>
      </div>
    );
  }

  if (view.phase === "FINALE") {
    return (
      <div className="stage-panel">
        <img className="stage-logo" src="/branding/flirtybites-logo.svg" alt="FlirtyBites" />
        <h1 className="stage-display">The food has spoken.</h1>
        <p className="stage-tagline">You thought you were choosing the food. You weren&apos;t.</p>
      </div>
    );
  }

  return (
    <div className="stage-panel">
      <img className="stage-logo" src="/branding/flirtybites-logo.svg" alt="FlirtyBites" />
    </div>
  );
}

function StageFoodHero({ food, compact }: { food: FoodProfile; compact?: boolean }) {
  return (
    <div
      className={`stage-food-hero match-card--${food.id} ${compact ? "compact" : ""}`}
      style={{ backgroundImage: `url("${food.image}")` }}
      role="img"
      aria-label={food.name}
    />
  );
}

function useCountUp(target: number, active: boolean, duration = 2600) {
  const [value, setValue] = useState(0);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!active) {
      setValue(0);
      setLocked(false);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const jitter = t < 0.88 ? Math.round((Math.random() - 0.5) * 8) : 0;
      setValue(Math.max(0, Math.min(100, Math.round(target * eased) + jitter)));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setValue(target);
        setLocked(true);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target, duration]);

  return { value, locked };
}

function Reveal({
  view,
  step,
  audioOn,
  resultPhase
}: {
  view: StageView;
  step: number;
  audioOn: boolean;
  resultPhase: boolean;
}) {
  const round = view.round;
  const foodName = round?.foodName ?? "The Food";
  const score = round?.compatibilityScore ?? 0;
  const kind = round?.result ?? bandForScore(score).kind;
  const copy = resultCopy(foodName, kind);
  const counting = step >= 5;
  const { value, locked } = useCountUp(score, counting);
  const dims = useMemo(() => {
    const labels = round?.foodId
      ? dimensionScores(round.foodId, round.answers).slice(0, 3).map((d) => d.label)
      : ["CHUTNEY COMPATIBILITY", "PERSONALITY", "CRUNCH COMPATIBILITY"];
    const values = teaseScores(score, kind, round?.volunteerIndex ?? 0);
    return labels.map((label, i) => ({ label, value: values[i] ?? score }));
  }, [round, score, kind]);

  useEffect(() => {
    if (!audioOn) return;
    if (step >= 1 && step <= 3) playTone("slam", step - 1);
    if (step === 4) playTone("tension");
    if (step === 5) playTone("rise");
  }, [step, audioOn]);

  useEffect(() => {
    if (!audioOn || !counting || locked) return;
    let n = 0;
    const id = window.setInterval(() => {
      playTone("tick", n);
      n += 1;
    }, 90);
    return () => window.clearInterval(id);
  }, [audioOn, counting, locked]);

  useEffect(() => {
    if (!locked || !resultPhase || !audioOn) return;
    playTone("lock");
    return undefined;
  }, [locked, resultPhase, audioOn]);

  const showVerdict = resultPhase && locked;
  const dimIndex = Math.min(step - 1, 2);
  const dimValue = dims[dimIndex]?.value;

  if (step < 1) {
    return (
      <div className="stage-reveal">
        <img className="stage-logo" src="/branding/flirtybites-logo.svg" alt="FlirtyBites" />
        <p className="stage-kicker">Hang tight</p>
        <h1 className="stage-display">Analysing chemistry...</h1>
      </div>
    );
  }

  if (step < 4) {
    return (
      <div className="stage-reveal stage-reveal-dim" key={step}>
        <p className="stage-kicker">{dims[dimIndex]?.label}</p>
        <div className="pct pct-slam">{dimValue}%</div>
      </div>
    );
  }

  return (
    <div className={`stage-reveal stage-overall ${locked ? "is-locked" : ""} ${showVerdict ? "has-verdict" : ""}`}>
      <div className="stage-score">
        <p className="stage-overall-kicker">Overall compatibility</p>
        {counting ? (
          <div className={`pct-wrap ${locked ? "is-locked" : "is-counting"}`}>
            <div className="pct pct-overall">
              {value}
              <span>%</span>
            </div>
          </div>
        ) : (
          <p className="stage-overall-wait">The food is deciding.</p>
        )}
      </div>
      {showVerdict && (
        <div className="stage-verdict">
          {kind === "not-a-match" ? (
            <>
              <HeartbreakIcon large sound={audioOn} />
              <h1 className="stage-verdict-title">
                You &amp; {foodName} want different things!
              </h1>
              <p className="stage-verdict-sub">{copy.sub}</p>
            </>
          ) : kind === "match" || kind === "strong" ? (
            <>
              <MatchIcon large sound={audioOn} />
              <h1 className="stage-verdict-title">
                It&apos;s a date, {round?.volunteerName ?? "you"}!
              </h1>
              <p className="stage-verdict-sub">{copy.sub}</p>
            </>
          ) : (
            <>
              <h1 className="stage-verdict-title">{copy.title}</h1>
              <p className="stage-verdict-sub">{copy.sub}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
