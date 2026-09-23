"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PRIMARY_FOODS } from "@/lib/foods";
import { getSocket } from "@/lib/useSocket";
import type { EventState, FoodQuestion, StagePhase } from "@/lib/types";
import { questionsForFood } from "@/lib/questions";

type Payload = {
  event: EventState;
  aggregates: {
    totalParticipants: number;
    completed: number;
  };
  eligible: string[];
};

const PHASE_LABEL: Record<StagePhase, string> = {
  INTRO: "Intro",
  QR_JOIN: "Join QR",
  SWIPING_LIVE: "Swiping",
  WAITING: "Waiting",
  CAST_REVEAL: "Matches",
  VOLUNTEER_ANNOUNCEMENT: "Announce",
  FOOD_SELECTION: "Pick food",
  QUESTION: "Question",
  ANSWER_REVEAL: "Answer",
  COMPATIBILITY_CALCULATION: "Calculate",
  RESULT: "Result",
  ROUND_TRANSITION: "Between",
  FINALE: "Finale"
};

export default function ControllerPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<Payload | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socket.on("controller", setData);
    socket.on("error-message", setError);
    return () => {
      socket.off("controller", setData);
      socket.off("error-message", setError);
    };
  }, []);

  function auth() {
    getSocket().emit("hello", { role: "controller", eventId, key });
    setAuthed(true);
  }

  function act(type: string, extra: Record<string, unknown> = {}) {
    if (["reset", "end-event", "end-round", "override"].includes(type)) {
      if (confirm !== type) {
        setConfirm(type);
        return;
      }
    }
    setConfirm(null);
    setError(null);
    getSocket().emit("controller-action", { type, ...extra });
  }

  const event = data?.event;
  const round = event?.rounds.find((r) => r.id === event.currentRoundId);
  const volunteer = event?.participants.find((p) => p.id === round?.participantId);
  const selectedPerson = event?.participants.find((p) => p.id === selected);
  const cast = event?.cast ?? {};
  const currentQ = round?.foodId ? questionsForFood(round.foodId)[round.currentQuestion] : null;
  const currentAnswer = currentQ
    ? round?.answers.find((a) => a.questionId === currentQ.id)?.answer
    : undefined;

  const rows = useMemo(() => {
    if (!event) return [];
    return event.participants.filter((p) => {
      if (search && !p.fullName.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === "ready") return data?.eligible.includes(p.id);
      if (PRIMARY_FOODS.some((f) => f.id === filter)) {
        return event.swipes.some(
          (s) => s.participantId === p.id && s.foodId === filter && s.direction === "right"
        );
      }
      return true;
    });
  }, [event, filter, search, data]);

  if (!authed || !event) {
    return (
      <div className="controller" style={{ padding: 24 }}>
        <h1 className="display">CONTROLLER</h1>
        <p>Enter controller key.</p>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="showtime"
          style={{ height: 44, marginRight: 8 }}
        />
        <button className="btn" onClick={auth}>
          Enter
        </button>
        {error && <p>{error}</p>}
      </div>
    );
  }

  const roundNum = event.rounds.filter((r) => r.status === "complete").length + (round ? 1 : 0);
  const booked = PRIMARY_FOODS.filter((f) => cast[f.id]).length;

  return (
    <div className="controller dash">
      {event.testMode && <div className="test-banner">TEST MODE</div>}
      <header className="dash-top">
        <div className="dash-top-left">
          <h1 className="display">CONTROL</h1>
          <div className={`dash-metric ${event.status === "live" ? "is-live" : ""}`}>
            <span>Show</span>
            <b>{event.status === "live" ? "LIVE" : event.status === "ended" ? "ENDED" : "NOT STARTED"}</b>
          </div>
          <div className="dash-metric">
            <span>On stage now</span>
            <b>{PHASE_LABEL[event.phase]}</b>
          </div>
          <div className="dash-metric">
            <span>In the room</span>
            <b>{data.aggregates.totalParticipants}</b>
          </div>
          <div className="dash-metric">
            <span>Dates booked</span>
            <b>
              {booked} / 6
            </b>
          </div>
          <div className="dash-metric">
            <span>Round</span>
            <b>{roundNum || "—"}</b>
          </div>
        </div>
        <div className="dash-show-controls">
          {event.status === "live" ? (
            <span className="show-live-flag">Show is live</span>
          ) : (
            <button className="btn start-cta" onClick={() => act("start")}>
              Start show
            </button>
          )}
          <button
            className={`btn match-them-cta ${event.castRevealed ? "is-tapped" : ""}`}
            disabled={booked < 6 || Boolean(round) || event.castRevealed}
            onClick={() => act("reveal-matches")}
          >
            {event.castRevealed ? "Matched" : "Match them"}
          </button>
          <button className="btn reset-cta" onClick={() => act("reset")}>
            {confirm === "reset" ? "Tap again to reset" : "Reset everything"}
          </button>
        </div>
      </header>

      {(error || confirm) && (
        <div className="dash-banner">
          {confirm ? `Tap the action again to confirm: ${confirm.replace("-", " ")}` : error}
        </div>
      )}

      <div className="dash-cast">
        {PRIMARY_FOODS.map((f) => {
          const pid = cast[f.id];
          const person = event.participants.find((p) => p.id === pid);
          const used = event.usedFoodIds.includes(f.id);
          const live = round?.foodId === f.id;
          const canCall = Boolean(person) && !used && !round;
          return (
            <div
              key={f.id}
              className={`cast-slot ${person ? "filled" : ""} ${used ? "used" : ""} ${live ? "live" : ""}`}
            >
              <strong>{f.name}</strong>
              <span>{person?.fullName ?? "Tap a ❤️ below"}</span>
              {live ? (
                <em>On stage</em>
              ) : used ? (
                <em>Done</em>
              ) : (
                <button
                  type="button"
                  className="btn-call-stage"
                  disabled={!canCall}
                  onClick={() => {
                    if (!person || !canCall) return;
                    act("select-volunteer", { participantId: person.id, foodSlug: f.slug });
                  }}
                >
                  Call on Stage
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="dash-body">
        <section className="dash-main">
          <p className="dash-hint">
            Tap a heart to book that person against that food. When all six are booked, press Match them. Then Call on Stage for whoever should walk up.
          </p>

          <div className="dash-tools">
            <input
              placeholder="Search a name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="seg">
              <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>
                Everyone
              </button>
              <button className={filter === "ready" ? "on" : ""} onClick={() => setFilter("ready")}>
                Ready for stage
              </button>
            </div>
          </div>

          <div className="matrix-wrap" tabIndex={0}>
            <table className="matrix">
              <thead>
                <tr>
                  <th className="name">
                    Name · {rows.length}
                  </th>
                  {PRIMARY_FOODS.map((f) => (
                    <th
                      key={f.id}
                      className={`food-th ${event.usedFoodIds.includes(f.id) || cast[f.id] ? "muted-col" : ""} ${filter === f.id ? "on" : ""}`}
                      onClick={() => setFilter(filter === f.id ? "all" : f.id)}
                    >
                      {f.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const bookedFood = PRIMARY_FOODS.find((f) => cast[f.id] === p.id);
                  return (
                  <tr
                    key={p.id}
                    className={`${data.eligible.includes(p.id) ? "eligible" : ""} ${selected === p.id ? "selected" : ""} ${bookedFood ? "casted muted-row" : ""}`}
                    onClick={() => setSelected(p.id)}
                  >
                    <td className="name">
                      {p.fullName}
                      {bookedFood ? (
                        <em className="ready-tag">{bookedFood.name}</em>
                      ) : data.eligible.includes(p.id) ? (
                        <em className="ready-tag">ready</em>
                      ) : null}
                    </td>
                    {PRIMARY_FOODS.map((f) => {
                      const swipe = event.swipes.find(
                        (s) => s.participantId === p.id && s.foodId === f.id
                      );
                      const picked = cast[f.id] === p.id;
                      const colTaken = Boolean(cast[f.id]);
                      const muted = Boolean(bookedFood) || colTaken || event.usedFoodIds.includes(f.id);
                      return (
                        <td
                          key={f.id}
                          className={`${muted ? "muted-cell" : ""} ${picked ? "heart-picked" : ""}`}
                        >
                          {swipe?.direction === "right" ? (
                            <button
                              type="button"
                              className={`heart-btn ${picked ? "picked" : ""} ${muted ? "is-muted" : ""}`}
                              aria-label={`Book ${p.fullName} for ${f.name}`}
                              disabled={muted && !picked}
                              onClick={(e) => {
                                e.stopPropagation();
                                act("assign-cast", { participantId: p.id, foodId: f.id });
                              }}
                            >
                              <span className="heart-glyph">♥</span>
                            </button>
                          ) : swipe?.direction === "left" ? (
                            <span className="nope">✕</span>
                          ) : (
                            "—"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="dash-footer">
            <span>
              {selectedPerson
                ? `Tap a ❤️ on ${selectedPerson.fullName}'s row to book their food.`
                : "Tap a ❤️ to book a date. Then tap that slot on top to call them."}
            </span>
          </div>
        </section>

        <aside className="dash-side">
          {round ? (
            <LiveRoundGuide
              event={event}
              volunteerName={volunteer?.fullName ?? "Volunteer"}
              foodName={PRIMARY_FOODS.find((f) => f.id === round.foodId)?.name ?? null}
              question={currentQ}
              answer={currentAnswer}
              confirm={confirm}
              act={act}
            />
          ) : (
            <ol className="show-steps idle-steps">
              <li>
                <b>1. Book the six dates</b>
                <span>Tap a heart in the grid. Names appear on top.</span>
              </li>
              <li>
                <b>2. Match them</b>
                <span>When all six slots are filled, press Match them. It turns green (Matched) and all six phones show It&apos;s a Match.</span>
              </li>
              <li>
                <b>3. Call someone up</b>
                <span>Press Call on Stage. Stage zooms in on that name. Then they scan and answer.</span>
              </li>
            </ol>
          )}

          <details className="more">
            <summary>Test mode</summary>
            <div className="side-actions">
              {[10, 30, 60, 100].map((n) => (
                <button key={n} className="btn ghost" onClick={() => act("simulate", { count: n })}>
                  Simulate {n} people
                </button>
              ))}
            </div>
          </details>
        </aside>
      </div>
    </div>
  );
}

function LiveRoundGuide({
  event,
  volunteerName,
  foodName,
  question,
  answer,
  confirm,
  act
}: {
  event: EventState;
  volunteerName: string;
  foodName: string | null;
  question: FoodQuestion | null;
  answer: string | undefined;
  confirm: string | null;
  act: (type: string, extra?: Record<string, unknown>) => void;
}) {
  const round = event.rounds.find((r) => r.id === event.currentRoundId);

  useEffect(() => {
    if (event.phase !== "COMPATIBILITY_CALCULATION" || !event.currentRoundId) return undefined;
    const t = window.setTimeout(() => {
      getSocket().emit("controller-action", { type: "reveal-result" });
    }, 6800);
    return () => window.clearTimeout(t);
  }, [event.phase, event.currentRoundId]);

  if (!round) return null;
  const phase = event.phase;
  const waitingScan = phase === "VOLUNTEER_ANNOUNCEMENT" || phase === "FOOD_SELECTION";
  const asking = phase === "QUESTION" || phase === "ANSWER_REVEAL";
  const tallying = phase === "COMPATIBILITY_CALCULATION";
  const result = phase === "RESULT";
  const qNum = round.currentQuestion + 1;
  const questions = round.foodId ? questionsForFood(round.foodId) : [];
  const qTotal = questions.length || 5;
  const lastQ = qNum >= qTotal;
  const answered = Boolean(answer);
  const allAnswered =
    questions.length > 0 &&
    questions.every((q) => round.answers.some((a) => a.questionId === q.id));
  const readyToLock = allAnswered || (lastQ && answered);

  return (
    <div className="live-card">
      <p className="live-who">
        {volunteerName}
        {foodName ? ` × ${foodName}` : ""}
      </p>

      <ol className="show-steps">
        <li className={waitingScan ? "is-now" : "is-done"}>
          <b>1. Scan</b>
          <span>
            {waitingScan
              ? "Volunteer scans the stage QR. Questions then open on phone, stage, and here."
              : "QR scanned."}
          </span>
          {waitingScan && round.foodId && (
            <button
              className="btn ghost"
              onClick={() => {
                const food = PRIMARY_FOODS.find((f) => f.id === round.foodId);
                if (food) act("pick-food", { foodSlug: food.slug });
              }}
            >
              Phone failed? Open questions now
            </button>
          )}
          {waitingScan && !round.foodId && (
            <div className="step-backup">
              <p>Phone failed? Pick their food here.</p>
              {PRIMARY_FOODS.map((f) => (
                <button
                  key={f.id}
                  className="btn ghost"
                  disabled={event.usedFoodIds.includes(f.id)}
                  onClick={() => act("pick-food", { foodSlug: f.slug })}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </li>

        <li className={asking ? "is-now" : waitingScan ? "" : "is-done"}>
          <b>2. Questions {asking ? `· ${qNum} / ${qTotal}` : ""}</b>
          {asking && question ? (
            <>
              <p className="step-prompt">{question.prompt}</p>
              <div className="step-opts">
                {question.options.map((opt) => (
                  <button
                    key={opt.key}
                    className={`btn ${answer === opt.key ? "picked-ans" : "ghost"}`}
                    onClick={() => act("answer", { questionId: question.id, answer: opt.key })}
                  >
                    {opt.key}. {opt.label}
                  </button>
                ))}
              </div>
              <p className="step-hint">
                {answered
                  ? "Answer is in. Phone and stage are showing it."
                  : "They answer on the phone. Use these only if the phone fails."}
              </p>
              {answered && !lastQ && (
                <button className="btn-critical" onClick={() => act("next-question")}>
                  Next question
                </button>
              )}
              {readyToLock && (
                <>
                  <p className="step-hint">All five answers are in. Accept or reject this date.</p>
                  <div className="step-force">
                    <button className="btn-force accept" onClick={() => act("force-match")}>
                      Accept
                    </button>
                    <button className="btn-force reject" onClick={() => act("force-reject")}>
                      Reject
                    </button>
                  </div>
                </>
              )}
              {!answered && (
                <button className="btn ghost" onClick={() => act("skip-question")}>
                  Skip this question
                </button>
              )}
            </>
          ) : (
            <span>{waitingScan ? "Waiting for the QR scan." : "Questions done."}</span>
          )}
        </li>

        <li className={tallying ? "is-now" : result ? "is-done" : ""}>
          <b>3. Compatibility</b>
          {tallying ? (
            <>
              <div className="side-score">
                {round.compatibilityScore ?? "—"}
                <span>%</span>
              </div>
              <span>
                {round.result === "match" || round.result === "strong"
                  ? "Accepted. Stage is counting up to a date."
                  : "Rejected. Stage is counting up to a miss."}
              </span>
            </>
          ) : result ? (
            <span>
              {round.result === "match" || round.result === "strong" ? "Accepted" : "Rejected"}
              {round.compatibilityScore != null ? ` · ${round.compatibilityScore}%` : ""}.
            </span>
          ) : (
            <span>After Accept or Reject.</span>
          )}
        </li>

        <li className={result ? "is-now" : ""}>
          <b>4. Close the round</b>
          {result ? (
            <>
              <span>Clear the stage, then call the next date from the top row.</span>
              <button className="btn-critical danger" onClick={() => act("end-round")}>
                {confirm === "end-round" ? "Tap again to end round" : "End round"}
              </button>
            </>
          ) : (
            <span>After the result.</span>
          )}
        </li>
      </ol>
    </div>
  );
}
