import type { ChatGptLead } from "@/types/leads";

export function leadSummary(leads: ChatGptLead[]) {
  return {
    total: leads.length,
    new: leads.filter((lead) => lead.status === "new").length,
    contacted: leads.filter((lead) => lead.status === "contacted").length,
    appointmentScheduled: leads.filter(
      (lead) => lead.status === "appointment_scheduled",
    ).length,
    becamePatients: leads.filter((lead) => lead.becamePatient).length,
  };
}
