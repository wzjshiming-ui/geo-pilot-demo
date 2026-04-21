import { DirectionId, GeoProfessionalGuidance, GeoTaskInput } from "@/lib/types";

function timingAdvice(input: GeoTaskInput, directionId: DirectionId) {
  if (["brand-reputation", "reputation-defense", "competitor", "comparison"].includes(directionId)) {
    return "决策型与防御型内容建议在工作日白天优先发布，并在搜索与讨论更活跃的时段同步分发，方便被持续检索与转述。";
  }
  if (input.audience.includes("门店") || input.audience.includes("老板")) {
    return "面向老板和门店用户的内容，更适合在早上营业前、中午、晚上收工后这些更容易阅读和决策的时段发布。";
  }
  return "问答型和方案型内容优先选工作日稳定更新，保持连续性比单次爆发更重要。";
}

function accountWeightAdvice(directionId: DirectionId) {
  if (["brand", "brand-reputation", "reputation-defense"].includes(directionId)) {
    return "品牌词、口碑词和防御词优先由企业号、创始人号或已有沉淀的老账号承接，权重和可信度比花哨表达更重要。";
  }
  if (["pain-point", "scenario", "use-case"].includes(directionId)) {
    return "问题型和场景型内容不一定非要最高权重账号，但需要垂类账号连续输出，形成稳定内容占位。";
  }
  return "对比型、选型型和案例型内容最好由专业感更强的账号承接，避免账号身份与内容判断不匹配。";
}

function coverageDensityAdvice(directionId: DirectionId) {
  if (["reputation-defense", "brand-reputation"].includes(directionId)) {
    return "这类方向不适合只发 1 篇，至少要覆盖品牌主阵地、第三方问答位和外部解释位，形成基础防御密度。";
  }
  if (["pain-point", "scenario", "solution"].includes(directionId)) {
    return "这类方向建议做系列化铺设，按一级主题、二级主题和长尾问法持续覆盖，密度比单篇质量同样重要。";
  }
  return "先用 3 到 5 篇内容验证方向，再决定是否扩成完整集群，避免一开始就无差异批量铺量。";
}

function commentAdvice(directionId: DirectionId) {
  if (["brand-reputation", "reputation-defense"].includes(directionId)) {
    return "不建议做明显水军式评论。更推荐用真实客户反馈、团队答疑、FAQ 补充和第三方观点来增加讨论深度。";
  }
  return "评论区可以做轻量人工运营，比如补充 FAQ、答疑、补案例，但不建议用低质量水军刷屏，这会损害可信度。";
}

function paidAdvice(directionId: DirectionId) {
  if (["pain-point", "scenario", "solution"].includes(directionId)) {
    return "投流不是 GEO 的前提，但优质内容在初期可以用小预算做曝光验证，帮助判断哪些主题更值得长期铺设。";
  }
  if (["brand-reputation", "reputation-defense"].includes(directionId)) {
    return "品牌口碑和防御词不建议单纯靠投流放大，更重要的是结构化解释、外部信号和长期可检索内容。";
  }
  return "投流应作为放大器，而不是替代内容布局本身。先把内容质量、平台匹配和账号承接做好，再考虑加速分发。";
}

export function buildProfessionalGuidance(input: GeoTaskInput, directionId: DirectionId): GeoProfessionalGuidance {
  return {
    publishTiming: timingAdvice(input, directionId),
    accountWeightAdvice: accountWeightAdvice(directionId),
    coverageDensityAdvice: coverageDensityAdvice(directionId),
    commentSeedingAdvice: commentAdvice(directionId),
    paidAmplificationAdvice: paidAdvice(directionId),
    riskBoundary: "不建议靠低质量刷评、无差异批量铺文或单纯堆量来做 GEO。专业做法是高质量内容 + 多平台占位 + 真实证据 + 稳定节奏。"
  };
}
