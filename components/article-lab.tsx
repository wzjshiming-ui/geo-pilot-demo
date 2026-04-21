"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  Copy,
  Loader2,
  PenSquare,
  Send,
  Sparkles,
  Wand2,
  X,
  Image as ImageIcon,
  CheckCircle2
} from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { generateArticleDraft, generateGeoResult } from "@/lib/rule-engine";
import { loadResult } from "@/lib/storage";
import { ArticleDraft, ArticleType, DirectionId, GeoGenerationResult } from "@/lib/types";
import { defaultCase } from "@/mock/default-case";

const articleTypes: ArticleType[] = ["标准问答型文章", "口碑型文章", "对比型文章", "场景解决方案型文章"];
const imageStyles = ["专业 SaaS 封面", "真实案例感", "知乎问答风", "小红书卡片风"];
const publishGoals = ["提高 AI 引用概率", "适合知乎沉淀", "适合小红书转述", "适合官网承接"];
const aiAdjustPresets = ["更像知乎回答", "语气更口语化", "补强案例感", "补一个对比段", "更适合小红书表达"];
const preflightItems = ["标题是否直给", "是否有明确答案", "是否包含案例/FAQ/对比", "是否有官网承接页", "是否准备多版本"];

interface ArticleWorkbenchConfig {
  directionId: DirectionId;
  articleType: ArticleType;
  targetPlatform: string;
  accountType: string;
  expressionVariant: string;
  evidenceFocus: string;
  imageStyle: string;
  publishGoal: string;
}

interface GeneratedVisual {
  title: string;
  description: string;
  caption: string;
}

