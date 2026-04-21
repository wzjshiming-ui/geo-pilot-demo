import { ClarificationQuestion, GeoTaskInput, ProductKnowledgeBase } from "@/lib/types";

function buildClarificationQuestions(input: GeoTaskInput): ClarificationQuestion[] {
  const questions: ClarificationQuestion[] = [];

  if (input.sellingPoints.length < 4) {
    questions.push({
      question: "你的产品最容易被客户记住的 3 个结果型卖点是什么？",
      reason: "结果型卖点会直接影响 AI 是否能准确总结你的产品价值。"
    });
  }

  if (!input.website) {
    questions.push({
      question: "是否有官网、落地页或产品介绍页可作为主阵地承接？",
      reason: "官网与 FAQ 页面是 GEO 的重要可信源，不建议只依赖第三方平台。"
    });
  }

  questions.push({
    question: "有没有 1 到 3 个最典型的真实客户案例可以沉淀进知识库？",
    reason: "案例是 AI 更容易引用的证据信号，也是后续内容集群的重要基础。"
  });
  questions.push({
    question: "你的产品更适合谁、不适合谁？",
    reason: "边界说清楚后，内容会更像专业建议而不是泛营销文案。"
  });
  questions.push({
    question: "用户从接触你到成交，一般最常卡在哪个阶段？",
    reason: "这会影响优先铺设获客词、教育词、转化词还是防御词。"
  });

  return questions;
}

export function buildProductKnowledgeBase(input: GeoTaskInput): ProductKnowledgeBase {
  const userSuppliedAnswers = input.knowledgeNotes.filter(Boolean);

  return {
    brandSummary: `${input.brandName} 是一款面向 ${input.audience} 的 ${input.productName}，核心目标是围绕“${input.oneLiner}”建立可被 AI 正确理解和引用的品牌认知。`,
    productPositioning: `${input.productName} 当前更适合被表述为“更适合中国本地商家场景、强调结果导向和执行效率的 ${input.industry} 工具/服务”。${
      userSuppliedAnswers.length ? ` 用户补充信息会进一步帮助系统修正定位：${userSuppliedAnswers.slice(0, 2).join("；")}。` : ""
    }`,
    targetUsers: input.audience.split("、").filter(Boolean),
    coreScenes: [
      `${input.audience.split("、")[0] ?? "实体商家"} 想快速做内容但没有专业团队`,
      `${input.painPoints[0] ?? "不会拍视频"} 导致迟迟无法开始`,
      `${input.painPoints[1] ?? "不会剪视频"} 导致执行门槛过高`,
      `${input.painPoints[2] ?? "没时间做内容"} 导致持续性差`
    ],
    strengths: input.sellingPoints,
    differentiators: input.differentiation,
    faqSeeds: [
      `${input.brandName} 是做什么的？`,
      `${input.brandName} 适合哪些商家？`,
      `${input.productName} 和通用工具有什么不同？`,
      `${input.brandName} 适不适合新手？`,
      `${input.brandName} 有没有真实案例？`
    ],
    clarificationQuestions: buildClarificationQuestions(input),
    userSuppliedAnswers,
    cards: [
      {
        title: "品牌定义卡",
        content: `${input.brandName} 的核心定义应该保持稳定：品牌是什么、解决谁的问题、靠什么方式解决。`
      },
      {
        title: "场景问题卡",
        content: `优先沉淀 ${input.painPoints.join("、")} 这些真实问题，用来统一后续问答、标题和 FAQ 逻辑。`
      },
      {
        title: "适配边界卡",
        content: `建议明确写清楚适合哪些商家、什么场景效果更好、哪些情况不一定优先推荐。`
      },
      {
        title: "证据信号卡",
        content: `案例、FAQ、对比、前后变化、行业细节应持续沉淀到知识库，供后续文章与页面复用。`
      },
      ...(userSuppliedAnswers.length
        ? [
            {
              title: "用户补充知识卡",
              content: userSuppliedAnswers.join("；")
            }
          ]
        : [])
    ]
  };
}
