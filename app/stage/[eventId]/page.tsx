"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { getSocket } from "@/lib/useSocket";
import type { StageView } from "@/lib/types";
import { bandForScore, dimensionScores, resultCopy } from "@/lib/compatibility";
import { playTone, unlockAudio } from "@/lib/sound";
import { FoodPickGrid } from "@/components/FoodPickGrid";
import { PRIMARY_FOODS } from "@/lib/foods";

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
      .then((data: { origin?: string }) => {
        const origin = data.origin || window.location.origin;
        return QRCode.toDataURL(`${origin}/join/${eventId}`, { width: 420, margin: 1 });
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
    setStep(0);
    if (!view) return;
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
    if (view.phase === "COMPATIBILITY_CALCULATION" || view.phase === "RESULT") {
      if (audioOn) playTone("sting");
      const ids = [900, 1800, 2700, 3800, 5200, 6800].map((ms, i) =>
        window.setTimeout(() => setStep(i + 1), ms)
      );
      return () => ids.forEach(clearTimeout);
    }
  }, [view?.phase, view?.round?.id, audioOn]);

  if (!view) {
    return (
      <div className="stage">
        <h1 className="display">FOOD DATING</h1>
      </div>
    );
  }

  return (
    <div className="stage">
      {view.testMode && <div className="test-banner">TEST MODE</div>}
      <button
        className="btn ghost audio-btn"
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
        {audioOn ? "SOUND ON" : "SOUND OFF"}
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
      <div>
        <p className="tag">LIVE</p>
        <h1 className="display">FOOD DATING</h1>
        {step >= 1 && <h2 className="serif">YOU DON&apos;T CHOOSE THE FOOD.</h2>}
        {step >= 2 && <h2 className="display">THE FOOD CHOOSES YOU.</h2>}
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
        <div>
          <p className="tag">SCAN TO ENTER</p>
          <h1 className="display">JOIN THE DATING POOL</h1>
          {qr && (
            <div className="qr-box">
              <img src={qr} alt="Join QR" width={420} height={420} />
            </div>
          )}
          <p>{n} {n === 1 ? "person is" : "people are"} in.</p>
        </div>
      );
    }
    return (
      <div className="join-plus-feed">
        <div className="feed-copy">
          <p className="tag">{n} PEOPLE IN THE POOL</p>
          <h1 className="display">
            {card?.headline ?? `${n} PEOPLE ARE CURRENTLY LOOKING FOR LOVE.`}
          </h1>
          <p className="serif">{card?.body ?? "Keep swiping. Destiny is buffering."}</p>
        </div>
        <div className="feed-qr">
          <p className="tag">STILL OPEN</p>
          {qr && (
            <div className="qr-box">
              <img src={qr} alt="Join QR" width={280} height={280} />
            </div>
          )}
          <p>Scan to join</p>
        </div>
      </div>
    );
  }

  if (view.phase === "VOLUNTEER_ANNOUNCEMENT" || (view.phase === "FOOD_SELECTION" && !food)) {
    return (
      <div style={{ width: "100%" }}>
        <p className="tag">PLEASE COME TO THE STAGE</p>
        <h1 className="display">{round?.volunteerName}</h1>
        <h2 className="serif">PICK YOUR DATE.</h2>
        <FoodPickGrid foods={PRIMARY_FOODS} usedFoodIds={view.usedFoodIds} large />
      </div>
    );
  }

  if (view.phase === "FOOD_SELECTION" && food && round) {
    return (
      <div>
        <p className="tag">IT&apos;S A DATE</p>
        <h1 className="display">
          ❤️ {round.volunteerName} + {food.name}
        </h1>
        <p className="serif">LET&apos;S SEE IF THIS RELATIONSHIP HAS A FUTURE.</p>
      </div>
    );
  }

  if (view.phase === "QUESTION" || view.phase === "ANSWER_REVEAL") {
    return (
      <div style={{ width: "100%" }}>
        <p className="tag">
          {round?.foodName} • Q {(round?.currentQuestion ?? 0) + 1} / {round?.totalQuestions}
        </p>
        <h2 className="serif">{question?.prompt}</h2>
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
          <h2 className="display">VOLUNTEER CHOSE {answer.answer}</h2>
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
      <div>
        <p className="tag">NEXT</p>
        <h1 className="display">THE FOOD IS STILL HUNGRY.</h1>
        <p>Who&apos;s next?</p>
      </div>
    );
  }

  if (view.phase === "FINALE") {
    return (
      <div>
        <h1 className="display">THE FOOD HAS SPOKEN.</h1>
        <p className="serif">You thought you were choosing the food. You weren&apos;t.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="display">FOOD DATING</h1>
    </div>
  );
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
  const first = (round?.volunteerIndex ?? 0) === 0;
  const kind = round?.result ?? bandForScore(score).kind;
  const copy = resultCopy(foodName, kind, first);
  const dims = useMemo(
    () =>
      round?.foodId
        ? dimensionScores(round.foodId, round.answers).slice(0, 3)
        : [
            { label: "CHUTNEY COMPATIBILITY", value: 42 },
            { label: "PERSONALITY", value: 31 },
            { label: "CRUNCH COMPATIBILITY", value: 38 }
          ],
    [round]
  );

  useEffect(() => {
    if (!resultPhase || step < 6) return;
    if (audioOn) playTone(kind === "match" || kind === "strong" ? "match" : "nope");
  }, [resultPhase, step, audioOn, kind]);

  const showFinal = resultPhase && step >= 5;

  return (
    <div>
      {step < 1 && <h1 className="display">ANALYSING CHEMISTRY...</h1>}
      {step >= 1 && step < 5 && (
        <div>
          <p className="tag">{dims[Math.min(step - 1, 2)]?.label}</p>
          <div className="pct">
            {first ? [42, 31, 38][Math.min(step - 1, 2)] : dims[Math.min(step - 1, 2)]?.value}%
          </div>
        </div>
      )}
      {step >= 4 && (
        <div>
          <p className="tag">OVERALL COMPATIBILITY</p>
          <div className="pct">{score}%</div>
          {showFinal && (
            <>
              {first && <p className="tag">{foodName.toUpperCase()} HAS DECIDED.</p>}
              <h1 className="display">{first ? "💔 NOT A MATCH" : copy.title}</h1>
              <p className="serif">{copy.sub}</p>
              {first && <p>Thank you for your service.</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
