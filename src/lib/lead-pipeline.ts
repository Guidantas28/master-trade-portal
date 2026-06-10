export const LEAD_PIPELINE_STATUSES = ["contacted", "in_quote", "won", "lost"] as const;
export type LeadPipelineStatus = (typeof LEAD_PIPELINE_STATUSES)[number];

export const LEAD_PIPELINE_LABELS: Record<LeadPipelineStatus, string> = {
  contacted: "Contacted",
  in_quote: "In quote",
  won: "Won",
  lost: "Lost",
};

export function isLeadPipelineStatus(v: string): v is LeadPipelineStatus {
  return (LEAD_PIPELINE_STATUSES as readonly string[]).includes(v);
}

export function pipelineBadgeTone(status: LeadPipelineStatus): "success" | "coral" | "soft" | "warning" {
  if (status === "won") return "success";
  if (status === "lost") return "coral";
  if (status === "in_quote") return "warning";
  return "soft";
}

/** Kanban column accent colours (hex). */
export const LEAD_PIPELINE_ACCENTS: Record<LeadPipelineStatus, string> = {
  contacted: "#3B82F6",
  in_quote: "#F59E0B",
  won: "#16A34A",
  lost: "#94A3B8",
};
