"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch, type IncidentSummary, type Paginated } from "@/lib/api";
import { STATUS_OPTIONS, statusLabel } from "@/lib/status";
import { buttonPrimary, buttonSecondary, inputClass } from "@/lib/ui";
import { useRequireAuth } from "@/lib/use-require-auth";

interface Filters {
  status: string;
  q: string;
  page: number;
}

interface Result {
  key: string;
  data?: Paginated<IncidentSummary>;
  error?: string;
}

const PAGE_SIZE = 10;

export default function IncidentsPage() {
  const { user, token, loading } = useRequireAuth();
  const [filters, setFilters] = useState<Filters>({ status: "", q: "", page: 1 });
  const [draftQ, setDraftQ] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const params = new URLSearchParams({ page: String(filters.page), limit: String(PAGE_SIZE) });
  if (filters.status) params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);
  const key = `${token ?? ""}?${params.toString()}`;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load() {
      try {
        const data = await apiFetch<Paginated<IncidentSummary>>(`/incidents?${params.toString()}`, {
          token,
        });
        if (!cancelled) setResult({ key, data });
      } catch (e) {
        if (!cancelled) {
          setResult({ key, error: e instanceof Error ? e.message : "Could not load incidents" });
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (loading || !user) {
    return <p className="p-6 text-sm text-neutral-600">Loading…</p>;
  }

  const isReporter = user.role === "REPORTER";
  const fresh = result?.key === key;
  const data = fresh ? result?.data : undefined;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{isReporter ? "My reports" : "Incidents"}</h1>
        <Link href="/report" className={buttonPrimary}>
          Report a problem
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setFilters((f) => ({ ...f, q: draftQ.trim(), page: 1 }));
        }}
        className="mb-6 flex flex-wrap items-end gap-3"
      >
        <label className="text-sm font-medium">
          Search title
          <input
            type="search"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            className={`${inputClass} w-56`}
          />
        </label>
        <label className="text-sm font-medium">
          Status
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
            className={`${inputClass} w-56`}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)} ({s})
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={buttonSecondary}>
          Search
        </button>
      </form>

      {result && fresh && result.error ? (
        <p role="alert" className="text-sm text-red-700">
          {result.error}
        </p>
      ) : !data ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : data.items.length === 0 ? (
        <p className="text-sm text-neutral-700">No incidents match.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border border-neutral-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-600">
                <tr>
                  <th scope="col" className="px-4 py-2">Title</th>
                  <th scope="col" className="px-4 py-2">Status</th>
                  {!isReporter && <th scope="col" className="px-4 py-2">Severity</th>}
                  <th scope="col" className="px-4 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-2">
                      <Link
                        href={`/incidents/${item.id}`}
                        className="font-medium text-indigo-700 underline"
                      >
                        {item.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={item.status} />
                    </td>
                    {!isReporter && (
                      <td className="px-4 py-2">{item.severity ?? "Not assessed"}</td>
                    )}
                    <td className="px-4 py-2">{new Date(item.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center gap-3 text-sm">
            <button
              type="button"
              disabled={filters.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className={buttonSecondary}
            >
              Previous
            </button>
            <span>
              Page {data.page} of {totalPages} · {data.total} total
            </span>
            <button
              type="button"
              disabled={filters.page >= totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className={buttonSecondary}
            >
              Next
            </button>
          </div>
        </>
      )}
    </main>
  );
}