export type Alert = {
  id: string;
  severity: string;
  status: string;
  payload: { title?: string; evidence?: { test?: { value?: number; unit?: string }; active_prescriptions?: unknown[] }; options?: string[] };
};

export type ApiStatus = "live" | "fallback";

const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export async function getAlerts(): Promise<Alert[]> {
  if (!apiUrl) return [];
  const response = await fetch(`${apiUrl}/v1/doctors/me/alerts`);
  if (!response.ok) throw new Error("Unable to load the care-loop inbox.");
  return response.json();
}

export async function getApiStatus(): Promise<ApiStatus> {
  if (!apiUrl) return "fallback";
  const response = await fetch(`${apiUrl}/health`);
  return response.ok ? "live" : "fallback";
}

export async function selectAlertAction(alertId: string, action: string) {
  if (!apiUrl) return { status: "local-demo" };
  const response = await fetch(`${apiUrl}/v1/alerts/${alertId}/actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, doctor_id: "demo-doctor" }),
  });
  if (!response.ok) throw new Error("The mock backend could not save this decision.");
  return response.json();
}
