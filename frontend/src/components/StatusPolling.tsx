"use client";

  import { useEffect, useState } from "react";
  import { getTryonStatus, TryonResult } from "@/lib/api";

  interface StatusPollingProps {
    taskId: string;
    onComplete: (result: TryonResult) => void;
  }

  export default function StatusPolling({ taskId, onComplete }: StatusPollingProps) {
    const [status, setStatus] = useState("pending");

    useEffect(() => {
      const interval = setInterval(async () => {
        try {
          const result = await getTryonStatus(taskId);
          setStatus(result.status);

          if (result.status === "completed" || result.status === "failed") {
            clearInterval(interval);
            onComplete(result);
          }
        } catch {
          // Keep polling even if one request fails
        }
      }, 3000);

      return () => clearInterval(interval);
    }, [taskId, onComplete]);

    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin" />
        <p className="text-lg font-medium text-gray-700">
          {status === "pending" && "Waiting in queue..."}
          {status === "processing" && "Generating try-on image..."}
        </p>
        <p className="text-sm text-gray-400">This usually takes 30–45 seconds</p>
      </div>
    );
  }