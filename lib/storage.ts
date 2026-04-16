"use client";

import { GeoGenerationResult } from "@/lib/types";

const STORAGE_KEY = "geo-demo-result";

export function saveResult(result: GeoGenerationResult) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}

export function loadResult(): GeoGenerationResult | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as GeoGenerationResult;
  } catch {
    return null;
  }
}
