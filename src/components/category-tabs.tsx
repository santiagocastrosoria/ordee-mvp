"use client";

import type { MenuCategoryMeta } from "@/lib/types";

interface CategoryTabsProps {
  categories: MenuCategoryMeta[];
  value: string;
  onChange: (code: string) => void;
}

/** Legacy sticky tabs — MenuScreen inlines dynamic tabs; kept for reuse. */
export function CategoryTabs({ categories, value, onChange }: CategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const isActive = value === category.code;

        return (
          <button
            key={category.code}
            type="button"
            onClick={() => onChange(category.code)}
            className={`rounded-full px-4 py-2 text-sm ${
              isActive ? "bg-brand-gold text-black" : "bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
