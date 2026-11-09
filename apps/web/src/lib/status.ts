export const STATUS_OPTIONS = [
  "RECEIVED",
  "INTAKE",
  "NEEDS_MORE_INFORMATION",
  "DIAGNOSIS",
  "PATTERN_ANALYSIS",
  "ROOT_CAUSE_ANALYSIS",
  "PATCH_GENERATION",
  "VERIFICATION",
  "AWAITING_APPROVAL",
  "RESOLVED",
  "DUPLICATE",
  "VERIFICATION_FAILED",
  "INVESTIGATION_FAILED",
  "CANCELLED",
] as const;

const LABELS: Record<string, string> = {
  RECEIVED: "Received",
  INTAKE: "Being reviewed",
  NEEDS_MORE_INFORMATION: "Needs more information",
  DIAGNOSIS: "Investigating",
  PATTERN_ANALYSIS: "Investigating",
  ROOT_CAUSE_ANALYSIS: "Investigating",
  PATCH_GENERATION: "Preparing a fix",
  VERIFICATION: "Testing a fix",
  AWAITING_APPROVAL: "Awaiting developer review",
  RESOLVED: "Resolved",
  DUPLICATE: "Duplicate",
  VERIFICATION_FAILED: "Fix did not pass tests",
  INVESTIGATION_FAILED: "Investigation failed",
  CANCELLED: "Cancelled",
};

const DESCRIPTIONS: Record<string, string> = {
  RECEIVED: "We have your report. Nothing has been investigated yet.",
  NEEDS_MORE_INFORMATION: "We need a few more details before we can continue.",
  AWAITING_APPROVAL: "A proposed fix has been tested and is waiting for a developer's decision.",
  RESOLVED: "A developer approved a verified fix.",
  VERIFICATION_FAILED: "A proposed fix did not pass its tests, so it was not accepted.",
  INVESTIGATION_FAILED: "The automated investigation could not finish. A developer will follow up.",
  CANCELLED: "This report was cancelled.",
};

export function statusLabel(status: string): string {
  return LABELS[status] ?? status;
}

export function statusDescription(status: string): string {
  return DESCRIPTIONS[status] ?? "This report is being worked on.";
}

export function statusTone(status: string): string {
  if (status === "RESOLVED") return "bg-green-50 text-green-900 border-green-300";
  if (status === "VERIFICATION_FAILED" || status === "INVESTIGATION_FAILED")
    return "bg-red-50 text-red-900 border-red-300";
  if (status === "NEEDS_MORE_INFORMATION" || status === "AWAITING_APPROVAL")
    return "bg-amber-50 text-amber-900 border-amber-300";
  return "bg-neutral-100 text-neutral-800 border-neutral-300";
}