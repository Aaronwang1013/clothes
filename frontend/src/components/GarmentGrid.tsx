 "use client";

  import { useEffect, useState } from "react";
  import { Card } from "@/components/ui/card";
  import { fetchGarments, Garment } from "@/lib/api";

  interface GarmentGridProps {
    onSelect: (garmentId: string) => void;
  }

  export default function GarmentGrid({ onSelect }: GarmentGridProps) {
    const [garments, setGarments] = useState<Garment[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      fetchGarments()
        .then(setGarments)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, []);

    if (loading) {
      return <p className="text-center text-gray-500">Loading garments...</p>;
    }

    if (error) {
      return <p className="text-center text-red-500">Failed to load garments: {error}</p>;
    }

    function handleSelect(id: string) {
      setSelectedId(id);
      onSelect(id);
    }

    return (
      <div>
        <p className="text-center text-gray-600 mb-4">Select a garment to try on</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {garments.map((g) => (
            <Card
              key={g.id}
              className={`cursor-pointer overflow-hidden transition-all ${
                selectedId === g.id
                  ? "ring-2 ring-blue-500 border-blue-500"
                  : "hover:border-gray-400"
              }`}
              onClick={() => handleSelect(g.id)}
            >
              <img
                src={g.image_url}
                alt={g.name}
                className="w-full aspect-square object-cover"
              />
              <p className="text-sm text-center p-2 truncate">{g.name}</p>
            </Card>
          ))}
        </div>
      </div>
    );
  }