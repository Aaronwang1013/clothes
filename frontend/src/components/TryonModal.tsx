"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createTryon, getTryonStatus, TryonResult } from "@/lib/api";

interface TryonModalProps {
  personImage: File;
  garmentId: string;
  onClose: () => void;
  onComplete?: (result: TryonResult) => void; //
}

type ModalStep = "processing" | "result";

export default function TryonModal({ personImage, garmentId, onClose, onComplete }: TryonModalProps) {
  const [step, setStep] = useState<ModalStep>("processing");
  const [error, setError] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<string>("pending");
  const [result, setResult] = useState<TryonResult | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);

  const handleComplete = useCallback((r: TryonResult) => {
    setResult(r);
    setStep("result");
    if (r.status == "completed") onComplete?.(r);
  }, [onComplete]);

  const startPolling = useCallback((taskId: string) => {
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
  }, [handleComplete]);

  // Auto-submit on mount
  useEffect(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    async function submit() {
      try {
        const res = await createTryon(personImage, garmentId);
        startPolling(res.task_id);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "提交失敗");
        setStep("result");
      }
    }

    submit();
  }, [personImage, garmentId, startPolling]);

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

        {/* Processing step */}
        {step === "processing" && !error && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="h-12 w-12 rounded-full border-4 border-[var(--forma-border)] border-t-forma-accent-dark animate-spin" />
            <p className="text-[1rem] font-medium text-charcoal">
              {pollingStatus === "pending" ? "排隊等待中..." : "AI 生成試穿效果中..."}
            </p>
            <p className="text-[0.78rem] text-taupe">通常需要 30-45 秒</p>
          </div>
        )}

        {/* Submission error */}
        {step === "processing" && error && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-red-500 text-[0.9rem]">{error}</p>
            <button
              onClick={onClose}
              className="bg-charcoal text-cream border-none px-8 py-[10px] font-sans text-[0.78rem] tracking-[0.08em] uppercase cursor-pointer hover:bg-forma-accent-dark transition-colors"
            >
              關閉
            </button>
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
                  onClick={onClose}
                  className="mt-4 bg-charcoal text-cream border-none px-8 py-[10px] font-sans text-[0.78rem] tracking-[0.08em] uppercase cursor-pointer hover:bg-forma-accent-dark transition-colors"
                >
                  關閉
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
