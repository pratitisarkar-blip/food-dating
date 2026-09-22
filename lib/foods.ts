import type { FoodProfile } from "./types";

export const FOODS: FoodProfile[] = [
  {
    id: "samosa",
    name: "Samosa",
    slug: "samosa",
    image:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80",
    personality: ["Desi", "Reliable", "Slightly dramatic", "Social butterfly"],
    bio: "I come with two sides: chutney. Don’t ask me to choose.",
    greenFlag: "Will show up hot, crispy and ready to commit.",
    redFlag: "Emotionally unavailable after 6 PM.",
    loveLanguage: "Sharing — but only if you ask nicely.",
    isPrimary: true
  },
  {
    id: "brownie",
    name: "Brownie",
    slug: "brownie",
    image:
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=80",
    personality: ["Sweet", "Comforting", "Flirty", "Low maintenance"],
    bio: "I’m basically a hug, but with chocolate.",
    greenFlag: "Makes bad days significantly better.",
    redFlag: "Has a serious “just one bite” trust issue.",
    loveLanguage: "Acts of sweetness.",
    isPrimary: true
  },
  {
    id: "protein-bar",
    name: "Protein Bar",
    slug: "protein-bar",
    image:
      "https://images.unsplash.com/photo-1579722820308-d74e571900a1?auto=format&fit=crop&w=1200&q=80",
    personality: ["Disciplined", "Ambitious", "Gym-coded", "Slightly judgmental"],
    bio: "You had cake. I had macros. We are not the same.",
    greenFlag: "Will motivate you to become your best self.",
    redFlag: "May bring up protein intake on the first date.",
    loveLanguage: "Consistency.",
    isPrimary: true
  },
  {
    id: "nacho-cheese",
    name: "Nacho + Cheese Dip",
    slug: "nacho-cheese",
    image:
      "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=1200&q=80",
    personality: ["Fun", "Chaotic", "Affectionate", "Very clingy"],
    bio: "You can have the nacho. But the cheese stays with me.",
    greenFlag: "Always brings the party.",
    redFlag: "Zero concept of personal space.",
    loveLanguage: "Physical touch. Mostly dipping.",
    isPrimary: true
  },
  {
    id: "gulab-jamun",
    name: "Gulab Jamun",
    slug: "gulab-jamun",
    image:
      "https://images.unsplash.com/photo-1666190098290-0bb5f5c0f0f2?auto=format&fit=crop&w=1200&q=80",
    personality: ["Traditional", "Romantic", "Sweet", "Family-approved"],
    bio: "Mummy already likes me.",
    greenFlag: "Excellent with commitment and celebrations.",
    redFlag: "Gets emotionally involved with every shaadi.",
    loveLanguage: "Words of affirmation + extra sugar.",
    isPrimary: true
  },
  {
    id: "tiramisu",
    name: "Tiramisu",
    slug: "tiramisu",
    image:
      "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=1200&q=80",
    personality: ["Sophisticated", "Mysterious", "International", "A little pretentious"],
    bio: "I have layers. Please pronounce my name correctly.",
    greenFlag: "Elegant, complex and surprisingly comforting.",
    redFlag: "Will judge your dessert vocabulary.",
    loveLanguage: "Quality time.",
    isPrimary: true
  },
  {
    id: "broccoli",
    name: "Broccoli",
    slug: "broccoli",
    image:
      "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=1200&q=80",
    personality: ["Responsible", "Healthy", "Mature", "Trying very hard"],
    bio: "I know what you're thinking. Give me a chance.",
    greenFlag: "Will always have your back... and your vitamins.",
    redFlag: "Has been rejected at birthday parties since childhood.",
    loveLanguage: "Acts of service.",
    isPrimary: false
  },
  {
    id: "sizzler",
    name: "Sizzler",
    slug: "sizzler",
    image:
      "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1200&q=80",
    personality: ["Loud", "Dramatic", "Attention-seeking", "Passionate"],
    bio: "I don't enter a room. I make an entrance.",
    greenFlag: "Brings excitement wherever it goes.",
    redFlag: "Cannot communicate without making noise.",
    loveLanguage: "Grand gestures.",
    isPrimary: false
  },
  {
    id: "pizza",
    name: "Pizza",
    slug: "pizza",
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
    personality: ["Popular", "Easy-going", "Adaptable", "Slightly basic"],
    bio: "Everybody says I'm not their type. Then orders me anyway.",
    greenFlag: "Works for almost every situation.",
    redFlag: "Has too many exes.",
    loveLanguage: "Sharing — but not the last slice.",
    isPrimary: false
  },
  {
    id: "sushi",
    name: "Sushi",
    slug: "sushi",
    image:
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80",
    personality: ["Adventurous", "Stylish", "Sophisticated", "Risk-taking"],
    bio: "Raw honesty. Zero drama. Wasabi optional.",
    greenFlag: "Will take you out of your comfort zone.",
    redFlag: "May cost more than your first date.",
    loveLanguage: "New experiences.",
    isPrimary: false
  }
];

export const FOOD_BY_ID = Object.fromEntries(FOODS.map((f) => [f.id, f]));
export const PRIMARY_FOODS = FOODS.filter((f) => f.isPrimary);
