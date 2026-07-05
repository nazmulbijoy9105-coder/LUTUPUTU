import type { Religion, KnowledgeResult } from '@/shared/types';
import { muslimFamilyData } from './banks/family-muslim';
import { hinduFamilyData } from './banks/family-hindu';
import { christianFamilyData } from './banks/family-christian';
import { adibashiFamilyData } from './banks/family-adibashi';

const familyBanks: Record<Religion, any> = {
  muslim: muslimFamilyData,
  hindu: hinduFamilyData,
  christian: christianFamilyData,
  adibashi: adibashiFamilyData,
};

export function queryFamilyKnowledge(religion: Religion): KnowledgeResult {
  const bank = familyBanks[religion];
  if (!bank) throw new Error(`No family law bank for: ${religion}`);
  return { religion: bank.religion, rules: bank.rules, qaEntries: bank.qaBank };
}

export function getAllFamilyReligions(): Religion[] {
  return Object.keys(familyBanks) as Religion[];
}
