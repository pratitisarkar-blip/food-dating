import { randomUUID } from "crypto";
import { FOODS, FOOD_BY_ID, PRIMARY_FOODS } from "./foods";
import { questionsForFood } from "./questions";
import { bandForScore, scoreAnswers } from "./compatibility";
import type {
  Aggregates,
  AudienceView,
  EntertainmentCard,
  EventState,
  EventStatus,
  Participant,
  PublicRound,
  ResultKind,
  StagePhase,
  StageRound,
  StageView,
  SwipeDirection
} from "./types";

const FIRST_NAMES = [
  "Rahul", "Priya", "Arjun", "Ananya", "Vikram", "Meera", "Kabir", "Isha",
  "Aditya", "Sana", "Rohan", "Diya", "Karan", "Nisha", "Aman", "Tara",
  "Dev", "Pooja", "Nikhil", "Riya", "Sahil", "Kavya", "Yash", "Anika",
  "Harsh", "Simran", "Varun", "Neha", "Aarav", "Myra", "Ishaan", "Zara"
];
const LAST_NAMES = [
  "Sharma", "Patel", "Kapoor", "Iyer", "Khan", "Mehta", "Reddy", "Nair",
  "Gupta", "Joshi", "Singh", "Das", "Banerjee", "Chawla", "Malhotra", "Pillai"
];

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function touch(event: EventState) {
  event.lastActivityAt = Date.now();
}

export function createEvent(id: string): EventState {
  return {
    id,
    name: "FOOD DATING",
    status: "idle",
    createdAt: Date.now(),
    phase: "INTRO",
    testMode: false,
    usedFoodIds: [],
    participants: [],
    swipes: [],
    rounds: [],
    currentRoundId: null,
    entertainment: null,
    entertainmentLog: [],
    firstVolunteerRejected: false,
    lastActivityAt: Date.now(),
    cast: {},
    castRevealed: false
  };
}

export function computeAggregates(event: EventState): Aggregates {
  const rightByFood: Record<string, number> = {};
  const leftByFood: Record<string, number> = {};
  for (const food of FOODS) {
    rightByFood[food.id] = 0;
    leftByFood[food.id] = 0;
  }
  let totalRight = 0;
  let totalLeft = 0;
  for (const swipe of event.swipes) {
    if (swipe.direction === "right") {
      rightByFood[swipe.foodId] = (rightByFood[swipe.foodId] ?? 0) + 1;
      totalRight += 1;
    } else {
      leftByFood[swipe.foodId] = (leftByFood[swipe.foodId] ?? 0) + 1;
      totalLeft += 1;
    }
  }
  const ranked = FOODS.map((f) => ({ id: f.id, n: rightByFood[f.id] ?? 0 })).sort(
    (a, b) => b.n - a.n
  );
  return {
    totalParticipants: event.participants.length,
    completed: event.participants.filter((p) => p.completedAt).length,
    totalRight,
    totalLeft,
    rightByFood,
    leftByFood,
    mostLiked: ranked[0]?.id ?? null,
    leastLiked: ranked[ranked.length - 1]?.id ?? null
  };
}

export function isEligible(event: EventState, participantId: string) {
  const rights = new Set(
    event.swipes
      .filter((s) => s.participantId === participantId && s.direction === "right")
      .map((s) => s.foodId)
  );
  return PRIMARY_FOODS.some((f) => rights.has(f.id));
}

export function currentRound(event: EventState): StageRound | null {
  return event.rounds.find((r) => r.id === event.currentRoundId) ?? null;
}

export function publicRound(event: EventState, hideName = false): PublicRound | null {
  const round = currentRound(event);
  if (!round) return null;
  const person = event.participants.find((p) => p.id === round.participantId);
  const food = round.foodId ? FOOD_BY_ID[round.foodId] : null;
  return {
    id: round.id,
    volunteerName: hideName ? "" : person?.fullName ?? "Volunteer",
    foodId: round.foodId,
    foodName: food?.name ?? null,
    status: round.status,
    currentQuestion: round.currentQuestion,
    answers: round.answers,
    revealedAnswer: round.revealedAnswer,
    result: round.result,
    compatibilityScore: round.compatibilityScore,
    volunteerIndex: round.volunteerIndex,
    totalQuestions: round.foodId ? questionsForFood(round.foodId).length : 5
  };
}

