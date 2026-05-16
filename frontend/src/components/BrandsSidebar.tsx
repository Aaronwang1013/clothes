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
  { name: "上衣", sub: "T-shirt / 襯衫 / 帽T / 背心", bg: "#DCFCE7", icon: "👕" },
  { name: "外套", sub: "夾克 / 大衣 / 羽絨外套", bg: "#DBEAFE", icon: "🧥" },
  { name: "褲子", sub: "牛仔 / 休閒褲 / 西裝褲", bg: "#EDE9FE", icon: "👖" },
  { name: "裙子", sub: "短裙 / 長裙 / 洋裝", bg: "#FCE7F3", icon: "👗" },
  { name: "鞋子", sub: "運動鞋 / 休閒鞋", bg: "#FEF9C3", icon: "👟" },
  { name: "配件", sub: "包包 / 帽子 / 飾品", bg: "#FFEDD5", icon: "👜" },
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
        <div className="flex flex-col gap-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => handleCategory(cat.name)}
              className={`flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors text-left ${
                activeCategory === cat.name ? "bg-[#F5F5F7]" : "hover:bg-[#F5F5F7]"
              }`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                style={{ background: cat.bg }}
              >
                {cat.icon}
              </div>
              <div className="min-w-0">
                <div className="text-[0.75rem] font-medium text-[#1D1D1F]">{cat.name}</div>
                <div className="text-[0.6rem] text-[rgba(0,0,0,0.4)] truncate">{cat.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-[var(--forma-border)] mx-4" />

      {/* AI CTA */}
      <div className="p-4">
        <div
          className="rounded-xl p-4"
          style={{ background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)" }}
        >
          <div className="text-[0.72rem] font-semibold text-[#78350F] mb-1.5 flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M8 1l1.45 4.45H14l-3.72 2.71 1.41 4.34L8 9.82l-3.69 2.68 1.41-4.34L2 5.45h4.55z" />
            </svg>
            AI 穿搭推薦
          </div>
          <p className="text-[0.62rem] text-[#92400E] leading-relaxed mb-3">
            告訴我你的風格，讓 AI 為你推薦完美穿搭
          </p>
          <button className="w-full bg-[#92400E] text-white text-[0.65rem] tracking-[0.06em] py-2 rounded-lg hover:bg-[#78350F] transition-colors">
            開始推薦
          </button>
        </div>
      </div>
    </aside>
  );
}
