"use client";

import { useState } from "react";

const MOCK_RECORDS = [
  {
    id: "1",
    style: "休閒運動風",
    items: ["Nike 白色運動上衣", "Adidas 黑色運動褲"],
    date: "2天前",
  },
  {
    id: "2",
    style: "日常簡約風",
    items: ["UNIQLO 白色T恤", "Zara 牛仔褲"],
    date: "5天前",
  },
  {
    id: "3",
    style: "文青學院風",
    items: ["H&M 格紋襯衫", "卡其色休閒褲"],
    date: "1週前",
  },
  {
    id: "4",
    style: "街頭潮流風",
    items: ["連帽大學T", "寬版牛仔褲"],
    date: "2週前",
  },
];

export default function OutfitRecords() {
  const [liked, setLiked] = useState<Set<string>>(new Set());

  function toggleLike(id: string) {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <aside className="bg-white border-l border-[var(--forma-border)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-[var(--forma-border)] flex items-center justify-between shrink-0">
        <span className="text-[0.78rem] font-medium text-[#1D1D1F]">我的穿搭紀錄</span>
        <button className="text-[0.62rem] text-[#6E6E73] hover:text-[#1D1D1F] transition-colors">
          查看全部 ›
        </button>
      </div>

      {/* Records */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {MOCK_RECORDS.map((record) => (
          <div
            key={record.id}
            className="border border-[var(--forma-border)] rounded-xl overflow-hidden hover:border-[rgba(0,0,0,0.18)] transition-colors"
          >
            <div className="flex gap-3 p-3">
              {/* Thumbnail */}
              <div className="w-12 bg-[#F5F5F7] rounded-lg flex items-center justify-center shrink-0" style={{ aspectRatio: "3/4" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.2" className="w-5 h-5">
                  <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
                </svg>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[0.75rem] font-medium text-[#1D1D1F] mb-1">{record.style}</div>
                {record.items.map((item, i) => (
                  <div key={i} className="text-[0.6rem] text-[rgba(0,0,0,0.4)] truncate">{item}</div>
                ))}
                <div className="text-[0.58rem] text-[rgba(0,0,0,0.28)] mt-1.5">{record.date}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-[var(--forma-border)] flex items-center px-3 py-1.5 gap-3">
              <button
                onClick={() => toggleLike(record.id)}
                className={`transition-colors ${
                  liked.has(record.id) ? "text-red-500" : "text-[rgba(0,0,0,0.28)]"
                } hover:text-red-400`}
              >
                <svg
                  viewBox="0 0 16 16"
                  fill={liked.has(record.id) ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-3.5 h-3.5"
                >
                  <path d="M8 14s-6-3.5-6-8a4 4 0 0 1 6-3.46A4 4 0 0 1 14 6c0 4.5-6 8-6 8z" />
                </svg>
              </button>
              <button className="flex items-center gap-1 text-[0.6rem] text-[rgba(0,0,0,0.28)] hover:text-[#1D1D1F] transition-colors">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                  <path d="M10 1l4 4-4 4M14 5H6a3 3 0 000 6h1" />
                </svg>
                分享
              </button>
              <button className="ml-auto text-[rgba(0,0,0,0.28)] hover:text-[#1D1D1F] transition-colors">
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <circle cx="8" cy="3" r="1.3" />
                  <circle cx="8" cy="8" r="1.3" />
                  <circle cx="8" cy="13" r="1.3" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add button */}
      <div className="p-3 border-t border-[var(--forma-border)] shrink-0">
        <button className="w-full border border-dashed border-[rgba(0,0,0,0.18)] rounded-xl py-3 text-[0.72rem] text-[#6E6E73] hover:border-[#1D1D1F] hover:text-[#1D1D1F] transition-colors flex items-center justify-center gap-2">
          <span className="text-base leading-none">+</span>
          新增穿搭紀錄
        </button>
      </div>
    </aside>
  );
}
