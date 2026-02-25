"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import BodyPanel, { BodyState } from "@/components/BodyPanel";
import ClothesPanel from "@/components/ClothesPanel";
import PhotoUpload from "@/components/PhotoUpload";
import TryonModal from "@/components/TryonModal";

const DEFAULT_BODY: BodyState = {
  gender: "male",
  height: 170,
  weight: 65,
  shoulder: 42,
  chest: 90,
  waist: 75,
  hip: 95,
};

export default function Home() {
  const [bodyState, setBodyState] = useState<BodyState>(DEFAULT_BODY);
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | null>(null);
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [showTryonModal, setShowTryonModal] = useState(false);

  return (
    <>
      <Navbar />
      <main className="flex-1 grid grid-cols-[280px_1fr_300px] overflow-hidden">
        <BodyPanel bodyState={bodyState} onChange={setBodyState} />
        <PhotoUpload personImage={personImage} onImageChange={setPersonImage} />
        <ClothesPanel
          selectedGarmentId={selectedGarmentId}
          onSelectGarment={setSelectedGarmentId}
          hasPersonImage={!!personImage}
          onTryOn={() => setShowTryonModal(true)}
        />
      </main>

      {showTryonModal && selectedGarmentId && personImage && (
        <TryonModal
          personImage={personImage}
          garmentId={selectedGarmentId}
          onClose={() => setShowTryonModal(false)}
        />
      )}
    </>
  );
}
