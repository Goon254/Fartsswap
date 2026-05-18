import { Inject, Injectable } from '@nestjs/common';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../../shared/application/ports/id-generator.port';
import type { PodProviderPort, PodProviderSubmitInput, PodProviderSubmitResult } from '../../application/ports/pod-provider.port';

/**
 * Deterministic local POD stand-in — no network, no inventory.
 */
@Injectable()
export class MockPodProviderAdapter implements PodProviderPort {
  constructor(@Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort) {}

  async submitOrder(_input: PodProviderSubmitInput): Promise<PodProviderSubmitResult> {
    const providerOrderRef = `mock_pod_${this.ids.generate().slice(0, 13)}`;
    const lineRefs = _input.lines.map((line, i) => ({
      commerceSku: line.commerceSku,
      providerLineRef: `${providerOrderRef}_line_${i + 1}`,
    }));
    return {
      providerOrderRef,
      lineRefs,
      initialStatus: 'accepted',
    };
  }
}