export function audienceView(event: EventState, participantId: string | null): AudienceView {
  const participant = event.participants.find((p) => p.id === participantId) ?? null;
  const round = currentRound(event);
  const isVolunteer = Boolean(
    participant && round && round.participantId === participant.id && round.status !== "complete"
  );
  const matchedFoodId = participant
    ? Object.entries(event.cast || {}).find(([, pid]) => pid === participant.id)?.[0] ?? null
    : null;
  return {
    eventId: event.id,
    status: event.status,
    phase: event.phase,
    testMode: event.testMode,
    participant,
    foods: FOODS,
    swipes: event.swipes.filter((s) => s.participantId === participantId),
    waitingLines: waitingLines(event),
    volunteerChosen: Boolean(round && round.status !== "complete"),
    isVolunteer,
    round: publicRound(event),
    questions: round?.foodId ? questionsForFood(round.foodId) : [],
    usedFoodIds: event.usedFoodIds,
    reconnecting: false,
    castRevealed: Boolean(event.castRevealed),
    matchedFood: matchedFoodId ? FOOD_BY_ID[matchedFoodId] ?? null : null
  };
}

export function stageView(event: EventState): StageView {
  const round = currentRound(event);
  return {
    eventId: event.id,
    name: event.name,
    status: event.status,
    phase: event.phase,
    testMode: event.testMode,
    aggregates: computeAggregates(event),
    entertainment: event.entertainment,
    joinPath: `/join/${event.id}`,
    round: publicRound(event),
    foods: FOODS,
    questions: round?.foodId ? questionsForFood(round.foodId) : [],
    usedFoodIds: event.usedFoodIds,
    castPairs: PRIMARY_FOODS.map((f) => {
      const pid = event.cast?.[f.id];
      const person = pid ? event.participants.find((p) => p.id === pid) : null;
      return {
        foodId: f.id,
        foodName: f.name,
        image: f.image,
        volunteerName: person?.fullName ?? "",
        done: event.usedFoodIds.includes(f.id)
      };
    })
  };
}

function waitingLines(event: EventState) {
  const agg = computeAggregates(event);
  return [
    "Look up. The casting director is still swiping.",
    "You are on the bench. The food is interviewing someone else.",
    "Please don't refresh. Your love life is loading.",
    "Not picked yet. Try looking more dateable from the audience.",
    `${agg.leftByFood.broccoli ?? 0} people have already rejected Broccoli.`,
    `${agg.rightByFood.pizza ?? 0} people said yes to Pizza. Predictable.`,
    `Gulab Jamun has received ${agg.rightByFood["gulab-jamun"] ?? 0} suspiciously high interest.`,
    "Protein Bar is asking everyone to check their macros.",
    "Tiramisu is pretending not to care.",
    "Broccoli is currently having an existential crisis.",
    `Someone just rejected Pizza. ${agg.leftByFood.pizza ?? 0} times, actually.`,
    `${agg.completed} people are done choosing. The food is still deciding.`,
    "If they call your name, act surprised. If they don't, act busy."
  ];
}

