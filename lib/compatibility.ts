import { questionsForFood } from "./questions";
import type { ResultKind, StageAnswer } from "./types";

export function bandForScore(score: number): { band: string; kind: ResultKind } {
  if (score <= 39) return { band: "Not Compatible", kind: "not-a-match" };
  if (score <= 59) return { band: "It's Complicated", kind: "complicated" };
  if (score <= 74) return { band: "There Could Be Something", kind: "could-be" };
  if (score <= 89) return { band: "Strong Chemistry", kind: "strong" };
  return { band: "Soulmate Territory", kind: "match" };
}

export function scoreAnswers(foodSlug: string, answers: StageAnswer[]) {
  const questions = questionsForFood(foodSlug);
  if (!questions.length) return 50;
  const weights = questions.map((q) => {
    const ans = answers.find((a) => a.questionId === q.id);
    if (!ans) return 50;
    return q.options.find((o) => o.key === ans.answer)?.weight ?? 50;
  });
  const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
  return Math.round(avg);
}

export function dimensionScores(foodSlug: string, answers: StageAnswer[]) {
  return questionsForFood(foodSlug).map((q) => {
    const ans = answers.find((a) => a.questionId === q.id);
    const value = ans ? q.options.find((o) => o.key === ans.answer)?.weight ?? 50 : 50;
    return { label: q.dimension, value };
  });
}

export function resultCopy(foodName: string, kind: ResultKind, firstRejection: boolean) {
  if (firstRejection || kind === "not-a-match") {
    const lines: Record<string, { title: string; sub: string }> = {
      Samosa: {
        title: "SAMOSA HAS SPOKEN.",
        sub: "It's not you. It's the chutney."
      },
      Brownie: {
        title: "BROWNIE NEEDS SPACE.",
        sub: "You deserve someone with better midnight chemistry."
      },
      "Protein Bar": {
        title: "PROTEIN BAR HAS DECIDED.",
        sub: "The macros just weren't matching."
      },
      "Nacho + Cheese Dip": {
        title: "THE CHEESE HAS BOUNDARIES.",
        sub: "This dip is looking for someone clingier."
      },
      "Gulab Jamun": {
        title: "MUMMY HAS VETOED THIS.",
        sub: "You deserve someone with better shaadi energy."
      },
      Tiramisu: {
        title: "TIRAMISU HAS LAYERS. THIS ISN'T ONE.",
        sub: "Please work on the pronunciation and try again next life."
      }
    };
    return (
      lines[foodName] ?? {
        title: "THE FOOD HAS SPOKEN.",
        sub: "You deserve someone with better snack chemistry."
      }
    );
  }
  if (kind === "complicated") {
    return { title: "IT'S COMPLICATED.", sub: "The food is thinking about it. Loudly." };
  }
  if (kind === "could-be") {
    return { title: "THERE COULD BE SOMETHING.", sub: "Not marriage. But maybe a second plate." };
  }
  if (kind === "strong") {
    return { title: "STRONG CHEMISTRY.", sub: "The room can feel it. So can the chutney." };
  }
  return { title: "IT'S A MATCH! ❤️", sub: "The food chose you. Don't mess this up." };
}
