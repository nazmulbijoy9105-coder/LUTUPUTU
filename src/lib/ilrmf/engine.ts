import type { KnowledgeResult, QAEntry, LegalRule, LawArea } from '@/shared/types';
import type { ILRMFResult, ILRMFInput } from './ilrmf-types';
import { checkFacts } from './scoring/facts-check';
import { matchLaw } from './scoring/law-match';
import { auditReasoning } from './scoring/audit-trace';
import { buildVerdict, buildSummary } from './scoring/verdict';

export async function runILRMF(input: ILRMFInput): Promise<ILRMFResult> {
  const { knowledgeResult, lawArea } = input;
  const entryResults = [];

  for (const entry of knowledgeResult.qaEntries) {
    const factCheck = checkFacts(entry);
    const lawMatch = matchLaw(entry, knowledgeResult.rules);
    const audit = auditReasoning(entry, factCheck, lawMatch);
    const verdict = buildVerdict(entry, factCheck, lawMatch, audit);
    entryResults.push(verdict);
  }

  return {
    religion: knowledgeResult.religion,
    timestamp: new Date().toISOString(),
    totalEntries: entryResults.length,
    summary: buildSummary(entryResults),
    results: entryResults,
    lawArea,
  };
}
