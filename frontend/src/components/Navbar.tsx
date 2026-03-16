"use client";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-10 py-5 border-b border-[var(--forma-border)] backdrop-blur-xl bg-warm-white relative z-10">
      <div className="font-serif text-[1.6rem] font-light tracking-[0.15em] text-cream">
        FOR<span className="text-forma-accent-dark">MA</span>
      </div>

      <ul className="flex gap-8 list-none">
        {["試衣間", "品牌", "收藏", "關於"].map((link) => (
          <li key={link}>
            <a
              href="#"
              className="text-[0.78rem] tracking-[0.1em] uppercase text-taupe no-underline transition-colors hover:text-cream"
            >
              {link}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
