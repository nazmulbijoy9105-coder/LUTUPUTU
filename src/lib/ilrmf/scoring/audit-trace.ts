import type { QAEntry } from '@/shared/types';
import type { FactCheckResult } from './facts-check';
import type { LawMatchResult } from './law-match';

export type StepValid = 'PASS' | 'FAIL' | 'WEAK';

export interface AuditGap {
  type: string;
  location: string;
  description: string;
}

export interface AuditResult {
  steps: Array<{ step: 'ISSUE' | 'RULE' | 'APPLICATION' | 'CONCLUSION'; content: string; valid: StepValid; note: string }>;
  gaps: AuditGap[];
  logicScore: number;
  note: string;
}

export function auditReasoning(entry: QAEntry, factCheck: FactCheckResult, lawMatch: LawMatchResult): AuditResult {
  const steps: AuditResult['steps'] = [];
  const gaps: AuditGap[] = [];

  // ISSUE
  const factRefs = factCheck.factEntities.filter(e => entry.irac.issue.toLowerCase().includes(e));
  const issueValid: StepValid = factRefs.length >= 2 ? 'PASS' : factRefs.length === 1 ? 'WEAK' : 'FAIL';
  steps.push({ step: 'ISSUE', content: entry.irac.issue, valid: issueValid, note: issueValid === 'PASS' ? 'Clear issue' : 'Vague issue' });

  // RULE
  const ruleValid: StepValid = !lawMatch.matchedRule ? 'FAIL' : !lawMatch.citationCorrect ? 'WEAK' : 'PASS';
  steps.push({ step: 'RULE', content: entry.irac.rule, valid: ruleValid, note: lawMatch.matchedRule ? `Cites ${lawMatch.matchedRule.source}` : 'No rule matched' });
  if (ruleValid === 'FAIL') gaps.push({ type: 'MISSING_RULE_LINK', location: 'rule', description: 'IRAC rule unmapped' });

  // APPLICATION
  const connectors = ['since', 'because', 'therefore', 'as', 'under', 'if', 'given that'];
  const hasConn = connectors.some(c => entry.irac.application.toLowerCase().includes(c));
  const appValid: StepValid = (!hasConn || entry.irac.application.length < 30) ? 'FAIL' : 'PASS';
  steps.push({ step: 'APPLICATION', content: entry.irac.application, valid: appValid, note: hasConn ? 'Has reasoning' : 'Missing reasoning chain' });
  if (appValid === 'FAIL') gaps.push({ type: 'LEAP', location: 'application', description: 'No reasoning connectors' });

  // CONCLUSION
  const hasAction = /\(\d\)|should|must|can |may |file |consult /i.test(entry.irac.conclusion);
  const concValid: StepValid = (hasAction && entry.irac.conclusion.length > 50) ? 'PASS' : (hasAction ? 'WEAK' : 'FAIL');
  steps.push({ step: 'CONCLUSION', content: entry.irac.conclusion, valid: concValid, note: hasAction ? 'Actionable' : 'Weak conclusion' });
  if (concValid === 'FAIL') gaps.push({ type: 'NO_CONCLUSION', location: 'conclusion', description: 'No actionable steps' });

  const stepScores: Record<StepValid, number> = { PASS: 25, WEAK: 12, FAIL: 0 };
  const rawScore = steps.reduce((sum, s) => sum + stepScores[s.valid], 0);
  const logicScore = Math.max(0, Math.min(100, rawScore - (gaps.length * 8)));

  return { steps, gaps, logicScore, note: gaps.length === 0 ? 'Clean chain' : `${gaps.length} gap(s)` };
}
