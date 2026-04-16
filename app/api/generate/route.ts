import { NextRequest, NextResponse } from "next/server";
import { generateGeoResult } from "@/lib/rule-engine";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = generateGeoResult(body);
  return NextResponse.json(result);
}
