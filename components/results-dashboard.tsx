"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Copy, FileText, Layers3, Radar, Sparkles } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { generateGeoResult } from "@/lib/rule-engine";
import { loadResult } from "@/lib/storage";
import { GeoGenerationResult } from "@/lib/types";
import { defaultCase } from "@/mock/default-case";

export function ResultsDashboard() {
  const [result, setResult] = useState<GeoGenerationResult>(() => generateGeoResult(defaultCase));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = loadResult();
    if (stored) setResult(stored);
  }, []);

  const topDirections = useMemo(() => result.summary.topDirections, [result]);
  const topScored = useMemo(() => result.directions.slice(0, 5), [result]);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="GEO 策略总览"
          desc="这是系统自动生成的结果摘要，可用于向客户或团队演示整体策略方向。"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard label="品牌名称" value={result.summary.brandName} />
            <InfoCard label="产品名称" value={result.summary.productName} />
            <InfoCard label="目标 AI 平台" value={result.summary.aiPlatforms.join("、")} />
            <InfoCard label="目标人群" value={result.summary.audience} />
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <SimpleList title="推荐优先优化方向 TOP 5" items={topDirections} />
            <SimpleList title="建议先做的内容矩阵" items={result.summary.contentMatrix} />
          </div>

          <div className="mt-5 rounded-3xl border border-slate-100 bg-white p-5">
            <div className="mb-3 text-sm font-semibold text-slate-800">产品定位升级后的目标</div>
            <p className="text-sm leading-6 text-slate-600">{result.summary.distributedGoal}</p>
          </div>

          <div className="mt-5 rounded-3xl border border-brand-100 bg-brand-50/80 p-5">
            <div className="mb-2 text-sm font-semibold text-brand-800">Quick Wins</div>
            <div className="grid gap-2 text-sm leading-6 text-brand-900">
              {result.summary.quickWins.map((item) => (
                <div key={item}>• {item}</div>
              ))}
            </div>
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="操作区" desc="可以继续查看方向详情、生成文章，或直接复制结果摘要。">
            <div className="grid gap-3">
              <AnchorButton href="#priority-panel" label="查看优先级决策" />
              <AnchorButton href="#matrix-panel" label="查看占位矩阵" />
              <AnchorButton href="#cluster-panel" label="查看内容集群" />
              <AnchorButton href="#plan-panel" label="查看30天执行方案" />
              <AnchorButton href="#score-panel" label="查看AI引用评分" />
              <Link
                href="/publishing"
                className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
              >
                查看账号策略
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/articles"
                className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
              >
                进入文章生成页
                <FileText className="h-4 w-4" />
              </Link>
              <Link
                href="/publishing"
                className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
              >
                查看发布建议
                <Layers3 className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1600);
                }}
                className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
              >
                {copied ? "已复制完整结果 JSON" : "复制完整结果"}
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </SectionCard>

          <div className="rounded-[2rem] bg-gradient-to-br from-brand-900 via-brand-800 to-ink p-6 text-white">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-brand-100">
              <Sparkles className="h-4 w-4" />
              默认演示流程已就绪
            </div>
            <p className="text-sm leading-7 text-brand-50">
              即使没有重新填写表单，这个 Demo 也会自动加载“商家牛简单拍”的一套完整 GEO 结果，方便你一打开就能演示。
            </p>
          </div>
        </div>
      </section>

      <SectionCard
        title="GEO 优先级决策引擎"
        desc="系统会自动判断哪些方向更值得优先做，避免把 GEO 理解成平均铺文。"
        className="scroll-mt-24"
      >
        <div id="priority-panel" className="grid gap-4 lg:grid-cols-4">
          <TierCard title="S 级优先方向" items={result.priorityOverview.sTier} tone="brand" />
          <TierCard title="A 级优先方向" items={result.priorityOverview.aTier} tone="ink" />
          <TierCard title="B 级可选方向" items={result.priorityOverview.bTier} tone="slate" />
          <TierCard title="当前不建议先做" items={result.priorityOverview.holdTier} tone="sand" />
        </div>
      </SectionCard>

      <SectionCard
        title="AI 产品理解与知识库沉淀"
        desc="系统先理解你的产品，再把关键信息沉淀成后续可复用的知识库，而不是直接跳去写文章。"
      >
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-100 bg-white p-5">
              <div className="mb-2 text-sm font-semibold text-slate-800">品牌理解摘要</div>
              <p className="text-sm leading-7 text-slate-600">{result.knowledgeBase.brandSummary}</p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-5">
              <div className="mb-2 text-sm font-semibold text-slate-800">产品定位表达</div>
              <p className="text-sm leading-7 text-slate-600">{result.knowledgeBase.productPositioning}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <SimpleList title="核心目标人群" items={result.knowledgeBase.targetUsers} />
              <SimpleList title="核心使用场景" items={result.knowledgeBase.coreScenes} />
            </div>
          </div>

          <div className="space-y-4">
            <SimpleList title="建议沉淀进知识库的卖点" items={result.knowledgeBase.strengths} />
            <SimpleList title="建议长期保持一致的差异化" items={result.knowledgeBase.differentiators} />
            <SimpleList title="FAQ 种子问题" items={result.knowledgeBase.faqSeeds} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-brand-100 bg-brand-50/70 p-5">
            <div className="mb-3 text-sm font-semibold text-brand-800">AI 二次互动补充问题</div>
            <div className="grid gap-3">
              {result.knowledgeBase.clarificationQuestions.map((item) => (
                <div key={item.question} className="rounded-2xl bg-white px-4 py-4">
                  <div className="font-medium text-slate-900">{item.question}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-5">
            <div className="mb-3 text-sm font-semibold text-slate-800">知识库沉淀卡片</div>
            <div className="grid gap-3">
              {result.knowledgeBase.cards.map((card) => (
                <div key={card.title} className="rounded-2xl bg-slate-50 px-4 py-4">
                  <div className="font-medium text-slate-900">{card.title}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">{card.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="AI 引用友好度总览"
        desc="系统会从问答匹配、结构清晰度、证据感和多平台适配度几个维度做评分。"
        className="scroll-mt-24"
      >
        <div id="score-panel" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topScored.map((direction) => (
            <div key={direction.id} className="rounded-3xl border border-slate-100 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-lg font-semibold text-ink">{direction.name}</div>
                <div className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
                  {direction.citationScore.total}
                </div>
              </div>
              <ScoreRow label="可读性" value={direction.citationScore.readability} />
              <ScoreRow label="问答匹配度" value={direction.citationScore.qaMatch} />
              <ScoreRow label="证据感" value={direction.citationScore.evidence} />
              <ScoreRow label="多平台适配" value={direction.citationScore.multiPlatform} />
              <div className="mt-4 grid gap-2">
                {direction.citationScore.suggestions.slice(0, 2).map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="GEO 优化方向拆解"
        desc="系统不只告诉你写什么，还会告诉你这个方向处于决策链哪一环、该用单篇还是矩阵打法。"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.directions.map((direction) => (
            <div key={direction.id} className="rounded-3xl border border-slate-100 bg-white p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-ink">{direction.name}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                    {direction.priorityDecision.tier} 级 / {direction.priorityDecision.stage} / {direction.priorityDecision.strategyMode}
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{direction.publishPlatforms[0]}</span>
              </div>
              <p className="text-sm leading-6 text-slate-500">{direction.explanation}</p>

              <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-sm leading-6 text-brand-900">
                AI 引用友好度 {direction.citationScore.total} / 100
              </div>

              <div className="mt-4 grid gap-2">
                {direction.questionTemplates.slice(0, 3).map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <Link
                  href={`/directions/${direction.id}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-brand-700"
                >
                  查看详情
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/articles?direction=${direction.id}`}
                  className="text-sm text-slate-500 transition hover:text-slate-900"
                >
                  生成文章
                </Link>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="GEO 占位矩阵"
        desc="横轴是 GEO 方向，纵轴是平台与账号类型。这个视图帮助判断应该做单点内容还是分布式占位。"
        className="scroll-mt-24"
      >
        <div id="matrix-panel" className="overflow-x-auto">
          <div className="min-w-[980px] space-y-3">
            {result.distributionMatrix.slice(0, 30).map((cell) => (
              <div key={`${cell.directionId}-${cell.platform}`} className="grid grid-cols-[180px_140px_140px_120px_120px_120px] gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-sm">
                <div className="font-medium text-slate-900">{cell.directionName}</div>
                <div className="text-slate-600">{cell.platform}</div>
                <div className={cell.recommended ? "text-brand-700" : "text-slate-400"}>{cell.recommended ? "建议布局" : "可延后"}</div>
                <div className="text-slate-600">{cell.contentType}</div>
                <div className="text-slate-600">{cell.accountType}</div>
                <div className="text-slate-600">
                  {cell.articleCount > 0 ? `${cell.articleCount} 篇 / ${cell.multiVersion ? "多版本" : "单版本"}` : "暂不优先"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="内容集群视图"
        desc="不是只看单篇文章，而是看这个方向应该拆成怎样的内容簇。"
        className="scroll-mt-24"
      >
        <div id="cluster-panel" className="grid gap-4 lg:grid-cols-2">
          {result.directions.slice(0, 4).map((direction) => (
            <div key={direction.id} className="rounded-3xl border border-slate-100 bg-white p-5">
              <div className="mb-2 flex items-center gap-2 text-sm text-brand-700">
                <Radar className="h-4 w-4" />
                {direction.name}
              </div>
              <div className="text-lg font-semibold text-ink">{direction.cluster.mainTopic}</div>
              <div className="mt-4 grid gap-2">
                {direction.cluster.subTopics.map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-600">
                {direction.cluster.contentPackage.map((item) => (
                  <div key={item}>• {item}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="30 天执行路径"
        desc="系统会按周拆分执行动作，告诉你该先铺什么、发到哪里、用什么账号承接。"
        className="scroll-mt-24"
      >
        <div id="plan-panel" className="grid gap-4 lg:grid-cols-2">
          {result.executionPlan.monthPlan.map((step) => (
            <div key={step.label} className="rounded-3xl border border-slate-100 bg-white p-5">
              <div className="text-lg font-semibold text-ink">{step.label}</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.focus}</p>
              <div className="mt-4 grid gap-2 text-sm text-slate-600">
                <div>建议写 {step.articleCount} 篇</div>
                <div>建议平台：{step.platforms.join("、")}</div>
                <div>建议账号：{step.accountTypes.join("、")}</div>
                <div>建议方向：{step.directions.join("、")}</div>
                <div>内容组合：{step.contentMix.join("、")}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="GEO 专业指导" desc="用户会判断你是否专业，往往就看这些策略细节有没有讲透。">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.directions.slice(0, 6).map((direction) => (
            <div key={direction.id} className="rounded-3xl border border-slate-100 bg-white p-5">
              <div className="mb-3 text-lg font-semibold text-ink">{direction.name}</div>
              <div className="grid gap-2 text-sm text-slate-600">
                <div>发布时间：{direction.professionalGuidance.publishTiming}</div>
                <div>账号权重：{direction.professionalGuidance.accountWeightAdvice}</div>
                <div>覆盖密度：{direction.professionalGuidance.coverageDensityAdvice}</div>
                <div>评论互动：{direction.professionalGuidance.commentSeedingAdvice}</div>
                <div>投流放大：{direction.professionalGuidance.paidAmplificationAdvice}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="默认文章草稿预览" desc="系统会自动为重点方向生成一组可演示文章草稿。">
        <div className="grid gap-4 lg:grid-cols-2">
          {result.defaultArticles.map((article) => (
            <div key={`${article.directionId}-${article.articleType}`} className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">{article.articleType}</div>
              <div className="text-lg font-semibold text-ink">{article.title}</div>
              <p className="mt-3 text-sm leading-6 text-slate-500">{article.summary}</p>
              <Link href={`/articles?direction=${article.directionId}`} className="mt-4 inline-flex items-center gap-2 text-sm text-brand-700">
                打开文章工作台
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={result.riskReminder.title} desc="系统内置低质量批量生成提醒，避免把 GEO 做成无差异灌水。">
        <div className="grid gap-2">
          {result.riskReminder.items.map((item) => (
            <div key={item} className="rounded-2xl border border-accent-100 bg-accent-50 px-4 py-3 text-sm text-accent-600">
              {item}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-2 text-base font-semibold text-ink">{value}</div>
    </div>
  );
}

function SimpleList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5">
      <div className="mb-3 text-sm font-semibold text-slate-800">{title}</div>
      <div className="grid gap-2">
        {items.map((item) => (
          <div key={item} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-brand-700" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function AnchorButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}

function TierCard({
  title,
  items,
  tone
}: {
  title: string;
  items: string[];
  tone: "brand" | "ink" | "slate" | "sand";
}) {
  const toneClass = {
    brand: "border-brand-100 bg-brand-50/80",
    ink: "border-slate-200 bg-slate-50/80",
    slate: "border-slate-100 bg-white",
    sand: "border-amber-100 bg-amber-50/70"
  }[tone];

  return (
    <div className={`rounded-3xl border p-5 ${toneClass}`}>
      <div className="mb-3 text-sm font-semibold text-slate-800">{title}</div>
      <div className="grid gap-2">
        {items.length ? (
          items.map((item) => (
            <div key={item} className="rounded-2xl bg-white/80 px-3 py-2 text-sm text-slate-700">
              {item}
            </div>
          ))
        ) : (
          <div className="text-sm text-slate-400">暂无</div>
        )}
      </div>
    </div>
  );
}
