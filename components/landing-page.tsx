import Link from "next/link";
import { ArrowRight, BadgeCheck, BarChart3, Files, Layers3, PenTool, Radar } from "lucide-react";
import { QuickActions } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";

const features = [
  {
    title: "面向中国市场的 GEO 方向库",
    desc: "内置 20 个可扩展 GEO 方向，覆盖品牌词、口碑词、痛点词、竞品词、地域词、本地生活与 ToB 选型。",
    icon: Radar
  },
  {
    title: "规则引擎生成结果",
    desc: "无需接真实大模型 API，先用模板 + 业务规则生成稳定可演示的策略、问句、标题、文章和发布建议。",
    icon: Layers3
  },
  {
    title: "可演示的 SaaS 交互流程",
    desc: "首页、任务创建、结果总览、方向详情、文章生成、发布建议全链路可访问，适合拿去直接展示。",
    icon: BarChart3
  }
];

const flow = [
  "输入品牌、产品、人群、痛点、竞品和差异化信息",
  "选择目标 AI 平台和 GEO 优化方向",
  "系统生成 GEO 策略总览与各方向拆解",
  "按方向生成文章草稿、素材建议和发布建议"
];

export function LandingPage() {
  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden px-6 py-8 lg:px-10 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-sm text-brand-700">
              <BadgeCheck className="h-4 w-4" />
              中国市场生成式搜索优化系统
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-ink lg:text-6xl">
              帮品牌在豆包、Kimi、元宝、千问里
              <span className="block text-brand-700">更容易被提到、推荐和引用</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              GEO Pilot
              是一套面向中国市场的 GEO 内容生成 Demo。它能把品牌信息、用户痛点、竞品和目标平台，自动组合成策略摘要、关键词问句、内容选题、文章草稿、素材建议和发布指引。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/tasks/new"
                className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-800"
              >
                立即创建 GEO 任务
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/results"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
              >
                直接查看默认案例
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-900 via-brand-800 to-ink p-6 text-white shadow-2xl shadow-brand-900/15">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-brand-200">Demo Snapshot</div>
                <div className="mt-2 text-2xl font-semibold">商家牛简单拍</div>
              </div>
              <div className="rounded-full bg-white/10 px-3 py-1 text-sm text-brand-100">默认案例</div>
            </div>
            <div className="grid gap-3">
              {[
                "目标平台：豆包 / Kimi / 腾讯元宝 / 通义千问",
                "重点方向：品牌词、痛点词、竞品截流、案例证明、转化词",
                "内容矩阵：知乎长文 + 公众号案例 + FAQ 页面 + 小红书口碑卡片",
                "文章草稿：问答型 / 口碑型 / 对比型 / 场景解决方案型"
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-brand-50">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <QuickActions />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="核心能力"
          desc="这不是传统 SEO 演示站，而是为了让你的品牌在中文 AI 对话场景里更容易被搜到、提到、引用和推荐。"
        >
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-ink">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          title="使用流程"
          desc="适合品牌方、服务商、商家、教育产品、软件工具和本地生活服务项目快速演示 GEO 方案。"
        >
          <div className="space-y-3">
            {flow.map((item, index) => (
              <div key={item} className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-brand-700 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <div className="pt-1 text-sm leading-6 text-slate-600">{item}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="系统输出"
        desc="生成结果不是空白卡片，而是完整可展示的策略成果。"
      >
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["GEO 策略总览", "品牌、产品、目标平台、TOP 5 优先方向、内容矩阵、Quick Wins"],
            ["方向拆解", "每个方向都有解释、问句、标题、结构、优先级、平台和账号建议"],
            ["文章草稿", "按方向自动生成问答型、口碑型、对比型、场景型文章"],
            ["发布建议", "分别给出针对豆包、Kimi、元宝、千问的内容分发策略"]
          ].map(([title, desc]) => (
            <div key={title} className="rounded-3xl border border-slate-100 bg-white p-5">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-100 text-accent-600">
                <Files className="h-5 w-5" />
              </div>
              <div className="text-base font-semibold text-ink">{title}</div>
              <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
