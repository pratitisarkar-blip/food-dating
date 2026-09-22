"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PRIMARY_FOODS } from "@/lib/foods";
import { getSocket } from "@/lib/useSocket";
import type { EventState, ResultKind, StagePhase } from "@/lib/types";
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
  const [filter, setFilter] = useState("eligible");
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
    if (["reset", "end-event", "end-round", "override", "force-match", "force-reject"].includes(type)) {
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
  const currentQ = round?.foodId ? questionsForFood(round.foodId)[round.currentQuestion] : null;
  const currentAnswer = currentQ
    ? round?.answers.find((a) => a.questionId === currentQ.id)?.answer
    : undefined;

  const rows = useMemo(() => {
    if (!event) return [];
    return event.participants.filter((p) => {
      if (search && !p.fullName.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === "completed") return Boolean(p.completedAt);
      if (filter === "eligible") return data?.eligible.includes(p.id);
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

  return (
    <div className="controller dash">
      {event.testMode && <div className="test-banner">TEST MODE</div>}
      <header className="dash-top">
        <div className="dash-top-left">
          <h1 className="display">CONTROL</h1>
          <div className="dash-metric">
            <span>Event</span>
            <b>{event.status.toUpperCase()}</b>
          </div>
          <div className="dash-metric">
            <span>Stage</span>
            <b>{PHASE_LABEL[event.phase]}</b>
          </div>
          <div className="dash-metric">
            <span>In room</span>
            <b>{data.aggregates.totalParticipants}</b>
          </div>
          <div className="dash-metric">
            <span>Done</span>
            <b>{data.aggregates.completed}</b>
          </div>
          <div className="dash-metric">
            <span>Round</span>
            <b>{roundNum || "—"}</b>
          </div>
        </div>
        <div className="dash-top-right">
          <button className="btn" onClick={() => act("start")}>
            Start
          </button>
          <button className="btn ghost" onClick={() => act("pause")}>
            Pause
          </button>
        </div>
      </header>

      {(error || confirm) && (
        <div className="dash-banner">
          {confirm ? `Tap the action again to confirm: ${confirm.replace("-", " ")}` : error}
        </div>
      )}

      <div className="dash-body">
        <section className="dash-main">
          <div className="dash-foods">
            {PRIMARY_FOODS.map((f) => {
              const used = event.usedFoodIds.includes(f.id);
              return (
                <button
                  key={f.id}
                  className={`food-chip ${used ? "used" : ""} ${filter === f.id ? "on" : ""}`}
                  onClick={() => setFilter(filter === f.id ? "eligible" : f.id)}
                >
                  {f.name}
                  <small>{used ? "USED" : "available"}</small>
                </button>
              );
            })}
          </div>

          <div className="dash-tools">
            <input
              placeholder="Search a name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="seg">
              {[
                ["eligible", "Eligible"],
                ["completed", "Done"],
                ["all", "All"]
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={filter === id ? "on" : ""}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
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
                      className={`food-th ${event.usedFoodIds.includes(f.id) ? "used-col" : ""} ${filter === f.id ? "on" : ""}`}
                      onClick={() => setFilter(filter === f.id ? "eligible" : f.id)}
                    >
                      {f.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={p.id}
                    className={`${data.eligible.includes(p.id) ? "eligible" : ""} ${selected === p.id ? "selected" : ""}`}
                    onClick={() => setSelected(p.id)}
                  >
                    <td className="name">{p.fullName}</td>
                    {PRIMARY_FOODS.map((f) => {
                      const swipe = event.swipes.find(
                        (s) => s.participantId === p.id && s.foodId === f.id
                      );
                      return (
                        <td
                          key={f.id}
                          className={event.usedFoodIds.includes(f.id) ? "used-col" : ""}
                        >
                          {swipe?.direction === "right" ? (
                            <span className="heart">❤️</span>
                          ) : swipe?.direction === "left" ? (
                            <span className="nope">✕</span>
                          ) : (
                            "—"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dash-footer">
            <span>
              {selectedPerson
                ? `Selected: ${selectedPerson.fullName}`
                : "Click a row, then call them up."}
            </span>
            <button
              className="btn gold"
              disabled={!selected}
              onClick={() => act("select-volunteer", { participantId: selected })}
            >
              Call {selectedPerson?.fullName ?? "volunteer"} to stage
            </button>
          </div>
        </section>

        <aside className="dash-side">
          {round ? (
            <div className="live-card">
              <h2>LIVE ROUND</h2>
              <div className="kv">
                <b>Volunteer</b>
                <span>{volunteer?.fullName}</span>
                <b>Food</b>
                <span>{PRIMARY_FOODS.find((f) => f.id === round.foodId)?.name ?? "Waiting for pick"}</span>
                <b>Question</b>
                <span>
                  {round.currentQuestion + 1} / 5
                </span>
                <b>Answer</b>
                <span>{currentAnswer || "—"}</span>
                <b>Score</b>
                <span>{round.compatibilityScore ?? "—"}%</span>
              </div>
              <div className="side-actions">
                {!round.foodId && (
                  <>
                    <p style={{ margin: 0 }}>Backup: pick their food if the phone fails.</p>
                    {PRIMARY_FOODS.map((f) => (
                      <button
                        key={f.id}
                        className="btn ghost"
                        disabled={event.usedFoodIds.includes(f.id)}
                        onClick={() => act("pick-food", { foodSlug: f.slug })}
                      >
                        {event.usedFoodIds.includes(f.id) ? `${f.name} used` : f.name}
                      </button>
                    ))}
                  </>
                )}
                {round.foodId && currentQ && (
                  <>
                    <p style={{ margin: 0 }}>Backup answers for this question</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {currentQ.options.map((opt) => (
                        <button
                          key={opt.key}
                          className={`btn ${currentAnswer === opt.key ? "" : "ghost"}`}
                          onClick={() => act("answer", { questionId: currentQ.id, answer: opt.key })}
                        >
                          {opt.key}. {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button className="btn ghost" onClick={() => act("prev-question")}>
                    Prev Q
                  </button>
                  <button className="btn" onClick={() => act("next-question")}>
                    Next Q
                  </button>
                </div>
                <button className="btn ghost" onClick={() => act("reveal-answer")}>
                  Reveal answer
                </button>
                <button className="btn ghost" onClick={() => act("calculate")}>
                  Calculate
                </button>
                <button className="btn gold block" onClick={() => act("reveal-result")}>
                  Reveal result
                </button>
                <button className="btn danger block" onClick={() => act("end-round")}>
                  {confirm === "end-round" ? "Confirm end round" : "End round"}
                </button>
              </div>
            </div>
          ) : (
            <div className="idle-hint">
              Stage runs itself until you pick someone. After 5 people join, jokes appear next to the QR. Click a name, then call them up.
            </div>
          )}

          <details className="more">
            <summary>Mark food used</summary>
            <div className="side-actions">
              {PRIMARY_FOODS.map((f) => (
                <button
                  key={f.id}
                  className="btn ghost"
                  onClick={() =>
                    act(event.usedFoodIds.includes(f.id) ? "reset-food" : "mark-food", {
                      foodId: f.id
                    })
                  }
                >
                  {event.usedFoodIds.includes(f.id) ? `Reset ${f.name}` : `Use ${f.name}`}
                </button>
              ))}
            </div>
          </details>

          <details className="more">
            <summary>Emergency</summary>
            <div className="side-actions">
              <button className="btn ghost" onClick={() => act("skip-round")}>
                Skip round
              </button>
              <button className="btn ghost" onClick={() => act("skip-question")}>
                Skip question
              </button>
              <button className="btn ghost" onClick={() => act("force-match")}>
                {confirm === "force-match" ? "Confirm force match" : "Force match"}
              </button>
              <button className="btn ghost" onClick={() => act("force-reject")}>
                {confirm === "force-reject" ? "Confirm force rejection" : "Force rejection"}
              </button>
              <select
                onChange={(e) => {
                  if (!e.target.value) return;
                  act("override", { kind: e.target.value as ResultKind });
                  e.target.value = "";
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  Override result
                </option>
                <option value="not-a-match">Not a Match</option>
                <option value="complicated">It&apos;s Complicated</option>
                <option value="could-be">There Could Be Something</option>
                <option value="strong">Strong Chemistry</option>
                <option value="match">It&apos;s a Match</option>
              </select>
              <button className="btn danger" onClick={() => act("end-event")}>
                {confirm === "end-event" ? "Confirm end event" : "End event"}
              </button>
              <button className="btn danger" onClick={() => act("reset")}>
                {confirm === "reset" ? "Confirm reset event" : "Reset event"}
              </button>
            </div>
          </details>

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
