import { statusLabel, statusTone } from "@/lib/status";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusTone(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}