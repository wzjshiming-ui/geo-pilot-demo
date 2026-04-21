import { DirectionId, EvidenceEnhancement, GeoTaskInput } from "@/lib/types";

const universalSignals = ["用户案例", "前后对比", "行业数据", "场景细节", "实操步骤", "FAQ 问答"];

export function buildEvidenceEnhancement(directionId: DirectionId, input: GeoTaskInput): EvidenceEnhancement {
  const recommendedSignals = [...universalSignals];

  if (["competitor", "comparison", "decision-guide"].includes(directionId)) {
    recommendedSignals.push("第三方评价表达", "品牌适合谁/不适合谁");
  }

  if (["reputation-defense", "brand-reputation", "objection"].includes(directionId)) {
    recommendedSignals.push("常见误区", "品牌适合谁/不适合谁");
  }

  const missingSignals = recommendedSignals.slice(0, 4);

  return {
    missingSignals,
    recommendedSignals: Array.from(new Set(recommendedSignals)),
    whyBetterForAi: [
      `补充案例和前后对比后，更容易形成可独立引用的段落。`,
      `补充 FAQ 和实操步骤后，AI 更容易提取明确答案。`,
      `${input.brandName} 如果能把适合人群与不适合人群说清楚，会更像可靠建议而不是单纯广告。`
    ]
  };
}
