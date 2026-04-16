import { AppShell } from "@/components/app-shell";
import { PublishingGuideView } from "@/components/publishing-guide-view";

export default function PublishingPage() {
  return (
    <AppShell current="publishing">
      <PublishingGuideView />
    </AppShell>
  );
}
