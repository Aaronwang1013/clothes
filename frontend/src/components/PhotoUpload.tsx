"use client";

import { useRef, useState } from "react";

interface PhotoUploadProps {
  personImage: File | null;
  onImageChange: (file: File | null) => void;
}

export default function PhotoUpload({ personImage, onImageChange }: PhotoUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    onImageChange(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
  }

  function handleRemove() {
    onImageChange(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, #EDECE8 0%, #E0DAD0 100%)" }}
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

      {personImage && preview ? (
        <>
          <img
            src={preview}
            alt="Uploaded photo"
            className="max-w-full max-h-full object-contain"
          />

          {/* Re-upload button */}
          <button
            onClick={() => inputRef.current?.click()}
            className="absolute top-5 right-5 bg-[rgba(28,28,28,0.7)] text-white backdrop-blur-[8px] px-3 py-1.5 text-[0.72rem] tracking-[0.08em] uppercase cursor-pointer border-none transition-colors hover:bg-[rgba(28,28,28,0.9)]"
          >
            重新上傳
          </button>

          {/* Remove button */}
          <button
            onClick={handleRemove}
            className="absolute top-5 left-5 bg-[rgba(28,28,28,0.7)] text-white backdrop-blur-[8px] w-8 h-8 flex items-center justify-center text-sm cursor-pointer border-none transition-colors hover:bg-[rgba(28,28,28,0.9)]"
          >
            ✕
          </button>
        </>
      ) : (
        <div
          className={`flex flex-col items-center justify-center w-[80%] max-w-[400px] aspect-[3/4] border-2 border-dashed cursor-pointer transition-colors ${
            dragging
              ? "border-forma-accent bg-[rgba(196,168,130,0.1)]"
              : "border-[var(--forma-border)] hover:border-taupe"
          }`}
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
          <div className="text-center text-taupe flex flex-col items-center gap-3">
            <div className="text-[2.5rem] opacity-40">📷</div>
            <p className="text-[0.9rem] font-medium tracking-[0.05em]">
              點擊或拖放上傳全身照
            </p>
            <p className="text-[0.72rem] opacity-70">
              JPG / PNG，全身照效果最佳
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
