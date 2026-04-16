"use client";

import { useEffect, useState } from "react";
import { SectionCard } from "@/components/section-card";
import { generateGeoResult } from "@/lib/rule-engine";
import { loadResult } from "@/lib/storage";
import { GeoGenerationResult } from "@/lib/types";
import { defaultCase } from "@/mock/default-case";

export function PublishingGuideView() {
  const [result, setResult] = useState<GeoGenerationResult>(() => generateGeoResult(defaultCase));

  useEffect(() => {
    const stored = loadResult();
    if (stored) setResult(stored);
  }, []);

  return (
    <div className="space-y-6">
      <SectionCard
        title="发布建议总览"
        desc="这里不是联网抓平台规则，而是按目标 AI 聊天机器人输出可配置、可展示的策略建议。"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {result.publishingGuides.map((guide) => (
            <div key={guide.platform} className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <div className="text-lg font-semibold text-ink">{guide.platform}</div>
              <p className="mt-2 text-sm leading-6 text-slate-500">{guide.platformTraits}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6">
        {result.publishingGuides.map((guide) => (
          <SectionCard key={guide.platform} title={`${guide.platform} 发布指引`} desc="适合作为对外汇报或内部执行的策略页面。">
            <div className="grid gap-4 lg:grid-cols-2">
              <InfoList title="推荐发布平台" items={guide.recommendedChannels} />
              <InfoList title="适合发布的内容类型" items={guide.contentTypes} />
              <InfoList title="推荐账号权重类型" items={guide.accountSuggestions} />
              <InfoList title="建议发布栏目 / 内容分区" items={guide.sections} />
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-brand-100 bg-brand-50/80 p-5">
                <div className="mb-2 text-sm font-semibold text-brand-800">发布频率建议</div>
                <p className="text-sm leading-6 text-brand-900">{guide.cadence}</p>
              </div>
              <div className="rounded-3xl border border-slate-100 bg-white p-5">
                <div className="mb-2 text-sm font-semibold text-slate-800">内容布局建议</div>
                <div className="grid gap-2">
                  {guide.matrixAdvice.map((item) => (
                    <div key={item} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
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