export function generateEntertainment(event: EventState): EntertainmentCard {
  const agg = computeAggregates(event);
  const looking = Math.max(0, agg.totalParticipants - agg.completed);
  const cards = [
    {
      headline: `${looking} PHONES ARE STILL SWIPING.`,
      body: "Don't look down too long. The food is looking back."
    },
    {
      headline: `${agg.leftByFood.broccoli ?? 0} PEOPLE HAVE ALREADY GHOSTED BROCCOLI.`,
      body: "Broccoli is in the hallway, rewriting its bio."
    },
    {
      headline: `SAMOSA HAS ${agg.rightByFood.samosa ?? 0} YESSES.`,
      body: "The chutney lobby is thriving. Extra drama included."
    },
    {
      headline: `BROWNIE IS POLLING DANGEROUSLY WELL.`,
      body: `${agg.rightByFood.brownie ?? 0} people said yes. Midnight fridge energy.`
    },
    {
      headline: `PROTEIN BAR WOULD LIKE A WORD.`,
      body: `${agg.leftByFood["protein-bar"] ?? 0} left swipes. The macros are taking it personally.`
    },
    {
      headline: `GULAB JAMUN HAS ${agg.rightByFood["gulab-jamun"] ?? 0} ADMIRERS.`,
      body: "Mummy already likes this one. Obviously."
    },
    {
      headline: "TIRAMISU IS PLAYING HARD TO GET.",
      body: "Layers. Secrets. A little too much coffee."
    },
    {
      headline: `${agg.rightByFood["nacho-cheese"] ?? 0} PEOPLE WANT THE CHEESE.`,
      body: "Personal space has been cancelled."
    },
    {
      headline: "THE FOOD IS SWIPING BACK.",
      body: "Someone in this room is about to get chosen."
    },
    {
      headline: "BREAKING: STANDARDS ARE FLEXIBLE.",
      body:
        agg.totalLeft > agg.totalRight
          ? "The room is rejecting with confidence. Iconic."
          : "The room is saying yes. A little too fast."
    },
    {
      headline: `${agg.completed} PEOPLE ARE DONE CHOOSING.`,
      body: "The menu is still deciding who deserves a date."
    },
    {
      headline: "LOOK UP WHEN YOUR NAME DROPS.",
      body: "Until then, swipe like you mean it."
    }
  ];
  const pick = cards[Math.floor(Math.random() * cards.length)];
  return { id: randomUUID(), headline: pick.headline, body: pick.body, createdAt: Date.now() };
}

export function joinParticipant(event: EventState, fullName: string, isSimulated = false) {
  const name = fullName.trim();
  if (name.length < 2) throw new Error("Please enter your actual full name.");
  const existing = event.participants.find(
    (p) => !isSimulated && !p.isSimulated && p.fullName.toLowerCase() === name.toLowerCase()
  );
  if (existing) return existing;
  const participant: Participant = {
    id: randomUUID(),
    eventId: event.id,
    fullName: name,
    joinedAt: Date.now(),
    completedAt: null,
    foodOrder: shuffle(FOODS.map((f) => f.id)),
    isSimulated
  };
  event.participants.push(participant);
  maybeAdvanceGathering(event);
  touch(event);
  return participant;
}

const GATHERING_PHASES = new Set([
  "INTRO",
  "QR_JOIN",
  "SWIPING_LIVE",
  "WAITING",
  "ROUND_TRANSITION"
]);

export function maybeAdvanceGathering(event: EventState) {
  if (currentRound(event)) return;
  if (event.status === "ended" || event.phase === "FINALE") return;
  if (!GATHERING_PHASES.has(event.phase)) return;
  if (event.participants.length < 5) {
    event.phase = "QR_JOIN";
    return;
  }
  event.phase = "SWIPING_LIVE";
  if (!event.entertainment) showEntertainment(event);
}

export function applySwipe(
  event: EventState,
  participantId: string,
  foodId: string,
  direction: SwipeDirection
) {
  const participant = event.participants.find((p) => p.id === participantId);
  if (!participant) throw new Error("Participant not found.");
  if (!FOOD_BY_ID[foodId]) throw new Error("Unknown food.");
  const already = event.swipes.find(
    (s) => s.participantId === participantId && s.foodId === foodId
  );
  if (already) return already;
  const swipe = {
    id: randomUUID(),
    participantId,
    foodId,
    direction,
    timestamp: Date.now()
  };
  event.swipes.push(swipe);
  const swiped = new Set(
    event.swipes.filter((s) => s.participantId === participantId).map((s) => s.foodId)
  );
  if (FOODS.every((f) => swiped.has(f.id))) participant.completedAt = Date.now();
  touch(event);
  return swipe;
}

