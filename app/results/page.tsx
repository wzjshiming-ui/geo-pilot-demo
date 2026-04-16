import { AppShell } from "@/components/app-shell";
import { DemoInitializer } from "@/components/demo-initializer";
import { ResultsDashboard } from "@/components/results-dashboard";

export default function ResultsPage() {
  return (
    <AppShell current="results">
      <DemoInitializer />
      <ResultsDashboard />
    </AppShell>
  );
}
