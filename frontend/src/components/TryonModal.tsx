"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createTryon, getTryonStatus, TryonResult } from "@/lib/api";

interface TryonModalProps {
  garmentId: string;
  onClose: () => void;
}

type ModalStep = "upload" | "processing" | "result";

export default function TryonModal({ garmentId, onClose }: TryonModalProps) {
  const [step, setStep] = useState<ModalStep>("upload");
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pollingStatus, setPollingStatus] = useState<string>("pending");
  const [result, setResult] = useState<TryonResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function handleFile(file: File) {
    setPersonImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!personImage) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await createTryon(personImage, garmentId);
      setStep("processing");
      startPolling(res.task_id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "提交失敗");
    } finally {
      setSubmitting(false);
    }
  }

  const handleComplete = useCallback((r: TryonResult) => {
    setResult(r);
    setStep("result");
  }, []);

  function startPolling(taskId: string) {
    intervalRef.current = setInterval(async () => {
      try {
        const r = await getTryonStatus(taskId);
        setPollingStatus(r.status);
        if (r.status === "completed" || r.status === "failed") {
          if (intervalRef.current) clearInterval(intervalRef.current);
          handleComplete(r);
        }
      } catch {
        // Keep polling
      }
    }, 3000);
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,28,28,0.6)] backdrop-blur-[6px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-warm-white w-[90vw] max-w-[720px] max-h-[85vh] overflow-y-auto relative p-8 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-taupe hover:text-charcoal transition-colors text-xl cursor-pointer bg-transparent border-none"
        >
          ✕
        </button>

        {/* Upload step */}
        {step === "upload" && (
          <div className="flex flex-col gap-6">
            <div className="font-serif text-[1.3rem] font-light text-charcoal tracking-[0.05em]">
              上傳人像照片
            </div>
            <p className="text-[0.78rem] text-taupe">
              請上傳一張全身照片，AI 將為您生成試穿效果圖
            </p>

            {/* Drop zone */}
            <div
              className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed cursor-pointer transition-colors ${
                dragging
                  ? "border-forma-accent bg-[rgba(196,168,130,0.1)]"
                  : "border-[var(--forma-border)] hover:border-taupe"
              }`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files[0];
                if (file?.type.startsWith("image/")) handleFile(file);
              }}
            >
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
              {preview ? (
                <img src={preview} alt="Preview" className="max-h-56 object-contain" />
              ) : (
                <div className="text-center text-taupe">
                  <p className="text-[0.9rem] font-medium">點擊或拖放上傳</p>
                  <p className="text-[0.72rem] mt-1">全身照效果最佳</p>
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-500 text-[0.78rem] text-center">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!personImage || submitting}
              className="w-full bg-charcoal text-cream border-none py-[13px] font-sans text-[0.8rem] tracking-[0.12em] uppercase cursor-pointer transition-colors hover:bg-forma-accent-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "提交中..." : "開始試穿"}
            </button>
          </div>
        )}

        {/* Processing step */}
        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="h-12 w-12 rounded-full border-4 border-[var(--forma-border)] border-t-forma-accent-dark animate-spin" />
            <p className="text-[1rem] font-medium text-charcoal">
              {pollingStatus === "pending" ? "排隊等待中..." : "AI 生成試穿效果中..."}
            </p>
            <p className="text-[0.78rem] text-taupe">通常需要 30–45 秒</p>
          </div>
        )}

        {/* Result step */}
        {step === "result" && result && (
          <div className="flex flex-col gap-6">
            <div className="font-serif text-[1.3rem] font-light text-charcoal tracking-[0.05em]">
              {result.status === "failed" ? "試穿失敗" : "試穿結果"}
            </div>

            {result.status === "failed" ? (
              <div className="text-center py-8">
                <p className="text-red-500 text-[0.9rem]">
                  {result.error || "未知錯誤，請重試"}
                </p>
                <button
                  onClick={() => { setStep("upload"); setPersonImage(null); setPreview(null); setResult(null); }}
                  className="mt-4 bg-charcoal text-cream border-none px-8 py-[10px] font-sans text-[0.78rem] tracking-[0.08em] uppercase cursor-pointer hover:bg-forma-accent-dark transition-colors"
                >
                  重新嘗試
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[0.7rem] tracking-[0.1em] uppercase text-taupe">
                      原始照片
                    </span>
                    <img
                      src={result.person_image_url}
                      alt="Original"
                      className="w-full object-contain max-h-[400px] border border-[var(--forma-border)]"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[0.7rem] tracking-[0.1em] uppercase text-taupe">
                      試穿效果
                    </span>
                    <img
                      src={result.result_image_url}
                      alt="Try-on result"
                      className="w-full object-contain max-h-[400px] border border-[var(--forma-border)]"
                    />
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full bg-charcoal text-cream border-none py-[13px] font-sans text-[0.8rem] tracking-[0.12em] uppercase cursor-pointer transition-colors hover:bg-forma-accent-dark"
                >
                  繼續挑選
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
