"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type SyntheticEvent } from "react";
import { apiFetch, type IncidentDetail, type ProjectSummary } from "@/lib/api";
import { buttonPrimary, inputClass } from "@/lib/ui";
import { useRequireAuth } from "@/lib/use-require-auth";

interface ProjectsState {
  token: string;
  projects?: ProjectSummary[];
  error?: string;
}

export default function ReportPage() {
  const { user, token, loading } = useRequireAuth();
  const router = useRouter();
  const [projectsState, setProjectsState] = useState<ProjectsState | null>(null);
  const [selected, setSelected] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expected, setExpected] = useState("");
  const [steps, setSteps] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load() {
      try {
        const projects = await apiFetch<ProjectSummary[]>("/projects", { token });
        if (!cancelled) setProjectsState({ token: token as string, projects });
      } catch (e) {
        if (!cancelled) {
          setProjectsState({
            token: token as string,
            error: e instanceof Error ? e.message : "Could not load projects",
          });
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading || !user) {
    return <p className="p-6 text-sm text-neutral-600">Loading…</p>;
  }

  const ready = projectsState?.token === token;
  const projects = ready ? (projectsState?.projects ?? []) : [];
  const projectId = selected || projects[0]?.id || "";

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = await apiFetch<IncidentDetail>("/incidents", {
        token,
        body: {
          projectId,
          title,
          description,
          ...(expected.trim() ? { expectedBehavior: expected } : {}),
          ...(steps.trim() ? { reproductionSteps: steps } : {}),
        },
      });
      router.push(`/incidents/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">Report a problem</h1>
      <p className="mt-1 mb-6 text-sm text-neutral-600">
        Describe what went wrong in your own words. No technical detail is needed.
      </p>

      {!ready ? (
        <p className="text-sm text-neutral-600">Loading projects…</p>
      ) : projectsState?.error ? (
        <p role="alert" className="text-sm text-red-700">
          {projectsState.error}
        </p>
      ) : projects.length === 0 ? (
                <p className="text-sm text-neutral-700">
          {user.role === "REPORTER" ? (
            "There are no projects to report against yet. Ask a developer to create one."
          ) : (
            <>
              You don&apos;t own any projects yet.{" "}
              <Link href="/projects" className="text-indigo-700 underline">
                Create one first
              </Link>
              .
            </>
          )}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium">
            Project
            <select
              value={projectId}
              onChange={(e) => setSelected(e.target.value)}
              className={inputClass}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Short title
            <input
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Login button does nothing"
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium">
            What happened?
            <textarea
              required
              rows={4}
              maxLength={5000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium">
            What did you expect to happen? <span className="font-normal">(optional)</span>
            <textarea
              rows={2}
              maxLength={5000}
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Steps to reproduce <span className="font-normal">(optional)</span>
            <textarea
              rows={3}
              maxLength={5000}
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              className={inputClass}
            />
          </label>
          <p className="rounded-md border border-neutral-200 bg-white p-3 text-xs text-neutral-600">
            Screenshots and browser diagnostics are not supported yet, so nothing is collected
            beyond what you type here.
          </p>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex items-center gap-4">
            <button type="submit" disabled={submitting} className={buttonPrimary}>
              {submitting ? "Submitting…" : "Submit report"}
            </button>
            <Link href="/incidents" className="text-sm text-neutral-600 underline">
              Cancel
            </Link>
          </div>
        </form>
      )}
    </main>
  );
}