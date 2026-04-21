import { ExecutionPlan, ExecutionStep, GeoDirectionResult, GeoTaskInput } from "@/lib/types";

function step(label: string, focus: string, directions: GeoDirectionResult[], platforms: string[]): ExecutionStep {
  const picked = directions.slice(0, 3);
  return {
    label,
    focus,
    articleCount: picked.reduce((sum, item) => sum + Math.max(2, Math.ceil(item.distributedRecommendation.articleCount / 3)), 0),
    platforms,
    accountTypes: Array.from(new Set(picked.flatMap((item) => item.accountTypes))).slice(0, 4),
    directions: picked.map((item) => item.name),
    contentMix: Array.from(new Set(picked.flatMap((item) => item.distributedRecommendation.contentMix))).slice(0, 5)
  };
}

export function buildExecutionPlan(input: GeoTaskInput, directions: GeoDirectionResult[]): ExecutionPlan {
  const sAndA = directions.filter((item) => ["S", "A"].includes(item.priorityDecision.tier));
  const sorted = sAndA.length ? sAndA : directions;
  const channels = input.aiPlatforms.includes("豆包") ? ["知乎", "百家号", "公众号"] : ["知乎", "公众号", "小红书"];

  return {
    shortTerm: [
      step("7 天计划 Day 1-3", "优先铺痛点词、场景词、解决方案词，先占住真实提问入口。", sorted, channels),
      step("7 天计划 Day 4-7", "补 FAQ、案例与基础官网承接页，让内容从单篇升级为成组资产。", sorted.slice(1), ["企业官网/blog", "知乎", "公众号"])
    ],
    monthPlan: [
      step("第 1 周", "优先铺痛点词和解决方案词，先拿到真实问答入口。", sorted, channels),
      step("第 2 周", "补案例型内容与行业版本，增强证据感和引用概率。", directions.filter((item) => ["case-proof", "industry", "scenario"].includes(item.id)), [
        "公众号",
        "知乎",
        "企业官网/blog"
      ]),
      step("第 3 周", "补竞品对比词、选型决策词和口碑词，承接比较流量。", directions.filter((item) => ["competitor", "comparison", "brand-reputation", "decision-guide"].includes(item.id)), [
        "知乎",
        "站长类博客",
        "公众号"
      ]),
      step("第 4 周", "补品牌口碑、防御词、FAQ 页面与多账号矩阵。", directions.filter((item) => ["brand", "brand-reputation", "reputation-defense", "objection"].includes(item.id)), [
        "企业官网/blog",
        "知乎",
        "小红书"
      ])
    ]
  };
}
