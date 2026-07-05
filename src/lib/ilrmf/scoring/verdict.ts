import type { QAEntry } from '@/shared/types';
import type { ILRMFEntryResult, VerdictSummary, VerdictBand } from '../ilrmf-types';
import type { FactCheckResult } from './facts-check';
import type { LawMatchResult } from './law-match';
import type { AuditResult } from './audit-trace';

export function buildVerdict(entry: QAEntry, factCheck: FactCheckResult, lawMatch: LawMatchResult, audit: AuditResult): ILRMFEntryResult {
  const score = Math.round((factCheck.score * 0.20) + (lawMatch.score * 0.30) + (audit.logicScore * 0.50));
  const band = toBand(score);

  return {
    entryId: entry.id,
    question: entry.question,
    verdict: band,
    score,
    escalate: entry.escalate,
    escalateReason: entry.escalateReason,
    breakdown: {
      facts: { score: factCheck.score, note: factCheck.note },
      law: { score: lawMatch.score, note: lawMatch.note },
      logic: { score: audit.logicScore, note: audit.note },
    },
    steps: audit.steps,
    gaps: audit.gaps,
  };
}

function toBand(score: number): VerdictBand {
  if (score >= 80) return 'STRONG';
  if (score >= 60) return 'ADEQUATE';
  if (score >= 40) return 'WEAK';
  if (score >= 20) return 'FAILING';
  return 'EMPTY';
}

export function buildSummary(results: ILRMFEntryResult[]): VerdictSummary {
  const count = (band: VerdictBand) => results.filter(r => r.verdict === band).length;
  return {
    strong: count('STRONG'),
    adequate: count('ADEQUATE'),
    weak: count('WEAK'),
    failing: count('FAILING'),
    empty: count('EMPTY'),
    averageScore: results.length > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0,
  };
}
