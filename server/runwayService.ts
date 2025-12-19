const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;
const RUNWAY_API_BASE = "https://api.dev.runwayml.com/v1";

interface RunwayTaskResponse {
  id: string;
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
  output?: string[];
  failure?: string;
}

export async function createVideoGeneration(
  imageUrl: string,
  prompt: string,
  duration: number = 5
): Promise<{ taskId: string; error?: string }> {
  if (!RUNWAY_API_KEY) {
    return { taskId: "", error: "Runway API key not configured" };
  }

  try {
    const response = await fetch(`${RUNWAY_API_BASE}/image_to_video`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RUNWAY_API_KEY}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06",
      },
      body: JSON.stringify({
        model: "gen3a_turbo",
        promptImage: imageUrl,
        promptText: prompt,
        duration: duration,
        ratio: "16:9",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Runway API error:", error);
      return { taskId: "", error: `Runway API error: ${response.status}` };
    }

    const data = await response.json();
    return { taskId: data.id };
  } catch (error) {
    console.error("Runway API request failed:", error);
    return { taskId: "", error: "Failed to start video generation" };
  }
}

export async function getVideoGenerationStatus(
  taskId: string
): Promise<RunwayTaskResponse | null> {
  if (!RUNWAY_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(`${RUNWAY_API_BASE}/tasks/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${RUNWAY_API_KEY}`,
        "X-Runway-Version": "2024-11-06",
      },
    });

    if (!response.ok) {
      console.error("Runway status check failed:", response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Runway status check error:", error);
    return null;
  }
}

export function isRunwayConfigured(): boolean {
  return !!RUNWAY_API_KEY;
}
