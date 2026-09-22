import { io } from "socket.io-client";

function client() {
  return io("http://localhost:3000", { transports: ["websocket"] });
}

function waitFor(socket: ReturnType<typeof io>, event: string, pred: (data: any) => boolean) {
  return new Promise<any>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout " + event)), 6000);
    const handler = (data: any) => {
      if (pred(data)) {
        clearTimeout(t);
        socket.off(event, handler);
        resolve(data);
      }
    };
    socket.on(event, handler);
  });
}

async function main() {
  const audience = client();
  const controller = client();
  const stage = client();

  const controllerReady = waitFor(controller, "controller", (d) => Boolean(d.event));
  controller.emit("hello", { role: "controller", eventId: "FOOD-DATING-001", key: "showtime" });
  await controllerReady;
  console.log("controller connected");

  const stageReady = waitFor(stage, "stage", (d) => Boolean(d.eventId));
  stage.emit("hello", { role: "stage", eventId: "FOOD-DATING-001" });
  await stageReady;

  const resetDone = waitFor(controller, "controller", (d) => d.event.participants.length === 0);
  controller.emit("controller-action", { type: "reset" });
  await resetDone;

  const startedP = waitFor(controller, "controller", (d) => d.event.status === "live");
  controller.emit("controller-action", { type: "start" });
  await startedP;
  console.log("started");

  const joinedP = waitFor(audience, "audience", (d) => Boolean(d.participant));
  audience.emit("hello", { role: "audience", eventId: "FOOD-DATING-001" });
  audience.emit("join", { eventId: "FOOD-DATING-001", fullName: "Rahul Sharma Test" });
  const av = await joinedP;
  console.log("joined foods", new Set(av.participant.foodOrder).size, "first", av.participant.foodOrder[0]);

  const doneP = waitFor(audience, "audience", (d) => Boolean(d.participant?.completedAt));
  for (const foodId of av.participant.foodOrder) {
    audience.emit("swipe", { foodId, direction: foodId === "broccoli" ? "left" : "right" });
  }
  const done = await doneP;
  console.log("completed", done.swipes.length);

  const matrix = await waitFor(controller, "controller", (d) => d.event.participants.length >= 1 && d.event.swipes.length >= 10);
  const p = matrix.event.participants[0];
  const samosa = matrix.event.swipes.find((s: any) => s.foodId === "samosa" && s.participantId === p.id);
  console.log("samosa", samosa.direction, "eligible", matrix.eligible.includes(p.id));

  const announcedP = waitFor(stage, "stage", (d) => d.phase === "VOLUNTEER_ANNOUNCEMENT" && d.round);
  controller.emit("controller-action", { type: "select-volunteer", participantId: p.id });
  const announced = await announcedP;
  console.log("announce", announced.round.volunteerName);

  const foodP = waitFor(stage, "stage", (d) => d.round?.foodName === "Samosa");
  const scanner = client();
  scanner.emit("scan-food", { eventId: "FOOD-DATING-001", foodSlug: "samosa" });
  const withFood = await foodP;
  console.log("food", withFood.round.foodName, withFood.questions.length);

  for (let i = 0; i < 5; i++) {
    const q = withFood.questions[i];
    const answeredP = waitFor(stage, "stage", (d) => d.round?.answers.some((a: any) => a.questionId === q.id));
    audience.emit("volunteer-answer", { questionId: q.id, answer: "A" });
    await answeredP;
    if (i < 4) {
      const nextP = waitFor(controller, "controller", (d) => {
        const r = d.event.rounds.find((x: any) => x.id === d.event.currentRoundId);
        return r?.currentQuestion === i + 1;
      });
      controller.emit("controller-action", { type: "next-question" });
      await nextP;
    }
  }

  const calcP = waitFor(controller, "controller", (d) => {
    const r = d.event.rounds.find((x: any) => x.id === d.event.currentRoundId);
    return r?.compatibilityScore === 37;
  });
  controller.emit("controller-action", { type: "calculate" });
  const calc = await calcP;
  const round = calc.event.rounds.find((r: any) => r.id === calc.event.currentRoundId);
  console.log("first score", round.compatibilityScore, round.result);

  const revealedP = waitFor(stage, "stage", (d) => d.phase === "RESULT");
  controller.emit("controller-action", { type: "reveal-result" });
  await revealedP;

  const endedP = waitFor(controller, "controller", (d) => d.event.usedFoodIds.includes("samosa"));
  controller.emit("controller-action", { type: "end-round" });
  const ended = await endedP;
  console.log("used", ended.event.usedFoodIds);

  const errP = waitFor(client(), "error-message", () => true);
  const usedScan = client();
  const errWait = waitFor(usedScan, "error-message", () => true);
  usedScan.emit("scan-food", { eventId: "FOOD-DATING-001", foodSlug: "samosa" });
  const err = await errWait;
  console.log("used error", err);
  errP.catch(() => undefined);

  const simP = waitFor(controller, "controller", (d) => d.event.testMode && d.event.participants.length >= 10);
  controller.emit("controller-action", { type: "simulate", count: 10 });
  const sim = await simP;
  console.log("testMode", sim.event.testMode, "count", sim.event.participants.length);

  audience.emit("swipe", { foodId: "samosa", direction: "left" });
  const dup = await waitFor(audience, "audience", () => true);
  const samosas = dup.swipes.filter((s: any) => s.foodId === "samosa");
  console.log("dup", samosas.length, samosas[0].direction);

  console.log("OK");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
