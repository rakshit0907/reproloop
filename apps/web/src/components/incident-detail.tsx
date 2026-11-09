"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { ApiError, apiFetch, type IncidentDetail as Incident } from "@/lib/api";
import { statusDescription } from "@/lib/status";
import { useRequireAuth } from "@/lib/use-require-auth";

interface State {
  key: string;
  incident?: Incident;
  error?: string;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase text-neutral-500">{label}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm">{value?.trim() ? value : "Not provided"}</p>
    </div>
  );
}

export function IncidentDetail({ id }: { id: string }) {
  const { user, token, loading } = useRequireAuth();
  const [state, setState] = useState<State | null>(null);
  const key = `${token ?? ""}:${id}`;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load() {
      try {
        const incident = await apiFetch<Incident>(`/incidents/${id}`, { token });
        if (!cancelled) setState({ key, incident });
      } catch (e) {
        if (!cancelled) {
          const message =
            e instanceof ApiError && e.status === 404
              ? "This incident does not exist, or you do not have access to it."
              : e instanceof Error
                ? e.message
                : "Could not load the incident";
          setState({ key, error: message });
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, token, key]);

  if (loading || !user) {
    return <p className="text-sm text-neutral-600">Loading…</p>;
  }

  const fresh = state?.key === key;
  const isStaff = user.role !== "REPORTER";

  if (!fresh || !state) {
    return <p className="text-sm text-neutral-600">Loading…</p>;
  }
  if (state.error || !state.incident) {
    return (
      <div className="space-y-3">
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
        <Link href="/incidents" className="text-sm text-indigo-700 underline">
          Back to the list
        </Link>
      </div>
    );
  }

  const incident = state.incident;

  return (
    <article className="space-y-6">
      <div>
        <Link href="/incidents" className="text-sm text-indigo-700 underline">
          ← Back to the list
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{incident.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
          <StatusBadge status={incident.status} />
          <span>Reported {new Date(incident.createdAt).toLocaleString()}</span>
          <span className="font-mono text-xs">ID {incident.id}</span>
        </div>
      </div>

      <section aria-labelledby="progress" className="rounded-md border border-neutral-200 bg-white p-4">
        <h2 id="progress" className="text-sm font-semibold">
          Progress
        </h2>
        <p className="mt-1 text-sm">{statusDescription(incident.status)}</p>
        <p className="mt-2 text-xs text-neutral-500">
          A detailed history of each step will appear here once investigation tracking is added.
        </p>
      </section>

      <section aria-labelledby="report" className="space-y-4 rounded-md border border-neutral-200 bg-white p-4">
        <h2 id="report" className="text-sm font-semibold">
          The report
        </h2>
        <Field label="What happened" value={incident.description} />
        <Field label="What was expected" value={incident.expectedBehavior} />
        <Field label="Steps to reproduce" value={incident.reproductionSteps} />
      </section>

      {isStaff && (
        <section aria-labelledby="internal" className="space-y-4 rounded-md border border-neutral-200 bg-white p-4">
          <h2 id="internal" className="text-sm font-semibold">
            Developer details
          </h2>
          <Field label="Severity" value={incident.severity ?? "Not assessed yet"} />
          <Field label="Category" value={incident.category ?? "Not categorized yet"} />
          <Field label="Reporter ID" value={incident.reporterId} />
        </section>
      )}
    </article>
  );
}