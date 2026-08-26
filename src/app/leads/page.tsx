import { LeadsDashboard } from "@/components/leads-dashboard";
import { listExampleLeads } from "@/lib/leads/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ChatGPT Leads · Exquisite Dentistry",
  description:
    "Track ChatGPT ad leads for Exquisite Dentistry: name, contact, source, follow-up, and whether they became a patient.",
};

export default function LeadsPage() {
  return <LeadsDashboard examples={listExampleLeads()} />;
}
