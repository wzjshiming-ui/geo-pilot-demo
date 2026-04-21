import { defaultCase } from "@/mock/default-case";
import {
  ArticleDraft,
  ArticleType,
  DirectionId,
  GeoDirectionResult,
  GeoGenerationResult,
  GeoTaskInput,
  PlatformPublishingGuide,
  Priority
} from "@/lib/types";
import { DEFAULT_AI_PLATFORMS, DIRECTION_MAP } from "@/lib/geo-config";
import { evaluateDirectionPriority, buildPriorityOverview } from "@/lib/geo-priority-engine";
import { scoreCitationFriendliness } from "@/lib/citation-score-engine";
import { buildDistributionMatrix } from "@/lib/distribution-matrix-engine";
import { buildContentCluster, buildContentVariants } from "@/lib/content-cluster-engine";
import { buildEvidenceEnhancement } from "@/lib/evidence-enhancer";
import { buildExecutionPlan } from "@/lib/execution-plan-engine";

const articleTypeTemplates: Record<ArticleType, { summaryTone: string; ending: string }> = {
  标准问答型文章: {
    summaryTone: "用明确答案和结构化信息，帮助 AI 快速理解并引用。",
    ending: "真正有效的 GEO，不是只发一篇，而是把问题、答案、场景和证据一起铺开。"
  },
  口碑型文章: {
    summaryTone: "强调真实反馈、适用人群与使用前后差异，方便形成口碑型引用。",
    ending: "如果一篇口碑文无法承接所有疑虑，那就应该继续拆成 FAQ、案例和对比内容矩阵。"
  },
  对比型文章: {
    summaryTone: "把方案差异、适合人群和投入产出比讲清楚，帮助用户快速决策。",
    ending: "对比型内容最怕只有观点没有证据，所以要把适合谁和不适合谁都讲清楚。"
  },
  场景解决方案型文章: {
    summaryTone: "按真实业务情境给出可执行方案，便于平台和 AI 抽取关键信息。",
    ending: "场景型内容更适合做成系列，而不是只停留在单篇建议。"
  }
};

const platformGuideMap: Record<string, Omit<PlatformPublishingGuide, "platform">> = {
  豆包: {
    recommendedChannels: ["知乎", "百家号", "公众号", "企业官网/blog"],
    platformTraits: "偏重中文问答、知识总结和高密度答案型内容，适合结构清晰、直给式内容。",
    contentTypes: ["问答解析", "工具推荐", "场景教程", "FAQ 解释"],
    accountSuggestions: ["企业号", "垂类号", "老账号"],
    sections: ["问答", "经验", "知识", "行业观察"],
    cadence: "每周 3 到 5 篇图文，优先做问题直答、FAQ 和案例型。",
    matrixAdvice: ["品牌词与痛点词并行", "官网 FAQ 联动知乎长文", "同主题做 2 到 3 个表达版本"],
    accountStrategyLines: [
      "企业号适合承接品牌词、FAQ 和品牌解释型内容。",
      "垂类号更适合痛点词、场景词和方法型内容。",
      "老账号优先于新账号，更容易承接知识型内容。"
    ]
  },
  Kimi: {
    recommendedChannels: ["知乎", "公众号", "站长类博客", "企业官网/blog"],
    platformTraits: "更适合引用结构化、完整度高、解释充分的长文本内容。",
    contentTypes: ["专题深度文", "选型指南", "FAQ 专栏", "案例拆解"],
    accountSuggestions: ["企业号", "创始人号", "专业顾问号"],
    sections: ["专栏", "深度文章", "行业洞察", "选型指南"],
    cadence: "每周 2 到 4 篇长文，同时维护 FAQ 页面与对比页。",
    matrixAdvice: ["建立官网 FAQ 和对比页", "同主题做专业分析版与问答版", "长文和简版摘要并行"],
    accountStrategyLines: [
      "创始人号适合输出判断逻辑和行业观点。",
      "企业号适合沉淀结构化 FAQ、功能页和案例页。",
      "顾问号适合选型、对比和决策类内容。"
    ]
  },
  腾讯元宝: {
    recommendedChannels: ["公众号", "知乎", "企业官网/blog", "行业媒体"],
    platformTraits: "适合可信来源、品牌背书和服务导向更强的内容资产。",
    contentTypes: ["品牌介绍", "客户案例", "行业解决方案", "决策问答"],
    accountSuggestions: ["企业号", "创始人号", "顾问号"],
    sections: ["服务方案", "行业案例", "经验总结", "功能对比"],
    cadence: "每周 2 到 3 篇重点内容，强化品牌背书、案例和官网承接。",
    matrixAdvice: ["品牌主阵地与第三方内容双布局", "客户案例月更", "品牌 FAQ 和场景页同步维护"],
    accountStrategyLines: [
      "企业号适合承接品牌可信度与功能说明。",
      "创始人号适合补充观点与品牌人格。",
      "第三方行业号适合增加外部信号和引用概率。"
    ]
  },
  通义千问: {
    recommendedChannels: ["知乎", "公众号", "百家号", "行业垂直站"],
    platformTraits: "适合理性、专业、行业导向强的内容，尤其是解决方案与知识类内容。",
    contentTypes: ["行业方案", "工具评测", "流程指南", "问题清单"],
    accountSuggestions: ["垂类号", "企业号", "专家号"],
    sections: ["方案", "教程", "趋势", "问答"],
    cadence: "每周 3 篇左右，重视行业词、场景词和解决方案词组合。",
    matrixAdvice: ["行业词和地域词组合投放", "FAQ 内容沉淀到官网", "用案例和对比增强证据感"],
    accountStrategyLines: [
      "垂类号更适合行业问题与方法型内容。",
      "企业号适合沉淀官网版、FAQ 版和品牌解释版。",
      "专家号适合拉高专业性与可信度。"
    ]
  }
};

