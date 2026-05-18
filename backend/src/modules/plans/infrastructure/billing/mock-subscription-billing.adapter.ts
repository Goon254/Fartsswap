import { Inject, Injectable } from '@nestjs/common';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../../shared/application/ports/id-generator.port';
import type {
  BillingStartSubscriptionInput,
  BillingStartSubscriptionResult,
  SubscriptionBillingPort,
} from '../../application/ports/subscription-billing.port';

@Injectable()
export class MockSubscriptionBillingAdapter implements SubscriptionBillingPort {
  constructor(@Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort) {}

  async startMockSubscription(_input: BillingStartSubscriptionInput): Promise<BillingStartSubscriptionResult> {
    const suffix = this.ids.generate().replace(/-/g, '').slice(0, 12);
    return {
      billingCustomerRef: `mock_cust_${suffix}`,
      billingSubscriptionRef: `mock_sub_${suffix}`,
    };
  }
}
