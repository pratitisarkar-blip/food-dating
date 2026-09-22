"use client";

import type { FoodProfile } from "@/lib/types";

export function FoodPickGrid({
  foods,
  usedFoodIds,
  onPick,
  large
}: {
  foods: FoodProfile[];
  usedFoodIds: string[];
  onPick?: (slug: string) => void;
  large?: boolean;
}) {
  return (
    <div className={`food-pick ${large ? "large" : ""}`}>
      {foods.map((food) => {
        const used = usedFoodIds.includes(food.id);
        const className = `food-pick-btn ${used ? "used" : ""}`;
        const body = (
          <>
            <img src={food.image} alt="" />
            <span>{food.name}</span>
            {used && <em>USED</em>}
          </>
        );
        if (!onPick) {
          return (
            <div key={food.id} className={className}>
              {body}
            </div>
          );
        }
        return (
          <button
            key={food.id}
            type="button"
            className={className}
            disabled={used}
            onClick={() => onPick(food.slug)}
          >
            {body}
          </button>
        );
      })}
    </div>
  );
}
