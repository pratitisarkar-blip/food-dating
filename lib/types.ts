export const DEFAULT_EVENT_ID = "FOOD-DATING-001";

export const PRIMARY_FOOD_SLUGS = [
  "samosa",
  "brownie",
  "protein-bar",
  "nacho-cheese",
  "gulab-jamun",
  "tiramisu"
] as const;

export type PrimaryFoodSlug = (typeof PRIMARY_FOOD_SLUGS)[number];

export type StagePhase =
  | "INTRO"
  | "QR_JOIN"
  | "SWIPING_LIVE"
  | "WAITING"
  | "CAST_REVEAL"
  | "VOLUNTEER_ANNOUNCEMENT"
  | "FOOD_SELECTION"
  | "QUESTION"
  | "ANSWER_REVEAL"
  | "COMPATIBILITY_CALCULATION"
  | "RESULT"
  | "ROUND_TRANSITION"
  | "FINALE";

export type EventStatus = "idle" | "live" | "paused" | "ended";
export type SwipeDirection = "right" | "left";
export type RoundStatus = "announcing" | "awaiting-food" | "questions" | "revealing" | "complete";

export type CompatibilityBand =
  | "Not Compatible"
  | "It's Complicated"
  | "There Could Be Something"
  | "Strong Chemistry"
  | "Soulmate Territory";

export type ResultKind =
  | "not-a-match"
  | "complicated"
  | "could-be"
  | "strong"
  | "match";

export interface FoodProfile {
  id: string;
  name: string;
  slug: string;
  image: string;
  originFlag: string;
  originLabel: string;
  tagline: string;
  personality: string[];
  bio: string;
  greenFlag: string;
  redFlag: string;
  loveLanguage: string;
  isPrimary: boolean;
}

export interface QuestionOption {
  key: "A" | "B" | "C" | "D";
  label: string;
  weight: number;
}

export interface FoodQuestion {
  id: string;
  foodSlug: PrimaryFoodSlug;
  prompt: string;
  options: QuestionOption[];
  dimension: string;
}

export interface Participant {
  id: string;
  eventId: string;
  fullName: string;
  joinedAt: number;
  completedAt: number | null;
  foodOrder: string[];
  isSimulated: boolean;
}

export interface Swipe {
  id: string;
  participantId: string;
  foodId: string;
  direction: SwipeDirection;
  timestamp: number;
}

export interface StageAnswer {
  questionId: string;
  answer: "A" | "B" | "C" | "D";
  timestamp: number;
}

export interface StageRound {
  id: string;
  eventId: string;
  participantId: string;
  foodId: string | null;
  roundNumber: number;
  status: RoundStatus;
  currentQuestion: number;
  answers: StageAnswer[];
  result: ResultKind | null;
  compatibilityScore: number | null;
  overrideResult: ResultKind | null;
  revealedAnswer: boolean;
  volunteerIndex: number;
}

export interface EntertainmentCard {
  id: string;
  headline: string;
  body: string;
  createdAt: number;
}

export interface EventState {
  id: string;
  name: string;
  status: EventStatus;
  createdAt: number;
  phase: StagePhase;
  testMode: boolean;
  usedFoodIds: string[];
  participants: Participant[];
  swipes: Swipe[];
  rounds: StageRound[];
  currentRoundId: string | null;
  entertainment: EntertainmentCard | null;
  entertainmentLog: EntertainmentCard[];
  lastActivityAt: number;
  /** foodId -> participantId for the six date slots */
  cast: Record<string, string>;
  castRevealed: boolean;
}

export interface CastPair {
  foodId: string;
  foodName: string;
  image: string;
  volunteerName: string;
  done: boolean;
}

export interface Aggregates {
  totalParticipants: number;
  completed: number;
  totalRight: number;
  totalLeft: number;
  rightByFood: Record<string, number>;
  leftByFood: Record<string, number>;
  mostLiked: string | null;
  leastLiked: string | null;
}

export interface ControllerView {
  event: EventState;
  aggregates: Aggregates;
  foods: FoodProfile[];
  questions: FoodQuestion[];
}

export interface AudienceView {
  eventId: string;
  status: EventStatus;
  phase: StagePhase;
  testMode: boolean;
  participant: Participant | null;
  foods: FoodProfile[];
  swipes: Swipe[];
  waitingLines: string[];
  volunteerChosen: boolean;
  isVolunteer: boolean;
  round: PublicRound | null;
  questions: FoodQuestion[];
  usedFoodIds: string[];
  reconnecting: boolean;
  castRevealed: boolean;
  matchedFood: FoodProfile | null;
}

export interface PublicRound {
  id: string;
  volunteerName: string;
  foodId: string | null;
  foodName: string | null;
  status: RoundStatus;
  currentQuestion: number;
  answers: StageAnswer[];
  revealedAnswer: boolean;
  result: ResultKind | null;
  compatibilityScore: number | null;
  volunteerIndex: number;
  totalQuestions: number;
}

export interface StageView {
  eventId: string;
  name: string;
  status: EventStatus;
  phase: StagePhase;
  testMode: boolean;
  aggregates: Aggregates;
  entertainment: EntertainmentCard | null;
  joinPath: string;
  round: PublicRound | null;
  foods: FoodProfile[];
  questions: FoodQuestion[];
  usedFoodIds: string[];
  castPairs: CastPair[];
}

export type ClientRole = "audience" | "controller" | "stage";
