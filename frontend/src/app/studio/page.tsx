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
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  function handleTryonComplete(result: TryonResult) {
    console.log("Tryon complete:", result.task_id);
  }

  function handleReset() {
    setSelectedGarmentId(null);
  }

  function handleTabChange(tab: MobileTab) {
    if (tab === "tryon") setIsPanelOpen(true);
    setActiveTab(tab);
  }

  return (
    <>
      <Navbar variant="app" />

      {/* ── Desktop: flex row ─────────────────────────────── */}
      <main className="hidden lg:flex lg:flex-row flex-1 overflow-hidden min-h-0">
        <BrandsSidebar />
        <TryonCenter
          personImage={personImage}
          onImageChange={setPersonImage}
          selectedGarmentId={selectedGarmentId}
          onSelectGarment={setSelectedGarmentId}
          onTryOn={() => setShowTryonModal(true)}
          onReset={handleReset}
          isPanelOpen={isPanelOpen}
          onClosePanel={() => setIsPanelOpen(false)}
        />
        {/* Strip sits between TryonCenter and OutfitRecords so OutfitRecords always hugs the right edge */}
        {!isPanelOpen && (
          <div className="w-10 shrink-0 border-l border-[var(--forma-border)] bg-white flex flex-col">
            <button
              onClick={() => setIsPanelOpen(true)}
              className="flex-1 flex flex-col items-center justify-center gap-3 hover:bg-[#F5F5F7] transition-colors cursor-pointer min-h-0"
              aria-label="展開上衣推薦"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-[rgba(0,0,0,0.4)] shrink-0">
                <path d="M9 2l-6 6 6 6" />
              </svg>
              <span
                className="text-[0.6rem] tracking-[0.12em] text-[rgba(0,0,0,0.4)] select-none"
                style={{ writingMode: "vertical-rl" }}
              >
                上衣推薦
              </span>
            </button>
          </div>
        )}
        <OutfitRecords />
      </main>

      {/* ── Mobile: Tab layout ─────────────────────────────── */}
      <div className="lg:hidden flex flex-col flex-1 overflow-hidden min-h-0">
        {activeTab === "brands" && (
          <div className="flex-1 overflow-y-auto">
            <BrandsSidebar />
          </div>
        )}
        {activeTab === "tryon" && (
          <div className="flex-1 overflow-hidden relative">
            <TryonCenter
              personImage={personImage}
              onImageChange={setPersonImage}
              selectedGarmentId={selectedGarmentId}
              onSelectGarment={setSelectedGarmentId}
              onTryOn={() => setShowTryonModal(true)}
              onReset={handleReset}
              isPanelOpen={isPanelOpen}
              onClosePanel={() => setIsPanelOpen(false)}
            />
            {!isPanelOpen && (
              <div className="absolute right-0 top-0 bottom-0 w-10 z-20 flex flex-col border-l border-[var(--forma-border)] bg-white">
                <button
                  onClick={() => setIsPanelOpen(true)}
                  className="flex-1 flex flex-col items-center justify-center gap-3 hover:bg-[#F5F5F7] transition-colors cursor-pointer min-h-0"
                  aria-label="展開上衣推薦"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-[rgba(0,0,0,0.4)] shrink-0">
                    <path d="M9 2l-6 6 6 6" />
                  </svg>
                  <span
                    className="text-[0.6rem] tracking-[0.12em] text-[rgba(0,0,0,0.4)] select-none"
                    style={{ writingMode: "vertical-rl" }}
                  >
                    上衣推薦
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
        {activeTab === "records" && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <OutfitRecords />
          </div>
        )}

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
                onClick={() => handleTabChange(id)}
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
