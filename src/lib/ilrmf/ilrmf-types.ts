import type { Religion, KnowledgeResult, LawArea } from '@/shared/types';

export type VerdictBand = 'STRONG' | 'ADEQUATE' | 'WEAK' | 'FAILING' | 'EMPTY';

export interface ILRMFEntryResult {
  entryId: string;
  question: string;
  verdict: VerdictBand;
  score: number;
  escalate: boolean;
  escalateReason?: string;
  breakdown: {
    facts: { score: number; note: string };
    law: { score: number; note: string };
    logic: { score: number; note: string };
  };
  steps: Array<{
    step: 'ISSUE' | 'RULE' | 'APPLICATION' | 'CONCLUSION';
    content: string;
    valid: 'PASS' | 'FAIL' | 'WEAK';
    note: string;
  }>;
  gaps: Array<{
    type: string;
    location: string;
    description: string;
  }>;
}

export interface VerdictSummary {
  strong: number;
  adequate: number;
  weak: number;
  failing: number;
  empty: number;
  averageScore: number;
}

export interface ILRMFResult {
  religion: Religion;
  timestamp: string;
  totalEntries: number;
  summary: VerdictSummary;
  results: ILRMFEntryResult[];
  lawArea?: LawArea;
}

export interface ILRMFInput {
  knowledgeResult: KnowledgeResult;
  lawArea?: LawArea;
}
