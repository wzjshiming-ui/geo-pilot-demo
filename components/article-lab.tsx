"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { generateArticleDraft, generateGeoResult } from "@/lib/rule-engine";
import { loadResult } from "@/lib/storage";
import { ArticleDraft, ArticleType, DirectionId, GeoGenerationResult } from "@/lib/types";
import { defaultCase } from "@/mock/default-case";

const articleTypes: ArticleType[] = ["标准问答型文章", "口碑型文章", "对比型文章", "场景解决方案型文章"];

export function ArticleLab() {
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<GeoGenerationResult>(() => generateGeoResult(defaultCase));
  const [selectedDirection, setSelectedDirection] = useState<DirectionId>("brand");
  const [selectedType, setSelectedType] = useState<ArticleType>("标准问答型文章");
  const [draft, setDraft] = useState<ArticleDraft>(() => generateArticleDraft(defaultCase, "brand", "标准问答型文章"));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = loadResult();
    const activeResult = stored ?? generateGeoResult(defaultCase);
    setResult(activeResult);
    const requestedDirection = searchParams.get("direction") as DirectionId | null;
    const fallbackDirection = activeResult.directions[0]?.id ?? "brand";
    const direction = activeResult.directions.some((item) => item.id === requestedDirection)
      ? (requestedDirection as DirectionId)
      : fallbackDirection;
    setSelectedDirection(direction);
    setDraft(generateArticleDraft(activeResult.taskInput, direction, "标准问答型文章"));
  }, [searchParams]);

  const currentDirection = useMemo(
    () => result.directions.find((item) => item.id === selectedDirection),
    [result, selectedDirection]
  );

  async function handleGenerate() {
    startTransition(async () => {
      const response = await fetch("/api/article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskInput: result.taskInput,
          directionId: selectedDirection,
          articleType: selectedType
        })
      });
      const nextDraft = await response.json();
      setDraft(nextDraft);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <SectionCard title="文章生成器" desc="按方向和文章类型快速生成可复制的中文文章草稿。">
        <div className="space-y-5">
          <div>
            <div className="mb-2 text-sm font-semibold text-slate-800">选择 GEO 方向</div>
            <div className="grid gap-2">
              {result.directions.map((direction) => (
                <button
                  key={direction.id}
                  type="button"
                  onClick={() => setSelectedDirection(direction.id)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    selectedDirection === direction.id
                      ? "border-brand-700 bg-brand-700 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-brand-300"
                  }`}
                >
                  <div className="font-medium">{direction.name}</div>
                  <div className={`mt-1 text-xs ${selectedDirection === direction.id ? "text-white/80" : "text-slate-400"}`}>
                    优先级 {direction.priority}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold text-slate-800">选择文章类型</div>
            <div className="grid gap-2">
              {articleTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    selectedType === type
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-800 disabled:opacity-70"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {pending ? "生成中..." : "生成文章草稿"}
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title={draft.title}
        desc={`当前方向：${currentDirection?.name ?? draft.directionName} / 当前类型：${draft.articleType}`}
      >
        <div className="mb-5 flex items-center justify-between rounded-3xl border border-brand-100 bg-brand-50/80 px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-brand-800">SEO / GEO 摘要</div>
            <p className="mt-2 text-sm leading-6 text-brand-900">{draft.summary}</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              const text = [
                draft.title,
                draft.summary,
                draft.intro,
                ...draft.sections.map((section) => `${section.heading}\n${section.content}`),
                ...draft.faq.map((item) => `${item.question}\n${item.answer}`),
                draft.closing,
                draft.imageSuggestion
              ].join("\n\n");
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm text-brand-700"
          >
            <Copy className="h-4 w-4" />
            {copied ? "已复制" : "复制文章"}
          </button>
        </div>

        <article className="space-y-6">
          <section className="rounded-3xl border border-slate-100 bg-white p-5">
            <div className="mb-2 text-sm font-semibold text-slate-800">引言</div>
            <p className="text-sm leading-7 text-slate-600">{draft.intro}</p>
          </section>

          <section className="grid gap-4">
            {draft.sections.map((section) => (
              <div key={section.heading} className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
                <h3 className="text-lg font-semibold text-ink">{section.heading}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{section.content}</p>
              </div>
            ))}
          </section>

          <section className="rounded-3xl border border-slate-100 bg-white p-5">
            <div className="mb-4 text-sm font-semibold text-slate-800">FAQ 问答</div>
            <div className="grid gap-3">
              {draft.faq.map((item) => (
                <div key={item.question} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="font-medium text-slate-900">{item.question}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-white p-5">
              <div className="mb-2 text-sm font-semibold text-slate-800">结尾引导</div>
              <p className="text-sm leading-7 text-slate-600">{draft.closing}</p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-5">
              <div className="mb-2 text-sm font-semibold text-slate-800">建议配图说明</div>
              <p className="text-sm leading-7 text-slate-600">{draft.imageSuggestion}</p>
            </div>
          </section>
        </article>
      </SectionCard>
    </div>
  );
}
