"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredUser, StoredUser } from "@/lib/auth";
import { logoutUser } from "@/lib/api";

const NAV_LINKS: { label: string; href: string; disabled?: boolean }[] = [
  { label: "首頁", href: "/" },
  { label: "尺寸推薦", href: "/size-guide" },
  { label: "AI穿搭推薦", href: "#", disabled: true },
];

interface NavbarProps {
  variant?: "site" | "app";
}

export default function Navbar({ variant = "site" }: NavbarProps) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await logoutUser();
    setUser(null);
    setMenuOpen(false);
    router.refresh();
  }

  const logo = (
    <Link href="/" className="no-underline shrink-0">
      <span className="font-serif text-[1.3rem] font-light tracking-[0.15em] text-[#1D1D1F]">
        ShapeOn<span className="text-[#6E6E73]">You</span>
      </span>
    </Link>
  );

  if (variant === "site") {
    return (
      <>
        <nav
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-4 md:py-5 bg-[rgba(245,245,247,0.88)] backdrop-blur-md border-b border-[rgba(0,0,0,0.05)]"
          role="navigation"
          aria-label="主選單"
        >
          {logo}

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-6 ml-8">
            <ul className="flex items-center gap-5 list-none">
              {NAV_LINKS.map(({ label, href, disabled }) => {
                const isActive = pathname === href;
                if (disabled) {
                  return (
                    <li key={label}>
                      <span className="text-[0.72rem] tracking-[0.04em] text-[rgba(0,0,0,0.25)] cursor-not-allowed select-none">
                        {label}
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={label}>
                    <Link
                      href={href}
                      className={`text-[0.72rem] tracking-[0.04em] no-underline transition-colors duration-200 ${
                        isActive
                          ? "text-[#1D1D1F] font-medium"
                          : "text-[rgba(0,0,0,0.45)] hover:text-[#1D1D1F]"
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-4 ml-auto">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#1D1D1F] flex items-center justify-center text-white text-[0.6rem] font-medium">
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-[0.65rem] text-[rgba(0,0,0,0.32)] hover:text-[#1D1D1F] transition-colors duration-200 cursor-pointer"
                >
                  登出
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-[0.72rem] tracking-[0.1em] uppercase text-[rgba(0,0,0,0.45)] hover:text-[#1D1D1F] transition-colors duration-200 no-underline"
              >
                登入
              </Link>
            )}
            <Link
              href="/studio"
              className="bg-[#1D1D1F] text-white text-[0.72rem] tracking-[0.12em] uppercase px-5 py-2.5 hover:bg-[#3a3a3c] transition-colors duration-200 no-underline"
            >
              試衣間
            </Link>
          </div>

          {/* Mobile: hamburger */}
          <button
            className="lg:hidden ml-auto flex items-center justify-center w-11 h-11 text-[#1D1D1F] cursor-pointer"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "關閉選單" : "開啟選單"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile menu overlay */}
        {menuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-[rgba(245,245,247,0.97)] backdrop-blur-md pt-[64px] flex flex-col px-6 py-8">
            <ul className="flex flex-col gap-1 list-none">
              {NAV_LINKS.map(({ label, href, disabled }) => {
                const isActive = pathname === href;
                if (disabled) {
                  return (
                    <li key={label}>
                      <span className="block py-3.5 text-[1rem] tracking-[0.04em] text-[rgba(0,0,0,0.25)] cursor-not-allowed select-none border-b border-[rgba(0,0,0,0.06)]">
                        {label}
                        <span className="ml-2 text-[0.65rem] text-[rgba(0,0,0,0.2)]">即將推出</span>
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={label}>
                    <Link
                      href={href}
                      className={`block py-3.5 text-[1rem] tracking-[0.04em] no-underline transition-colors duration-200 border-b border-[rgba(0,0,0,0.06)] ${
                        isActive ? "text-[#1D1D1F] font-medium" : "text-[rgba(0,0,0,0.55)] hover:text-[#1D1D1F]"
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/studio"
                className="block text-center bg-[#1D1D1F] text-white text-[0.8rem] tracking-[0.12em] uppercase px-5 py-3.5 hover:bg-[#3a3a3c] transition-colors duration-200 no-underline"
              >
                試衣間
              </Link>
              {user ? (
                <div className="flex items-center justify-between py-2 border-t border-[rgba(0,0,0,0.08)]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#1D1D1F] flex items-center justify-center text-white text-[0.65rem] font-medium">
                      {(user.name || user.email)[0].toUpperCase()}
                    </div>
                    <span className="text-[0.8rem] text-[#1D1D1F]">{user.name || user.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-[0.72rem] text-[rgba(0,0,0,0.4)] hover:text-[#1D1D1F] transition-colors cursor-pointer"
                  >
                    登出
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="block text-center border border-[rgba(0,0,0,0.15)] text-[0.8rem] tracking-[0.08em] uppercase px-5 py-3 text-[rgba(0,0,0,0.55)] hover:text-[#1D1D1F] hover:border-[#1D1D1F] transition-colors no-underline"
                >
                  登入 / 註冊
                </Link>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  // variant === "app" — Studio navbar
  return (
    <nav
      className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-[var(--forma-border)] bg-white shrink-0 z-10"
      role="navigation"
      aria-label="應用程式導航"
    >
      {logo}

      {/* Desktop nav links */}
      <div className="hidden lg:block ml-3">
        <ul className="flex items-center gap-5 list-none">
          {NAV_LINKS.map(({ label, href, disabled }) => {
            const isActive = pathname === href;
            if (disabled) {
              return (
                <li key={label}>
                  <span className="text-[0.72rem] tracking-[0.04em] text-[rgba(0,0,0,0.25)] cursor-not-allowed select-none">
                    {label}
                  </span>
                </li>
              );
            }
            return (
              <li key={label}>
                <Link
                  href={href}
                  className={`text-[0.72rem] tracking-[0.04em] no-underline transition-colors duration-200 ${
                    isActive
                      ? "text-[#1D1D1F] font-medium"
                      : "text-[rgba(0,0,0,0.45)] hover:text-[#1D1D1F]"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Desktop search */}
      <div className="hidden lg:flex flex-1 max-w-xs ml-auto">
        <div className="flex items-center gap-2 w-full border border-[var(--forma-border)] rounded-lg px-3 py-2 bg-[#F5F5F7] hover:border-[rgba(0,0,0,0.2)] transition-colors">
          <svg viewBox="0 0 16 16" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" className="w-3.5 h-3.5 shrink-0">
            <circle cx="7" cy="7" r="5" />
            <path d="M14 14l-3.5-3.5" />
          </svg>
          <input
            type="text"
            placeholder="搜尋品牌、商品或分類"
            className="flex-1 bg-transparent text-[0.72rem] text-[#1D1D1F] placeholder-[rgba(0,0,0,0.3)] outline-none"
          />
        </div>
      </div>

      {/* Desktop actions */}
      <div className="hidden lg:flex items-center gap-2 shrink-0">
        <button className="flex items-center gap-1.5 px-3 py-2 border border-[var(--forma-border)] rounded-lg text-[0.7rem] text-[rgba(0,0,0,0.5)] hover:border-[rgba(0,0,0,0.25)] hover:text-[#1D1D1F] transition-colors cursor-pointer">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
            <path d="M8 2v9M4 6l4-4 4 4" />
            <path d="M2 13h12" />
          </svg>
          上傳照片
        </button>
        <button className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-[#F5F5F7] transition-colors text-[rgba(0,0,0,0.4)] hover:text-[#1D1D1F] cursor-pointer">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            <path d="M8 1a5 5 0 00-5 5v3L1.5 11.5h13L13 9V6a5 5 0 00-5-5z" />
            <path d="M6.5 13.5a1.5 1.5 0 003 0" />
          </svg>
        </button>
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-[var(--forma-border)] ml-1">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name ?? ""}
                className="w-7 h-7 rounded-full object-cover border border-[var(--forma-border)]"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#1D1D1F] flex items-center justify-center text-white text-[0.6rem] font-medium">
                {(user.name || user.email)[0].toUpperCase()}
              </div>
            )}
            <span className="text-[0.72rem] text-[#1D1D1F] max-w-[70px] truncate">
              Hi, {user.name || user.email.split("@")[0]}
            </span>
            <button
              onClick={handleLogout}
              className="text-[0.65rem] text-[rgba(0,0,0,0.32)] hover:text-[#1D1D1F] transition-colors ml-1 cursor-pointer"
            >
              登出
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center px-4 py-2 bg-[#1D1D1F] text-white rounded-lg text-[0.7rem] tracking-[0.05em] no-underline hover:bg-[#6E6E73] transition-colors"
          >
            登入
          </Link>
        )}
      </div>

      {/* Mobile: essential actions only */}
      <div className="lg:hidden flex items-center gap-2 ml-auto">
        <button className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-[#F5F5F7] transition-colors text-[rgba(0,0,0,0.5)] cursor-pointer">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            <path d="M8 1a5 5 0 00-5 5v3L1.5 11.5h13L13 9V6a5 5 0 00-5-5z" />
            <path d="M6.5 13.5a1.5 1.5 0 003 0" />
          </svg>
        </button>
        {user ? (
          <div className="w-8 h-8 rounded-full bg-[#1D1D1F] flex items-center justify-center text-white text-[0.6rem] font-medium">
            {(user.name || user.email)[0].toUpperCase()}
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center px-3 py-2 bg-[#1D1D1F] text-white rounded-lg text-[0.7rem] no-underline hover:bg-[#6E6E73] transition-colors"
          >
            登入
          </Link>
        )}
      </div>
    </nav>
  );
}
