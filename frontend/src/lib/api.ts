const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Garment {
    id: string;
    name: string;
    category: string;
    image_url: string;
}

export interface TryonResult {
    task_id: string;
    status: "pending" | "processing" | "completed" | "failed";
    result_image_url?: string;
    person_image_url?: string;
    error?: string;
    created_at: string;
  }

  export async function fetchGarments(): Promise<Garment[]> {
    const res = await fetch(`${API_URL}/api/garments`);
    if (!res.ok) throw new Error("Failed to fetch garments");
    return res.json();
  }

  export async function createTryon(
    personImage: File,
    garmentId: string
  ): Promise<{ task_id: string; status: string }> {
    const formData = new FormData();
    formData.append("person_image", personImage);
    formData.append("garment_id", garmentId);

    const res = await fetch(`${API_URL}/api/tryon`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to create tryon task");
    return res.json();
  }

  export async function getTryonStatus(taskId: string): Promise<TryonResult> {
    const res = await fetch(`${API_URL}/api/tryon/${taskId}`);
    if (!res.ok) throw new Error("Failed to get tryon status");
    return res.json();
  }