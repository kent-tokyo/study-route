import type { LocalizedStrings } from './index';

export type DomainId = 'math' | 'philosophy' | 'aws' | 'cs' | 'chemistry' | 'accounting';

export interface DomainMeta {
  id: DomainId;
  prefix: string;
  label: string;
  labels?: LocalizedStrings;
  description: string;
  descriptions?: LocalizedStrings;
  color: string;
  contentsTableLabel: string;
  areaOrder: string[];
}
