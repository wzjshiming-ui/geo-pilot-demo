import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { ArticleLab } from "@/components/article-lab";

export default function ArticlesPage() {
  return (
    <AppShell current="article">
      <Suspense fallback={null}>
        <ArticleLab />
      </Suspense>
    </AppShell>
  );
}
