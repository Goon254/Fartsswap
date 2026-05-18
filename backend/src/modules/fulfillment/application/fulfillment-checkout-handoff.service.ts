import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfigService } from '../../../config/config.service';
import { PremiumIntentEntity } from '../../commerce/infrastructure/persistence/premium-intent.entity';
import { PodFulfillmentOrchestrationService } from './pod-fulfillment-orchestration.service';

/**
 * Bridges premium checkout completion into POD order rows + provider submit.
 */
@Injectable()
export class FulfillmentCheckoutHandoffService {
  constructor(
    @InjectRepository(PremiumIntentEntity) private readonly intents: Repository<PremiumIntentEntity>,
    private readonly pod: PodFulfillmentOrchestrationService,
    private readonly config: AppConfigService,
  ) {}

  async onCheckoutCompleted(args: { intentId: string; sessionId: string }): Promise<{
    fulfillmentOrderId?: string;
    providerOrderRef?: string;
    fulfillmentRef?: string;
  }> {
    if (!this.config.podFulfillment.enabled) {
      return {};
    }
    const row = await this.intents.findOne({ where: { id: args.intentId } });
    if (!row || row.sessionId !== args.sessionId) {
      return {};
    }
    const result = await this.pod.createAndSubmitFromIntent({
      intentRow: row,
      sessionId: args.sessionId,
      providerMode: this.config.podFulfillment.providerMode,
    });
    const fulfillmentRef = result.providerOrderRef ?? result.orderId;
    return {
      fulfillmentOrderId: result.orderId,
      providerOrderRef: result.providerOrderRef,
      fulfillmentRef,
    };
  }
}