export function setStatus(event: EventState, status: EventStatus) {
  event.status = status;
  if (status === "live") maybeAdvanceGathering(event);
  if (status === "ended") event.phase = "FINALE";
  touch(event);
}

export function setPhase(event: EventState, phase: StagePhase) {
  event.phase = phase;
  touch(event);
}

function ensureCast(event: EventState) {
  if (!event.cast) event.cast = {};
  return event.cast;
}

export function assignCast(event: EventState, participantId: string, foodId: string) {
  const food = FOOD_BY_ID[foodId];
  if (!food?.isPrimary) throw new Error("Pick one of the six date foods.");
  const person = event.participants.find((p) => p.id === participantId);
  if (!person) throw new Error("Participant not found.");
  const liked = event.swipes.some(
    (s) => s.participantId === participantId && s.foodId === foodId && s.direction === "right"
  );
  if (!liked) throw new Error("They did not swipe right on that food.");
  if (event.usedFoodIds.includes(foodId)) {
    throw new Error("That food already had its date.");
  }
  const cast = ensureCast(event);
  if (cast[foodId] === participantId) {
    delete cast[foodId];
    touch(event);
    return;
  }
  for (const [fid, pid] of Object.entries(cast)) {
    if (pid === participantId) delete cast[fid];
  }
  cast[foodId] = participantId;
  touch(event);
}

export function revealMatches(event: EventState) {
  const cast = ensureCast(event);
  const missing = PRIMARY_FOODS.filter((f) => !cast[f.id]);
  if (missing.length) {
    throw new Error(`Book all six dates first. Still need ${missing.map((f) => f.name).join(", ")}.`);
  }
  const live = currentRound(event);
  if (live && live.status !== "complete") {
    throw new Error("Finish the person on stage first.");
  }
  event.castRevealed = true;
  event.phase = "CAST_REVEAL";
  touch(event);
}

function chooseFoodForVolunteer(event: EventState, participantId: string, foodSlug?: string) {
  if (foodSlug) {
    const named = FOOD_BY_ID[foodSlug] ?? FOODS.find((f) => f.slug === foodSlug);
    if (named?.isPrimary && !event.usedFoodIds.includes(named.id)) return named.id;
  }
  const assigned = Object.entries(ensureCast(event)).find(([, pid]) => pid === participantId)?.[0];
  if (assigned && !event.usedFoodIds.includes(assigned)) return assigned;
  const liked = new Set(
    event.swipes
      .filter((s) => s.participantId === participantId && s.direction === "right")
      .map((s) => s.foodId)
  );
  const unused = PRIMARY_FOODS.filter((f) => !event.usedFoodIds.includes(f.id));
  return unused.find((f) => liked.has(f.id))?.id ?? unused[0]?.id ?? null;
}

export function selectVolunteer(event: EventState, participantId: string, foodSlug?: string) {
  const person = event.participants.find((p) => p.id === participantId);
  if (!person) throw new Error("Participant not found.");
  if (currentRound(event) && currentRound(event)!.status !== "complete") {
    throw new Error("End the current round first.");
  }
  const foodId = chooseFoodForVolunteer(event, participantId, foodSlug);
  const round: StageRound = {
    id: randomUUID(),
    eventId: event.id,
    participantId,
    foodId,
    roundNumber: event.rounds.filter((r) => r.status === "complete").length + 1,
    status: "announcing",
    currentQuestion: 0,
    answers: [],
    result: null,
    compatibilityScore: null,
    overrideResult: null,
    revealedAnswer: false,
    volunteerIndex: event.rounds.length
  };
  event.rounds.push(round);
  event.currentRoundId = round.id;
  event.phase = "VOLUNTEER_ANNOUNCEMENT";
  touch(event);
  return round;
}

