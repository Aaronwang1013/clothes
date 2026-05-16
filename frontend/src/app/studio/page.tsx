"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import BrandsSidebar from "@/components/BrandsSidebar";
import TryonCenter from "@/components/TryonCenter";
import OutfitRecords from "@/components/OutfitRecords";
import TryonModal from "@/components/TryonModal";
import { TryonResult } from "@/lib/api";

export default function StudioPage() {
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | null>(null);
  const [showTryonModal, setShowTryonModal] = useState(false);

  function handleTryonComplete(result: TryonResult) {
    console.log("Tryon complete:", result.task_id);
  }

  function handleReset() {
    setSelectedGarmentId(null);
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 grid grid-cols-[260px_1fr_280px] overflow-hidden min-h-0">
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
