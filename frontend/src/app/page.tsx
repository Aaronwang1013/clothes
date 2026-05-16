import Link from "next/link";

const GRID_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M40 0H0v40' fill='none' stroke='%23000' stroke-width='0.4' stroke-opacity='0.04'/%3E%3C/svg%3E")`;

const FEATURES = [
  {
    title: "AI 試穿效果",
    desc: "上傳全身照，IDM-VTON 技術即時生成真實試穿效果圖",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-8 h-8">
        <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
      </svg>
    ),
  },
  {
    title: "多品牌服裝",
    desc: "Uniqlo、H&M、Zara 等主流品牌服裝持續更新，一鍵試穿",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-8 h-8">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    title: "尺寸推薦",
    desc: "輸入身材數據，AI 根據您的體型給出最適合的剪裁建議",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-8 h-8">
        <rect x="2" y="7" width="20" height="10" rx="2" />
        <line x1="7" y1="7" x2="7" y2="12" />
        <line x1="12" y1="7" x2="12" y2="10" />
        <line x1="17" y1="7" x2="17" y2="12" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* ── Hero Section ──────────────────────────────────── */}
      <section
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{ backgroundImage: GRID_BG }}
      >
        {/* Top nav */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-10 py-6">
          <span className="font-serif text-[1.4rem] font-light tracking-[0.15em] text-[#1D1D1F]">
            FOR<span className="text-[#6E6E73]">MA</span>
          </span>
          <Link
            href="/login"
            className="text-[0.75rem] tracking-[0.1em] uppercase text-[rgba(0,0,0,0.4)] hover:text-[#1D1D1F] transition-colors no-underline"
          >
            登入
          </Link>
        </div>

        {/* Hero content */}
        <div className="flex flex-col items-center text-center gap-8 px-6 max-w-2xl">
          <div className="border border-[rgba(0,0,0,0.1)] px-4 py-1.5 text-[0.68rem] tracking-[0.18em] uppercase text-[rgba(0,0,0,0.4)]">
            Powered by IDM-VTON
          </div>

          <h1 className="font-serif text-[5rem] font-light tracking-[0.12em] text-[#1D1D1F] leading-none">
            FOR<span className="text-[#6E6E73]">MA</span>
          </h1>

          <p className="text-[1.05rem] font-light tracking-[0.04em] text-[rgba(0,0,0,0.5)] leading-relaxed">
            AI 虛擬試衣・讓每一個穿搭決策都更自信
          </p>

          <Link
            href="/studio"
            className="mt-2 inline-block bg-[#1D1D1F] text-white px-12 py-4 text-[0.8rem] tracking-[0.16em] uppercase no-underline transition-colors duration-200 hover:bg-[#6E6E73]"
          >
            立即試穿
          </Link>

          <p className="text-[0.72rem] tracking-[0.06em] text-[rgba(0,0,0,0.3)]">
            免費使用 · 無需登入 · 30 秒出結果
          </p>
        </div>

        {/* Scroll arrow */}
        <div className="absolute bottom-10 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-[0.6rem] tracking-[0.14em] uppercase text-[rgba(0,0,0,0.25)]">scroll</span>
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            className="w-4 h-4 text-[rgba(0,0,0,0.25)]"
          >
            <polyline points="2 5 8 11 14 5" />
          </svg>
        </div>
      </section>

      {/* ── Features Section ──────────────────────────────── */}
      <section className="bg-white py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-[0.68rem] tracking-[0.2em] uppercase text-[rgba(0,0,0,0.35)] mb-4">
              功能特色
            </p>
            <h2 className="font-serif text-[2rem] font-light tracking-[0.08em] text-[#1D1D1F]">
              穿搭，從此不再猜測
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center gap-5">
                <div className="text-[rgba(0,0,0,0.35)]">{f.icon}</div>
                <div>
                  <h3 className="font-serif text-[1.1rem] font-light tracking-[0.06em] text-[#1D1D1F] mb-2">
                    {f.title}
                  </h3>
                  <p className="text-[0.8rem] text-[rgba(0,0,0,0.45)] leading-relaxed tracking-[0.02em]">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-20">
            <Link
              href="/studio"
              className="inline-block border border-[rgba(0,0,0,0.15)] px-10 py-3 text-[0.75rem] tracking-[0.14em] uppercase text-[rgba(0,0,0,0.6)] no-underline hover:border-[#1D1D1F] hover:text-[#1D1D1F] transition-colors duration-200"
            >
              進入試衣間
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="bg-[#F5F5F7] border-t border-[rgba(0,0,0,0.07)] py-8 px-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="font-serif text-[1rem] font-light tracking-[0.15em] text-[#1D1D1F]">
            FOR<span className="text-[#6E6E73]">MA</span>
          </span>
          <p className="text-[0.68rem] tracking-[0.06em] text-[rgba(0,0,0,0.3)]">
            © 2025 FORMA. Powered by IDM-VTON
          </p>
        </div>
      </footer>
    </div>
  );
}
