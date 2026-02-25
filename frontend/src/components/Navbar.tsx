"use client";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-10 py-5 border-b border-[var(--forma-border)] bg-warm-white relative z-10">
      <div className="font-serif text-[1.6rem] font-light tracking-[0.15em] text-charcoal">
        FOR<span className="text-forma-accent-dark">MA</span>
      </div>

      <ul className="flex gap-8 list-none">
        {["試衣間", "品牌", "收藏", "關於"].map((link) => (
          <li key={link}>
            <a
              href="#"
              className="text-[0.78rem] tracking-[0.1em] uppercase text-taupe no-underline transition-colors hover:text-charcoal"
            >
              {link}
            </a>
          </li>
        ))}
      </ul>

      <div className="flex gap-3 items-center">
        <button className="bg-transparent border border-[var(--forma-border)] text-taupe px-[22px] py-[9px] font-sans text-[0.78rem] tracking-[0.08em] uppercase cursor-pointer transition-all hover:border-taupe hover:text-charcoal">
          匯入衣物
        </button>
        <button className="bg-charcoal text-cream border-none px-[22px] py-[9px] font-sans text-[0.78rem] tracking-[0.08em] uppercase cursor-pointer transition-colors hover:bg-forma-accent-dark">
          儲存造型
        </button>
      </div>
    </nav>
  );
}
