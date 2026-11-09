"use client";

import Link from "next/link";
import { useEffect, useState, type SyntheticEvent } from "react";
import { apiFetch, type ProjectDetail } from "@/lib/api";
import { buttonPrimary, inputClass } from "@/lib/ui";
import { useRequireAuth } from "@/lib/use-require-auth";

interface ListState {
  token: string;
  projects?: ProjectDetail[];
  error?: string;
}

export default function ProjectsPage() {
  const { user, token, loading } = useRequireAuth();
  const [state, setState] = useState<ListState | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load() {
      try {
        const projects = await apiFetch<ProjectDetail[]>("/projects", { token });
        if (!cancelled) setState({ token: token as string, projects });
      } catch (e) {
        if (!cancelled) {
          setState({
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

  const canCreate = user.role !== "REPORTER";
  const ready = state?.token === token;
  const projects = ready ? (state?.projects ?? []) : [];

  async function handleCreate(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const created = await apiFetch<ProjectDetail>("/projects", {
        token,
        body: {
          name,
          ...(description.trim() ? { description } : {}),
          ...(repositoryUrl.trim() ? { repositoryUrl: repositoryUrl.trim() } : {}),
        },
      });
      setState((prev) =>
        prev ? { ...prev, projects: [created, ...(prev.projects ?? [])] } : prev,
      );
      setName("");
      setDescription("");
      setRepositoryUrl("");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">Projects</h1>
      <p className="mt-1 mb-6 text-sm text-neutral-600">
        {canCreate
          ? "Projects you own. Reporters can file problems against them."
          : "Projects you can report problems against."}
      </p>

      {canCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-8 space-y-4 rounded-md border border-neutral-200 bg-white p-4"
        >
          <h2 className="text-sm font-semibold">Create a project</h2>
          <label className="block text-sm font-medium">
            Name
            <input
              type="text"
              required
              maxLength={160}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Description <span className="font-normal">(optional)</span>
            <textarea
              rows={2}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Repository URL <span className="font-normal">(optional, must start with https://)</span>
            <input
              type="url"
              maxLength={500}
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              placeholder="https://github.com/your-name/your-repo"
              className={inputClass}
            />
          </label>
          <p className="text-xs text-neutral-600">
            The repository is only stored for now. Nothing is read from it yet.
          </p>
          {formError && (
            <p role="alert" className="text-sm text-red-700">
              {formError}
            </p>
          )}
          <button type="submit" disabled={submitting} className={buttonPrimary}>
            {submitting ? "Creating…" : "Create project"}
          </button>
        </form>
      )}

      {!ready ? (
        <p className="text-sm text-neutral-600">Loading projects…</p>
      ) : state?.error ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-neutral-700">
          {canCreate ? "You don't own any projects yet. Create one above." : "No projects yet."}
        </p>
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => (
            <li key={p.id} className="rounded-md border border-neutral-200 bg-white p-4">
              <h3 className="font-medium">{p.name}</h3>
              {p.description && <p className="mt-1 text-sm text-neutral-700">{p.description}</p>}
              {p.repositoryUrl && (
                <p className="mt-1 break-all font-mono text-xs text-neutral-600">
                  {p.repositoryUrl}
                </p>
              )}
              <Link href="/report" className="mt-2 inline-block text-sm text-indigo-700 underline">
                Report a problem
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}