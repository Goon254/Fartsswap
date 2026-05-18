import type { PodAssetPackageV1 } from '../../domain/pod-asset-package';
import type { PodLineDraft } from '../../domain/sku-to-pod-lines';

export const POD_PROVIDER_PORT = Symbol('POD_PROVIDER_PORT');

export interface PodProviderSubmitInput {
  readonly internalOrderId: string;
  readonly providerCode: string;
  readonly lines: readonly PodLineDraft[];
  readonly assetPackage: PodAssetPackageV1;
  readonly currency: string;
  readonly amountCents?: number;
}

export interface PodProviderSubmitResult {
  readonly providerOrderRef: string;
  readonly lineRefs: readonly { readonly commerceSku: string; readonly providerLineRef: string }[];
  readonly initialStatus: 'accepted' | 'submitted';
}

export interface PodProviderPort {
  submitOrder(input: PodProviderSubmitInput): Promise<PodProviderSubmitResult>;
}
