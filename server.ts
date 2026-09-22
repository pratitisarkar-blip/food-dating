import { createServer } from "http";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import next from "next";
import { Server } from "socket.io";
import { DEFAULT_EVENT_ID } from "./lib/types";
import type { EventState, ResultKind, StagePhase } from "./lib/types";
import {
  answerQuestion,
  applySwipe,
  attachFood,
  audienceView,
  calculateCompatibility,
  computeAggregates,
  createEvent,
  currentRound,
  endRound,
  isEligible,
  joinParticipant,
  markFoodUsed,
  nextQuestion,
  overrideResult,
  prevQuestion,
  resetEvent,
  resetFood,
  revealAnswer,
  revealResult,
  returnToWaiting,
  selectVolunteer,
  setPhase,
  setStatus,
  showEntertainment,
  simulateParticipants,
  skipEntertainment,
  skipRound,
  stageView
} from "./lib/engine";
import { FOODS } from "./lib/foods";
import { joinUrl, lanOrigins, tunnelUrl } from "./lib/public-url";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const CONTROLLER_KEY = process.env.CONTROLLER_KEY || "showtime";
const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), "data");
const STATE_FILE = join(DATA_DIR, "event-state.json");

const events = new Map<string, EventState>();

function loadState() {
  try {
    if (!existsSync(STATE_FILE)) return;
    const parsed = JSON.parse(readFileSync(STATE_FILE, "utf8")) as EventState[];
    for (const event of parsed) events.set(event.id, event);
  } catch {
    /* start fresh */
  }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
function persist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(STATE_FILE, JSON.stringify([...events.values()]));
  }, 250);
}

function getEvent(eventId: string) {
  const id = eventId || DEFAULT_EVENT_ID;
  let event = events.get(id);
  if (!event) {
    event = createEvent(id);
    events.set(id, event);
    persist();
  }
  return event;
}

loadState();
if (!events.has(DEFAULT_EVENT_ID)) {
  events.set(DEFAULT_EVENT_ID, createEvent(DEFAULT_EVENT_ID));
  persist();
}

