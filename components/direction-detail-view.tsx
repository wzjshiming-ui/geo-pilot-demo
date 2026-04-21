"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { generateGeoResult } from "@/lib/rule-engine";
import { loadResult } from "@/lib/storage";
import { GeoDirectionResult, GeoGenerationResult } from "@/lib/types";
import { defaultCase } from "@/mock/default-case";

export function DirectionDetailView({ directionId }: { directionId: string }) {
  const [result, setResult] = useState<GeoGenerationResult>(() => generateGeoResult(defaultCase));

  useEffect(() => {
    const stored = loadResult();
    if (stored) setResult(stored);
  }, []);

  const direction = useMemo<GeoDirectionResult | undefined>(
    () => result.directions.find((item) => item.id === directionId),
    [directionId, result]
  );

  if (!direction) {
    return (
      <SectionCard title="未找到该方向" desc="这个方向可能还没有被选中，可以先回到结果页查看默认案例。">
        <Link href="/results" className="inline-flex items-center gap-2 text-sm text-brand-700">
          <ArrowLeft className="h-4 w-4" />
          返回结果总览
        </Link>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/results" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          返回结果页
        </Link>
        <Link href={`/articles?direction=${direction.id}`} className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2 text-sm text-white">
          生成该方向文章
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title={direction.name} desc="该页用于展示单个 GEO 方向的完整拆解。">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoBlock title="方向说明" value={direction.explanation} />
            <InfoBlock title="为什么值得做" value={direction.whyWorthDoing} />
            <InfoBlock title="优先级判断" value={`${direction.priorityDecision.tier} 级 / ${direction.priorityDecision.stage} / ${direction.priorityDecision.strategyMode}`} />
            <InfoBlock title="推荐理由" value={direction.reason} />
          </div>
        </SectionCard>

        <SectionCard title="推荐发布策略" desc="按这个方向适配的平台、账号与打法做成矩阵。">
          <TagGroup title="推荐发布平台" items={direction.publishPlatforms} />
          <div className="mt-4" />
          <TagGroup title="推荐账号类型" items={direction.accountTypes} />
          <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm leading-6 text-brand-900">
            AI 引用友好度：{direction.citationScore.total} / 100
          </div>
        </SectionCard>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="为什么这个方向值得先做" desc="系统会解释它处于用户决策链哪一环，以及为什么应该优先。">
          <ListBlock items={direction.priorityDecision.reasons} />
        </SectionCard>
        <SectionCard title="单篇打法还是矩阵打法" desc="GEO 不只是写单篇，而是判断这个方向要不要做分布式占位。">
          <ListBlock
            items={[
              `当前建议：${direction.priorityDecision.strategyMode}`,
              `建议至少布局 ${direction.distributedRecommendation.articleCount} 篇内容`,
              `建议覆盖 ${direction.distributedRecommendation.platformCount} 个平台`,
              direction.distributedRecommendation.multipleAccounts ? "建议多账号布局" : "可先由主账号承接",
              direction.distributedRecommendation.multiVersion ? "建议多版本表达" : "可先单版本验证"
            ]}
          />
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="专业 GEO 指导" desc="不是只给内容，还要告诉用户实际执行时有哪些讲究。">
          <ListBlock
            items={[
              `发布时间建议：${direction.professionalGuidance.publishTiming}`,
              `账号权重建议：${direction.professionalGuidance.accountWeightAdvice}`,
              `覆盖密度建议：${direction.professionalGuidance.coverageDensityAdvice}`,
              `评论互动建议：${direction.professionalGuidance.commentSeedingAdvice}`,
              `投流放大建议：${direction.professionalGuidance.paidAmplificationAdvice}`
            ]}
          />
        </SectionCard>
        <SectionCard title="风险边界提醒" desc="系统会明确告诉用户什么是专业做法，什么是高风险做法。">
          <ListBlock items={[direction.professionalGuidance.riskBoundary]} />
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="用户搜索 / 提问意图" desc="这些问题是该方向最适合承接的 AI 问答意图。">
          <ListBlock items={direction.userIntent} />
        </SectionCard>
        <SectionCard title="推荐问句模板 10 条" desc="可直接拿去做问答标题、FAQ 页面或内容选题。">
          <ListBlock items={direction.questionTemplates} />
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="推荐内容标题 10 条" desc="适合知乎、公众号、小红书图文等中文内容平台。">
          <ListBlock items={direction.titleIdeas} />
        </SectionCard>
        <SectionCard title="推荐内容结构 3 套" desc="可作为长文、专题页和案例页的内容骨架。">
          <ListBlock items={direction.contentStructures} />
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="内容集群建议" desc="这个方向建议如何拆成主主题、子主题和内容簇。">
          <SubTitle title="主主题" />
          <div className="mb-4 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-700">{direction.cluster.mainTopic}</div>
          <SubTitle title="子主题" />
          <ListBlock items={direction.cluster.subTopics} />
          <SubTitle title="配套内容形式" className="mt-5" />
          <ListBlock items={direction.cluster.contentPackage} />
        </SectionCard>
        <SectionCard title="多表达版本" desc="同一个主题建议拆成不同视角，避免同质化。">
          <div className="grid gap-3">
            {direction.variants.map((variant) => (
              <div key={variant.variantName} className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                <div className="font-medium text-slate-900">{variant.variantName}</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">{variant.angle}</div>
                <div className="mt-2 text-sm text-brand-700">{variant.sampleTitle}</div>
                <div className="mt-2 text-xs text-slate-400">适合平台：{variant.bestPlatforms.join("、")}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="素材建议" desc="帮助你把方向内容做成更像真实运营资产的图文和短视频。">
          <SubTitle title="封面图思路 3 条" />
          <ListBlock items={direction.coverIdeas} />
          <SubTitle title="推荐配图主题 5 条" className="mt-5" />
          <ListBlock items={direction.imageThemes} />
        </SectionCard>
        <SectionCard title="内容包装建议" desc="适合交给设计、内容运营或短视频团队继续执行。">
          <SubTitle title="图文内容结构" />
          <ListBlock items={direction.graphicStructure} />
          <SubTitle title="短视频脚本角度 3 条" className="mt-5" />
          <ListBlock items={direction.videoAngles} />
          <SubTitle title="截图 / 案例素材建议" className="mt-5" />
          <ListBlock items={direction.proofSuggestions} />
          <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm leading-6 text-brand-900">
            建议背书方式：{direction.endorsementAdvice}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="证据信号增强" desc="补足这些证据信号后，更有机会被 AI 理解和引用。">
          <SubTitle title="当前缺少哪些信号" />
          <ListBlock items={direction.evidenceEnhancement.missingSignals} />
          <SubTitle title="建议补充哪些信号" className="mt-5" />
          <ListBlock items={direction.evidenceEnhancement.recommendedSignals} />
        </SectionCard>
        <SectionCard title="官网 / 自有站点布局建议" desc="GEO 不是只做外部分发，官网与 FAQ 页面同样重要。">
          <ListBlock items={direction.recommendedOwnedMedia} />
          <SubTitle title="账号策略" className="mt-5" />
          <ListBlock items={direction.accountStrategy} />
        </SectionCard>
      </div>
    </div>
  );
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="text-sm font-semibold text-slate-800">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-500">{value}</p>
    </div>
  );
}

function TagGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="mb-3 text-sm font-semibold text-slate-800">{title}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ListBlock({ items }: { items: string[] }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={item} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
          {item}
        </div>
      ))}
    </div>
  );
}

function SubTitle({ title, className = "" }: { title: string; className?: string }) {
  return <div className={`mb-3 text-sm font-semibold text-slate-800 ${className}`}>{title}</div>;
}
