import { ExecutiveDashboard } from "@/components/executive-dashboard";
import snapshot from "@/data/dashboard-snapshot.json";
import type { DashboardSnapshot } from "@/types/dashboard";

export default function Home() {
  return <ExecutiveDashboard snapshot={snapshot as DashboardSnapshot} />;
}
