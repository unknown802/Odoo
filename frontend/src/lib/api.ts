import { useAssetFlowStore } from "../store/assetFlowStore";
import { mockApiRouter } from "./mock-api/router";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// Add a simulated network delay to make the prototype feel real
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  // Route directly to backend API
  const backendUrl = "http://localhost:4000";
  const url = endpoint.startsWith("http") ? endpoint : `${backendUrl}${endpoint}`;
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    let errorMessage = "API Error";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      errorMessage = response.statusText;
    }
    throw new ApiError(response.status, errorMessage);
  }

  const json = await response.json();
  return json as T;
}
