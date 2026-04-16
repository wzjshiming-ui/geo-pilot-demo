"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Copy, FileText, Layers3, Sparkles } from "lucide-react";
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
              即使没有重新填写表单，这个 Demo 也会自动加载“牛简单拍”的一套完整 GEO 结果，方便你一打开就能演示。
            </p>
          </div>
        </div>
      </section>

      <SectionCard
        title="GEO 优化方向拆解"
        desc="点击任意方向可进入详情页，继续查看问句、标题、素材建议和发布建议。"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.directions.map((direction) => (
            <div key={direction.id} className="rounded-3xl border border-slate-100 bg-white p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-ink">{direction.name}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">优先级 {direction.priority}</div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{direction.publishPlatforms[0]}</span>
              </div>
              <p className="text-sm leading-6 text-slate-500">{direction.explanation}</p>

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
