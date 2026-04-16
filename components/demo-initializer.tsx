"use client";

import { useEffect } from "react";
import { generateGeoResult } from "@/lib/rule-engine";
import { loadResult, saveResult } from "@/lib/storage";
import { defaultCase } from "@/mock/default-case";

export function DemoInitializer() {
  useEffect(() => {
    const existing = loadResult();
    if (!existing) {
      saveResult(generateGeoResult(defaultCase));
    }
  }, []);

  return null;
}
