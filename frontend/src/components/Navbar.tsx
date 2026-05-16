"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredUser, StoredUser } from "@/lib/auth";
import { logoutUser } from "@/lib/api";

const NAV_LINKS = [
  { label: "首頁", href: "/" },
  { label: "品牌", href: "#" },
  { label: "女裝", href: "#" },
  { label: "男裝", href: "#" },
  { label: "配件", href: "#" },
  { label: "AI穿搭推薦", href: "#" },
];

export default function Navbar() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  async function handleLogout() {
    await logoutUser();
    setUser(null);
    router.refresh();
  }

  return (
    <nav className="flex items-center gap-4 px-6 py-3 border-b border-[var(--forma-border)] bg-white shrink-0 z-10">
      {/* Logo */}
      <Link href="/" className="no-underline shrink-0">
        <div className="flex flex-col leading-none">
          <span className="font-serif text-[1.3rem] font-light tracking-[0.12em] text-[#1D1D1F]">
            FOR<span className="text-[#6E6E73]">MA</span>
          </span>
          <span className="text-[0.48rem] tracking-[0.16em] uppercase text-[rgba(0,0,0,0.32)]">AI 虛擬試穿</span>
        </div>
      </Link>

      {/* Nav links */}
      <ul className="flex items-center gap-5 list-none ml-3">
        {NAV_LINKS.map(({ label, href }) => (
          <li key={label}>
            <Link
              href={href}
              className={`text-[0.72rem] tracking-[0.04em] no-underline transition-colors ${
                label === "首頁"
                  ? "text-[#1D1D1F] font-medium"
                  : "text-[rgba(0,0,0,0.45)] hover:text-[#1D1D1F]"
              }`}
            >
              {label}
            </Link>
          </li>
        ))}
        {user?.is_admin && (
          <li>
            <Link
              href="/admin"
              className="text-[0.72rem] tracking-[0.04em] text-[rgba(0,0,0,0.45)] hover:text-[#1D1D1F] no-underline transition-colors"
            >
              後台
            </Link>
          </li>
        )}
      </ul>

      {/* Search */}
      <div className="flex-1 max-w-xs ml-auto">
        <div className="flex items-center gap-2 border border-[var(--forma-border)] rounded-lg px-3 py-2 bg-[#F5F5F7] hover:border-[rgba(0,0,0,0.2)] transition-colors">
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

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Upload button */}
        <button className="flex items-center gap-1.5 px-3 py-2 border border-[var(--forma-border)] rounded-lg text-[0.7rem] text-[rgba(0,0,0,0.5)] hover:border-[rgba(0,0,0,0.25)] hover:text-[#1D1D1F] transition-colors">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
            <path d="M8 2v9M4 6l4-4 4 4" />
            <path d="M2 13h12" />
          </svg>
          上傳照片
        </button>

        {/* Notification */}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F7] transition-colors text-[rgba(0,0,0,0.4)] hover:text-[#1D1D1F]">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            <path d="M8 1a5 5 0 00-5 5v3L1.5 11.5h13L13 9V6a5 5 0 00-5-5z" />
            <path d="M6.5 13.5a1.5 1.5 0 003 0" />
          </svg>
        </button>

        {/* User */}
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
            <svg viewBox="0 0 12 12" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" className="w-2.5 h-2.5">
              <path d="M2 4l4 4 4-4" />
            </svg>
            <button
              onClick={handleLogout}
              className="text-[0.65rem] text-[rgba(0,0,0,0.32)] hover:text-[#1D1D1F] transition-colors ml-1"
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
    </nav>
  );
}
