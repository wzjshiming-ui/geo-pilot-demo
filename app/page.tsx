import { AppShell } from "@/components/app-shell";
import { DemoInitializer } from "@/components/demo-initializer";
import { LandingPage } from "@/components/landing-page";

export default function HomePage() {
  return (
    <AppShell current="home">
      <DemoInitializer />
      <LandingPage />
    </AppShell>
  );
}
