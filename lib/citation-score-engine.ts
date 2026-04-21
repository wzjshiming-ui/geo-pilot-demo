import { CitationScore, GeoTaskInput } from "@/lib/types";

interface ScoreInput {
  title: string;
  directionName: string;
  questionTemplates: string[];
  contentStructures: string[];
  evidenceSignals: string[];
  platforms: string[];
  input: GeoTaskInput;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreCitationFriendliness(params: ScoreInput): CitationScore {
  const title = params.title;
  const hasQuestion = /[？?怎么|如何|是不是|适合|推荐]/.test(title) || title.includes("吗");
  const hasAnswerSignal = params.contentStructures.some((item) => item.includes("核心结论先说") || item.includes("推荐做法"));
  const structureRich = params.contentStructures.length >= 3;
  const evidenceRich = params.evidenceSignals.length >= 4;
  const multiPlatformFit = params.platforms.length >= 3;
  const sceneMatch =
    title.includes(params.input.brandName) ||
    title.includes(params.input.productName) ||
    params.questionTemplates.some((item) => item.includes(params.input.brandName));

  const readability = clamp(62 + (title.length <= 30 ? 10 : 4) + (hasAnswerSignal ? 12 : 0) + (structureRich ? 8 : 0));
  const qaMatch = clamp(58 + (hasQuestion ? 16 : 5) + (sceneMatch ? 12 : 0) + Math.min(12, params.questionTemplates.length));
  const evidence = clamp(45 + (evidenceRich ? 24 : 8) + (params.evidenceSignals.some((item) => item.includes("案例")) ? 12 : 0));
  const multiPlatform = clamp(52 + (multiPlatformFit ? 18 : 6) + (params.platforms.includes("知乎") ? 10 : 0) + (params.platforms.includes("公众号") ? 8 : 0));
  const total = clamp(readability * 0.25 + qaMatch * 0.3 + evidence * 0.25 + multiPlatform * 0.2);

  const suggestions: string[] = [];
  if (!hasQuestion) suggestions.push("标题建议更接近真实提问语气，提升问答匹配度。");
  if (!hasAnswerSignal) suggestions.push("正文结构应更直给结论，避免绕弯表达。");
  if (!evidenceRich) suggestions.push("缺少案例、FAQ 或前后对比，证据感偏弱。");
  if (params.platforms.includes("小红书") && title.length > 26) suggestions.push("这条更适合知乎/公众号，不够适合小红书短标题环境。");
  if (multiPlatformFit && total > 78) suggestions.push("适合做系列化铺设，而不是只发单篇内容。");

  return {
    total,
    readability,
    qaMatch,
    evidence,
    multiPlatform,
    suggestions
  };
}
