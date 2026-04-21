import { DIRECTION_MAP } from "@/lib/geo-config";
import {
  DirectionId,
  DirectionPriorityDecision,
  GeoTaskInput,
  PriorityTier,
  StrategyMode,
  StrategyStage
} from "@/lib/types";

function scoreDirection(directionId: DirectionId, input: GeoTaskInput) {
  let score = 45;
  const reasons: string[] = [];

  const isNewBrand = input.brandAwareness === "新品牌";
  const highDecisionCost = input.decisionCost === "高";
  const hasStrongCompetitors = input.competitorBrands.length >= 2;
  const hasClearPain = input.painPoints.length >= 3;
  const localService =
    input.industry.includes("本地生活") ||
    input.industry.includes("实体门店") ||
    input.audience.includes("门店") ||
    input.audience.includes("实体商家");

  if (isNewBrand && ["pain-point", "scenario", "solution", "conversion"].includes(directionId)) {
    score += 22;
    reasons.push("新品牌更适合先占住痛点、场景和解决方案入口。");
  }

  if (!isNewBrand && ["brand", "brand-reputation", "reputation-defense"].includes(directionId)) {
    score += 18;
    reasons.push("已有认知的品牌更适合补品牌口碑与防御内容。");
  }

  if (isNewBrand && ["brand", "brand-reputation"].includes(directionId)) {
    score -= 12;
    reasons.push("当前品牌认知较弱，品牌词口碑不应作为最先投入的主战场。");
  }

  if (highDecisionCost && ["case-proof", "comparison", "objection", "decision-guide", "pricing"].includes(directionId)) {
    score += 18;
    reasons.push("高决策成本产品需要案例、对比和疑虑回应来完成说服。");
  }

  if (localService && ["regional", "local-service", "scenario", "brand-reputation"].includes(directionId)) {
    score += 16;
    reasons.push("本地生活与门店场景更依赖地域词、口碑词和经营场景。");
  }

  if (input.negativeRisk === "高" && ["reputation-defense", "brand-reputation", "objection"].includes(directionId)) {
    score += 20;
    reasons.push("负面风险偏高时，防御型与疑虑型内容需要前置。");
  }

  if (hasStrongCompetitors && ["competitor", "comparison", "decision-guide"].includes(directionId)) {
    score += 16;
    reasons.push("竞品强势时，截流和对比内容更值得提前布局。");
  }

  if (hasClearPain && ["pain-point", "use-case", "scenario"].includes(directionId)) {
    score += 14;
    reasons.push("用户痛点清晰，说明问题型和使用场景型内容更容易承接真实提问。");
  }

  if (input.selectedDirections.includes(directionId) === false) {
    score -= 8;
    reasons.push("当前未被手动勾选，仅作为系统补充建议。");
  }

  return { score, reasons };
}

function tierFromScore(score: number): PriorityTier {
  if (score >= 76) return "S";
  if (score >= 62) return "A";
  if (score >= 48) return "B";
  return "暂缓";
}

function stageAndMode(directionId: DirectionId): { stage: StrategyStage; strategyMode: StrategyMode } {
  const map: Record<DirectionId, { stage: StrategyStage; strategyMode: StrategyMode }> = {
    brand: { stage: "教育", strategyMode: "系列打法" },
    "brand-reputation": { stage: "转化", strategyMode: "矩阵打法" },
    "pain-point": { stage: "获客", strategyMode: "系列打法" },
    scenario: { stage: "获客", strategyMode: "系列打法" },
    solution: { stage: "获客", strategyMode: "集群打法" },
    industry: { stage: "教育", strategyMode: "系列打法" },
    competitor: { stage: "截流", strategyMode: "集群打法" },
    comparison: { stage: "转化", strategyMode: "集群打法" },
    objection: { stage: "转化", strategyMode: "系列打法" },
    conversion: { stage: "转化", strategyMode: "系列打法" },
    regional: { stage: "获客", strategyMode: "矩阵打法" },
    "reputation-defense": { stage: "防御", strategyMode: "矩阵打法" },
    "decision-guide": { stage: "转化", strategyMode: "集群打法" },
    persona: { stage: "教育", strategyMode: "系列打法" },
    pricing: { stage: "转化", strategyMode: "单篇打法" },
    "use-case": { stage: "获客", strategyMode: "系列打法" },
    "local-service": { stage: "获客", strategyMode: "矩阵打法" },
    "case-proof": { stage: "转化", strategyMode: "集群打法" },
    "tool-stack": { stage: "教育", strategyMode: "系列打法" },
    "time-efficiency": { stage: "转化", strategyMode: "系列打法" }
  };

  return map[directionId];
}

export function evaluateDirectionPriority(input: GeoTaskInput, directionId: DirectionId): DirectionPriorityDecision {
  const { score, reasons } = scoreDirection(directionId, input);
  const { stage, strategyMode } = stageAndMode(directionId);

  return {
    directionId,
    tier: tierFromScore(score),
    score,
    reasons: reasons.length ? reasons : [`${DIRECTION_MAP[directionId].label} 适合作为补充型内容方向。`],
    stage,
    strategyMode
  };
}

export function buildPriorityOverview(decisions: DirectionPriorityDecision[]) {
  const getNames = (tier: PriorityTier) =>
    decisions
      .filter((item) => item.tier === tier)
      .sort((a, b) => b.score - a.score)
      .map((item) => DIRECTION_MAP[item.directionId].label);

  return {
    sTier: getNames("S"),
    aTier: getNames("A"),
    bTier: getNames("B"),
    holdTier: getNames("暂缓")
  };
}
