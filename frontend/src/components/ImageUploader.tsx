"use client";

  import { useRef, useState } from "react";
  import { Card } from "@/components/ui/card";

  interface ImageUploaderProps {
    onUpload: (file: File) => void;
  }

  export default function ImageUploader({ onUpload }: ImageUploaderProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function handleFile(file: File) {
      setPreview(URL.createObjectURL(file));
      onUpload(file);
    }

    return (
      <Card
        className={`flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
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
          if (file && file.type.startsWith("image/")) {
            handleFile(file);
          }
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
          <img
            src={preview}
            alt="Preview"
            className="max-h-72 rounded object-contain"
          />
        ) : (
          <div className="text-center text-gray-500 p-6">
            <p className="text-lg font-medium">Upload your photo</p>
            <p className="text-sm mt-1">Drag and drop or click to select</p>
            <p className="text-xs mt-2 text-gray-400">Full-body photo works best</p>
          </div>
        )}
      </Card>
    );
  }