"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import BrandsSidebar from "@/components/BrandsSidebar";
import TryonCenter from "@/components/TryonCenter";
import OutfitRecords from "@/components/OutfitRecords";
import TryonModal from "@/components/TryonModal";
import { getMe, TryonResult } from "@/lib/api";

export default function StudioPage() {
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | null>(null);
  const [showTryonModal, setShowTryonModal] = useState(false);
  const [outfitRefreshTrigger, setOutfitRefreshTrigger] = useState(0);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

  async function refreshCredits() {
    try {
      const user = await getMe();
      setCreditsRemaining(user.credits_remaining);
    } catch {
      setCreditsRemaining(null);
    }
  }

  useEffect(() => {
    refreshCredits();
  }, []);

  function handleTryonComplete(result: TryonResult) {
    console.log("Tryon complete:", result.task_id);
    setOutfitRefreshTrigger((n) => n + 1);
  }

  function handleModalClose() {
    setShowTryonModal(false);
    refreshCredits();
  }

  function handleReset() {
    setSelectedGarmentId(null);
  }

  return (
    <>
      <Navbar variant="app" />

      <main className="flex-1 grid grid-cols-[260px_1fr_280px] overflow-hidden min-h-0">
        <BrandsSidebar />
        <TryonCenter
          personImage={personImage}
          onImageChange={setPersonImage}
          selectedGarmentId={selectedGarmentId}
          onSelectGarment={setSelectedGarmentId}
          onTryOn={() => setShowTryonModal(true)}
          onReset={handleReset}
          creditsRemaining={creditsRemaining}
        />
        <OutfitRecords refreshTrigger={outfitRefreshTrigger} />
      </main>

      {showTryonModal && selectedGarmentId && personImage && (
        <TryonModal
          personImage={personImage}
          garmentId={selectedGarmentId}
          onClose={handleModalClose}
          onComplete={handleTryonComplete}
        />
      )}
    </>
  );
}
