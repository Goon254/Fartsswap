import { Injectable } from '@nestjs/common';
import type {
  AiAnalysisInput,
  AiAnalysisResult,
  AiProviderPort,
} from '../../../shared/application/ports/ai-provider.port';

@Injectable()
export class StubAiProviderAdapter implements AiProviderPort {
  async analyze(input: AiAnalysisInput): Promise<AiAnalysisResult> {
    throw new Error('Real AI analysis is not available in Phase 1. Use fake report generation.');
  }
}
