// Family Law Only — Zero Dependencies

export type Religion = 'muslim' | 'hindu' | 'christian' | 'adibashi';

export type LawArea = 'family' | 'property' | 'criminal' | 'business';

export interface LegalRule {
  id: string;
  title: string;
  source: string;
  rule: string;
  certainty: 'confirmed' | 'arguable';
  religion: Religion;
}

export interface QAEntry {
  id: string;
  question: string;
  jurisdiction: string;
  religion: Religion;
  triggerKeywords: string[];
  irac: {
    issue: string;
    rule: string;
    application: string;
    conclusion: string;
  };
  relatedRules: string[];
  escalate: boolean;
  escalateReason?: string;
}

export interface KnowledgeBank {
  label: string;
  description?: string;
  religion: Religion;
  rules: LegalRule[];
  qaBank: QAEntry[];
}

export interface KnowledgeResult {
  religion: Religion;
  rules: LegalRule[];
  qaEntries: QAEntry[];
}