export function attachFood(event: EventState, foodSlug: string) {
  const food = FOOD_BY_ID[foodSlug];
  if (!food || !food.isPrimary) throw new Error("That food is not part of the date.");
  if (event.usedFoodIds.includes(food.id)) {
    throw new Error("This food has already had its moment. Please choose another one.");
  }
  const round = currentRound(event);
  if (!round || round.status === "complete") {
    throw new Error("No active volunteer round.");
  }
  if (round.foodId && round.foodId !== food.id) {
    throw new Error("This volunteer already chose a food.");
  }
  round.foodId = food.id;
  const alreadyAsking =
    round.status === "questions" ||
    event.phase === "QUESTION" ||
    event.phase === "ANSWER_REVEAL";
  if (!alreadyAsking) {
    round.status = "questions";
    round.currentQuestion = 0;
    round.revealedAnswer = false;
    event.phase = "QUESTION";
  } else {
    round.status = "questions";
    if (event.phase === "VOLUNTEER_ANNOUNCEMENT" || event.phase === "FOOD_SELECTION") {
      event.phase = "QUESTION";
    }
  }
  touch(event);
  return round;
}

export function answerQuestion(
  event: EventState,
  participantId: string,
  questionId: string,
  answer: "A" | "B" | "C" | "D",
  force = false
) {
  const round = currentRound(event);
  if (!round || round.participantId !== participantId) {
    throw new Error("You are not the current volunteer.");
  }
  if (!round.foodId) throw new Error("Pick a food first.");
  const questions = questionsForFood(round.foodId);
  const question = questions[round.currentQuestion];
  if (!question || question.id !== questionId) {
    throw new Error("This is not the current question.");
  }
  const existing = round.answers.find((a) => a.questionId === questionId);
  if (existing) {
    if (!force) throw new Error("Already answered.");
    existing.answer = answer;
    existing.timestamp = Date.now();
  } else {
    round.answers.push({ questionId, answer, timestamp: Date.now() });
  }
  round.revealedAnswer = true;
  event.phase = "ANSWER_REVEAL";
  touch(event);
}

export function revealAnswer(event: EventState) {
  const round = currentRound(event);
  if (!round) throw new Error("No active round.");
  round.revealedAnswer = true;
  event.phase = "ANSWER_REVEAL";
  touch(event);
}

export function nextQuestion(event: EventState) {
  const round = currentRound(event);
  if (!round?.foodId) throw new Error("No food selected.");
  const total = questionsForFood(round.foodId).length;
  if (round.currentQuestion < total - 1) {
    round.currentQuestion += 1;
    const q = questionsForFood(round.foodId)[round.currentQuestion];
    round.revealedAnswer = Boolean(round.answers.find((a) => a.questionId === q?.id));
    event.phase = "QUESTION";
  }
  touch(event);
}

export function prevQuestion(event: EventState) {
  const round = currentRound(event);
  if (!round) throw new Error("No active round.");
  round.currentQuestion = Math.max(0, round.currentQuestion - 1);
  const q = questionsForFood(round.foodId ?? "")[round.currentQuestion];
  round.revealedAnswer = Boolean(round.answers.find((a) => q && a.questionId === q.id));
  event.phase = "QUESTION";
  touch(event);
}

function showScoreFor(kind: ResultKind, volunteerIndex: number) {
  if (kind === "match") {
    if (volunteerIndex < 2) return 91;
    const extras = [94, 87, 96, 89, 93, 85, 98, 82];
    return extras[(volunteerIndex - 2) % extras.length];
  }
  if (kind === "not-a-match") {
    if (volunteerIndex < 2) return 54;
    const extras = [47, 61, 38, 58, 49, 42, 35, 56];
    return extras[(volunteerIndex - 2) % extras.length];
  }
  if (kind === "strong") return volunteerIndex < 2 ? 82 : [84, 79, 86, 76][(volunteerIndex - 2) % 4];
  if (kind === "complicated") return volunteerIndex < 2 ? 52 : [48, 55, 44, 57][(volunteerIndex - 2) % 4];
  if (kind === "could-be") return volunteerIndex < 2 ? 68 : [64, 71, 66, 73][(volunteerIndex - 2) % 4];
  return 50;
}

