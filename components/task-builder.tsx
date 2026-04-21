"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { DEFAULT_AI_PLATFORMS, GEO_DIRECTIONS } from "@/lib/geo-config";
import { DirectionId, GeoTaskInput } from "@/lib/types";
import { defaultCase } from "@/mock/default-case";
import { parseMultiline } from "@/lib/utils";
import { saveResult } from "@/lib/storage";

const steps = [
  "品牌与产品",
  "用户人群与痛点",
  "差异化与竞品",
  "目标 AI 平台",
  "GEO 优化方向",
  "确认生成"
];

export function TaskBuilder() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [customPlatform, setCustomPlatform] = useState("");
  const [form, setForm] = useState<GeoTaskInput>(defaultCase);

  const selectedDirectionCount = form.selectedDirections.length;

  const extraDirections = useMemo(() => GEO_DIRECTIONS.filter((item) => item.extra), []);

  function updateField<K extends keyof GeoTaskInput>(key: K, value: GeoTaskInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function togglePlatform(platform: string) {
    const exists = form.aiPlatforms.includes(platform);
    updateField(
      "aiPlatforms",
      exists ? form.aiPlatforms.filter((item) => item !== platform) : [...form.aiPlatforms, platform]
    );
  }

  function toggleDirection(directionId: DirectionId) {
    const exists = form.selectedDirections.includes(directionId);
    updateField(
      "selectedDirections",
      exists
        ? form.selectedDirections.filter((item) => item !== directionId)
        : [...form.selectedDirections, directionId]
    );
  }

  async function handleGenerate() {
    startTransition(async () => {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const result = await response.json();
      saveResult(result);
      router.push("/results");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <SectionCard title="任务步骤" desc="按步骤填写即可，系统默认内置了“商家牛简单拍”演示案例。">
        <div className="space-y-3">
          {steps.map((item, index) => (
            <button
              key={item}
              type="button"
              onClick={() => setStep(index)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                index === step ? "bg-brand-700 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-semibold ${
                  index === step ? "bg-white/15 text-white" : "bg-white text-brand-700"
                }`}
              >
                {index + 1}
              </span>
              <div>
                <div className="font-medium">{item}</div>
                {index === 4 ? <div className="text-xs opacity-80">已选 {selectedDirectionCount} 个方向</div> : null}
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="space-y-6">
        {step === 0 ? (
          <SectionCard title="第一步：品牌和产品信息" desc="把品牌基础信息描述完整，后面的策略会更贴近真实业务。">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="品牌名称" value={form.brandName} onChange={(v) => updateField("brandName", v)} />
              <Field label="产品/服务名称" value={form.productName} onChange={(v) => updateField("productName", v)} />
              <div className="md:col-span-2">
                <TextAreaField
                  label="产品一句话介绍"
                  value={form.oneLiner}
                  onChange={(v) => updateField("oneLiner", v)}
                  rows={3}
                />
              </div>
              <Field label="所属行业" value={form.industry} onChange={(v) => updateField("industry", v)} />
              <Field label="官网/落地页（可选）" value={form.website ?? ""} onChange={(v) => updateField("website", v)} />
              <div className="md:col-span-2">
                <Field label="联系方式（可选）" value={form.contact ?? ""} onChange={(v) => updateField("contact", v)} />
              </div>
              <SelectField
                label="品牌当前知名度"
                value={form.brandAwareness}
                onChange={(v) => updateField("brandAwareness", v as GeoTaskInput["brandAwareness"])}
                options={["新品牌", "有一定认知", "较高知名度"]}
              />
              <SelectField
                label="产品决策成本"
                value={form.decisionCost}
                onChange={(v) => updateField("decisionCost", v as GeoTaskInput["decisionCost"])}
                options={["低", "中", "高"]}
              />
            </div>
          </SectionCard>
        ) : null}

        {step === 1 ? (
          <SectionCard title="第二步：用户人群与痛点" desc="这些内容决定系统生成的问句、选题和文章重心。">
            <div className="grid gap-4">
              <TextAreaField label="服务人群" value={form.audience} onChange={(v) => updateField("audience", v)} rows={3} />
              <TextAreaField
                label="核心卖点（每行或用逗号分隔）"
                value={form.sellingPoints.join("\n")}
                onChange={(v) => updateField("sellingPoints", parseMultiline(v))}
                rows={4}
              />
              <TextAreaField
                label="用户常见痛点（每行或用逗号分隔）"
                value={form.painPoints.join("\n")}
                onChange={(v) => updateField("painPoints", parseMultiline(v))}
                rows={4}
              />
            </div>
          </SectionCard>
        ) : null}

        {step === 2 ? (
          <SectionCard title="第三步：竞品与差异化" desc="GEO 特别依赖“为什么推荐你而不是别人”的表达。">
            <div className="grid gap-4">
              <TextAreaField
                label="品牌差异化优势"
                value={form.differentiation.join("\n")}
                onChange={(v) => updateField("differentiation", parseMultiline(v))}
                rows={4}
              />
              <TextAreaField
                label="竞品品牌词"
                value={form.competitorBrands.join("\n")}
                onChange={(v) => updateField("competitorBrands", parseMultiline(v))}
                rows={4}
              />
              <TextAreaField
                label="禁用词 / 敏感词"
                value={form.bannedWords.join("\n")}
                onChange={(v) => updateField("bannedWords", parseMultiline(v))}
                rows={3}
              />
              <SelectField
                label="潜在负面搜索风险"
                value={form.negativeRisk}
                onChange={(v) => updateField("negativeRisk", v as GeoTaskInput["negativeRisk"])}
                options={["低", "中", "高"]}
              />
            </div>
          </SectionCard>
        ) : null}

        {step === 3 ? (
          <SectionCard title="第四步：选择目标 AI 平台" desc="支持多选，也支持手动补充新的目标平台。">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                {[...DEFAULT_AI_PLATFORMS, ...form.customPlatforms].map((platform) => {
                  const active = form.aiPlatforms.includes(platform);
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        active
                          ? "border-brand-700 bg-brand-700 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-700"
                      }`}
                    >
                      {platform}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={customPlatform}
                  onChange={(event) => setCustomPlatform(event.target.value)}
                  placeholder="自定义新增平台，例如：文心一言"
                  className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 outline-none transition focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const value = customPlatform.trim();
                    if (!value) return;
                    if (!form.customPlatforms.includes(value)) {
                      updateField("customPlatforms", [...form.customPlatforms, value]);
                      updateField("aiPlatforms", [...form.aiPlatforms, value]);
                    }
                    setCustomPlatform("");
                  }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-black"
                >
                  <Plus className="h-4 w-4" />
                  新增平台
                </button>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {step === 4 ? (
          <SectionCard
            title="第五步：选择 GEO 优化方向"
            desc={`系统内置 20 个方向，其中包含额外补充的 ${extraDirections.length} 个中国市场 GEO 方向。默认已全选。`}
          >
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateField("selectedDirections", GEO_DIRECTIONS.map((item) => item.id))}
                className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm text-brand-700"
              >
                全选
              </button>
              <button
                type="button"
                onClick={() => updateField("selectedDirections", [])}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
              >
                清空
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {GEO_DIRECTIONS.map((direction) => {
                const active = form.selectedDirections.includes(direction.id);
                return (
                  <button
                    key={direction.id}
                    type="button"
                    onClick={() => toggleDirection(direction.id)}
                    className={`rounded-3xl border p-4 text-left transition ${
                      active
                        ? "border-brand-700 bg-brand-700 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-brand-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold">{direction.label}</div>
                      {direction.extra ? (
                        <span className={`rounded-full px-2 py-1 text-xs ${active ? "bg-white/10" : "bg-accent-100 text-accent-600"}`}>
                          补充方向
                        </span>
                      ) : null}
                    </div>
                    <p className={`mt-2 text-sm leading-6 ${active ? "text-white/80" : "text-slate-500"}`}>
                      {direction.shortDescription}
                    </p>
                  </button>
                );
              })}
            </div>
          </SectionCard>
        ) : null}

        {step === 5 ? (
          <SectionCard title="第六步：确认并生成" desc="点击后将调用本地规则引擎，生成可演示的 GEO 结果页。">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
                <h3 className="text-lg font-semibold text-ink">任务摘要</h3>
                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <SummaryRow label="品牌 / 产品" value={`${form.brandName} / ${form.productName}`} />
                  <SummaryRow label="目标人群" value={form.audience} />
                  <SummaryRow label="目标 AI 平台" value={form.aiPlatforms.join("、")} />
                  <SummaryRow label="已选方向" value={`${form.selectedDirections.length} 个`} />
                  <SummaryRow label="竞品" value={form.competitorBrands.join("、")} />
                  <SummaryRow label="品牌认知 / 决策成本 / 风险" value={`${form.brandAwareness} / ${form.decisionCost} / ${form.negativeRisk}`} />
                </div>
              </div>

              <div className="rounded-[2rem] bg-gradient-to-br from-brand-900 to-ink p-6 text-white">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-brand-100">
                  <Sparkles className="h-4 w-4" />
                  准备生成 GEO 方案
                </div>
                <p className="text-sm leading-7 text-brand-50">
                  系统会自动输出 GEO 策略总览、方向拆解、默认文章草稿、素材建议和面向不同 AI 平台的发布建议。
                </p>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={pending}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-brand-900 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {pending ? "正在生成 GEO 方案..." : "生成 GEO 方案"}
                </button>
              </div>
            </div>
          </SectionCard>
        ) : null}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
            disabled={step === 0}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-brand-300 disabled:opacity-40"
          >
            上一步
          </button>
          <button
            type="button"
            onClick={() => setStep((prev) => Math.min(prev + 1, steps.length - 1))}
            disabled={step === steps.length - 1}
            className="rounded-full bg-ink px-4 py-2 text-sm text-white transition hover:bg-slate-800 disabled:opacity-40"
          >
            下一步
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
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
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 outline-none transition focus:border-brand-500"
      />
    </label>
  );
}

function TextAreaField({
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
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-500"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-600">
      <span className="font-medium text-slate-800">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 outline-none transition focus:border-brand-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-2xl border border-white bg-white p-3">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="text-sm leading-6 text-slate-700">{value}</div>
    </div>
  );
}
