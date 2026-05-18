export interface BureauBadgeTemplate {
  id: string;
  title: string;
  ribbon: string;
  body: string;
  rarityFootnote: string;
}

export const BUREAU_BADGE_TEMPLATES: Record<string, BureauBadgeTemplate> = {
  honorary_filer: {
    id: 'honorary_filer',
    title: 'Honorary Bureau Filer',
    ribbon: 'DISTINCTION · COMMUNITY',
    body: 'Issued for sustained participation in acoustic classification theatre. No additional hearings scheduled.',
    rarityFootnote: 'Ceremonial issuance · non-transferable',
  },
  dispute_champion: {
    id: 'dispute_champion',
    title: 'Dispute Champion (Provisional)',
    ribbon: 'OFFICE OF CHALLENGES',
    body: 'Recognised for propagating a challenge link without loss of institutional composure.',
    rarityFootnote: 'Subject to verification under §6.2',
  },
  bulletin_clerk: {
    id: 'bulletin_clerk',
    title: 'Bulletin Distribution Clerk',
    ribbon: 'NATIONAL METHANE INDEX',
    body: 'Authorised to relay weekly bureau bulletins to a designated correspondence channel.',
    rarityFootnote: 'Operational ribbon · revocable',
  },
};
