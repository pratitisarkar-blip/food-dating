import type { FoodQuestion } from "./types";

export const QUESTIONS: FoodQuestion[] = [
  {
    id: "samosa-1",
    foodSlug: "samosa",
    prompt: "Samosa arrives at your date 15 minutes late. Your reaction?",
    dimension: "CHUTNEY COMPATIBILITY",
    options: [
      { key: "A", label: "It's okay ❤️", weight: 86 },
      { key: "B", label: "Where were you?", weight: 48 },
      { key: "C", label: "I have already eaten.", weight: 18 },
      { key: "D", label: "Actually, I respect the confidence.", weight: 72 }
    ]
  },
  {
    id: "samosa-2",
    foodSlug: "samosa",
    prompt: "Chutney situation?",
    dimension: "PERSONALITY",
    options: [
      { key: "A", label: "Green only", weight: 62 },
      { key: "B", label: "Sweet only", weight: 58 },
      { key: "C", label: "Both. Obviously.", weight: 96 },
      { key: "D", label: "No chutney. I believe in pure relationships.", weight: 22 }
    ]
  },
  {
    id: "samosa-3",
    foodSlug: "samosa",
    prompt: "One samosa is left. What happens?",
    dimension: "SHARING INDEX",
    options: [
      { key: "A", label: "We share.", weight: 88 },
      { key: "B", label: "I give it to them.", weight: 80 },
      { key: "C", label: "Whoever gets there first wins.", weight: 34 },
      { key: "D", label: "I quietly order another plate.", weight: 74 }
    ]
  },
  {
    id: "samosa-4",
    foodSlug: "samosa",
    prompt: "Samosa says: “I'm a little oily.”",
    dimension: "CRUNCH COMPATIBILITY",
    options: [
      { key: "A", label: "Nobody's perfect.", weight: 84 },
      { key: "B", label: "Dealbreaker.", weight: 12 },
      { key: "C", label: "Depends how good you are.", weight: 70 },
      { key: "D", label: "That's between you and your cardiologist.", weight: 44 }
    ]
  },
  {
    id: "samosa-5",
    foodSlug: "samosa",
    prompt: "Ideal Samosa date?",
    dimension: "DATE ENERGY",
    options: [
      { key: "A", label: "Chai + gossip", weight: 92 },
      { key: "B", label: "House party", weight: 68 },
      { key: "C", label: "Rainy evening", weight: 78 },
      { key: "D", label: "Wedding buffet", weight: 84 }
    ]
  },
  {
    id: "brownie-1",
    foodSlug: "brownie",
    prompt: "Brownie says “I'm just a little sweet.” Your response?",
    dimension: "SWEETNESS",
    options: [
      { key: "A", label: "Perfect.", weight: 90 },
      { key: "B", label: "Too much.", weight: 28 },
      { key: "C", label: "That's what you say now.", weight: 56 },
      { key: "D", label: "Prove it.", weight: 72 }
    ]
  },
  {
    id: "brownie-2",
    foodSlug: "brownie",
    prompt: "Would you share your last brownie?",
    dimension: "TRUST",
    options: [
      { key: "A", label: "Absolutely.", weight: 88 },
      { key: "B", label: "Never.", weight: 16 },
      { key: "C", label: "Only with my soulmate.", weight: 76 },
      { key: "D", label: "I'd order another one.", weight: 70 }
    ]
  },
  {
    id: "brownie-3",
    foodSlug: "brownie",
    prompt: "Brownie asks: Cake or Brownie?",
    dimension: "LOYALTY",
    options: [
      { key: "A", label: "Brownie.", weight: 96 },
      { key: "B", label: "Cake.", weight: 22 },
      { key: "C", label: "Depends on the mood.", weight: 60 },
      { key: "D", label: "Why are you creating conflict?", weight: 48 }
    ]
  },
  {
    id: "brownie-4",
    foodSlug: "brownie",
    prompt: "Your brownie is slightly warm.",
    dimension: "WARMTH",
    options: [
      { key: "A", label: "Green flag.", weight: 86 },
      { key: "B", label: "Perfection.", weight: 94 },
      { key: "C", label: "Too hot to handle.", weight: 64 },
      { key: "D", label: "I'm calling HR.", weight: 30 }
    ]
  },
  {
    id: "brownie-5",
    foodSlug: "brownie",
    prompt: "Brownie wants a midnight date.",
    dimension: "MIDNIGHT ENERGY",
    options: [
      { key: "A", label: "Obviously.", weight: 92 },
      { key: "B", label: "Sleep is important.", weight: 36 },
      { key: "C", label: "Only weekends.", weight: 58 },
      { key: "D", label: "Send location.", weight: 84 }
    ]
  },
  {
    id: "protein-bar-1",
    foodSlug: "protein-bar",
    prompt: "The wrapper says “30g protein.”",
    dimension: "MACRO CHEMISTRY",
    options: [
      { key: "A", label: "Nice.", weight: 70 },
      { key: "B", label: "Finally.", weight: 82 },
      { key: "C", label: "Gains.", weight: 92 },
      { key: "D", label: "Marriage.", weight: 96 }
    ]
  },
  {
    id: "protein-bar-2",
    foodSlug: "protein-bar",
    prompt: "Your Protein Bar is ₹300.",
    dimension: "LIFESTYLE",
    options: [
      { key: "A", label: "Fine.", weight: 74 },
      { key: "B", label: "Premium.", weight: 86 },
      { key: "C", label: "EMI.", weight: 40 },
      { key: "D", label: "Investment.", weight: 90 }
    ]
  },
  {
    id: "protein-bar-3",
    foodSlug: "protein-bar",
    prompt: "Someone asks for a bite.",
    dimension: "VALUES",
    options: [
      { key: "A", label: "Sure.", weight: 50 },
      { key: "B", label: "Tiny.", weight: 68 },
      { key: "C", label: "Never.", weight: 88 },
      { key: "D", label: "Protein-tax.", weight: 80 }
    ]
  },
  {
    id: "protein-bar-4",
    foodSlug: "protein-bar",
    prompt: "Protein Bar falls on gym floor.",
    dimension: "COMMITMENT",
    options: [
      { key: "A", label: "Leave.", weight: 70 },
      { key: "B", label: "Cry.", weight: 62 },
      { key: "C", label: "Five-second.", weight: 48 },
      { key: "D", label: "Gainslost.", weight: 84 }
    ]
  },
  {
    id: "protein-bar-5",
    foodSlug: "protein-bar",
    prompt: "Your jaw hurts halfway through.",
    dimension: "PRACTICAL LOVE",
    options: [
      { key: "A", label: "Stop.", weight: 36 },
      { key: "B", label: "Continue.", weight: 78 },
      { key: "C", label: "Gains.", weight: 92 },
      { key: "D", label: "Jawday.", weight: 86 }
    ]
  },
  {
    id: "nacho-cheese-1",
    foodSlug: "nacho-cheese",
    prompt: "Your date takes your last nacho.",
    dimension: "BOUNDARY DIP",
    options: [
      { key: "A", label: "Forgivable.", weight: 78 },
      { key: "B", label: "Never.", weight: 22 },
      { key: "C", label: "We discuss boundaries.", weight: 60 },
      { key: "D", label: "I take their cheese.", weight: 84 }
    ]
  },
  {
    id: "nacho-cheese-2",
    foodSlug: "nacho-cheese",
    prompt: "A nacho breaks inside the dip.",
    dimension: "DIP DRAMA",
    options: [
      { key: "A", label: "Rescue.", weight: 86 },
      { key: "B", label: "Spoon.", weight: 78 },
      { key: "C", label: "Sacrifice.", weight: 64 },
      { key: "D", label: "Panic.", weight: 40 }
    ]
  },
  {
    id: "nacho-cheese-3",
    foodSlug: "nacho-cheese",
    prompt: "How much cheese with nachos is too much?",
    dimension: "CHEESE LOYALTY",
    options: [
      { key: "A", label: "There is no such thing.", weight: 96 },
      { key: "B", label: "Enough to be concerned.", weight: 34 },
      { key: "C", label: "Depends.", weight: 58 },
      { key: "D", label: "I like it without cheese", weight: 16 }
    ]
  },
  {
    id: "nacho-cheese-4",
    foodSlug: "nacho-cheese",
    prompt: "What would be your ideal date?",
    dimension: "PARTY CHEMISTRY",
    options: [
      { key: "A", label: "Movie + nachos", weight: 86 },
      { key: "B", label: "Party + nachos", weight: 78 },
      { key: "C", label: "Netflix at home + nachos", weight: 72 },
      { key: "D", label: "Anything with extra dip", weight: 92 }
    ]
  },
  {
    id: "nacho-cheese-5",
    foodSlug: "nacho-cheese",
    prompt: "Someone asks for your cheese dip.",
    dimension: "SHARING",
    options: [
      { key: "A", label: "Share.", weight: 74 },
      { key: "B", label: "Absolutely not.", weight: 40 },
      { key: "C", label: "One dip only.", weight: 68 },
      { key: "D", label: "Order another.", weight: 88 }
    ]
  },
  {
    id: "gulab-jamun-1",
    foodSlug: "gulab-jamun",
    prompt: "You like it hot or cold?",
    dimension: "TEMPERATURE",
    options: [
      { key: "A", label: "Hot.", weight: 86 },
      { key: "B", label: "Cold.", weight: 62 },
      { key: "C", label: "Both.", weight: 90 },
      { key: "D", label: "Straight from the wedding buffet.", weight: 94 }
    ]
  },
  {
    id: "gulab-jamun-2",
    foodSlug: "gulab-jamun",
    prompt: "You finish the Jamun. Syrup remains.",
    dimension: "APPETITE FOR LOVE",
    options: [
      { key: "A", label: "Leave it.", weight: 28 },
      { key: "B", label: "Taste it.", weight: 64 },
      { key: "C", label: "Finish it.", weight: 88 },
      { key: "D", label: "Drink it like a shot.", weight: 96 }
    ]
  },
  {
    id: "gulab-jamun-3",
    foodSlug: "gulab-jamun",
    prompt: "You’re already full. Gulab Jamun arrives.",
    dimension: "FAMILY VALUES",
    options: [
      { key: "A", label: "No, thank you.", weight: 18 },
      { key: "B", label: "Just one.", weight: 62 },
      { key: "C", label: "Tummy will adjust.", weight: 86 },
      { key: "D", label: "Full? Who said I’m full?", weight: 96 }
    ]
  },
  {
    id: "gulab-jamun-4",
    foodSlug: "gulab-jamun",
    prompt: "Your Gulab Jamun comes with ice cream.",
    dimension: "CELEBRATION",
    options: [
      { key: "A", label: "Soulmate.", weight: 96 },
      { key: "B", label: "Too much.", weight: 24 },
      { key: "C", label: "Obviously.", weight: 84 },
      { key: "D", label: "Now we're serious.", weight: 88 }
    ]
  },
  {
    id: "gulab-jamun-5",
    foodSlug: "gulab-jamun",
    prompt: "Gulab Jamun disappears from the fridge.",
    dimension: "MUMMY APPROVAL",
    options: [
      { key: "A", label: "Ask who took it.", weight: 58 },
      { key: "B", label: "Check the fridge again.", weight: 72 },
      { key: "C", label: "Launch an investigation.", weight: 88 },
      { key: "D", label: "File an FIR. This is personal.", weight: 96 }
    ]
  },
  {
    id: "tiramisu-1",
    foodSlug: "tiramisu",
    prompt: "Tiramisu says: “I have layers.”",
    dimension: "DEPTH",
    options: [
      { key: "A", label: "Same.", weight: 90 },
      { key: "B", label: "Red flag.", weight: 20 },
      { key: "C", label: "Tell me everything.", weight: 82 },
      { key: "D", label: "That's unnecessarily dramatic.", weight: 36 }
    ]
  },
  {
    id: "tiramisu-2",
    foodSlug: "tiramisu",
    prompt: "Ideal first date?",
    dimension: "TASTE",
    options: [
      { key: "A", label: "Coffee.", weight: 84 },
      { key: "B", label: "Fine dining.", weight: 88 },
      { key: "C", label: "Art gallery.", weight: 80 },
      { key: "D", label: "Chai tapri. Keep it real.", weight: 46 }
    ]
  },
  {
    id: "tiramisu-3",
    foodSlug: "tiramisu",
    prompt: "Would you split dessert?",
    dimension: "GENEROSITY",
    options: [
      { key: "A", label: "Always.", weight: 78 },
      { key: "B", label: "Never.", weight: 30 },
      { key: "C", label: "Only Tiramisu.", weight: 92 },
      { key: "D", label: "Depends on the person.", weight: 60 }
    ]
  },
  {
    id: "tiramisu-4",
    foodSlug: "tiramisu",
    prompt: "Tiramisu judges your pronunciation.",
    dimension: "PRONUNCIATION",
    options: [
      { key: "A", label: "Fair.", weight: 86 },
      { key: "B", label: "Rude.", weight: 28 },
      { key: "C", label: "Humbling.", weight: 70 },
      { key: "D", label: "I'll call it whatever I want.", weight: 34 }
    ]
  },
  {
    id: "tiramisu-5",
    foodSlug: "tiramisu",
    prompt: "Tiramisu is slightly expensive.",
    dimension: "INVESTMENT",
    options: [
      { key: "A", label: "Worth it.", weight: 90 },
      { key: "B", label: "Dealbreaker.", weight: 16 },
      { key: "C", label: "Once in a while.", weight: 64 },
      { key: "D", label: "Put it on the corporate card.", weight: 76 }
    ]
  }
];

export function questionsForFood(slug: string) {
  return QUESTIONS.filter((q) => q.foodSlug === slug);
}
