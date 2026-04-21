import { DIRECTION_MAP } from "@/lib/geo-config";
import { DistributionMatrixCell, GeoDirectionResult } from "@/lib/types";

const matrixPlatforms = [
  "知乎",
  "小红书",
  "公众号",
  "百家号",
  "搜狐号",
  "站长类博客",
  "论坛/问答站",
  "行业垂直站",
  "企业官网/blog",
  "视频平台配文页"
];

export function buildDistributionMatrix(directions: GeoDirectionResult[]): DistributionMatrixCell[] {
  return directions.flatMap((direction) =>
    matrixPlatforms.map((platform) => {
      const recommended =
        direction.publishPlatforms.includes(platform) ||
        (platform === "企业官网/blog" && direction.recommendedOwnedMedia.length > 0) ||
        (platform === "论坛/问答站" && direction.citationScore.qaMatch > 75);

      return {
        directionId: direction.id,
        directionName: DIRECTION_MAP[direction.id].label,
        platform,
        recommended,
        contentType: recommended
          ? direction.distributedRecommendation.contentMix[0] ?? "问答型内容"
          : "可选补充",
        accountType: recommended ? direction.accountTypes[0] ?? "企业号" : "不优先",
        frequency: recommended ? direction.distributedRecommendation.rhythm : "暂不优先",
        articleCount: recommended ? Math.max(1, Math.ceil(direction.distributedRecommendation.articleCount / 3)) : 0,
        multiVersion: recommended ? direction.distributedRecommendation.multiVersion : false
      };
    })
  );
}
