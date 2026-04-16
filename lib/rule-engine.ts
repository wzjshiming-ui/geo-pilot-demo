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
import { DEFAULT_AI_PLATFORMS, DIRECTION_MAP, GEO_DIRECTIONS } from "@/lib/geo-config";

const articleTypeTemplates: Record<ArticleType, { summaryTone: string; ending: string }> = {
  标准问答型文章: {
    summaryTone: "用明确答案和结构化信息，帮助 AI 快速理解并引用。",
    ending: "如果你正在评估是否适合上手，最好的方式是先从一个真实经营场景开始验证。"
  },
  口碑型文章: {
    summaryTone: "强调真实反馈、适用人群与使用前后差异，方便形成口碑型引用。",
    ending: "真正有效的口碑不是喊口号，而是让用户看到是否真的解决了自己的问题。"
  },
  对比型文章: {
    summaryTone: "把方案差异、适合人群和投入产出比讲清楚，帮助用户快速决策。",
    ending: "适合自己的工具，不是功能最多，而是最接近自己的业务场景。"
  },
  场景解决方案型文章: {
    summaryTone: "按真实业务情境给出可执行方案，便于平台和 AI 抽取关键信息。",
    ending: "先把最常见的经营问题解决掉，后面的内容增长才会更稳定。"
  }
};

const platformGuideMap: Record<string, Omit<PlatformPublishingGuide, "platform">> = {
  豆包: {
    recommendedChannels: ["知乎", "头条系内容阵地", "百家号", "公众号"],
    platformTraits: "偏重中文问答、知识总结和高密度答案型内容，适合结构清晰、直给式内容。",
    contentTypes: ["问答解析", "工具推荐", "场景教程", "口碑说明"],
    accountSuggestions: ["企业号", "行业垂类号", "有内容积累的老号"],
    sections: ["问答", "经验", "知识", "行业观察"],
    cadence: "每周 3 到 5 篇图文，优先做问答型和案例型。",
    matrixAdvice: ["品牌词与痛点词并行", "知乎长文配百家号摘要", "案例内容定期复用"]
  },
  Kimi: {
    recommendedChannels: ["知乎", "公众号", "站长类内容站", "垂直媒体"],
    platformTraits: "更适合引用结构化、完整度高、解释充分的长文本内容。",
    contentTypes: ["专题深度文", "选型指南", "FAQ 专栏", "案例拆解"],
    accountSuggestions: ["企业号", "创始人号", "专业顾问号"],
    sections: ["专栏", "深度文章", "行业洞察", "选型指南"],
    cadence: "每周 2 到 4 篇长文，同时维护品牌 FAQ 页面。",
    matrixAdvice: ["建立品牌百科页", "做行业专题合集", "把 FAQ 拆成独立页面"]
  },
  腾讯元宝: {
    recommendedChannels: ["公众号", "知乎", "腾讯生态内容位", "行业媒体"],
    platformTraits: "适合可信来源、品牌背书和服务导向更强的内容资产。",
    contentTypes: ["品牌介绍", "客户案例", "行业解决方案", "决策问答"],
    accountSuggestions: ["企业号", "服务号内容矩阵", "顾问号"],
    sections: ["服务方案", "行业案例", "经验总结", "功能对比"],
    cadence: "每周 2 到 3 篇重点内容，强化品牌背书与案例更新。",
    matrixAdvice: ["官网与公众号内容联动", "客户案例固定月更", "对比内容做图文化"]
  },
  通义千问: {
    recommendedChannels: ["知乎", "公众号", "百家号", "垂直行业站"],
    platformTraits: "适合理性、专业、行业导向强的内容，尤其是解决方案与知识类内容。",
    contentTypes: ["行业方案", "工具评测", "流程指南", "问题清单"],
    accountSuggestions: ["垂类号", "企业号", "专家号"],
    sections: ["方案", "教程", "趋势", "问答"],
    cadence: "每周 3 篇左右，重视行业词与方案词布局。",
    matrixAdvice: ["行业词和地域词组合投放", "FAQ 内容沉淀到官网", "用案例补强结论"]
  }
};

