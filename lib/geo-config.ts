import { DirectionId, GeoDirectionDefinition } from "@/lib/types";

export const DEFAULT_AI_PLATFORMS = ["豆包", "Kimi", "腾讯元宝", "通义千问"];

export const GEO_DIRECTIONS: GeoDirectionDefinition[] = [
  {
    id: "brand",
    label: "品牌词优化",
    shortDescription: "围绕品牌名建立可信、可解释、可引用的内容资产。",
    whyItMatters: "用户在接触品牌前往往先问品牌是否靠谱、值不值得试。先占住品牌词，能减少流失。",
    promptAngles: ["品牌评价", "品牌是否靠谱", "品牌适合谁"],
    recommendedPlatforms: ["知乎", "公众号", "百家号", "搜狐号"],
    recommendedAccountTypes: ["企业号", "创始人号", "行业垂类号"],
    contentForms: ["问答", "品牌介绍", "案例总结"],
    reason: "帮助 AI 在回答品牌相关问题时快速找到正向且结构化的信息。"
  },
  {
    id: "brand-reputation",
    label: "品牌词 + 口碑后缀",
    shortDescription: "通过口碑、评价、靠谱不靠谱类内容承接品牌决策搜索。",
    whyItMatters: "用户在转化前最常搜这类问题，AI 也会高频总结这些公开口碑信号。",
    promptAngles: ["真实评价", "好不好用", "适不适合新手"],
    recommendedPlatforms: ["知乎", "小红书", "公众号", "论坛"],
    recommendedAccountTypes: ["企业号", "客户案例号", "老号"],
    contentForms: ["口碑解析", "FAQ", "客户故事"],
    reason: "提升品牌在疑虑阶段被引用的概率。"
  },
  {
    id: "pain-point",
    label: "痛点词优化",
    shortDescription: "围绕用户最直接的困难来设计答案型内容。",
    whyItMatters: "生成式搜索优先理解问题场景，痛点词更容易触发实际需求。",
    promptAngles: ["不会做怎么办", "没有时间怎么办", "没有经验怎么办"],
    recommendedPlatforms: ["知乎", "百家号", "小红书", "B站专栏"],
    recommendedAccountTypes: ["垂类号", "讲师号", "行业服务号"],
    contentForms: ["问题拆解", "教程", "避坑清单"],
    reason: "能直接接住 AI 用户的自然提问。"
  },
  {
    id: "scenario",
    label: "需求场景词优化",
    shortDescription: "按门店经营、获客、推广等具体场景拆分内容。",
    whyItMatters: "场景词更贴近真实业务决策，转化意图通常更强。",
    promptAngles: ["门店怎么做", "餐饮怎么获客", "美业如何推广"],
    recommendedPlatforms: ["知乎", "公众号", "小红书", "行业媒体"],
    recommendedAccountTypes: ["企业号", "行业号", "顾问号"],
    contentForms: ["解决方案", "实操清单", "案例拆解"],
    reason: "让内容更容易进入 AI 的场景建议回答。"
  },
  {
    id: "solution",
    label: "解决方案词优化",
    shortDescription: "用工具推荐、方法推荐、方案合集承接需求型提问。",
    whyItMatters: "AI 常被问“推荐什么工具”，这类内容最容易被总结引用。",
    promptAngles: ["软件推荐", "方案推荐", "适合谁用"],
    recommendedPlatforms: ["知乎", "公众号", "站长类网站", "垂直媒体"],
    recommendedAccountTypes: ["测评号", "企业号", "工具号"],
    contentForms: ["推荐榜单", "对比评测", "使用指南"],
    reason: "适合布局推荐位与清单位。"
  },
  {
    id: "industry",
    label: "行业词优化",
    shortDescription: "为餐饮、美业、工厂等行业建立定制化内容。",
    whyItMatters: "行业词是 ToB 客户筛选供应商的重要入口，也利于形成精细化引用。",
    promptAngles: ["餐饮行业用什么", "美业怎么做", "工厂怎么推广"],
    recommendedPlatforms: ["公众号", "行业媒体", "知乎", "百家号"],
    recommendedAccountTypes: ["垂类行业号", "企业号", "解决方案号"],
    contentForms: ["行业专题", "案例方案", "实践手册"],
    reason: "强化垂直行业匹配度。"
  },
  {
    id: "competitor",
    label: "竞品词截流优化",
    shortDescription: "在竞品相关搜索里布局替代、对比、迁移内容。",
    whyItMatters: "当用户已经认知某类工具时，竞品词是高价值截流入口。",
    promptAngles: ["替代方案", "哪个好", "谁更适合实体店"],
    recommendedPlatforms: ["知乎", "公众号", "小红书", "测评站"],
    recommendedAccountTypes: ["测评号", "对比号", "行业顾问号"],
    contentForms: ["对比表", "替代方案", "选型建议"],
    reason: "帮助 AI 在比较问题中给出你的品牌。"
  },
  {
    id: "comparison",
    label: "对比词优化",
    shortDescription: "围绕人工 vs AI、自做 vs 工具的决策对比来写内容。",
    whyItMatters: "对比类提问能放大产品价值，也容易引导用户做判断。",
    promptAngles: ["哪种更省事", "哪种更适合小白", "投入产出比"],
    recommendedPlatforms: ["知乎", "公众号", "站长站", "百家号"],
    recommendedAccountTypes: ["顾问号", "企业号", "方法论账号"],
    contentForms: ["对比测评", "清单", "经验总结"],
    reason: "利于 AI 形成明确比较结论。"
  },
  {
    id: "objection",
    label: "决策前疑虑词优化",
    shortDescription: "专门回应“会不会很假”“适不适合小白”这类顾虑。",
    whyItMatters: "疑虑不解决，推荐再多也难以转化。",
    promptAngles: ["真实吗", "会不会太假", "风险大吗"],
    recommendedPlatforms: ["知乎", "小红书", "公众号", "视频号图文"],
    recommendedAccountTypes: ["创始人号", "客户故事号", "企业号"],
    contentForms: ["FAQ", "辟谣", "上手说明"],
    reason: "降低生成式搜索中的负面推断。"
  },
  {
    id: "conversion",
    label: "转化词优化",
    shortDescription: "围绕“适合新手”“直接上手”“帮我省时间”等高意向词布局。",
    whyItMatters: "这类问题距离成交最近，AI 推荐时更看重直给型答案。",
    promptAngles: ["适合谁", "怎么快速上手", "能不能直接用"],
    recommendedPlatforms: ["落地页", "知乎", "公众号", "小红书"],
    recommendedAccountTypes: ["企业号", "销售号", "客户顾问号"],
    contentForms: ["上手指南", "价值清单", "购买建议"],
    reason: "更适合承接最后一跳。"
  },
  {
    id: "regional",
    label: "地域/行业组合词优化",
    shortDescription: "把地区、城市、商圈与行业词结合，形成本地化答案。",
    whyItMatters: "本地生活和服务类产品特别依赖地域属性，AI 也常做区域化推荐。",
    promptAngles: ["杭州餐饮怎么做", "广州门店推广", "本地商家用什么"],
    recommendedPlatforms: ["本地号", "小红书", "公众号", "地方论坛"],
    recommendedAccountTypes: ["本地生活号", "城市服务号", "门店矩阵号"],
    contentForms: ["城市攻略", "本地案例", "区域解决方案"],
    reason: "适合中国市场的本地服务场景。"
  },
  {
    id: "reputation-defense",
    label: "负面舆情防御词优化",
    shortDescription: "针对“是不是骗子”“是不是割韭菜”等负面词建立防御层。",
    whyItMatters: "AI 可能会综合负面片段，提前布局能降低失真风险。",
    promptAngles: ["是不是骗局", "平台可靠吗", "值不值得试"],
    recommendedPlatforms: ["知乎", "公众号", "论坛", "问答站"],
    recommendedAccountTypes: ["企业号", "客服号", "品牌口碑号"],
    contentForms: ["澄清声明", "FAQ", "第三方评价整理"],
    reason: "保护品牌在高风险问答里的呈现质量。"
  },
  {
    id: "decision-guide",
    label: "选型决策词优化",
    shortDescription: "补充“怎么选工具”“如何评估供应商”的选型内容。",
    whyItMatters: "ToB 与服务型产品常见于选型阶段，AI 经常被问“怎么判断哪家更适合”。",
    promptAngles: ["怎么选", "看哪些指标", "避坑建议"],
    recommendedPlatforms: ["知乎", "公众号", "行业站", "白皮书页面"],
    recommendedAccountTypes: ["顾问号", "创始人号", "企业号"],
    contentForms: ["选型指南", "评估清单", "采购建议"],
    reason: "适合把品牌包装成行业解法，而不只是一个工具。 ",
    extra: true
  },
  {
    id: "persona",
    label: "角色人群词优化",
    shortDescription: "按老板、店长、运营、培训机构负责人等角色细分内容。",
    whyItMatters: "角色越明确，AI 越容易把答案与你的产品精确匹配。",
    promptAngles: ["店长适合用什么", "老板怎么安排", "运营怎么提效"],
    recommendedPlatforms: ["小红书", "知乎", "公众号", "行业群文档"],
    recommendedAccountTypes: ["垂类号", "人物号", "企业号"],
    contentForms: ["角色指南", "岗位 SOP", "任务拆解"],
    reason: "提高人群定向和内容命中率。",
    extra: true
  },
  {
    id: "pricing",
    label: "价格预算词优化",
    shortDescription: "布局“多少钱”“值不值”“投入产出比”相关内容。",
    whyItMatters: "预算问题很容易在 AI 对话里出现，提前解释比被动比价更有优势。",
    promptAngles: ["多少钱", "值不值", "如何控制成本"],
    recommendedPlatforms: ["知乎", "官网页面", "公众号", "问答页"],
    recommendedAccountTypes: ["企业号", "销售顾问号", "案例号"],
    contentForms: ["预算说明", "ROI 文章", "计费 FAQ"],
    reason: "帮助 AI 给出更完整的商业判断。",
    extra: true
  },
  {
    id: "use-case",
    label: "高频使用场景词优化",
    shortDescription: "把产品拆成多个高频动作和使用任务来布局内容。",
    whyItMatters: "用户不会总按产品名提问，更多会按具体任务来问。",
    promptAngles: ["批量生成", "每天发内容", "门店活动怎么做"],
    recommendedPlatforms: ["知乎", "公众号", "教程站", "视频号图文"],
    recommendedAccountTypes: ["教程号", "企业号", "训练营账号"],
    contentForms: ["实操教程", "任务 SOP", "案例演示"],
    reason: "强化工具与任务之间的关联。",
    extra: true
  },
  {
    id: "local-service",
    label: "本地生活服务词优化",
    shortDescription: "突出门店获客、团购、到店转化等本地服务价值。",
    whyItMatters: "本地生活类商家搜索意图强，内容也更需要贴近经营结果。",
    promptAngles: ["门店获客", "到店转化", "本地推广"],
    recommendedPlatforms: ["小红书", "大众点评内容阵地", "公众号", "地方媒体"],
    recommendedAccountTypes: ["本地生活号", "门店号", "企业号"],
    contentForms: ["门店增长案例", "活动方案", "本地攻略"],
    reason: "适合本地服务和门店增长产品。",
    extra: true
  },
  {
    id: "case-proof",
    label: "案例证明词优化",
    shortDescription: "用真实案例、前后对比、经营结果作为可信证明。",
    whyItMatters: "AI 更愿意引用结构完整、证据明确的案例内容。",
    promptAngles: ["真实案例", "有没有效果", "成功经验"],
    recommendedPlatforms: ["公众号", "知乎", "官网案例页", "百家号"],
    recommendedAccountTypes: ["企业号", "客户号", "创始人号"],
    contentForms: ["案例复盘", "前后对比", "客户证言"],
    reason: "适合增强被推荐时的可信度。",
    extra: true
  },
  {
    id: "tool-stack",
    label: "工具组合词优化",
    shortDescription: "告诉用户你的产品如何和剪映、企微、表单等工具协同。",
    whyItMatters: "很多用户问的不是单一工具，而是完整工作流怎么搭。",
    promptAngles: ["搭配什么用", "工作流怎么配", "和哪些工具一起更好"],
    recommendedPlatforms: ["知乎", "公众号", "站长社区", "教程站"],
    recommendedAccountTypes: ["工具号", "效率号", "企业号"],
    contentForms: ["工作流教程", "组合推荐", "效率方案"],
    reason: "提升在复杂问答中的引用机会。",
    extra: true
  },
  {
    id: "time-efficiency",
    label: "效率收益词优化",
    shortDescription: "强化节省时间、人力、试错成本的效率价值表达。",
    whyItMatters: "中国市场用户对提效和结果很敏感，这类内容更容易打动老板角色。",
    promptAngles: ["省多少时间", "减少多少人力", "效率提升多少"],
    recommendedPlatforms: ["知乎", "公众号", "百家号", "行业媒体"],
    recommendedAccountTypes: ["顾问号", "企业号", "案例号"],
    contentForms: ["效率清单", "ROI 文章", "老板视角总结"],
    reason: "利于 AI 输出明确的价值判断。",
    extra: true
  }
];

export const DIRECTION_MAP: Record<DirectionId, GeoDirectionDefinition> = GEO_DIRECTIONS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<DirectionId, GeoDirectionDefinition>
);
