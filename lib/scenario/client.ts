// ============================================================
// LIVING EAMON — Scenario.gg REST client (project-wide)
//
// Thin wrapper around https://api.cloud.scenario.com/v1 covering the
// endpoints we actually use:
//
//   - listProjects()                  GET  /projects
//   - createModel(...)                POST /models?projectId=...
//   - uploadTrainingImage(...)        POST /models/{modelId}/training-images?projectId=...
//   - startTraining(...)              PUT  /models/{modelId}/train?projectId=...
//   - getModel(...)                   GET  /models/{modelId}?projectId=...
//   - generate(...)                   POST /generate (TBD shape — fleshed out when the
//                                              first generation lands)
//
// Auth is HTTP Basic (KEY:SECRET); see auth.ts.
// ============================================================

import { getBasicAuthHeader } from "./auth";
import type {
  CreateModelRequest,
  GenerateRequest,
  ScenarioModel,
  ScenarioProject,
  TrainingParameters,
  UploadTrainingImageRequest,
} from "./types";

const BASE_URL = "https://api.cloud.scenario.com/v1";

interface FetchOpts {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  /** Override timeout in ms. Default 60s. Increase for big uploads. */
  timeoutMs?: number;
}

async function call<T>(opts: FetchOpts): Promise<T> {
  const { method, path, body, timeoutMs = 60_000 } = opts;
  const url = `${BASE_URL}${path}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      method,
      headers: {
        Authorization: getBasicAuthHeader(),
        "Content-Type": "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(
        `Scenario ${method} ${path} → HTTP ${resp.status}: ${text.slice(0, 800)}`
      );
    }
    return (await resp.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

// ── Projects ────────────────────────────────────────────────────────

export async function listProjects(): Promise<ScenarioProject[]> {
  const resp = await call<{ projects: ScenarioProject[] }>({
    method: "GET",
    path: "/projects",
  });
  return resp.projects;
}

/** Convenience: returns the first (and usually only) project ID for the
 *  authenticated key. Throws if zero projects. */
export async function getDefaultProjectId(): Promise<string> {
  const projects = await listProjects();
  if (projects.length === 0) {
    throw new Error("No Scenario projects found for these credentials.");
  }
  return projects[0].id;
}

// ── Models ──────────────────────────────────────────────────────────

export async function createModel(
  projectId: string,
  body: CreateModelRequest
): Promise<ScenarioModel> {
  const resp = await call<{ model: ScenarioModel }>({
    method: "POST",
    path: `/models?projectId=${encodeURIComponent(projectId)}`,
    body,
  });
  return resp.model;
}

export async function getModel(
  projectId: string,
  modelId: string
): Promise<ScenarioModel> {
  const resp = await call<{ model: ScenarioModel }>({
    method: "GET",
    path: `/models/${encodeURIComponent(modelId)}?projectId=${encodeURIComponent(projectId)}`,
  });
  return resp.model;
}

export async function uploadTrainingImage(
  projectId: string,
  modelId: string,
  body: UploadTrainingImageRequest
): Promise<unknown> {
  return call<unknown>({
    method: "POST",
    path: `/models/${encodeURIComponent(modelId)}/training-images?projectId=${encodeURIComponent(projectId)}`,
    body,
    timeoutMs: 180_000, // base64 image uploads can be ~600KB — give them room
  });
}

export async function startTraining(
  projectId: string,
  modelId: string,
  parameters: TrainingParameters = {}
): Promise<unknown> {
  return call<unknown>({
    method: "PUT",
    path: `/models/${encodeURIComponent(modelId)}/train?projectId=${encodeURIComponent(projectId)}`,
    body: { parameters },
  });
}

// ── Generation (preliminary — exact endpoint shape verified when first
// validation generation runs; updated then if it differs) ────────────

export async function generate(
  projectId: string,
  body: GenerateRequest
): Promise<unknown> {
  return call<unknown>({
    method: "POST",
    path: `/generate?projectId=${encodeURIComponent(projectId)}`,
    body,
    timeoutMs: 120_000,
  });
}
