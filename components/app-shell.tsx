import Link from "next/link";
import { Sparkles, Target, FileText, Send, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  current?: "home" | "task" | "results" | "article" | "publishing";
}

const navItems = [
  { key: "home", label: "首页", href: "/" },
  { key: "task", label: "创建任务", href: "/tasks/new" },
  { key: "results", label: "结果总览", href: "/results" },
  { key: "article", label: "文章生成", href: "/articles" },
  { key: "publishing", label: "发布建议", href: "/publishing" }
] as const;

export function AppShell({ children, current }: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-grid bg-[length:44px_44px] opacity-[0.22]" />
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-700 text-white shadow-lg shadow-brand-900/15">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">GEO Pilot</div>
              <div className="text-sm text-slate-500">生成式搜索优化内容系统 Demo</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition",
                  current === item.key
                    ? "bg-brand-700 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/tasks/new"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            立即开始
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">{children}</main>
    </div>
  );
}

export function QuickActions() {
  const cards = [
    {
      title: "策略生成",
      desc: "按品牌、痛点、场景、竞品等多维度自动组合 GEO 方向。",
      icon: Target
    },
    {
      title: "文章草稿",
      desc: "支持问答型、口碑型、对比型、场景方案型草稿一键生成。",
      icon: FileText
    },
    {
      title: "发布指引",
      desc: "按豆包、Kimi、元宝、千问给出差异化内容分发建议。",
      icon: Send
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.title} className="panel p-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-ink">{card.title}</h3>
            <p className="muted">{card.desc}</p>
          </div>
        );
      })}
    </div>
  );
}
