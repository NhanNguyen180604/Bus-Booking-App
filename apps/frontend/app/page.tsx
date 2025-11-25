import { AppShell } from "../components/layout/app-shell";
import { BusSearchForm } from "../components/home/bus-search-form";
import { HeroSection } from "../components/home/hero-section";
import { AuthActions } from "../components/home/auth-actions";

export default function Home() {
  return (
    <AppShell hideNav>
      <div className="max-w-7xl mx-auto py-8 space-y-8">
        <HeroSection />
        <BusSearchForm />
        <AuthActions />
      </div>
    </AppShell>
  );
}
