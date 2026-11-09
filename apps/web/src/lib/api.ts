const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export type UserRole = "REPORTER" | "DEVELOPER" | "ADMIN";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const hasBody = options.body !== undefined;
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? (hasBody ? "POST" : "GET"),
      headers: {
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: hasBody ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Is the API running?");
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      const detail = data?.message;
      message = Array.isArray(detail) ? detail.join(", ") : (detail ?? message);
    } catch {
      // keep the default message
    }
    throw new ApiError(response.status, message);
  }

  return (await response.json()) as T;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
}

export interface IncidentSummary {
  id: string;
  projectId: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  severity?: string | null;
  category?: string | null;
}

export interface IncidentDetail extends IncidentSummary {
  description: string;
  expectedBehavior: string | null;
  actualBehavior: string | null;
  reproductionSteps: string | null;
  reporterId?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
export interface ProjectDetail extends ProjectSummary {
  repositoryUrl?: string | null;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
}