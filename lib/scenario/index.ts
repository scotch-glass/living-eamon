// ============================================================
// LIVING EAMON — Scenario.gg public barrel
//
// Project-wide AI provider for Flux 2 + LoRA workflows. First caller
// is the painter-style-LoRA training pipeline (scripts/scenario/);
// future callers include hero-master regeneration, NPC sprites,
// monsters, scenes, item art.
//
// Anything outside lib/scenario/ that needs to touch the Scenario API
// imports from this barrel.
// ============================================================

export { getScenarioCredentials, getBasicAuthHeader } from "./auth";
export type { ScenarioCredentials } from "./auth";

export {
  listProjects,
  getDefaultProjectId,
  createModel,
  getModel,
  uploadTrainingImage,
  startTraining,
  generate,
} from "./client";

export type {
  ScenarioModel,
  ScenarioModelStatus,
  ScenarioModelType,
  ScenarioProject,
  CreateModelRequest,
  UploadTrainingImageRequest,
  TrainingParameters,
  GenerateRequest,
} from "./types";
