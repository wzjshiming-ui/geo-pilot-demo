import { GeoTaskInput } from "@/lib/types";

export const defaultCase: GeoTaskInput = {
  brandName: "商家牛简单拍",
  productName: "AI短视频生成系统",
  oneLiner: "帮助实体商家低门槛、高效率生成短视频内容",
  industry: "AI营销 / 本地生活 / 实体门店增长",
  audience: "实体商家、门店老板、餐饮、美业、工厂老板",
  sellingPoints: [
    "不会拍也能做视频",
    "不会写文案也能生成脚本",
    "降低出镜门槛",
    "提高短视频获客效率"
  ],
  painPoints: ["不会拍视频", "不会剪视频", "没时间做内容", "做了内容没效果"],
  differentiation: ["更适合实体门店", "更偏结果导向", "更适合中国本地商家场景"],
  competitorBrands: ["剪映类工具", "通用 AI 视频工具", "其他短视频 SaaS 工具"],
  bannedWords: ["保底爆单", "稳赚不赔", "100%起号"],
  website: "https://demo.niujiandanpai.cn",
  contact: "微信：NJDPAI-DEMO",
  brandAwareness: "新品牌",
  decisionCost: "高",
  negativeRisk: "中",
  aiPlatforms: ["豆包", "Kimi", "腾讯元宝", "通义千问"],
  customPlatforms: [],
  selectedDirections: [
    "brand",
    "brand-reputation",
    "pain-point",
    "scenario",
    "solution",
    "industry",
    "competitor",
    "comparison",
    "objection",
    "conversion",
    "regional",
    "reputation-defense",
    "decision-guide",
    "persona",
    "pricing",
    "use-case",
    "local-service",
    "case-proof",
    "tool-stack",
    "time-efficiency"
  ]
};