export function calculateCompatibility(event: EventState) {
  const round = currentRound(event);
  if (!round?.foodId) throw new Error("No food selected.");
  const isFirst = !event.firstVolunteerRejected;
  let score = scoreAnswers(round.foodId, round.answers);
  let kind = bandForScore(score).kind;
  if (isFirst) {
    score = showScoreFor("not-a-match", round.volunteerIndex);
    kind = "not-a-match";
  } else if (round.volunteerIndex === 1) {
    score = showScoreFor("match", round.volunteerIndex);
    kind = "match";
  }
  if (round.overrideResult) {
    kind = round.overrideResult;
    score = showScoreFor(kind, round.volunteerIndex);
  }
  round.compatibilityScore = score;
  round.result = kind;
  event.phase = "COMPATIBILITY_CALCULATION";
  touch(event);
}

export function revealResult(event: EventState) {
  const round = currentRound(event);
  if (!round) throw new Error("No active round.");
  if (round.compatibilityScore == null) calculateCompatibility(event);
  event.phase = "RESULT";
  touch(event);
}

export function overrideResult(event: EventState, kind: ResultKind) {
  const round = currentRound(event);
  if (!round) throw new Error("No active round.");
  round.overrideResult = kind;
  calculateCompatibility(event);
}

export function endRound(event: EventState) {
  const round = currentRound(event);
  if (!round) throw new Error("No active round.");
  round.status = "complete";
  if (round.foodId && !event.usedFoodIds.includes(round.foodId)) {
    event.usedFoodIds.push(round.foodId);
  }
  event.firstVolunteerRejected = true;
  event.currentRoundId = null;
  if (event.castRevealed) {
    event.phase = "CAST_REVEAL";
  } else {
    event.phase = "SWIPING_LIVE";
    if (event.participants.length >= 5) showEntertainment(event);
  }
  touch(event);
}

export function markFoodUsed(event: EventState, foodId: string) {
  if (!event.usedFoodIds.includes(foodId)) event.usedFoodIds.push(foodId);
  touch(event);
}

export function resetFood(event: EventState, foodId: string) {
  event.usedFoodIds = event.usedFoodIds.filter((id) => id !== foodId);
  touch(event);
}

export function skipRound(event: EventState) {
  if (event.currentRoundId) {
    const round = currentRound(event);
    if (round) {
      round.status = "complete";
      event.currentRoundId = null;
    }
  }
  if (event.castRevealed) {
    event.phase = "CAST_REVEAL";
    touch(event);
    return;
  }
  maybeAdvanceGathering(event);
  touch(event);
}

export function returnToWaiting(event: EventState) {
  event.phase = "SWIPING_LIVE";
  maybeAdvanceGathering(event);
  touch(event);
}

export function showEntertainment(event: EventState) {
  const card = generateEntertainment(event);
  event.entertainment = card;
  event.entertainmentLog.unshift(card);
  event.entertainmentLog = event.entertainmentLog.slice(0, 40);
  touch(event);
}

export function skipEntertainment(event: EventState) {
  event.entertainment = null;
  touch(event);
}

export function simulateParticipants(event: EventState, count: number) {
  event.testMode = true;
  const existingSim = event.participants.filter((p) => p.isSimulated).length;
  const toAdd = Math.max(0, count - existingSim);
  for (let i = 0; i < toAdd; i++) {
    const name = `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
    const p = joinParticipant(event, `${name} ${existingSim + i + 1}`, true);
    for (const foodId of p.foodOrder) {
      const food = FOOD_BY_ID[foodId];
      let chance = 0.45;
      if (food.id === "broccoli") chance = 0.18;
      if (food.id === "pizza" || food.id === "samosa" || food.id === "gulab-jamun") chance = 0.72;
      if (food.id === "protein-bar") chance = 0.32;
      applySwipe(event, p.id, foodId, Math.random() < chance ? "right" : "left");
    }
  }
  maybeAdvanceGathering(event);
  touch(event);
}

export function resetEvent(event: EventState) {
  const id = event.id;
  Object.assign(event, createEvent(id));
}
