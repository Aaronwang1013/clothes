"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import BrandsSidebar from "@/components/BrandsSidebar";
import TryonCenter from "@/components/TryonCenter";
import OutfitRecords from "@/components/OutfitRecords";
import TryonModal from "@/components/TryonModal";
import { TryonResult } from "@/lib/api";

type MobileTab = "brands" | "tryon" | "records";

const TABS: { id: MobileTab; label: string; icon: React.ReactNode }[] = [
  {
    id: "brands",
    label: "品牌",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <rect x="2" y="3" width="16" height="14" rx="2" />
        <path d="M2 7h16" />
        <path d="M6 7v10" />
      </svg>
    ),
  },
  {
    id: "tryon",
    label: "試穿",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M10 2a3 3 0 100 6 3 3 0 000-6z" />
        <path d="M4 18v-2a6 6 0 0112 0v2" />
      </svg>
    ),
  },
  {
    id: "records",
    label: "記錄",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <rect x="3" y="3" width="14" height="14" rx="1.5" />
        <path d="M7 7h6M7 10h6M7 13h4" />
      </svg>
    ),
  },
];

export default function StudioPage() {
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | null>(null);
  const [showTryonModal, setShowTryonModal] = useState(false);
  const [activeTab, setActiveTab] = useState<MobileTab>("tryon");

  function handleTryonComplete(result: TryonResult) {
    console.log("Tryon complete:", result.task_id);
  }

  function handleReset() {
    setSelectedGarmentId(null);
  }

  return (
    <>
      <Navbar variant="app" />

      {/* ── Desktop: 3-column grid ─────────────────────────── */}
      <main className="hidden lg:grid lg:grid-cols-[260px_1fr_280px] flex-1 overflow-hidden min-h-0">
        <BrandsSidebar />
        <TryonCenter
          personImage={personImage}
          onImageChange={setPersonImage}
          selectedGarmentId={selectedGarmentId}
          onSelectGarment={setSelectedGarmentId}
          onTryOn={() => setShowTryonModal(true)}
          onReset={handleReset}
        />
        <OutfitRecords />
      </main>

      {/* ── Mobile: Tab layout ─────────────────────────────── */}
      <div className="lg:hidden flex flex-col flex-1 overflow-hidden min-h-0">
        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "brands" && <BrandsSidebar />}
          {activeTab === "tryon" && (
            <TryonCenter
              personImage={personImage}
              onImageChange={setPersonImage}
              selectedGarmentId={selectedGarmentId}
              onSelectGarment={setSelectedGarmentId}
              onTryOn={() => setShowTryonModal(true)}
              onReset={handleReset}
            />
          )}
          {activeTab === "records" && <OutfitRecords />}
        </div>

        {/* Bottom Tab Bar */}
        <nav
          className="shrink-0 grid grid-cols-3 border-t border-[rgba(0,0,0,0.08)] bg-white"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          aria-label="分頁導航"
        >
          {TABS.map(({ id, label, icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? "text-[#1D1D1F]"
                    : "text-[rgba(0,0,0,0.35)] hover:text-[rgba(0,0,0,0.65)]"
                }`}
                aria-label={label}
                aria-selected={isActive}
              >
                {icon}
                <span className={`text-[0.6rem] tracking-[0.05em] ${isActive ? "font-medium" : ""}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {showTryonModal && selectedGarmentId && personImage && (
        <TryonModal
          personImage={personImage}
          garmentId={selectedGarmentId}
          onClose={() => setShowTryonModal(false)}
          onComplete={handleTryonComplete}
        />
      )}
    </>
  );
}
