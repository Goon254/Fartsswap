export interface AiAnalysisInput {
  durationMs?: number;
  tonePreset?: string;
  customFartName?: string;
}

export interface AiAnalysisResult {
  classification: string;
  powerScore: number;
  emotionalTone: string;
  probableCause: string;
  cinematicParallel: string;
  threatLevel: string;
}

export interface AiProviderPort {
  analyze(input: AiAnalysisInput): Promise<AiAnalysisResult>;
}

export const AI_PROVIDER_PORT = Symbol('AI_PROVIDER_PORT');