export function ArticleLab() {
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<GeoGenerationResult>(() => generateGeoResult(defaultCase));
  const [draft, setDraft] = useState<ArticleDraft>(() => generateArticleDraft(defaultCase, "brand", "标准问答型文章"));
  const [baseDraft, setBaseDraft] = useState<ArticleDraft>(() => generateArticleDraft(defaultCase, "brand", "标准问答型文章"));
  const [config, setConfig] = useState<ArticleWorkbenchConfig | null>(null);
  const [showWorkbench, setShowWorkbench] = useState(true);
  const [copied, setCopied] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [publishMode, setPublishMode] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [visuals, setVisuals] = useState<GeneratedVisual[]>([]);
  const [selectedPublishPlatforms, setSelectedPublishPlatforms] = useState<string[]>([]);
  const [checkedPreflight, setCheckedPreflight] = useState<string[]>([]);
  const [publishSuccess, setPublishSuccess] = useState(false);

  useEffect(() => {
    const stored = loadResult();
    const activeResult = stored ?? generateGeoResult(defaultCase);
    setResult(activeResult);
    const requestedDirection = searchParams.get("direction") as DirectionId | null;
    const fallbackDirection = activeResult.directions[0]?.id ?? "brand";
    const directionId = activeResult.directions.some((item) => item.id === requestedDirection)
      ? (requestedDirection as DirectionId)
      : fallbackDirection;

    const direction = activeResult.directions.find((item) => item.id === directionId) ?? activeResult.directions[0];
    const initialConfig: ArticleWorkbenchConfig = {
      directionId,
      articleType: "标准问答型文章",
      targetPlatform: direction?.publishPlatforms[0] ?? "知乎",
      accountType: direction?.accountTypes[0] ?? "企业号",
      expressionVariant: direction?.variants[0]?.variantName ?? "问答直给版",
      evidenceFocus: direction?.evidenceEnhancement.recommendedSignals[0] ?? "用户案例",
      imageStyle: imageStyles[0],
      publishGoal: publishGoals[0]
    };
    setConfig(initialConfig);
    setSelectedPublishPlatforms(direction?.publishPlatforms.slice(0, 2) ?? ["知乎", "公众号"]);
    setCheckedPreflight([]);
    autoGenerate(activeResult, initialConfig);
  }, [searchParams]);

  const currentDirection = useMemo(
    () => result.directions.find((item) => item.id === config?.directionId),
    [result, config]
  );

  async function autoGenerate(activeResult: GeoGenerationResult, nextConfig: ArticleWorkbenchConfig) {
    startTransition(async () => {
      const response = await fetch("/api/article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskInput: activeResult.taskInput,
          directionId: nextConfig.directionId,
          articleType: nextConfig.articleType
        })
      });
      const generated = (await response.json()) as ArticleDraft;
      const tuned = tuneDraftForWorkbench(generated, nextConfig, activeResult);
      setDraft(tuned);
      setBaseDraft(tuned);
      setVisuals(buildVisuals(tuned, nextConfig, activeResult));
      setShowWorkbench(false);
      setAiMode(false);
      setManualMode(false);
      setPublishMode(false);
      setPublishSuccess(false);
    });
  }

  function handleGenerateFromWorkbench() {
    if (!config) return;
    autoGenerate(result, config);
  }

  function applyAiAdjustment(instruction: string) {
    setAiMode(true);
    setManualMode(false);
    setPublishMode(false);
    setDraft((prev) => {
      const extraSentence = `AI 调整建议：${instruction}。请继续保持问题直给、结论清晰、场景具体。`;
      return {
        ...prev,
        summary: `${prev.summary} ${instruction.includes("小红书") ? "建议增加更短句的观点表达与结论前置。" : extraSentence}`,
        intro: `${prev.intro} ${instruction.includes("知乎") ? "这一版会更偏结构化回答风格。 " : ""}${instruction.includes("口语") ? "表达会更自然、更像真实用户交流。 " : ""}`,
        sections: prev.sections.map((section, index) => ({
          ...section,
          content:
            index === 1 && instruction.includes("案例")
              ? `${section.content} 建议补充一个真实商家在内容效率、获客流程或执行难度上的前后变化，让内容更像可被引用的案例。`
              : index === 2 && instruction.includes("对比")
                ? `${section.content} 同时建议补一个“人工方式 vs 工具方式”的简短对比段，增强决策参考价值。`
                : `${section.content}${index === 0 ? ` ${extraSentence}` : ""}`
        })),
        closing: `${prev.closing} 当前调整方向：${instruction}。`
      };
    });
  }

  const publishChecklist = useMemo(() => {
    if (!config || !currentDirection) return [];
    return [
      `目标平台：${config.targetPlatform}`,
      `承接账号：${config.accountType}`,
      `建议表达版本：${config.expressionVariant}`,
      `优先补强证据：${config.evidenceFocus}`,
      `建议同步官网页：${currentDirection.recommendedOwnedMedia.slice(0, 2).join("、")}`,
      currentDirection.distributedRecommendation.multiVersion ? "建议同主题至少同步 2 个不同表达版本" : "当前可先发布主版本验证"
    ];
  }, [config, currentDirection]);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <SectionCard
          title="文章生成工作台"
          desc="这里不再是手动慢慢配一堆选项，而是用一次性工作台确认生成策略，然后自动产出文章与配图预览。"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <InfoPill label="当前方向" value={currentDirection?.name ?? draft.directionName} />
            <InfoPill label="当前类型" value={draft.articleType} />
            <InfoPill label="目标平台" value={config?.targetPlatform ?? "知乎"} />
            <InfoPill label="承接账号" value={config?.accountType ?? "企业号"} />
          </div>

          <div className="mt-5 rounded-[1.75rem] border border-brand-100 bg-brand-50/80 p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-800">
              <Sparkles className="h-4 w-4" />
              自动生成逻辑
            </div>
            <p className="text-sm leading-6 text-brand-900">
              用户先在生成操作台选定方向、目标平台、表达版本、证据重点与配图风格。系统随后自动生成可用性更高的文章初稿和配图方案，之后再进入 AI 互动调整、人工调整与发布确认流程。
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowWorkbench(true)}
              className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2 text-sm text-white"
            >
              <Sparkles className="h-4 w-4" />
              打开生成操作台
            </button>
            <button
              type="button"
              onClick={handleGenerateFromWorkbench}
              disabled={pending || !config}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              自动重新生成
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(baseDraft);
                setAiMode(false);
                setManualMode(false);
              }}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
            >
              恢复生成初稿
            </button>
          </div>
        </SectionCard>

        <SectionCard
          title="后续动作"
          desc="生成完成后，先预览，再决定是走 AI 微调、人工改写还是直接进入发布。"
        >
          <div className="grid gap-3">
            <ActionButton
              icon={<Wand2 className="h-4 w-4" />}
              title="AI 互动调整"
              desc="用自然语言快速要求系统改语气、补案例、补对比。"
              onClick={() => {
                setAiMode(true);
                setManualMode(false);
                setPublishMode(false);
              }}
            />
            <ActionButton
              icon={<PenSquare className="h-4 w-4" />}
              title="人工调整"
              desc="直接按分段编辑标题、摘要、正文模块与 FAQ。"
              onClick={() => {
                setManualMode(true);
                setAiMode(false);
                setPublishMode(false);
                setPublishSuccess(false);
              }}
            />
            <ActionButton
              icon={<Send className="h-4 w-4" />}
              title="选择发布"
              desc="先检查平台、账号、证据信号和版本策略，再确认发布。"
              onClick={() => {
                setPublishMode(true);
                setAiMode(false);
                setManualMode(false);
                setPublishSuccess(false);
              }}
            />
          </div>

          <div className="mt-5 rounded-3xl border border-slate-100 bg-white p-5">
            <div className="mb-3 text-sm font-semibold text-slate-800">AI 引用友好度</div>
            <ScoreBar label="总分" value={draft.citationScore.total} />
            <ScoreBar label="可读性" value={draft.citationScore.readability} />
            <ScoreBar label="问答匹配度" value={draft.citationScore.qaMatch} />
            <ScoreBar label="证据感" value={draft.citationScore.evidence} />
            <ScoreBar label="多平台适配" value={draft.citationScore.multiPlatform} />
          </div>
        </SectionCard>
      </section>

      {showWorkbench && config ? (
        <WorkbenchModal
          config={config}
          pending={pending}
          directions={result.directions}
          onClose={() => setShowWorkbench(false)}
          onChange={setConfig}
          onGenerate={handleGenerateFromWorkbench}
        />
      ) : null}

      {aiMode ? (
        <SectionCard title="AI 互动调整" desc="这里模拟后续可接 Skill/LLM 的互动优化流程，先用本地规则完成演示。">
          <div className="flex flex-wrap gap-2">
            {aiAdjustPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyAiAdjustment(preset)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
              >
                {preset}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <input
              value={aiInput}
              onChange={(event) => setAiInput(event.target.value)}
              placeholder="例如：帮我补一个实体门店案例，并让标题更像知乎高赞回答"
              className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (!aiInput.trim()) return;
                applyAiAdjustment(aiInput.trim());
                setAiInput("");
              }}
              className="rounded-2xl bg-slate-900 px-5 text-sm text-white"
            >
              执行 AI 调整
            </button>
          </div>
        </SectionCard>
      ) : null}

      {manualMode ? (
        <SectionCard title="人工调整工作区" desc="重要内容可以按模块逐段编辑，再决定是否发布。">
          <div className="grid gap-4">
            <EditableField label="标题" value={draft.title} onChange={(value) => setDraft((prev) => ({ ...prev, title: value }))} />
            <EditableArea
              label="摘要"
              value={draft.summary}
              onChange={(value) => setDraft((prev) => ({ ...prev, summary: value }))}
              rows={4}
            />
            <EditableArea
              label="引言"
              value={draft.intro}
              onChange={(value) => setDraft((prev) => ({ ...prev, intro: value }))}
              rows={5}
            />
            {draft.sections.map((section, index) => (
              <EditableArea
                key={section.heading}
                label={`正文模块 ${index + 1}：${section.heading}`}
                value={section.content}
                onChange={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    sections: prev.sections.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, content: value } : item
                    )
                  }))
                }
                rows={6}
              />
            ))}
            {draft.faq.map((item, index) => (
              <EditableArea
                key={item.question}
                label={`FAQ ${index + 1}：${item.question}`}
                value={item.answer}
                onChange={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    faq: prev.faq.map((faq, faqIndex) => (faqIndex === index ? { ...faq, answer: value } : faq))
                  }))
                }
                rows={4}
              />
            ))}
            <EditableArea
              label="结尾引导"
              value={draft.closing}
              onChange={(value) => setDraft((prev) => ({ ...prev, closing: value }))}
              rows={4}
            />
          </div>
        </SectionCard>
      ) : null}

      {publishMode ? (
        <SectionCard title="发布确认台" desc="真正合理的发布动作不是一键发文，而是先确认平台、账号、证据、版本和承接页。">
          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-3xl border border-slate-100 bg-white p-5">
              <div className="mb-3 text-sm font-semibold text-slate-800">发布到哪些平台</div>
              <div className="mb-5 flex flex-wrap gap-2">
                {(currentDirection?.publishPlatforms ?? []).map((platform) => {
                  const active = selectedPublishPlatforms.includes(platform);
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() =>
                        setSelectedPublishPlatforms((prev) =>
                          active ? prev.filter((item) => item !== platform) : [...prev, platform]
                        )
                      }
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        active
                          ? "border-brand-700 bg-brand-700 text-white"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {platform}
                    </button>
                  );
                })}
              </div>

              <div className="mb-3 text-sm font-semibold text-slate-800">发布前检查清单</div>
              <div className="grid gap-2">
                {publishChecklist.map((item) => (
                  <div key={item} className="flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-700" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 mb-3 text-sm font-semibold text-slate-800">确认勾选</div>
              <div className="grid gap-2">
                {preflightItems.map((item) => {
                  const checked = checkedPreflight.includes(item);
                  return (
                    <label key={item} className="flex items-center gap-3 rounded-2xl border border-slate-100 px-3 py-3 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          setCheckedPreflight((prev) =>
                            event.target.checked ? [...prev, item] : prev.filter((entry) => entry !== item)
                          )
                        }
                      />
                      <span>{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="rounded-3xl border border-brand-100 bg-brand-50/80 p-5">
              <div className="mb-3 text-sm font-semibold text-brand-800">当前流程状态</div>
              <div className="grid gap-2 text-sm text-brand-900">
                <div>1. 已完成策略配置</div>
                <div>2. 已生成文章初稿与配图方案</div>
                <div>3. 可选择 AI 调整或人工调整</div>
                <div>4. 当前为“确认发布”阶段</div>
              </div>
              <button
                type="button"
                onClick={() => setPublishSuccess(true)}
                disabled={!selectedPublishPlatforms.length || checkedPreflight.length < 3}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                确认发布（Demo）
              </button>
              <div className="mt-3 text-xs text-brand-900/80">
                至少选择 1 个平台，并完成 3 项以上检查确认后才能进入发布成功页。
              </div>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {publishSuccess ? (
        <SectionCard title="发布成功状态页" desc="这里先用 Demo 状态模拟内容已经进入待分发或待同步环节。">
          <div className="grid gap-4 lg:grid-cols-[1fr_0.92fr]">
            <div className="rounded-[1.75rem] border border-brand-100 bg-brand-50/80 p-6">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-brand-700">
                <CheckCircle2 className="h-4 w-4" />
                已进入发布队列
              </div>
              <div className="text-2xl font-semibold text-brand-900">文章与配图方案已准备完成</div>
              <div className="mt-3 text-sm leading-7 text-brand-900">
                本次将发布到：{selectedPublishPlatforms.join("、")}。当前为 Demo 状态页，后续可接真实发布 API、工作流平台或人工审核流程。
              </div>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-5">
              <div className="mb-3 text-sm font-semibold text-slate-800">下一步建议</div>
              <div className="grid gap-2 text-sm text-slate-600">
                <div>1. 同步生成 1 到 2 个表达变体，避免单点表达。</div>
                <div>2. 补官网 FAQ 或对比页，增强自有站点承接。</div>
                <div>3. 根据平台差异，分别调整标题和首段。</div>
                <div>4. 后续可接入定时发布、审核流和数据监控。</div>
              </div>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.06fr_0.94fr]">
        <SectionCard title={draft.title} desc={`当前方向：${currentDirection?.name ?? draft.directionName} / 当前类型：${draft.articleType}`}>
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

        <div className="space-y-6">
          <SectionCard title="配图与封面预览" desc="这里先用 Demo 方式模拟后续可接入 Skill 的配图生产链路。">
            <div className="grid gap-4">
              {visuals.map((visual, index) => (
                <div key={visual.title} className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white">
                  <div
                    className={`flex min-h-[180px] items-end bg-gradient-to-br p-5 text-white ${
                      index % 3 === 0
                        ? "from-brand-900 via-brand-800 to-slate-900"
                        : index % 3 === 1
                          ? "from-slate-900 via-slate-700 to-brand-700"
                          : "from-amber-500 via-orange-500 to-rose-500"
                    }`}
                  >
                    <div>
                      <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
                        <ImageIcon className="h-3.5 w-3.5" />
                        配图方案 {index + 1}
                      </div>
                      <div className="text-xl font-semibold leading-8">{visual.title}</div>
                      <div className="mt-2 text-sm text-white/80">{visual.caption}</div>
                    </div>
                  </div>
                  <div className="p-4 text-sm leading-6 text-slate-600">{visual.description}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Sparkles className="h-4 w-4" />
                真实图片生成 / Skill 预留入口
              </div>
              <div className="text-sm leading-6 text-slate-600">
                后续这里可以接入图片生成 Skill 或外部图像 API：根据当前文章标题、平台风格、证据重点，自动生成封面、配图卡片、案例对比图和尾图摘要图。
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                  调用图片 Skill（预留）
                </button>
                <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                  接外部图像 API（预留）
                </button>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="生成同主题不同表达版本" desc="避免只生成一个版本，后续可多平台分发与 chunk 级占位。">
            <div className="grid gap-3">
              {draft.variants.map((variant) => (
                <div key={variant.variantName} className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                  <div className="font-medium text-slate-900">{variant.variantName}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">{variant.angle}</div>
                  <div className="mt-2 text-sm text-brand-700">{variant.sampleTitle}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="证据信号与发布适配" desc="发布前先检查这篇内容是不是已经足够像一个会被引用的内容单元。">
            <div className="grid gap-2 text-sm text-slate-600">
              {draft.evidenceEnhancement.recommendedSignals.slice(0, 6).map((item) => (
                <div key={item}>• {item}</div>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              {draft.citationScore.suggestions.map((item) => (
                <div key={item} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </section>
    </div>
  );
}

function WorkbenchModal({
  config,
  pending,
  directions,
  onClose,
  onChange,
  onGenerate
}: {
  config: ArticleWorkbenchConfig;
  pending: boolean;
  directions: GeoGenerationResult["directions"];
  onClose: () => void;
  onChange: (config: ArticleWorkbenchConfig) => void;
  onGenerate: () => void;
}) {
  const currentDirection = directions.find((item) => item.id === config.directionId) ?? directions[0];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-[2rem] border border-white/15 bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-ink">生成操作台</div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              用户在这里一次性确认方向、平台、版本、证据重点和配图风格，然后系统自动生成高可用文章与配图预览。
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <SelectBlock
            label="GEO 方向"
            value={config.directionId}
            options={directions.map((item) => ({ value: item.id, label: item.name }))}
            onChange={(value) =>
              onChange({
                ...config,
                directionId: value as DirectionId,
                targetPlatform:
                  directions.find((item) => item.id === value)?.publishPlatforms[0] ?? config.targetPlatform,
                accountType: directions.find((item) => item.id === value)?.accountTypes[0] ?? config.accountType
              })
            }
          />
          <SelectBlock
            label="文章类型"
            value={config.articleType}
            options={articleTypes.map((item) => ({ value: item, label: item }))}
            onChange={(value) => onChange({ ...config, articleType: value as ArticleType })}
          />
          <SelectBlock
            label="目标发布平台"
            value={config.targetPlatform}
            options={currentDirection.publishPlatforms.map((item) => ({ value: item, label: item }))}
            onChange={(value) => onChange({ ...config, targetPlatform: value })}
          />
          <SelectBlock
            label="承接账号"
            value={config.accountType}
            options={currentDirection.accountTypes.map((item) => ({ value: item, label: item }))}
            onChange={(value) => onChange({ ...config, accountType: value })}
          />
          <SelectBlock
            label="表达版本"
            value={config.expressionVariant}
            options={currentDirection.variants.map((item) => ({ value: item.variantName, label: item.variantName }))}
            onChange={(value) => onChange({ ...config, expressionVariant: value })}
          />
          <SelectBlock
            label="优先补强证据"
            value={config.evidenceFocus}
            options={currentDirection.evidenceEnhancement.recommendedSignals.map((item) => ({ value: item, label: item }))}
            onChange={(value) => onChange({ ...config, evidenceFocus: value })}
          />
          <SelectBlock
            label="配图风格"
            value={config.imageStyle}
            options={imageStyles.map((item) => ({ value: item, label: item }))}
            onChange={(value) => onChange({ ...config, imageStyle: value })}
          />
          <SelectBlock
            label="生成目标"
            value={config.publishGoal}
            options={publishGoals.map((item) => ({ value: item, label: item }))}
            onChange={(value) => onChange({ ...config, publishGoal: value })}
          />
        </div>

        <div className="mt-5 rounded-3xl border border-brand-100 bg-brand-50/80 p-5">
          <div className="text-sm font-semibold text-brand-800">当前自动生成策略</div>
          <div className="mt-2 grid gap-2 text-sm text-brand-900">
            <div>会优先生成：{currentDirection.name} / {config.articleType}</div>
            <div>会优先适配：{config.targetPlatform} / {config.accountType}</div>
            <div>会优先强化：{config.expressionVariant} + {config.evidenceFocus}</div>
            <div>会同步生成：文章初稿、配图方案、发布前检查项</div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
            先取消
          </button>
          <button
            type="button"
            onClick={onGenerate}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2 text-sm text-white disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {pending ? "正在自动生成..." : "自动生成文章与配图"}
          </button>
        </div>
      </div>
    </div>
  );
}

function tuneDraftForWorkbench(
  draft: ArticleDraft,
  config: ArticleWorkbenchConfig,
  result: GeoGenerationResult
): ArticleDraft {
  const direction = result.directions.find((item) => item.id === config.directionId);
  if (!direction) return draft;

  return {
    ...draft,
    summary: `${draft.summary} 当前生成目标是“${config.publishGoal}”，承接平台为 ${config.targetPlatform}，建议用 ${config.expressionVariant} 的方式去呈现。`,
    intro: `${draft.intro} 本次生成默认优先适配 ${config.targetPlatform} 的内容阅读习惯，并由 ${config.accountType} 来承接发布。`,
    imageSuggestion: `${draft.imageSuggestion} 本次推荐配图风格：${config.imageStyle}；建议重点突出：${config.evidenceFocus}。`
  };
}

function buildVisuals(
  draft: ArticleDraft,
  config: ArticleWorkbenchConfig,
  result: GeoGenerationResult
): GeneratedVisual[] {
  const direction = result.directions.find((item) => item.id === config.directionId);
  const coverTitle = draft.title.length > 20 ? `${draft.title.slice(0, 20)}...` : draft.title;
  return [
    {
      title: coverTitle,
      description: `主封面适合 ${config.targetPlatform}，以“问题 + 结论”方式呈现，突出 ${config.expressionVariant}。适合用标题、强结论、副标题三段式构图。`,
      caption: `${config.imageStyle} / ${config.targetPlatform}`
    },
    {
      title: `${direction?.name ?? draft.directionName} 案例卡`,
      description: `第二张图建议突出 ${config.evidenceFocus}，如果后续接入配图 Skill，可自动产出案例数字卡、流程图或对比卡。`,
      caption: `证据强化 / ${config.evidenceFocus}`
    },
    {
      title: `发布前重点检查`,
      description: `第三张图适合作为尾图或摘要图，突出“适合谁、核心结论、平台建议、FAQ 承接页”，增强转述和发布效率。`,
      caption: `发布辅助 / 自有站点承接`
    }
  ];
}

function SelectBlock({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-600">
      <span className="font-medium text-slate-800">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ActionButton({
  icon,
  title,
  desc,
  onClick
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:border-brand-300"
    >
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
        {icon}
        {title}
      </div>
      <div className="text-sm leading-6 text-slate-500">{desc}</div>
    </button>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-base font-semibold text-ink">{value}</div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
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

function EditableField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-600">
      <span className="font-medium text-slate-800">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 outline-none" />
    </label>
  );
}

function EditableArea({
  label,
  value,
  onChange,
  rows
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-600">
      <span className="font-medium text-slate-800">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
      />
    </label>
  );
}
