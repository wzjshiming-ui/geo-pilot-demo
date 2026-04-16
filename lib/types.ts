export type Priority = "高" | "中" | "低";

export type ArticleType = "标准问答型文章" | "口碑型文章" | "对比型文章" | "场景解决方案型文章";

export type DirectionId =
  | "brand"
  | "brand-reputation"
  | "pain-point"
  | "scenario"
  | "solution"
  | "industry"
  | "competitor"
  | "comparison"
  | "objection"
  | "conversion"
  | "regional"
  | "reputation-defense"
  | "decision-guide"
  | "persona"
  | "pricing"
  | "use-case"
  | "local-service"
  | "case-proof"
  | "tool-stack"
  | "time-efficiency";

export interface GeoDirectionDefinition {
  id: DirectionId;
  label: string;
  shortDescription: string;
  whyItMatters: string;
  promptAngles: string[];
  recommendedPlatforms: string[];
  recommendedAccountTypes: string[];
  contentForms: string[];
  reason: string;
  extra?: boolean;
}

export interface GeoTaskInput {
  brandName: string;
  productName: string;
  oneLiner: string;
  industry: string;
  audience: string;
  sellingPoints: string[];
  painPoints: string[];
  differentiation: string[];
  competitorBrands: string[];
  bannedWords: string[];
  website?: string;
  contact?: string;
  aiPlatforms: string[];
  selectedDirections: DirectionId[];
  customPlatforms: string[];
}

export interface GeoDirectionResult {
  id: DirectionId;
  name: string;
  explanation: string;
  whyWorthDoing: string;
  userIntent: string[];
  questionTemplates: string[];
  titleIdeas: string[];
  contentStructures: string[];
  priority: Priority;
  publishPlatforms: string[];
  accountTypes: string[];
  reason: string;
  coverIdeas: string[];
  imageThemes: string[];
  graphicStructure: string[];
  videoAngles: string[];
  proofSuggestions: string[];
  endorsementAdvice: string;
}

export interface ArticleDraft {
  articleType: ArticleType;
  directionId: DirectionId;
  directionName: string;
  title: string;
  summary: string;
  intro: string;
  sections: Array<{
    heading: string;
    content: string;
  }>;
  faq: Array<{
    question: string;
    answer: string;
  }>;
  closing: string;
  imageSuggestion: string;
}

export interface PlatformPublishingGuide {
  platform: string;
  recommendedChannels: string[];
  platformTraits: string;
  contentTypes: string[];
  accountSuggestions: string[];
  sections: string[];
  cadence: string;
  matrixAdvice: string[];
}

export interface GeoStrategySummary {
  brandName: string;
  productName: string;
  aiPlatforms: string[];
  audience: string;
  topDirections: string[];
  contentMatrix: string[];
  quickWins: string[];
}

export interface GeoGenerationResult {
  taskInput: GeoTaskInput;
  summary: GeoStrategySummary;
  directions: GeoDirectionResult[];
  publishingGuides: PlatformPublishingGuide[];
  defaultArticles: ArticleDraft[];
  generatedAt: string;
}