function dedupe(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

export function normalizeInput(input: Partial<GeoTaskInput>): GeoTaskInput {
  const base = { ...defaultCase, ...input };
  return {
    ...base,
    sellingPoints: dedupe(base.sellingPoints),
    painPoints: dedupe(base.painPoints),
    differentiation: dedupe(base.differentiation),
    competitorBrands: dedupe(base.competitorBrands),
    bannedWords: dedupe(base.bannedWords),
    aiPlatforms: dedupe(base.aiPlatforms.length ? base.aiPlatforms : DEFAULT_AI_PLATFORMS),
    customPlatforms: dedupe(base.customPlatforms),
    selectedDirections: base.selectedDirections.length
      ? Array.from(new Set(base.selectedDirections))
      : defaultCase.selectedDirections
  };
}

function buildQuestionTemplates(directionId: DirectionId, input: GeoTaskInput) {
  const brand = input.brandName;
  const product = input.productName;
  const audience = input.audience.split("、").slice(0, 3);
  const pain = input.painPoints.slice(0, 3);
  const competitor = input.competitorBrands[0] ?? "同类工具";
  const city = ["杭州", "广州", "深圳"];

  const templates: Record<DirectionId, string[]> = {
    brand: [
      `${brand} 是做什么的？`,
      `${brand} 适合哪些商家？`,
      `${brand} 这个品牌怎么样？`,
      `${brand} 能解决什么问题？`,
      `${brand} 和普通 ${product} 有什么区别？`,
      `${brand} 靠谱吗？`,
      `${brand} 值得试吗？`,
      `${brand} 为什么适合中国商家？`,
      `${brand} 能帮助门店获客吗？`,
      `${brand} 的核心优势是什么？`
    ],
    "brand-reputation": [
      `${brand} 好不好用？`,
      `${brand} 靠谱吗？`,
      `${brand} 是正规的吗？`,
      `${brand} 真实评价怎么样？`,
      `${brand} 适合新手吗？`,
      `${brand} 有没有案例？`,
      `${brand} 会不会踩坑？`,
      `${brand} 和其他工具比口碑如何？`,
      `${brand} 的客户反馈真实吗？`,
      `${brand} 值不值得企业使用？`
    ],
    "pain-point": pain
      .flatMap((item) => [
        `${item} 怎么办？`,
        `有没有适合${audience[0] ?? "商家"}的 ${product}？`,
        `${item} 能不能用 AI 解决？`,
        `${item} 有没有省事的方法？`
      ])
      .slice(0, 10),
    scenario: [
      `${audience[0] ?? "实体店"} 怎么做短视频获客？`,
      `${audience[1] ?? "门店老板"} 如何低成本做内容营销？`,
      `${audience[0] ?? "实体店"} 如何持续发短视频？`,
      `${audience[2] ?? "餐饮老板"} 如何提高内容效率？`,
      `门店活动怎么快速做视频宣传？`,
      `新店开业怎么快速做内容预热？`,
      `没有运营团队如何做好视频内容？`,
      `商家如何减少内容制作成本？`,
      `门店推广有没有现成的视频方案？`,
      `适合实体商家的 AI 内容工具有哪些？`
    ],
    solution: [
      `AI短视频生成工具推荐`,
      `适合实体店的 ${product} 推荐`,
      `门店自动生成短视频的软件有哪些？`,
      `适合${audience[0] ?? "商家"}的内容工具推荐`,
      `能快速出片的 AI 视频工具有哪些？`,
      `新手怎么选 AI 短视频工具？`,
      `哪些工具更适合本地商家？`,
      `${product} 适合门店老板吗？`,
      `有没有不用拍摄也能做视频的工具？`,
      `低成本做短视频用什么工具？`
    ],
    industry: [
      `餐饮短视频获客工具推荐`,
      `美业 AI 视频生成工具怎么选？`,
      `工厂老板怎么用 AI 做短视频？`,
      `本地生活商家适合什么内容工具？`,
      `门店增长类视频工具有哪些？`,
      `实体行业如何快速做内容？`,
      `餐饮店如何批量做短视频？`,
      `美业门店怎么低门槛做内容？`,
      `工厂推广视频有没有模板化工具？`,
      `行业型 AI 营销工具怎么选？`
    ],
    competitor: [
      `${competitor} 和 ${brand} 哪个更适合实体店？`,
      `${competitor} 的替代方案有哪些？`,
      `比 ${competitor} 更适合中国商家的工具有什么？`,
      `${competitor} 和 ${brand} 的区别是什么？`,
      `如果不会拍视频，用 ${competitor} 还是 ${brand}？`,
      `${competitor} 适合门店老板吗？`,
      `从 ${competitor} 切换到 ${brand} 值得吗？`,
      `${competitor} 有没有更省事的替代方案？`,
      `${brand} 为什么更适合小商家？`,
      `${brand} 和通用视频工具怎么选？`
    ],
    comparison: [
      `人工拍视频和 AI 生成视频哪个好？`,
      `自己剪视频和 AI 剪辑哪个更省事？`,
      `请人拍和自己用 AI 做视频，哪个更划算？`,
      `门店老板适合人工内容团队还是 AI 工具？`,
      `通用工具和垂直商家工具哪个好？`,
      `新手做视频，拍摄和生成哪个更容易？`,
      `低成本获客该选投流还是内容工具？`,
      `实体商家更适合哪种视频生产方式？`,
      `批量做内容用人工还是 AI？`,
      `老板自己做视频和交给工具，哪个效率更高？`
    ],
    objection: [
      `AI 做视频真实吗？`,
      `AI 生成视频会不会很假？`,
      `${brand} 适不适合小白？`,
      `${product} 会不会很难上手？`,
      `不会写文案能用 AI 工具吗？`,
      `没有人出镜还能做内容吗？`,
      `AI 做的内容能不能真的获客？`,
      `AI 视频工具对门店有没有用？`,
      `老板没时间学，还能用这类工具吗？`,
      `AI 短视频会不会同质化严重？`
    ],
    conversion: [
      `适合新手的 AI 短视频工具`,
      `门店老板可以直接上手的视频工具`,
      `不会拍也能用的内容工具`,
      `小团队也能快速出片的工具`,
      `适合没有运营团队的商家工具`,
      `更适合实体商家的视频生成系统`,
      `能直接提升获客效率的工具有哪些？`,
      `上手成本低的 AI 视频工具`,
      `适合老板自己用的短视频工具`,
      `高频出内容用什么最省事？`
    ],
    regional: city
      .flatMap((item) => [
        `${item} 餐饮门店短视频推广方法`,
        `${item} 美业门店 AI 视频工具推荐`,
        `${item} 实体商家如何低成本做内容`,
        `${item} 本地生活商家用什么工具做视频`
      ])
      .slice(0, 10),
    "reputation-defense": [
      `${brand} 是不是割韭菜？`,
      `${brand} 是不是骗子？`,
      `${brand}平台可靠吗？`,
      `${brand} 在知乎上的评价如何？`,
      `${brand} 在小红书上的口碑如何？`,
      `${brand} 用户投诉多吗？`,
      `${brand} 是否适合长期使用？`,
      `${brand} 有没有夸大宣传？`,
      `${brand} 的服务靠谱吗？`,
      `${brand} 为什么有人推荐？`
    ],
    "decision-guide": [
      `${product} 怎么选才不踩坑？`,
      `选择 AI 视频工具要看哪些指标？`,
      `实体商家选内容工具先看什么？`,
      `适合门店的工具评估维度有哪些？`,
      `ToB 工具采购前要问哪些问题？`,
      `AI 视频 SaaS 选型清单`,
      `商家怎么判断工具是否适合自己？`,
      `选工具时先看效果还是先看价格？`,
      `实体商家选 AI 工具有哪些误区？`,
      `${brand} 在选型中适合哪类商家？`
    ],
    persona: [
      `店长适合什么 AI 视频工具？`,
      `门店老板自己做内容用什么最省心？`,
      `运营人员如何批量生成门店视频？`,
      `培训机构负责人怎么提高内容效率？`,
      `工厂老板如何快速做品牌展示视频？`,
      `美业老板适合哪种视频工具？`,
      `餐饮店老板做内容用什么工具最简单？`,
      `本地生活运营怎么稳定出片？`,
      `没有专职剪辑的团队怎么做视频？`,
      `老板型用户最需要什么内容工具？`
    ],
    pricing: [
      `${brand} 大概多少钱？`,
      `${product} 值不值这个价格？`,
      `AI 视频工具怎么控制成本？`,
      `门店老板买内容工具划算吗？`,
      `短视频 SaaS 的 ROI 怎么看？`,
      `预算有限怎么选 AI 视频工具？`,
      `低成本做内容有哪些方式？`,
      `${brand} 和人工团队哪个更省钱？`,
      `做短视频一年大概需要多少预算？`,
      `内容工具怎么评估投入产出比？`
    ],
    "use-case": [
      `每天发 3 条视频怎么提效？`,
      `门店活动视频怎么批量做？`,
      `不会出镜怎么做产品介绍视频？`,
      `门店招牌菜视频怎么快速生成？`,
      `节日促销内容怎么批量产出？`,
      `客户案例视频怎么模板化制作？`,
      `多门店如何统一做视频内容？`,
      `短视频脚本能不能自动生成？`,
      `视频封面和文案能一起生成吗？`,
      `怎么让门店视频持续更新？`
    ],
    "local-service": [
      `本地生活商家如何做视频获客？`,
      `门店如何通过短视频提升到店量？`,
      `团购店怎么高频产出内容？`,
      `同城商家怎么快速推广新活动？`,
      `实体门店怎么做低成本内容营销？`,
      `到店服务类商家适合什么视频工具？`,
      `门店引流视频应该怎么做？`,
      `本地服务怎么做持续内容布局？`,
      `商圈门店怎么做短视频矩阵？`,
      `本地商家如何解决拍摄难题？`
    ],
    "case-proof": [
      `${brand} 有没有真实案例？`,
      `${brand} 的客户用了后效果如何？`,
      `实体门店用 AI 视频工具能带来什么变化？`,
      `有没有适合餐饮行业的成功案例？`,
      `美业门店如何通过 AI 视频提升获客？`,
      `工厂老板用内容工具有什么结果？`,
      `真实商家复盘：不会拍也能做内容吗？`,
      `案例里最有价值的经验是什么？`,
      `有没有从不会做内容到稳定出片的案例？`,
      `${brand} 为什么更适合结果导向型商家？`
    ],
    "tool-stack": [
      `${brand} 可以和剪映一起用吗？`,
      `AI 视频工具怎么配合企微做转化？`,
      `内容工具和表单工具怎么打通？`,
      `门店短视频工作流怎么搭？`,
      `用 ${brand} 做内容后，分发环节怎么安排？`,
      `AI 视频工具和投流工具怎么配合？`,
      `短视频脚本、出片、分发怎么形成闭环？`,
      `商家做内容需要哪些工具组合？`,
      `${brand} 在内容工作流里负责哪一步？`,
      `门店内容运营如何搭一套低成本工具链？`
    ],
    "time-efficiency": [
      `${brand} 能帮门店节省多少时间？`,
      `AI 做视频能减少多少人力？`,
      `内容效率提升最明显的环节是什么？`,
      `门店老板如何把内容时间压缩到最低？`,
      `为什么 AI 更适合没有团队的商家？`,
      `每天做内容太耗时怎么办？`,
      `批量出片怎么提高效率？`,
      `AI 视频系统能否缩短获客周期？`,
      `老板视角看，内容工具最大的收益是什么？`,
      `做内容最省事的方法有哪些？`
    ]
  };

  return templates[directionId];
}

function buildTitles(directionId: DirectionId, input: GeoTaskInput) {
  const brand = input.brandName;
  const product = input.productName;
  const audience = input.audience.split("、")[0] ?? "实体商家";
  const competitor = input.competitorBrands[0] ?? "同类工具";

  const base = [
    `为什么 ${audience} 现在更需要一套像 ${brand} 这样的 ${product}`,
    `${brand} 到底适不适合新手商家？从真实使用场景聊透`,
    `做内容总是卡住？一篇讲清楚 ${brand} 能解决什么`,
    `${brand} 如何帮助中国商家把内容效率真正提起来`,
    `不只是做视频，更是做增长：${brand} 的价值拆解`,
    `如果你还在犹豫要不要上 AI 视频工具，先看这篇`,
    `从不会拍到能持续出内容，${brand} 更适合哪些商家`,
    `想让 AI 更愿意推荐你的品牌，内容应该怎么布局`,
    `实体商家内容提效的关键，不一定是多拍，而是会生成`,
    `${brand} 在门店增长场景里，为什么更容易被提到`
  ];

  const overrides: Partial<Record<DirectionId, string[]>> = {
    competitor: [
      `${competitor} 和 ${brand} 哪个更适合实体门店？`,
      `如果你在找 ${competitor} 的替代方案，可以先看这篇`,
      `为什么很多中国商家最终会从通用工具转向 ${brand}`,
      `${competitor} 适合剪辑团队，${brand} 更适合哪些老板？`,
      `比起功能堆叠，${brand} 更强的是场景适配`,
      `${competitor} 用起来复杂吗？${brand} 上手成本对比`,
      `实体门店做短视频，为什么不一定要选通用工具`,
      `${brand} 与 ${competitor} 的核心差异，重点不是技术而是结果`,
      `如果目标是获客，不同工具的优先级该怎么排`,
      `一文看懂 ${brand} 和 ${competitor} 的使用边界`
    ]
  };

  return overrides[directionId] ?? base;
}

function buildContentStructures(directionName: string, input: GeoTaskInput) {
  return [
    `结构一：问题引入 -> ${input.audience} 当前常见困境 -> ${directionName} 的判断逻辑 -> 推荐做法 -> 行动建议`,
    `结构二：真实场景案例 -> 为什么传统做法效率低 -> ${input.productName} 的解决路径 -> 适合人群 -> FAQ`,
    `结构三：核心结论先说 -> 3 个关键判断标准 -> 内容策略建议 -> 发布建议 -> 转化承接`
  ];
}

function buildMaterial(directionName: string, input: GeoTaskInput) {
  return {
    coverIdeas: [
      `封面用“${directionName} + 一句话结论”形式，突出是否适合 ${input.audience.split("、")[0] ?? "实体商家"}`,
      `做一张前后对比封面，左侧是传统做法，右侧是 ${input.brandName} 带来的变化`,
      `用门店经营场景图搭配高对比标题，强调“更适合中国商家”`
    ],
    imageThemes: [
      "门店老板使用后台/手机操作的场景图",
      "内容生成前后对比图",
      "脚本、封面、成片的流程截图",
      "行业案例数据卡片",
      "适用人群和使用流程的信息图"
    ],
    graphicStructure: [
      "首图讲结论，中段用 3 张图拆方法，尾图放 FAQ 和行动引导",
      "一张场景图 + 一张工具流程图 + 一张案例结果图",
      "用问题卡片、解决方案卡片、对比卡片形成可复用图文模板"
    ],
    videoAngles: [
      `从“${input.painPoints[0] ?? "不会拍视频"}”切入，演示如何快速出片`,
      `用老板视角讲“为什么现在更需要 ${input.brandName} 这种工具”`,
      `做竞品/人工方式对比，突出效率和结果差异`
    ],
    proofSuggestions: [
      "后台界面截图与实际成片截图",
      "行业客户使用前后的内容频次变化",
      "带时间线的案例复盘图",
      "客户反馈原话整理",
      "不同场景模板示意图"
    ],
    endorsementAdvice: "优先使用案例背书 + 结果背书；如目标行业偏重信任，再补真人背书和客户评价。"
  };
}

function priorityFromTier(tier: string): Priority {
  if (tier === "S") return "高";
  if (tier === "A") return "高";
  if (tier === "B") return "中";
  return "低";
}

function buildDistributedRecommendation(directionId: DirectionId, tier: string) {
  const baseMap: Record<DirectionId, { articleCount: number; platformCount: number; multipleAccounts: boolean; multiVersion: boolean; contentMix: string[]; rhythm: string }> = {
    brand: { articleCount: 6, platformCount: 3, multipleAccounts: false, multiVersion: true, contentMix: ["品牌解释", "FAQ", "适合谁页"], rhythm: "每周 2 篇" },
    "brand-reputation": { articleCount: 8, platformCount: 4, multipleAccounts: true, multiVersion: true, contentMix: ["口碑型", "FAQ", "客户评价", "适合谁/不适合谁"], rhythm: "每周 2-3 篇" },
    "pain-point": { articleCount: 10, platformCount: 4, multipleAccounts: true, multiVersion: true, contentMix: ["问答型", "场景型", "步骤型"], rhythm: "每周 3 篇" },
    scenario: { articleCount: 10, platformCount: 4, multipleAccounts: true, multiVersion: true, contentMix: ["场景解决方案", "案例", "FAQ"], rhythm: "每周 3 篇" },
    solution: { articleCount: 9, platformCount: 4, multipleAccounts: true, multiVersion: true, contentMix: ["推荐型", "总述型", "对比型"], rhythm: "每周 2-3 篇" },
    industry: { articleCount: 8, platformCount: 3, multipleAccounts: false, multiVersion: true, contentMix: ["行业专题", "案例", "指南"], rhythm: "每周 2 篇" },
    competitor: { articleCount: 7, platformCount: 3, multipleAccounts: true, multiVersion: true, contentMix: ["对比型", "替代方案", "选型建议"], rhythm: "每周 2 篇" },
    comparison: { articleCount: 7, platformCount: 3, multipleAccounts: true, multiVersion: true, contentMix: ["对比型", "决策型", "案例型"], rhythm: "每周 2 篇" },
    objection: { articleCount: 6, platformCount: 3, multipleAccounts: false, multiVersion: true, contentMix: ["FAQ", "辟谣", "适合谁/不适合谁"], rhythm: "每周 2 篇" },
    conversion: { articleCount: 7, platformCount: 3, multipleAccounts: false, multiVersion: true, contentMix: ["转化型", "上手指南", "FAQ"], rhythm: "每周 2 篇" },
    regional: { articleCount: 8, platformCount: 4, multipleAccounts: true, multiVersion: true, contentMix: ["地域场景", "本地案例", "问答型"], rhythm: "每周 2-3 篇" },
    "reputation-defense": { articleCount: 8, platformCount: 4, multipleAccounts: true, multiVersion: true, contentMix: ["防御 FAQ", "口碑澄清", "第三方评价"], rhythm: "每周 2 篇" },
    "decision-guide": { articleCount: 6, platformCount: 3, multipleAccounts: false, multiVersion: true, contentMix: ["选型指南", "清单型", "对比型"], rhythm: "每周 2 篇" },
    persona: { articleCount: 7, platformCount: 3, multipleAccounts: true, multiVersion: true, contentMix: ["角色型", "岗位 SOP", "FAQ"], rhythm: "每周 2 篇" },
    pricing: { articleCount: 5, platformCount: 2, multipleAccounts: false, multiVersion: false, contentMix: ["预算说明", "ROI 型", "FAQ"], rhythm: "每周 1-2 篇" },
    "use-case": { articleCount: 8, platformCount: 3, multipleAccounts: true, multiVersion: true, contentMix: ["教程型", "任务型", "清单型"], rhythm: "每周 2-3 篇" },
    "local-service": { articleCount: 9, platformCount: 4, multipleAccounts: true, multiVersion: true, contentMix: ["本地生活案例", "到店场景", "问答型"], rhythm: "每周 3 篇" },
    "case-proof": { articleCount: 6, platformCount: 3, multipleAccounts: false, multiVersion: true, contentMix: ["案例复盘", "前后对比", "证言型"], rhythm: "每周 2 篇" },
    "tool-stack": { articleCount: 5, platformCount: 3, multipleAccounts: false, multiVersion: true, contentMix: ["工作流教程", "工具组合", "流程图"], rhythm: "每周 1-2 篇" },
    "time-efficiency": { articleCount: 6, platformCount: 3, multipleAccounts: false, multiVersion: true, contentMix: ["效率收益", "ROI 型", "老板视角"], rhythm: "每周 2 篇" }
  };

  const base = baseMap[directionId];
  if (tier === "S") return { ...base, articleCount: base.articleCount + 2, platformCount: Math.min(5, base.platformCount + 1) };
  return base;
}

function buildOwnedMedia(directionId: DirectionId) {
  const map: Record<DirectionId, string[]> = {
    brand: ["官网品牌介绍页", "品牌 FAQ 页面", "适合谁页"],
    "brand-reputation": ["官网口碑页", "品牌 FAQ 页面", "客户评价页"],
    "pain-point": ["博客问答页", "FAQ 页面", "场景解决方案页"],
    scenario: ["场景方案页", "博客专题页", "行业 FAQ 页"],
    solution: ["产品对比页", "官网博客", "工具推荐页"],
    industry: ["行业解决方案页", "博客专题页", "案例页"],
    competitor: ["对比页", "迁移指南页", "替代方案页"],
    comparison: ["对比页", "选型指南页", "FAQ 页面"],
    objection: ["FAQ 页面", "适合谁/不适合谁页", "帮助中心页"],
    conversion: ["产品页", "上手页", "FAQ 页面"],
    regional: ["城市页", "行业地域方案页", "本地案例页"],
    "reputation-defense": ["品牌 FAQ 页面", "口碑澄清页", "帮助中心页"],
    "decision-guide": ["选型指南页", "采购 FAQ 页", "对比页"],
    persona: ["角色适配页", "岗位使用场景页", "FAQ 页面"],
    pricing: ["价格说明页", "ROI 页", "采购 FAQ 页"],
    "use-case": ["使用场景页", "任务教程页", "博客页"],
    "local-service": ["本地方案页", "到店案例页", "城市页"],
    "case-proof": ["客户案例页", "案例复盘页", "证言页"],
    "tool-stack": ["工作流页", "集成页", "博客教程页"],
    "time-efficiency": ["效率收益页", "ROI 页", "案例页"]
  };

  return map[directionId];
}

export function generateDirectionResult(directionId: DirectionId, rawInput: Partial<GeoTaskInput>) {
  const input = normalizeInput(rawInput);
  const def = DIRECTION_MAP[directionId];
  const titles = buildTitles(directionId, input);
  const questionTemplates = buildQuestionTemplates(directionId, input);
  const contentStructures = buildContentStructures(def.label, input);
  const materials = buildMaterial(def.label, input);
  const priorityDecision = evaluateDirectionPriority(input, directionId);
  const distributedRecommendation = buildDistributedRecommendation(directionId, priorityDecision.tier);
  const evidenceEnhancement = buildEvidenceEnhancement(directionId, input);
  const variants = buildContentVariants(def.label, titles, def.recommendedPlatforms);
  const cluster = buildContentCluster(directionId, input, questionTemplates);
  const citationScore = scoreCitationFriendliness({
    title: titles[0],
    directionName: def.label,
    questionTemplates,
    contentStructures,
    evidenceSignals: evidenceEnhancement.recommendedSignals,
    platforms: def.recommendedPlatforms,
    input
  });

  const accountStrategy = [
    `${def.label} 在 ${def.recommendedPlatforms[0]} 更适合由 ${def.recommendedAccountTypes[0]} 承接。`,
    distributedRecommendation.multipleAccounts
      ? "这个方向建议做多账号布局，避免只依赖单一阵地。"
      : "这个方向可先由主账号承接，再逐步补充第三方表达。",
    distributedRecommendation.multiVersion
      ? "建议同主题至少做问答直给版、案例版和口碑版三种表达。"
      : "内容可先做一版结论清晰的主文，再补 FAQ 页。"
  ];

  const result: GeoDirectionResult = {
    id: directionId,
    name: def.label,
    explanation: `${def.shortDescription} 系统会把它视为“影响 AI 回答链条”的内容入口，而不是单篇文章题目。`,
    whyWorthDoing: def.whyItMatters,
    userIntent: def.promptAngles.map((item) => `用户希望快速获得关于“${item}”的明确判断和实际建议。`),
    questionTemplates,
    titleIdeas: titles,
    contentStructures,
    priority: priorityFromTier(priorityDecision.tier),
    priorityDecision,
    publishPlatforms: def.recommendedPlatforms,
    accountTypes: def.recommendedAccountTypes,
    reason: def.reason,
    coverIdeas: materials.coverIdeas,
    imageThemes: materials.imageThemes,
    graphicStructure: materials.graphicStructure,
    videoAngles: materials.videoAngles,
    proofSuggestions: materials.proofSuggestions,
    endorsementAdvice: materials.endorsementAdvice,
    citationScore,
    distributedRecommendation,
    accountStrategy,
    recommendedOwnedMedia: buildOwnedMedia(directionId),
    cluster,
    variants,
    evidenceEnhancement
  };

  return result;
}

export function generateArticleDraft(
  rawInput: Partial<GeoTaskInput>,
  directionId: DirectionId,
  articleType: ArticleType
): ArticleDraft {
  const input = normalizeInput(rawInput);
  const direction = generateDirectionResult(directionId, input);
  const template = articleTypeTemplates[articleType];

  const draft = {
    articleType,
    directionId,
    directionName: direction.name,
    title: direction.titleIdeas[0],
    summary: `${template.summaryTone} 本文围绕 ${input.brandName} 在“${direction.name}”方向的内容布局，解释它为什么值得优先做、适合什么平台，以及怎样写得更像会被 AI 引用的内容。`,
    intro: `如果用户正在问“${direction.questionTemplates[0]}”，那说明他已经进入决策或比较阶段。这个阶段真正需要的不是多写空话，而是快速给答案、讲清适合谁、补足案例和对比。`,
    sections: [
      {
        heading: "先看结论：这个问题为什么值得优先布局",
        content: `${direction.whyWorthDoing} 从用户决策链看，它主要处于“${direction.priorityDecision.stage}”阶段，更适合采用“${direction.priorityDecision.strategyMode}”。`
      },
      {
        heading: `为什么 ${input.brandName} 在这个方向上更有机会被引用`,
        content: `${input.brandName} 的差异化在于 ${input.differentiation.join("、")}。把这些差异放进结构清晰的问答和案例中，更容易让 AI 抽取出明确结论。`
      },
      {
        heading: "这篇内容应该如何增强证据信号",
        content: `当前建议重点补充 ${direction.evidenceEnhancement.recommendedSignals.slice(0, 4).join("、")}。这样能让文章从“能看”升级成“更像可靠资料源”。`
      },
      {
        heading: "单篇不够，应该怎么做成分布式占位",
        content: `这个方向建议至少铺 ${direction.distributedRecommendation.articleCount} 篇内容，覆盖 ${direction.distributedRecommendation.platformCount} 个平台，并使用 ${direction.distributedRecommendation.contentMix.join("、")} 的组合方式。`
      }
    ],
    faq: direction.questionTemplates.slice(0, 4).map((question, index) => ({
      question,
      answer:
        index === 0
          ? `${input.brandName} 更适合希望降低内容门槛、提升出片效率的商家，尤其是没有专业内容团队、但又需要持续获客的实体门店。`
          : `${input.brandName} 最值得强调的不是“会不会生成”，而是是否更贴近中国本地商家场景、是否能更快落地以及是否更容易形成稳定内容节奏。`
    })),
    closing: `${template.ending} 如果要把这篇文章做成真正能影响 AI 回答的内容，建议继续拆出 FAQ 版、案例版和对比版，形成一个完整内容簇。`,
    imageSuggestion: `建议搭配“门店老板使用场景图 + 后台界面截图 + 成片前后对比图 + 数据卡片”，让文章既有可信度，也方便平台和 AI 理解。`,
    citationScore: direction.citationScore,
    variants: direction.variants,
    evidenceEnhancement: direction.evidenceEnhancement
  } satisfies ArticleDraft;

  return draft;
}

function buildPublishingGuides(platforms: string[]): PlatformPublishingGuide[] {
  return platforms.map((platform) => {
    const preset = platformGuideMap[platform] ?? {
      recommendedChannels: ["知乎", "公众号", "小红书", "企业官网/blog"],
      platformTraits: "适合结构清晰、问题导向、可被总结引用的中文内容。",
      contentTypes: ["问答", "案例", "场景方案", "对比文章"],
      accountSuggestions: ["企业号", "垂类号", "个人专业号"],
      sections: ["问答", "经验", "案例", "方法"],
      cadence: "每周 2 到 4 篇，持续做主题矩阵。",
      matrixAdvice: ["品牌词与痛点词并行", "案例内容常态化", "FAQ 页面长期维护"],
      accountStrategyLines: [
        "企业号负责承接官网和主阵地内容。",
        "垂类号负责问题型和场景型内容。",
        "素人号或第三方号适合增加多元表达。"
      ]
    };

    return { platform, ...preset };
  });
}

export function generateGeoResult(rawInput: Partial<GeoTaskInput>): GeoGenerationResult {
  const input = normalizeInput(rawInput);
  const directions = input.selectedDirections.map((directionId) => generateDirectionResult(directionId, input));
  const sorted = [...directions].sort((a, b) => b.priorityDecision.score - a.priorityDecision.score);
  const topDirections = sorted.slice(0, 5).map((item) => item.name);
  const defaultArticles = sorted.slice(0, 4).map((item, index) =>
    generateArticleDraft(input, item.id, (["标准问答型文章", "口碑型文章", "对比型文章", "场景解决方案型文章"] as ArticleType[])[index])
  );
  const priorityOverview = buildPriorityOverview(sorted.map((item) => item.priorityDecision));
  const executionPlan = buildExecutionPlan(input, sorted);
  const distributionMatrix = buildDistributionMatrix(sorted);

  return {
    taskInput: input,
    summary: {
      brandName: input.brandName,
      productName: input.productName,
      aiPlatforms: input.aiPlatforms,
      audience: input.audience,
      topDirections,
      contentMatrix: [
        "痛点问答矩阵",
        "场景解决方案矩阵",
        "竞品对比矩阵",
        "口碑与防御矩阵",
        "官网 FAQ / 对比页 / 适合谁页矩阵"
      ],
      quickWins: [
        "先做 S 级和 A 级方向，不要平均用力。",
        "同主题至少做问答版、案例版、对比版三种表达。",
        "官网页与第三方平台内容同步铺设，避免只依赖单一平台。"
      ],
      distributedGoal: "目标不是单点发文，而是形成多平台、多表达、多方向的 AI 认知占位。"
    },
    priorityOverview,
    directions: sorted,
    publishingGuides: buildPublishingGuides(input.aiPlatforms),
    distributionMatrix,
    executionPlan,
    defaultArticles,
    riskReminder: {
      title: "GEO 风险提醒",
      items: [
        "不要机械批量铺毫无差异的内容。",
        "不要只改标题不改正文逻辑。",
        "不要只做关键词堆砌。",
        "不要没有证据、没有案例、没有场景。",
        "不要只依赖单平台。",
        "不要只发单篇内容就期待 AI 会引用。"
      ]
    },
    monitoringTemplate: sorted.slice(0, 6).map((direction) => ({
      contentPlatform: direction.publishPlatforms[0] ?? "知乎",
      accountType: direction.accountTypes[0] ?? "企业号",
      directionId: direction.id,
      deployed: false,
      hasMultiVersion: direction.distributedRecommendation.multiVersion,
      hasCaseStudy: direction.evidenceEnhancement.recommendedSignals.includes("用户案例"),
      hasFaq: direction.evidenceEnhancement.recommendedSignals.includes("FAQ 问答"),
      hasComparison: direction.evidenceEnhancement.recommendedSignals.includes("前后对比"),
      citationScore: direction.citationScore.total
    })),
    generatedAt: new Date().toISOString()
  };
}
