import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  desc,
  children,
  className
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel p-6 lg:p-7", className)}>
      <div className="mb-5">
        <h2 className="text-xl font-semibold tracking-tight text-ink">{title}</h2>
        {desc ? <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p> : null}
      </div>
      {children}
    </section>
  );
}
