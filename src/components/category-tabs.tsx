"use client";

import { MenuCategory } from "@/lib/types";
import { categoryLabels } from "@/lib/menu-data";

interface CategoryTabsProps {
  value: MenuCategory;
  onChange: (category: MenuCategory) => void;
}

const categories: MenuCategory[] = ["entrada", "principal", "bebida", "postre"];

export function CategoryTabs({ value, onChange }: CategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const isActive = value === category;

        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={`rounded-full px-4 py-2 text-sm ${
              isActive ? "bg-brand-gold text-black" : "bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            {categoryLabels[category]}
          </button>
        );
      })}
    </div>
  );
}