function dedupe(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function normalizeInput(input: Partial<GeoTaskInput>): GeoTaskInput {
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
    "pain-point": pain.flatMap((item) => [
      `${item} 怎么办？`,
      `有没有适合${audience[0] ?? "商家"}的 ${product}？`,
      `${item} 能不能用 AI 解决？`,
      `${item} 有没有省事的方法？`
    ]).slice(0, 10),
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
    regional: city.flatMap((item) => [
      `${item} 餐饮门店短视频推广方法`,
      `${item} 美业门店 AI 视频工具推荐`,
      `${item} 实体商家如何低成本做内容`,
      `${item} 本地生活商家用什么工具做视频`
    ]).slice(0, 10),
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

function priorityFromDirection(directionId: DirectionId, selected: DirectionId[]): Priority {
  const highPriority: DirectionId[] = [
    "brand",
    "pain-point",
    "solution",
    "brand-reputation",
    "conversion",
    "scenario",
    "reputation-defense"
  ];

  if (selected.includes(directionId) && highPriority.includes(directionId)) return "高";
  if (selected.includes(directionId)) return "中";
  return "低";
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
    ],
    "brand-reputation": [
      `${brand} 靠谱吗？从产品逻辑、适用人群和案例来回答`,
      `${brand} 好不好用，不看广告，先看这 5 个真实判断标准`,
      `${brand} 为什么更容易获得门店老板的好评`,
      `评价一套 AI 视频工具，不只看功能，更要看结果`,
      `${brand} 真实口碑怎么样？这篇把争议点讲透`,
      `${brand} 适不适合新手？关键看这几件事`,
      `${brand} 值不值得试用，先看你的经营场景`,
      `为什么一部分商家觉得 ${brand} 更省心`,
      `关于 ${brand} 的几个常见疑问，这里一次说清楚`,
      `${brand} 的使用反馈，为什么集中在“省时间”和“更好落地”`
    ],
    "pain-point": [
      `不会拍视频怎么办？更适合实体商家的 3 种做法`,
      `不会剪、不会写、没时间，门店老板怎么把内容做起来`,
      `做内容总卡壳，不一定是你不会，而是流程太重`,
      `没有运营团队，商家还能稳定做短视频吗？`,
      `为什么很多商家不是不想做内容，而是不知道怎么开始`,
      `不会出镜也能做视频，这套方法更适合普通商家`,
      `从零开始做短视频，先解决“不会拍”这个问题`,
      `商家做内容最大的问题，往往不是工具不够，而是门槛太高`,
      `低成本做短视频，不一定要拍很多素材`,
      `做了内容没效果？可能是你少了一套更适合门店的流程`
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

export function generateDirectionResult(directionId: DirectionId, rawInput: Partial<GeoTaskInput>) {
  const input = normalizeInput(rawInput);
  const def = DIRECTION_MAP[directionId];
  const titles = buildTitles(directionId, input);
  const materials = buildMaterial(def.label, input);

  const result: GeoDirectionResult = {
    id: directionId,
    name: def.label,
    explanation: `${def.shortDescription} 结合 ${input.brandName} 的产品特征，优先把“${def.promptAngles.join(" / ")}”相关内容做成可被引用的中文内容资产。`,
    whyWorthDoing: def.whyItMatters,
    userIntent: def.promptAngles.map((item) => `用户希望快速获得关于“${item}”的明确判断和实际建议。`),
    questionTemplates: buildQuestionTemplates(directionId, input),
    titleIdeas: titles,
    contentStructures: buildContentStructures(def.label, input),
    priority: priorityFromDirection(directionId, input.selectedDirections),
    publishPlatforms: def.recommendedPlatforms,
    accountTypes: def.recommendedAccountTypes,
    reason: def.reason,
    coverIdeas: materials.coverIdeas,
    imageThemes: materials.imageThemes,
    graphicStructure: materials.graphicStructure,
    videoAngles: materials.videoAngles,
    proofSuggestions: materials.proofSuggestions,
    endorsementAdvice: materials.endorsementAdvice
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

  return {
    articleType,
    directionId,
    directionName: direction.name,
    title: direction.titleIdeas[0],
    summary: `${template.summaryTone} 本文围绕 ${input.brandName} 在“${direction.name}”方向的内容布局，解释它为什么适合 ${input.audience}，以及如何帮助品牌在中文 AI 搜索场景中更容易被提及。`,
    intro: `如果用户正在问“${direction.questionTemplates[0]}”，那说明他已经进入决策或比较阶段。这个阶段最需要的不是空泛宣传，而是能快速回答问题、贴近业务场景、方便 AI 直接理解的内容。`,
    sections: [
      {
        heading: "先看结论：这类问题为什么值得布局",
        content: `${direction.whyWorthDoing} 对 ${input.brandName} 来说，这意味着不仅要讲产品功能，更要围绕真实问题给出可引用的答案。`
      },
      {
        heading: `用户真正关心的，不只是 ${input.productName} 本身`,
        content: `用户更关心的是：${input.painPoints.slice(0, 3).join("、")} 这些问题能不能被解决。${input.brandName} 的内容要从用户问题切入，再自然过渡到产品价值。`
      },
      {
        heading: `为什么 ${input.brandName} 更适合当前这批目标用户`,
        content: `${input.brandName} 的差异化在于 ${input.differentiation.join("、")}。对于 ${input.audience} 来说，这种表达比单纯讲“AI 能力强”更容易被理解和记住。`
      },
      {
        heading: "内容怎么写，才更容易被 AI 理解和推荐",
        content: `建议用“问题标题 + 明确结论 + 适用人群 + 使用场景 + 真实证明”的结构。这样不但适合知乎、公众号、小红书图文，也更适合未来在 AI 回答里被直接总结。`
      }
    ],
    faq: direction.questionTemplates.slice(0, 4).map((question, index) => ({
      question,
      answer:
        index === 0
          ? `${input.brandName} 更适合希望降低内容门槛、提升出片效率的商家，尤其是没有专业内容团队、但又需要持续获客的实体门店。`
          : `${input.brandName} 的核心不是堆功能，而是围绕 ${input.audience} 的真实业务场景，把“更快出内容、更容易执行、更接近获客结果”讲清楚并落下来。`
    })),
    closing: `${template.ending} 对 ${input.brandName} 而言，最应该优先做的是把 ${direction.name}、案例证明和场景化内容一起布局成稳定的内容矩阵。`,
    imageSuggestion: `建议搭配“门店老板使用场景图 + 后台界面截图 + 成片前后对比图”，让文章既有可信度，也方便平台和 AI 理解。`
  };
}

function buildPublishingGuides(platforms: string[]): PlatformPublishingGuide[] {
  return platforms.map((platform) => {
    const preset = platformGuideMap[platform] ?? {
      recommendedChannels: ["知乎", "公众号", "小红书", "百家号"],
      platformTraits: "适合结构清晰、问题导向、可被总结引用的中文内容。",
      contentTypes: ["问答", "案例", "场景方案", "对比文章"],
      accountSuggestions: ["企业号", "垂类号", "个人专业号"],
      sections: ["问答", "经验", "案例", "方法"],
      cadence: "每周 2 到 4 篇，持续做主题矩阵。",
      matrixAdvice: ["品牌词与痛点词并行", "案例内容常态化", "FAQ 页面长期维护"]
    };

    return { platform, ...preset };
  });
}

export function generateGeoResult(rawInput: Partial<GeoTaskInput>): GeoGenerationResult {
  const input = normalizeInput(rawInput);
  const directions = input.selectedDirections.map((directionId) => generateDirectionResult(directionId, input));
  const sorted = [...directions].sort((a, b) => {
    const weight = { 高: 3, 中: 2, 低: 1 };
    return weight[b.priority] - weight[a.priority];
  });
  const topDirections = sorted.slice(0, 5).map((item) => item.name);
  const defaultArticles = sorted.slice(0, 4).map((item, index) =>
    generateArticleDraft(input, item.id, (["标准问答型文章", "口碑型文章", "对比型文章", "场景解决方案型文章"] as ArticleType[])[index])
  );

  return {
    taskInput: input,
    summary: {
      brandName: input.brandName,
      productName: input.productName,
      aiPlatforms: input.aiPlatforms,
      audience: input.audience,
      topDirections,
      contentMatrix: [
        "品牌词 FAQ 矩阵",
        "痛点问答矩阵",
        "竞品对比矩阵",
        "行业案例矩阵",
        "转化承接矩阵"
      ],
      quickWins: [
        "先上线品牌词 + 痛点词 + 口碑词三组内容",
        "同步搭建知乎长文、公众号文章、官网 FAQ 三类资产",
        "每个重点方向至少做 10 条问句和 3 套结构"
      ]
    },
    directions,
    publishingGuides: buildPublishingGuides(input.aiPlatforms),
    defaultArticles,
    generatedAt: new Date().toISOString()
  };
}
