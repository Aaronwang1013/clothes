"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import BodyPanel, { BodyState } from "@/components/BodyPanel";
import ClothesPanel from "@/components/ClothesPanel";
import TryonModal from "@/components/TryonModal";

// Dynamically import AvatarCanvas to avoid SSR issues with Three.js
const AvatarCanvas = dynamic(() => import("@/components/AvatarCanvas"), {
  ssr: false,
});

const DEFAULT_BODY: BodyState = {
  gender: "male",
  height: 170,
  weight: 65,
  shoulder: 42,
  chest: 90,
  waist: 75,
  hip: 95,
  skinColor: "#FDDBB4",
  hairColor: "#1C1008",
};

export default function Home() {
  const [bodyState, setBodyState] = useState<BodyState>(DEFAULT_BODY);
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | null>(null);
  const [clothColor, setClothColor] = useState("#2C3E50");
  const [showTryonModal, setShowTryonModal] = useState(false);

  return (
    <>
      <Navbar />
      <main className="flex-1 grid grid-cols-[280px_1fr_300px] overflow-hidden">
        <BodyPanel bodyState={bodyState} onChange={setBodyState} />
        <AvatarCanvas bodyState={bodyState} clothColor={clothColor} />
        <ClothesPanel
          selectedGarmentId={selectedGarmentId}
          onSelectGarment={setSelectedGarmentId}
          clothColor={clothColor}
          onClothColorChange={setClothColor}
          onTryOn={() => setShowTryonModal(true)}
        />
      </main>

      {showTryonModal && selectedGarmentId && (
        <TryonModal
          garmentId={selectedGarmentId}
          onClose={() => setShowTryonModal(false)}
        />
      )}
    </>
  );
}
