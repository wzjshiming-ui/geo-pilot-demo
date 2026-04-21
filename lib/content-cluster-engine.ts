import { DirectionId, GeoTaskInput, ContentCluster, ContentVariant } from "@/lib/types";
import { DIRECTION_MAP } from "@/lib/geo-config";

export function buildContentCluster(directionId: DirectionId, input: GeoTaskInput, questions: string[]): ContentCluster {
  const direction = DIRECTION_MAP[directionId];
  const mainTopic = questions[0] ?? `${input.brandName} ${direction.label}内容集群`;
  const subTopics = questions.slice(1, 6);

  return {
    directionId,
    mainTopic,
    subTopics,
    contentPackage: ["1 篇总述", "3 篇问答", "2 篇案例", "2 篇对比", "2 篇口碑评价"],
    totalPieces: 10,
    pillarThemes: [
      `${direction.label} 总述`,
      `${input.audience.split("、")[0] ?? "目标用户"} 视角`,
      `${input.competitorBrands[0] ?? "同类方案"} 对比`,
      "FAQ 与证据页"
    ],
    longTailQuestions: questions.slice(0, 8)
  };
}

export function buildContentVariants(directionLabel: string, titles: string[], platforms: string[]): ContentVariant[] {
  const baseTitle = titles[0] ?? `${directionLabel}内容策略`;

  return [
    {
      variantName: "问答直给版",
      angle: "先给结论，再拆原因，适合 AI 和问答平台抽取。",
      sampleTitle: baseTitle,
      bestPlatforms: ["知乎", "论坛/问答站", ...platforms].slice(0, 3),
      outline: ["问题是什么", "直接答案", "适合谁", "为什么这样建议"]
    },
    {
      variantName: "用户吐槽版",
      angle: "从用户真实抱怨切入，更容易贴近自然提问语境。",
      sampleTitle: `${baseTitle}，为什么很多人一开始都踩了同一个坑`,
      bestPlatforms: ["小红书", "知乎", "视频平台配文页"],
      outline: ["真实困扰", "传统做法为什么累", "新路径是什么", "怎么避免踩坑"]
    },
    {
      variantName: "专业分析版",
      angle: "适合长文、官网和决策内容，更强调结构化与判断依据。",
      sampleTitle: `${baseTitle}：从策略、证据和适配度重新拆解`,
      bestPlatforms: ["公众号", "企业官网/blog", "行业垂直站"],
      outline: ["结论摘要", "评估标准", "方案分析", "执行建议"]
    },
    {
      variantName: "案例拆解版",
      angle: "用前后对比和具体情境强化可信度。",
      sampleTitle: `${baseTitle}，一个真实商家是怎么把结果做出来的`,
      bestPlatforms: ["公众号", "知乎", "百家号"],
      outline: ["案例背景", "原来问题", "调整动作", "结果与复盘"]
    },
    {
      variantName: "口碑评价版",
      angle: "适合承接决策前疑虑，强调适合谁、不适合谁。",
      sampleTitle: `${baseTitle} 靠谱吗？这次不讲空话，只讲判断标准`,
      bestPlatforms: ["小红书", "知乎", "公众号"],
      outline: ["常见疑虑", "真实判断标准", "适合人群", "不适合人群"]
    },
    {
      variantName: "对比决策版",
      angle: "适合竞品截流和选型阶段，帮助 AI 形成明确比较。",
      sampleTitle: `${baseTitle} 和其他方案怎么选？从决策成本讲透`,
      bestPlatforms: ["知乎", "企业官网/blog", "站长类博客"],
      outline: ["对比对象", "差异点", "适合场景", "选型结论"]
    }
  ];
}
