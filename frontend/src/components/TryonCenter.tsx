"use client";

import { useEffect, useRef, useState } from "react";
import { fetchGarments, Garment } from "@/lib/api";

const TABS = ["熱門", "最新", "價格"];

const STEPS = [
  {
    num: 1,
    label: "上傳照片",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <path d="M10 13V3M6 7l4-4 4 4" />
        <path d="M3 17h14" />
      </svg>
    ),
  },
  {
    num: 2,
    label: "選擇商品",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <path d="M6 2 3 6v12a2 2 0 002 2h10a2 2 0 002-2V6l-3-4z" />
        <path d="M3 6h14M13 10a3 3 0 01-6 0" />
      </svg>
    ),
  },
  {
    num: 3,
    label: "生成試穿",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <circle cx="10" cy="10" r="7" />
        <path d="M10 7v4l2.5 1.5" />
      </svg>
    ),
  },
  {
    num: 4,
    label: "儲存分享",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <path d="M13 4l3 3-3 3M4 14v1a1 1 0 001 1h10a1 1 0 001-1v-1" />
        <path d="M16 7H8a4 4 0 000 8" />
      </svg>
    ),
  },
];

interface TryonCenterProps {
  personImage: File | null;
  onImageChange: (file: File | null) => void;
  selectedGarmentId: string | null;
  onSelectGarment: (id: string) => void;
  onTryOn: () => void;
  onReset: () => void;
}

