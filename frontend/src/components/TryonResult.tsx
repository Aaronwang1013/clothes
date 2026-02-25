"use client";

  import { Button } from "@/components/ui/button";
  import { TryonResult as TryonResultType } from "@/lib/api";

  interface TryonResultProps {
    result: TryonResultType;
    onReset: () => void;
  }

  export default function TryonResult({ result, onReset }: TryonResultProps) {
    if (result.status === "failed") {
      return (
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-lg font-medium text-red-600">Try-on failed</p>
          <p className="text-sm text-gray-500">{result.error || "Unknown error"}</p>
          <Button onClick={onReset}>Try Again</Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-6">
        <h2 className="text-xl font-semibold">Your Try-On Result</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-gray-500">Original</p>
            <img
              src={result.person_image_url}
              alt="Original"
              className="w-full rounded-lg object-contain max-h-[500px]"
            />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-gray-500">Try-On Result</p>
            <img
              src={result.result_image_url}
              alt="Try-on result"
              className="w-full rounded-lg object-contain max-h-[500px]"
            />
          </div>
        </div>
        <Button onClick={onReset}>Try Again</Button>
      </div>
    );
  }