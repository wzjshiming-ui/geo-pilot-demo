import { AppShell } from "@/components/app-shell";
import { DirectionDetailView } from "@/components/direction-detail-view";

export default function DirectionPage({ params }: { params: { slug: string } }) {
  return (
    <AppShell current="results">
      <DirectionDetailView directionId={params.slug} />
    </AppShell>
  );
}
