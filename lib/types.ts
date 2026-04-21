export type Priority = "高" | "中" | "低";
export type PriorityTier = "S" | "A" | "B" | "暂缓";
export type StrategyStage = "获客" | "教育" | "转化" | "截流" | "防御";
export type StrategyMode = "单篇打法" | "系列打法" | "矩阵打法" | "集群打法";
export type BrandAwareness = "新品牌" | "有一定认知" | "较高知名度";
export type DecisionCost = "低" | "中" | "高";
export type RiskLevel = "低" | "中" | "高";
export type AccountType = "企业号" | "创始人号" | "垂类号" | "素人号" | "测评号" | "老账号" | "新账号";

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
  brandAwareness: BrandAwareness;
  decisionCost: DecisionCost;
  negativeRisk: RiskLevel;
}

export interface CitationScore {
  total: number;
  readability: number;
  qaMatch: number;
  evidence: number;
  multiPlatform: number;
  suggestions: string[];
}

export interface DirectionPriorityDecision {
  directionId: DirectionId;
  tier: PriorityTier;
  score: number;
  reasons: string[];
  stage: StrategyStage;
  strategyMode: StrategyMode;
}

export interface DistributedRecommendation {
  articleCount: number;
  platformCount: number;
  multipleAccounts: boolean;
  multiVersion: boolean;
  contentMix: string[];
  rhythm: string;
}

export interface ContentCluster {
  directionId: DirectionId;
  mainTopic: string;
  subTopics: string[];
  contentPackage: string[];
  totalPieces: number;
  pillarThemes: string[];
  longTailQuestions: string[];
}

export interface ContentVariant {
  variantName: string;
  angle: string;
  sampleTitle: string;
  bestPlatforms: string[];
  outline: string[];
}

export interface EvidenceEnhancement {
  missingSignals: string[];
  recommendedSignals: string[];
  whyBetterForAi: string[];
}

export interface KnowledgeBaseCard {
  title: string;
  content: string;
}

export interface ClarificationQuestion {
  question: string;
  reason: string;
}

export interface ProductKnowledgeBase {
  brandSummary: string;
  productPositioning: string;
  targetUsers: string[];
  coreScenes: string[];
  strengths: string[];
  differentiators: string[];
  faqSeeds: string[];
  clarificationQuestions: ClarificationQuestion[];
  cards: KnowledgeBaseCard[];
}

export interface GeoProfessionalGuidance {
  publishTiming: string;
  accountWeightAdvice: string;
  coverageDensityAdvice: string;
  commentSeedingAdvice: string;
  paidAmplificationAdvice: string;
  riskBoundary: string;
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
  priorityDecision: DirectionPriorityDecision;
  publishPlatforms: string[];
  accountTypes: string[];
  reason: string;
  coverIdeas: string[];
  imageThemes: string[];
  graphicStructure: string[];
  videoAngles: string[];
  proofSuggestions: string[];
  endorsementAdvice: string;
  citationScore: CitationScore;
  distributedRecommendation: DistributedRecommendation;
  accountStrategy: string[];
  recommendedOwnedMedia: string[];
  cluster: ContentCluster;
  variants: ContentVariant[];
  evidenceEnhancement: EvidenceEnhancement;
  professionalGuidance: GeoProfessionalGuidance;
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
  citationScore: CitationScore;
  variants: ContentVariant[];
  evidenceEnhancement: EvidenceEnhancement;
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
  accountStrategyLines: string[];
}

export interface GeoStrategySummary {
  brandName: string;
  productName: string;
  aiPlatforms: string[];
  audience: string;
  topDirections: string[];
  contentMatrix: string[];
  quickWins: string[];
  distributedGoal: string;
}

export interface PriorityOverview {
  sTier: string[];
  aTier: string[];
  bTier: string[];
  holdTier: string[];
}

export interface DistributionMatrixCell {
  directionId: DirectionId;
  directionName: string;
  platform: string;
  recommended: boolean;
  contentType: string;
  accountType: string;
  frequency: string;
  articleCount: number;
  multiVersion: boolean;
}

export interface ExecutionStep {
  label: string;
  focus: string;
  articleCount: number;
  platforms: string[];
  accountTypes: string[];
  directions: string[];
  contentMix: string[];
}

export interface ExecutionPlan {
  shortTerm: ExecutionStep[];
  monthPlan: ExecutionStep[];
}

export interface GeoRiskReminder {
  title: string;
  items: string[];
}

export interface MonitoringPlaceholder {
  contentPlatform: string;
  publishedAt?: string;
  accountType: string;
  directionId: DirectionId;
  deployed: boolean;
  hasMultiVersion: boolean;
  hasCaseStudy: boolean;
  hasFaq: boolean;
  hasComparison: boolean;
  citationScore: number;
  clicks?: number;
  indexStatus?: string;
  aiMentions?: number;
  citedUrl?: string;
  brandFrequency?: number;
}

export interface GeoGenerationResult {
  taskInput: GeoTaskInput;
  summary: GeoStrategySummary;
  knowledgeBase: ProductKnowledgeBase;
  priorityOverview: PriorityOverview;
  directions: GeoDirectionResult[];
  publishingGuides: PlatformPublishingGuide[];
  distributionMatrix: DistributionMatrixCell[];
  executionPlan: ExecutionPlan;
  defaultArticles: ArticleDraft[];
  riskReminder: GeoRiskReminder;
  monitoringTemplate: MonitoringPlaceholder[];
  generatedAt: string;
}
