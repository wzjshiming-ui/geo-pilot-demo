import { NextRequest, NextResponse } from "next/server";
import { generateArticleDraft } from "@/lib/rule-engine";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const article = generateArticleDraft(body.taskInput, body.directionId, body.articleType);
  return NextResponse.json(article);
}