export default function TryonCenter({
  personImage,
  onImageChange,
  selectedGarmentId,
  onSelectGarment,
  onTryOn,
  onReset,
}: TryonCenterProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loadingGarments, setLoadingGarments] = useState(true);
  const [activeTab, setActiveTab] = useState("熱門");
  const [compareMode, setCompareMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGarments()
      .then(setGarments)
      .catch(() => {})
      .finally(() => setLoadingGarments(false));
  }, []);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    onImageChange(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
  }

  function handleReset() {
    onImageChange(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    onReset();
  }

  function handleRandomOutfit() {
    if (garments.length === 0) return;
    const random = garments[Math.floor(Math.random() * garments.length)];
    onSelectGarment(random.id);
  }

  const canTryOn = !!personImage && !!selectedGarmentId;
  const currentStep = !personImage ? 1 : !selectedGarmentId ? 2 : 3;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Main area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Photo area */}
        <div className="flex-1 relative bg-[#F5F5F7] overflow-hidden flex flex-col">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-3 z-10">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 20 20" fill="none" stroke="#1D1D1F" strokeWidth="1.4" className="w-4 h-4">
                <circle cx="10" cy="10" r="8" />
                <path d="M10 6v5l3 2" />
              </svg>
              <span className="text-[0.78rem] font-medium text-[#1D1D1F]">虛擬試穿</span>
            </div>
            <div className="flex gap-1.5">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/70 transition-colors text-[rgba(0,0,0,0.4)] hover:text-[#1D1D1F]">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                  <circle cx="5" cy="5" r="3" /><circle cx="11" cy="11" r="3" />
                  <path d="M8 2l6 6-6 6M2 8h12" />
                </svg>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/70 transition-colors text-[rgba(0,0,0,0.4)] hover:text-[#1D1D1F]">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                  <path d="M2 11v3h3M14 5V2h-3M14 11v3h-3M2 5V2h3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Photo display */}
          <div className="flex-1 flex items-center justify-center mt-12 mb-16 overflow-hidden px-4">
            {personImage && preview ? (
              <div className="relative h-full flex items-center justify-center">
                <img
                  src={preview}
                  alt="Uploaded photo"
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
                <button
                  onClick={() => inputRef.current?.click()}
                  className="absolute top-3 right-3 bg-black/10 backdrop-blur-sm text-[#1D1D1F] px-3 py-1.5 text-[0.65rem] tracking-[0.05em] uppercase rounded-lg border border-black/10 hover:bg-black/20 transition-colors"
                >
                  重新上傳
                </button>
              </div>
            ) : (
              <div
                className={`flex flex-col items-center justify-center gap-4 cursor-pointer w-full h-full`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
              >
                <div
                  className={`w-36 h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors bg-white/60 ${
                    dragging
                      ? "border-[#1D1D1F] bg-white/80"
                      : "border-[rgba(0,0,0,0.15)] hover:border-[rgba(0,0,0,0.3)]"
                  }`}
                >
                  <svg viewBox="0 0 48 48" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" className="w-10 h-10">
                    <path d="M38.5 6.5 30 2a8 8 0 0 1-16 0L5.5 6.5a4 4 0 0 0-2.7 4.46l1.15 7.14a2 2 0 0 0 1.97 1.7H10v20a4 4 0 0 0 4 4h20a4 4 0 0 0 4-4V19.8h4.08a2 2 0 0 0 1.97-1.7l1.15-7.14a4 4 0 0 0-2.7-4.46z" />
                  </svg>
                  <span className="text-[0.6rem] text-[rgba(0,0,0,0.3)] text-center leading-relaxed">
                    無完整身照<br />點選上傳
                  </span>
                </div>
                <p className="text-[0.72rem] text-[rgba(0,0,0,0.4)]">點擊或拖曳全身照片至此</p>
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 px-5 py-3 flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-[0.7rem] tracking-[0.05em] text-[#6E6E73] border border-[rgba(0,0,0,0.12)] rounded-lg hover:border-[rgba(0,0,0,0.3)] hover:text-[#1D1D1F] transition-all bg-white/80 backdrop-blur-sm"
            >
              重設
            </button>
            <button
              onClick={handleRandomOutfit}
              className="flex items-center gap-2 px-4 py-2 text-[0.7rem] tracking-[0.05em] text-[#6E6E73] border border-[rgba(0,0,0,0.12)] rounded-lg hover:border-[rgba(0,0,0,0.3)] hover:text-[#1D1D1F] transition-all bg-white/80 backdrop-blur-sm"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M1 1l14 14M15 1l-4 4M1 15l4-4" />
                <path d="M11 1h4v4M1 11v4h4" />
              </svg>
              隨機搭配
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[0.68rem] text-[rgba(0,0,0,0.4)]">對比模式</span>
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
                  compareMode ? "bg-[#1D1D1F]" : "bg-[rgba(0,0,0,0.15)]"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                    compareMode ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Product panel */}
        <div className="w-[220px] border-l border-[var(--forma-border)] bg-white flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--forma-border)] shrink-0">
            <div className="text-[0.78rem] font-medium text-[#1D1D1F] mb-2">上衣推薦</div>
            <div className="flex border border-[var(--forma-border)] rounded-lg overflow-hidden">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 text-[0.62rem] tracking-[0.03em] transition-colors ${
                    activeTab === tab
                      ? "bg-[#1D1D1F] text-white"
                      : "text-[#6E6E73] hover:bg-[#F5F5F7]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingGarments ? (
              <div className="flex items-center justify-center h-20 text-[0.72rem] text-[rgba(0,0,0,0.35)]">
                載入中...
              </div>
            ) : garments.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-[0.72rem] text-[rgba(0,0,0,0.35)]">
                暫無商品
              </div>
            ) : (
              <div className="p-2 flex flex-col gap-2">
                {garments.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => onSelectGarment(g.id)}
                    className={`w-full text-left border rounded-xl overflow-hidden transition-all hover:border-[rgba(0,0,0,0.2)] ${
                      selectedGarmentId === g.id
                        ? "border-[#1D1D1F] ring-1 ring-[#1D1D1F]"
                        : "border-[var(--forma-border)]"
                    }`}
                  >
                    <div className="aspect-[4/3] bg-[#F5F5F7] overflow-hidden">
                      {g.image_url ? (
                        <img src={g.image_url} alt={g.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">👕</div>
                      )}
                    </div>
                    <div className="p-2">
                      <div className="text-[0.68rem] font-medium text-[#1D1D1F] truncate">{g.name}</div>
                      <div className="text-[0.58rem] text-[rgba(0,0,0,0.4)] mt-0.5">{g.category}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-[var(--forma-border)] shrink-0">
            <button
              onClick={onTryOn}
              disabled={!canTryOn}
              className="w-full bg-[#1D1D1F] text-white py-2.5 text-[0.72rem] tracking-[0.08em] uppercase rounded-lg hover:bg-[#6E6E73] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {!personImage ? "請先上傳照片" : !selectedGarmentId ? "請選擇服裝" : "立即試穿"}
            </button>
          </div>
        </div>
      </div>

      {/* Step guide */}
      <div className="shrink-0 border-t border-[var(--forma-border)] bg-white px-4 py-2.5 flex items-center justify-center gap-1">
        {STEPS.map((step, i) => (
          <div key={step.num} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                currentStep === step.num
                  ? "bg-[#1D1D1F] text-white"
                  : currentStep > step.num
                  ? "text-[rgba(0,0,0,0.45)]"
                  : "text-[rgba(0,0,0,0.22)]"
              }`}
            >
              {step.icon}
              <span className="text-[0.62rem] tracking-[0.03em] whitespace-nowrap">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <svg viewBox="0 0 12 12" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" className="w-2.5 h-2.5 shrink-0 mx-0.5">
                <path d="M3 1l5 5-5 5" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
