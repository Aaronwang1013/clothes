"use client";

import { useState } from "react";

const BRANDS = [
  { name: "Nike", abbr: "NIKE" },
  { name: "adidas", abbr: "ADS" },
  { name: "ZARA", abbr: "ZARA" },
  { name: "UNIQLO", abbr: "UQLQ" },
  { name: "H&M", abbr: "H&M" },
  { name: "GUCCI", abbr: "GCI" },
  { name: "North Face", abbr: "TNF" },
  { name: "Ralph Lauren", abbr: "RL" },
];

const CATEGORIES = [
  { name: "上衣", sub: "T-shirt · 襯衫 · 帽T · 背心" },
  { name: "外套", sub: "夾克 · 大衣 · 羽絨外套" },
  { name: "褲子", sub: "牛仔 · 休閒褲 · 西裝褲" },
  { name: "裙子", sub: "短裙 · 長裙 · 洋裝" },
  { name: "鞋子", sub: "運動鞋 · 休閒鞋" },
  { name: "配件", sub: "包包 · 帽子 · 飾品" },
];

interface BrandsSidebarProps {
  onSelectCategory?: (cat: string) => void;
}

export default function BrandsSidebar({ onSelectCategory }: BrandsSidebarProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  function handleCategory(cat: string) {
    const next = cat === activeCategory ? null : cat;
    setActiveCategory(next);
    onSelectCategory?.(next ?? "");
  }

  return (
    <aside className="bg-white border-r border-[var(--forma-border)] overflow-y-auto flex flex-col">
      {/* Brands */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[0.72rem] font-medium text-[#1D1D1F]">熱門品牌</span>
          <button className="text-[0.62rem] text-[#6E6E73] hover:text-[#1D1D1F] transition-colors">
            查看全部 ›
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {BRANDS.map((b) => (
            <button
              key={b.name}
              className="border border-[var(--forma-border)] rounded-lg p-2 flex flex-col items-center justify-center gap-0.5 hover:border-[rgba(0,0,0,0.25)] hover:bg-[#FAFAFA] transition-all aspect-square"
            >
              <span className="text-[0.58rem] font-bold tracking-widest text-[#1D1D1F]">{b.abbr}</span>
              <span className="text-[0.5rem] text-[rgba(0,0,0,0.4)] text-center leading-tight">{b.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-[var(--forma-border)] mx-4" />

      {/* Categories */}
      <div className="p-4">
        <div className="text-[0.72rem] font-medium text-[#1D1D1F] mb-3">商品分類</div>
        <div className="flex flex-col">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => handleCategory(cat.name)}
              className="flex items-center gap-3 py-2.5 text-left group transition-colors hover:bg-[#F5F5F7] px-2"
            >
              <div
                className={`w-0.5 h-7 shrink-0 transition-colors ${
                  activeCategory === cat.name
                    ? "bg-[#1D1D1F]"
                    : "bg-transparent group-hover:bg-[rgba(0,0,0,0.12)]"
                }`}
              />
              <div className="min-w-0">
                <div className={`text-[0.75rem] font-medium transition-colors ${
                  activeCategory === cat.name ? "text-[#1D1D1F]" : "text-[rgba(0,0,0,0.55)]"
                }`}>{cat.name}</div>
                <div className="text-[0.58rem] text-[rgba(0,0,0,0.35)] truncate mt-0.5">{cat.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

    </aside>
  );
}