const app = next({ dev, hostname: "localhost", port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*" },
    pingInterval: 8000,
    pingTimeout: 20000
  });

  function broadcast(event: EventState) {
    persist();
    const controllerPayload = {
      event,
      aggregates: computeAggregates(event),
      foods: FOODS,
      eligible: event.participants
        .filter((p) => isEligible(event, p.id))
        .map((p) => p.id)
    };
    io.to(`controller:${event.id}`).emit("controller", controllerPayload);
    io.to(`stage:${event.id}`).emit("stage", stageView(event));
    const sockets = io.sockets.adapter.rooms.get(`audience:${event.id}`);
    if (sockets) {
      for (const sid of sockets) {
        const sock = io.sockets.sockets.get(sid);
        const pid = sock?.data.participantId as string | undefined;
        sock?.emit("audience", audienceView(event, pid ?? null));
      }
    }
  }

  io.on("connection", (socket) => {
    socket.on("hello", (payload: { role: string; eventId: string; participantId?: string; key?: string }) => {
      const event = getEvent(payload.eventId);
      socket.data.eventId = event.id;
      socket.data.role = payload.role;
      if (payload.role === "controller") {
        if (payload.key !== CONTROLLER_KEY) {
          socket.emit("error-message", "Invalid controller key.");
          return;
        }
        socket.data.controller = true;
        socket.join(`controller:${event.id}`);
        broadcast(event);
        return;
      }
      if (payload.role === "stage") {
        socket.join(`stage:${event.id}`);
        socket.emit("stage", stageView(event));
        return;
      }
      socket.join(`audience:${event.id}`);
      if (payload.participantId) {
        socket.data.participantId = payload.participantId;
        socket.emit("audience", audienceView(event, payload.participantId));
      }
    });

    socket.on("join", ({ eventId, fullName }: { eventId: string; fullName: string }) => {
      try {
        const event = getEvent(eventId);
        const participant = joinParticipant(event, fullName);
        socket.data.participantId = participant.id;
        socket.data.eventId = event.id;
        socket.join(`audience:${event.id}`);
        socket.emit("joined", { participantId: participant.id });
        socket.emit("audience", audienceView(event, participant.id));
        broadcast(event);
      } catch (err) {
        socket.emit("error-message", err instanceof Error ? err.message : "Join failed");
      }
    });

    socket.on("swipe", ({ foodId, direction }: { foodId: string; direction: "left" | "right" }) => {
      try {
        const event = getEvent(socket.data.eventId);
        const pid = socket.data.participantId as string | undefined;
        if (!pid) throw new Error("Join first.");
        applySwipe(event, pid, foodId, direction);
        socket.emit("audience", audienceView(event, pid));
        broadcast(event);
      } catch (err) {
        socket.emit("error-message", err instanceof Error ? err.message : "Swipe failed");
      }
    });

    socket.on("volunteer-answer", ({ questionId, answer }: { questionId: string; answer: "A" | "B" | "C" | "D" }) => {
      try {
        const event = getEvent(socket.data.eventId);
        const pid = socket.data.participantId as string | undefined;
        if (!pid) throw new Error("Join first.");
        answerQuestion(event, pid, questionId, answer);
        broadcast(event);
      } catch (err) {
        socket.emit("error-message", err instanceof Error ? err.message : "Answer failed");
      }
    });

    socket.on("scan-food", ({ eventId, foodSlug }: { eventId: string; foodSlug: string }) => {
      try {
        const event = getEvent(eventId);
        attachFood(event, foodSlug);
        socket.emit("food-attached", { foodSlug });
        broadcast(event);
      } catch (err) {
        socket.emit("error-message", err instanceof Error ? err.message : "Scan failed");
      }
    });

    function requireController() {
      if (!socket.data.controller) throw new Error("Controller only.");
      return getEvent(socket.data.eventId);
    }

    socket.on("controller-action", (payload: { type: string; [k: string]: unknown }) => {
      try {
        const event = requireController();
        switch (payload.type) {
          case "start":
            setStatus(event, "live");
            setPhase(event, "QR_JOIN");
            break;
          case "pause":
            setStatus(event, "paused");
            break;
          case "end-event":
            setStatus(event, "ended");
            break;
          case "reset":
            resetEvent(event);
            break;
          case "phase":
            setPhase(event, payload.phase as StagePhase);
            break;
          case "select-volunteer":
            selectVolunteer(event, String(payload.participantId));
            break;
          case "pick-food":
            attachFood(event, String(payload.foodSlug));
            break;
          case "answer": {
            const round = currentRound(event);
            if (!round) throw new Error("No active round.");
            answerQuestion(
              event,
              round.participantId,
              String(payload.questionId),
              payload.answer as "A" | "B" | "C" | "D",
              true
            );
            break;
          }
          case "start-round":
            setPhase(event, "FOOD_SELECTION");
            if (currentRound(event)) currentRound(event)!.status = "awaiting-food";
            break;
          case "next-question":
            nextQuestion(event);
            break;
          case "prev-question":
            prevQuestion(event);
            break;
          case "reveal-answer":
            revealAnswer(event);
            break;
          case "calculate":
            calculateCompatibility(event);
            break;
          case "reveal-result":
            revealResult(event);
            break;
          case "override":
            overrideResult(event, payload.kind as ResultKind);
            break;
          case "end-round":
            endRound(event);
            break;
          case "mark-food":
            markFoodUsed(event, String(payload.foodId));
            break;
          case "reset-food":
            resetFood(event, String(payload.foodId));
            break;
          case "entertainment":
            showEntertainment(event);
            break;
          case "skip-entertainment":
            skipEntertainment(event);
            break;
          case "skip-round":
            skipRound(event);
            break;
          case "waiting":
            returnToWaiting(event);
            break;
          case "skip-question":
            nextQuestion(event);
            break;
          case "force-match":
            overrideResult(event, "match");
            revealResult(event);
            break;
          case "force-reject":
            overrideResult(event, "not-a-match");
            revealResult(event);
            break;
          case "simulate":
            simulateParticipants(event, Number(payload.count) || 10);
            break;
          default:
            throw new Error("Unknown action");
        }
        broadcast(event);
      } catch (err) {
        socket.emit("error-message", err instanceof Error ? err.message : "Action failed");
      }
    });
  });

  setInterval(() => {
    for (const event of events.values()) {
      if (event.status !== "live") continue;
      if (
        event.participants.length >= 5 &&
        (event.phase === "SWIPING_LIVE" || event.phase === "WAITING" || event.phase === "QR_JOIN")
      ) {
        showEntertainment(event);
        broadcast(event);
      }
    }
  }, 9000);

  httpServer.listen(port, hostname, () => {
    const lan = lanOrigins(port);
    console.log(`FOOD DATING running on http://localhost:${port}`);
    for (const url of lan) console.log(`Phones on Wi-Fi: ${url}/join/${DEFAULT_EVENT_ID}`);
    const pub = tunnelUrl();
    if (pub) console.log(`Public audience URL: ${pub}/join/${DEFAULT_EVENT_ID}`);
    else console.log(`Need a public link? set PUBLIC_URL on the host, or run: npm run share`);
    console.log(`Event: ${DEFAULT_EVENT_ID}`);
    console.log(`Controller key: ${CONTROLLER_KEY}`);
    console.log(`Audience join: ${joinUrl(DEFAULT_EVENT_ID)}`);
  });
});
