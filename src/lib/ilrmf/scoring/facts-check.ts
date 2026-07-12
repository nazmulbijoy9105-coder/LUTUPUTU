import type { QAEntry } from '@/shared/types';

export interface FactCheckResult {
  hasFacts: boolean;
  factCount: number;
  factEntities: string[];
  score: number;
  note: string;
}

export function checkFacts(entry: QAEntry): FactCheckResult {
  const question = entry.question;
  const entities = extractEntities(question);
  
  if (entities.length === 0) {
    return { hasFacts: false, factCount: 0, factEntities: [], score: 0, note: 'No identifiable factual entities' };
  }

  let score = 30;
  if (/\d+\s*(years?|months?|days?)/.test(question)) score += 15;
  const relationships = ['neighbor', 'seller', 'landlord', 'tenant', 'father', 'mother', 'wife', 'husband', 'employer', 'employee'];
  if (relationships.some(r => question.toLowerCase().includes(r))) score += 15;
  const actions = ['encroached', 'evict', 'bought', 'sold', 'register', 'signed', 'paid', 'divorce', 'talaq', 'khul'];
  if (actions.some(a => question.toLowerCase().includes(a))) score += 15;
  const documents = ['deed', 'contract', 'agreement', 'khatian', 'mutation', 'notice', 'kabinanama'];
  if (documents.some(d => question.toLowerCase().includes(d))) score += 15;
  const keywordHits = entry.triggerKeywords.filter(kw => question.toLowerCase().includes(kw.toLowerCase()));
  score += Math.min(10, keywordHits.length * 2);

  return {
    hasFacts: true,
    factCount: entities.length,
    factEntities: entities,
    score: Math.min(100, score),
    note: entities.length >= 3 ? `Good specificity: ${entities.slice(0, 3).join(', ')}` : `Limited facts: ${entities.join(', ')}`
  };
}

function extractEntities(text: string): string[] {
  const entities: string[] = [];
  
  // Extract proper nouns as entities (names)
  const properNouns = text.match(/[A-Z][a-z]+/g) || [];
  const commonExclude = new Set([
    "The", "And", "In", "On", "At", "By", "For", "To", "With", "About", "Against", "From", "But", "He", "She", "They",
    "Bangladesh", "Muslim", "Hindu", "Christian", "Adibashi", "Sunni", "Shia", "Talaq", "Khul", "Mahr", "Denmahr",
    "Court", "Family", "Act", "Ordinance", "Chairman", "Section", "MFLO", "DMMA", "GWA", "ISA", "ID", "Title", "Rule",
    "Irac", "Ilrmf", "Chambers", "Neum", "Lex", "Dhaka", "Guardians", "Wards", "Domestic", "Violence", "Prohibition",
    "Marriage", "Restraint", "During", "Under", "Given", "Therefore", "Since", "Because", "This", "That", "Wife", "Husband"
  ]);
  properNouns.forEach(pn => {
    if (!commonExclude.has(pn) && pn.length > 2 && !entities.includes(pn.toLowerCase())) {
      entities.push(pn.toLowerCase());
    }
  });

  const patterns = [
    /(?:land|property|house|apartment|mahr|denmahr|talaq|khul|divorce|marriage|married|custody|guardianship|maintenance|alimony|abuse|violence|protection)/gi,
    /(?:seller|buyer|landlord|tenant|neighbor|owner|husband|wife|child|children|son|daughter|father|mother)/gi,
    /(?:deed|khatian|mutation|agreement|contract|kabinanama|passport|notice)/gi,
    /\d+\s*(?:years?|months?|days?)/gi
  ];
  patterns.forEach(p => {
    const m = text.match(p);
    if (m) {
      entities.push(...m.map(x => x.toLowerCase()));
    }
  });
  return [...new Set(entities)];
}
