"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import BodyPanel, { BodyState } from "@/components/BodyPanel";
import ClothesPanel from "@/components/ClothesPanel";
import PhotoUpload from "@/components/PhotoUpload";
import TryonModal from "@/components/TryonModal";
import FilterTabs from "@/components/FilterTabs";
import { TryonResult } from "@/lib/api";

const DEFAULT_BODY: BodyState = {
  gender: "male",
  height: 170,
  weight: 65,
  shoulder: 42,
  chest: 90,
  waist: 75,
  hip: 95,
};

interface StagingItem {
  id: string;
  resultImageUrl: string;
}

export default function Home() {
  const [bodyState, setBodyState] = useState<BodyState>(DEFAULT_BODY);
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | null>(null);
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [showTryonModal, setShowTryonModal] = useState(false);
  const [stagingItems, setStagingItems] = useState<StagingItem[]>([]);

  function handleTryonComplete(result: TryonResult) {
    if (result.result_image_url) {
      setStagingItems((prev) => [
        ...prev,
        { id: result.task_id, resultImageUrl: result.result_image_url! },
      ]);
    }
  }

  return (
    <>
      <Navbar />
      <FilterTabs />
      <main className="flex-1 grid grid-cols-[280px_1fr_300px] overflow-hidden min-h-0">
        <BodyPanel bodyState={bodyState} onChange={setBodyState} />
        <PhotoUpload personImage={personImage} onImageChange={setPersonImage} />
        <ClothesPanel
          selectedGarmentId={selectedGarmentId}
          onSelectGarment={setSelectedGarmentId}
          hasPersonImage={!!personImage}
          onTryOn={() => setShowTryonModal(true)}
        />
      </main>

      {/* 已試穿的暫存區 */}
      <div className="h-[100px] border-t border-[var(--forma-border)] bg-warm-white flex items-center px-6 gap-4 shrink-0">
        <span className="text-[0.65rem] tracking-[0.12em] uppercase text-taupe whitespace-nowrap">
          已試穿
        </span>
        <div className="flex gap-3 overflow-x-auto flex-1">
          {stagingItems.length === 0 ? (
            <p className="text-[0.72rem] text-taupe opacity-60">試穿後會顯示在這裡</p>
          ) : (
            stagingItems.map((item) => (
              <img
                key={item.id}
                src={item.resultImageUrl}
                alt="試穿結果"
                className="h-[72px] aspect-[3/4] object-cover border border-[var(--forma-border)] shrink-0"
              />
            ))
          )}
        </div>
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
