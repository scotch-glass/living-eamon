// ============================================================
// LIVING EAMON — Scenario.gg API types
//
// Minimal TypeScript types for the request/response shapes we
// actually touch. Scenario's full API is wider; we add fields here
// as the client expands.
// ============================================================

/** Base model families for LoRA training. We pin to flux.2-dev-lora
 *  per the four-painter style-LoRA plan; other types kept as a union
 *  for forward-compat. */
export type ScenarioModelType =
  | "flux.2-dev-lora"
  | "flux.2-klein-lora"
  | "qwen-image-lora"
  | "zimage-lora"
  | "zimage-turbo-lora";

export type ScenarioModelStatus =
  | "draft"
  | "training"
  | "trained"
  | "failed"
  | "cancelled";

export interface ScenarioModel {
  id: string;
  name: string;
  type: ScenarioModelType;
  status: ScenarioModelStatus;
  trainingProgress?: {
    stage?: string;
    progress?: number;
    eta?: number;
  };
  trainingImages?: Array<{ id: string; name?: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScenarioProject {
  id: string;
  name: string;
  teamId?: string;
}

export interface CreateModelRequest {
  name: string;
  type: ScenarioModelType;
}

export interface UploadTrainingImageRequest {
  /** Filename for the upload — Scenario stores it as-is. */
  name: string;
  /** Either a `data:image/jpeg;base64,...` URI or a public URL. */
  data: string;
  /** Subject-only caption (no style words). Optional but strongly
   *  recommended for LoRA quality. */
  caption?: string;
}

export interface TrainingParameters {
  seed?: number;
  learningRate?: number;
  rank?: number;
  nbEpochs?: number;
  nbRepeats?: number;
}

export interface GenerateRequest {
  /** ID of a trained custom model, OR a base model alias. */
  modelId: string;
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  numInferenceSteps?: number;
  guidance?: number;
  seed?: number;
  /** Stack additional LoRAs. For a style+character composite, list both
   *  here with their respective strengths. */
  additionalModelIds?: Array<{ modelId: string; influence: number }>;
}
