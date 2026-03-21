import type { LocalizedStrings } from './index';

export type DomainId = 'math' | 'philosophy' | 'aws' | 'cs' | 'chemistry' | 'accounting';

export interface DomainMeta {
  id: DomainId;
  label: string;
  labels?: LocalizedStrings;
  description: string;
  descriptions?: LocalizedStrings;
  color: string;
}
