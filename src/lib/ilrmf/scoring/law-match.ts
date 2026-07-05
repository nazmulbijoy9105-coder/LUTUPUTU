import type { QAEntry, LegalRule } from '@/shared/types';

export interface LawMatchResult {
  matchedRule: LegalRule | null;
  relatedRulesMatched: LegalRule[];
  citationCorrect: boolean;
  score: number;
  note: string;
}

export function matchLaw(entry: QAEntry, rules: LegalRule[]): LawMatchResult {
  const primaryRule = rules.find(r => entry.relatedRules.includes(r.id));
  const secondaryRules = rules.filter(r => !entry.relatedRules.includes(r.id) && textOverlap(entry.irac.rule, r.rule) > 0.15).slice(0, 2);
  
  const citationCorrect = primaryRule ? entry.irac.rule.toLowerCase().includes(primaryRule.source.toLowerCase().split(',')[0].toLowerCase()) : false;

  let score = 0;
  if (primaryRule) {
    score += 40;
    if (citationCorrect) score += 30;
    score += Math.min(20, secondaryRules.length * 10);
    score += 10;
  } else {
    const overlaps = rules.map(r => textOverlap(entry.irac.rule, r.rule));
    score = overlaps.length > 0 ? Math.max(...overlaps, 0) * 80 : 0;
  }

  return {
    matchedRule: primaryRule || secondaryRules[0] || null,
    relatedRulesMatched: secondaryRules,
    citationCorrect,
    score: Math.min(100, Math.round(score)),
    note: primaryRule ? (citationCorrect ? `Correctly maps to ${primaryRule.id}` : `Maps to ${primaryRule.id} but missing citation`) : 'No rule mapping found'
  };
}

function textOverlap(a: string, b: string): number {
  const wA = new Set(a.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 3));
  const wB = new Set(b.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 3));
  if (wB.size === 0) return 0;
  let overlap = 0;
  for (const w of wA) { if (wB.has(w)) overlap++; }
  return overlap / wB.size;
}
