"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMe, updateProfile, changePassword, updateBodyMeasurements } from "@/lib/api";
import { getStoredUser, setStoredUser } from "@/lib/auth";
import type { StoredUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);

  // Profile fields
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Body fields
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [bustCm, setBustCm] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [hipsCm, setHipsCm] = useState("");
  const [bodyLoading, setBodyLoading] = useState(false);
  const [bodyMessage, setBodyMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(stored);
    setName(stored.name ?? "");
    setAvatarUrl(stored.avatar_url ?? "");

    // Fetch full user data including body measurements
    getMe().then((full: AuthUser) => {
      if (full.height_cm) setHeightCm(String(full.height_cm));
      if (full.weight_kg) setWeightKg(String(full.weight_kg));
      if (full.bust_cm) setBustCm(String(full.bust_cm));
      if (full.waist_cm) setWaistCm(String(full.waist_cm));
      if (full.hips_cm) setHipsCm(String(full.hips_cm));
    }).catch(() => {});
  }, [router]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileMessage(null);
    setProfileLoading(true);
    try {
      const updated = await updateProfile(name || undefined, avatarUrl || undefined);
      const newStored: StoredUser = {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        avatar_url: updated.avatar_url,
        is_admin: updated.is_admin,
        oauth_provider: updated.oauth_provider,
      };
      setStoredUser(newStored);
      setUser(newStored);
      setProfileMessage({ type: "ok", text: "資料已更新" });
    } catch (e) {
      setProfileMessage({ type: "err", text: e instanceof Error ? e.message : "更新失敗" });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleBodySave(e: React.FormEvent) {
    e.preventDefault();
    setBodyMessage(null);
    setBodyLoading(true);
    try {
      const data: Record<string, number> = {};
      if (heightCm) data.height_cm = parseFloat(heightCm);
      if (weightKg) data.weight_kg = parseFloat(weightKg);
      if (bustCm) data.bust_cm = parseFloat(bustCm);
      if (waistCm) data.waist_cm = parseFloat(waistCm);
      if (hipsCm) data.hips_cm = parseFloat(hipsCm);
      await updateBodyMeasurements(data);
      setBodyMessage({ type: "ok", text: "身材數據已儲存" });
    } catch (e) {
      setBodyMessage({ type: "err", text: e instanceof Error ? e.message : "更新失敗" });
    } finally {
      setBodyLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwMessage(null);
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: "err", text: "兩次輸入的密碼不一致" });
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPwMessage({ type: "ok", text: "密碼已更新，下次登入請使用新密碼" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setPwMessage({ type: "err", text: e instanceof Error ? e.message : "更改失敗" });
    } finally {
      setPwLoading(false);
    }
  }

  if (!user) return null;

  const isEmailUser = !user.oauth_provider;

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-16 px-4">
      <div className="max-w-[480px] mx-auto">
        <h1 className="font-serif text-[1.4rem] font-light tracking-[0.12em] text-cream mb-8">
          個人設定
        </h1>

        {/* Profile Section */}
        <div className="bg-white border border-[var(--forma-border)] p-8 shadow-sm mb-5">
          <h2 className="text-[0.72rem] tracking-[0.1em] uppercase text-taupe mb-6">個人資料</h2>

          <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.72rem] tracking-[0.08em] uppercase text-taupe">Email</label>
              <p className="text-[0.88rem] text-cream px-3 py-2.5 border border-[var(--forma-border)] bg-black/[0.02]">
                {user.email}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.72rem] tracking-[0.08em] uppercase text-taupe">姓名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="您的名稱"
                className="border border-[var(--forma-border)] px-3 py-2.5 text-[0.88rem] text-cream bg-white outline-none focus:border-cream transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.72rem] tracking-[0.08em] uppercase text-taupe">頭像 URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="border border-[var(--forma-border)] px-3 py-2.5 text-[0.88rem] text-cream bg-white outline-none focus:border-cream transition-colors"
              />
            </div>

            {profileMessage && (
              <p className={`text-[0.78rem] ${profileMessage.type === "ok" ? "text-green-600" : "text-red-500"}`}>
                {profileMessage.text}
              </p>
            )}

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full bg-cream text-white py-3 text-[0.78rem] tracking-[0.12em] uppercase cursor-pointer transition-colors hover:bg-forma-accent disabled:opacity-40 disabled:cursor-not-allowed border-none mt-1"
            >
              {profileLoading ? "儲存中..." : "儲存變更"}
            </button>
          </form>
        </div>

        {/* Body Measurements Section */}
        <div className="bg-white border border-[var(--forma-border)] p-8 shadow-sm mb-5">
          <h2 className="text-[0.72rem] tracking-[0.1em] uppercase text-taupe mb-1">身材數據</h2>
          <p className="text-[0.72rem] text-taupe mb-6">用於 AI 尺寸推薦，所有欄位皆為選填</p>

          <form onSubmit={handleBodySave} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.72rem] tracking-[0.08em] uppercase text-taupe">身高 (cm)</label>
                <input
                  type="number"
                  min="100"
                  max="250"
                  step="0.1"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="例：165"
                  className="border border-[var(--forma-border)] px-3 py-2.5 text-[0.88rem] text-cream bg-white outline-none focus:border-cream transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.72rem] tracking-[0.08em] uppercase text-taupe">體重 (kg)</label>
                <input
                  type="number"
                  min="30"
                  max="200"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="例：55"
                  className="border border-[var(--forma-border)] px-3 py-2.5 text-[0.88rem] text-cream bg-white outline-none focus:border-cream transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.72rem] tracking-[0.08em] uppercase text-taupe">胸圍 (cm)</label>
                <input
                  type="number"
                  min="50"
                  max="180"
                  step="0.1"
                  value={bustCm}
                  onChange={(e) => setBustCm(e.target.value)}
                  placeholder="例：86"
                  className="border border-[var(--forma-border)] px-3 py-2.5 text-[0.88rem] text-cream bg-white outline-none focus:border-cream transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.72rem] tracking-[0.08em] uppercase text-taupe">腰圍 (cm)</label>
                <input
                  type="number"
                  min="40"
                  max="180"
                  step="0.1"
                  value={waistCm}
                  onChange={(e) => setWaistCm(e.target.value)}
                  placeholder="例：68"
                  className="border border-[var(--forma-border)] px-3 py-2.5 text-[0.88rem] text-cream bg-white outline-none focus:border-cream transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.72rem] tracking-[0.08em] uppercase text-taupe">臀圍 (cm)</label>
                <input
                  type="number"
                  min="50"
                  max="180"
                  step="0.1"
                  value={hipsCm}
                  onChange={(e) => setHipsCm(e.target.value)}
                  placeholder="例：92"
                  className="border border-[var(--forma-border)] px-3 py-2.5 text-[0.88rem] text-cream bg-white outline-none focus:border-cream transition-colors"
                />
              </div>
            </div>

            {bodyMessage && (
              <p className={`text-[0.78rem] ${bodyMessage.type === "ok" ? "text-green-600" : "text-red-500"}`}>
                {bodyMessage.text}
              </p>
            )}

            <button
              type="submit"
              disabled={bodyLoading}
              className="w-full bg-cream text-white py-3 text-[0.78rem] tracking-[0.12em] uppercase cursor-pointer transition-colors hover:bg-forma-accent disabled:opacity-40 disabled:cursor-not-allowed border-none mt-1"
            >
              {bodyLoading ? "儲存中..." : "儲存身材數據"}
            </button>
          </form>
        </div>

        {/* Password Section (email users only) */}
        {isEmailUser && (
          <div className="bg-white border border-[var(--forma-border)] p-8 shadow-sm mb-5">
            <h2 className="text-[0.72rem] tracking-[0.1em] uppercase text-taupe mb-6">更改密碼</h2>

            <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.72rem] tracking-[0.08em] uppercase text-taupe">目前密碼</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="border border-[var(--forma-border)] px-3 py-2.5 text-[0.88rem] text-cream bg-white outline-none focus:border-cream transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.72rem] tracking-[0.08em] uppercase text-taupe">新密碼</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="至少 8 個字元"
                  className="border border-[var(--forma-border)] px-3 py-2.5 text-[0.88rem] text-cream bg-white outline-none focus:border-cream transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.72rem] tracking-[0.08em] uppercase text-taupe">確認新密碼</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="再次輸入新密碼"
                  className="border border-[var(--forma-border)] px-3 py-2.5 text-[0.88rem] text-cream bg-white outline-none focus:border-cream transition-colors"
                />
              </div>

              {pwMessage && (
                <p className={`text-[0.78rem] ${pwMessage.type === "ok" ? "text-green-600" : "text-red-500"}`}>
                  {pwMessage.text}
                </p>
              )}

              <button
                type="submit"
                disabled={pwLoading}
                className="w-full bg-cream text-white py-3 text-[0.78rem] tracking-[0.12em] uppercase cursor-pointer transition-colors hover:bg-forma-accent disabled:opacity-40 disabled:cursor-not-allowed border-none mt-1"
              >
                {pwLoading ? "處理中..." : "更改密碼"}
              </button>
            </form>
          </div>
        )}

        {/* Back link */}
        <div className="text-center">
          <a
            href="/studio"
            className="text-[0.72rem] text-taupe hover:text-cream transition-colors tracking-[0.04em]"
          >
            返回試衣間
          </a>
        </div>
      </div>
    </div>
  );
}
