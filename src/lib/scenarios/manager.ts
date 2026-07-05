import type { LawArea, QAEntry, Religion } from '@/shared/types';

export interface LegalScenario {
  id: string;
  title: string;
  description: string;
  lawArea: LawArea;
  religion: Religion;
  qaEntry: QAEntry;
}

const DEFAULT_SCENARIOS: LegalScenario[] = [
  {
    id: 'scen-001',
    title: 'Arbitrary Talaq Notice Dispute',
    description: 'A husband pronounced Talaq verbally but has not sent any notice to the local Union Parishad Chairman. He believes the divorce is already legally effective.',
    lawArea: 'family',
    religion: 'muslim',
    qaEntry: {
      id: 'scen-qa-001',
      question: 'A husband in Dhaka pronounced Talaq verbally to his wife in front of witnesses, but has not sent any written notice to the local Chairman. Is this talaq valid and effective under Bangladesh law, or is it a crime?',
      jurisdiction: 'BD',
      religion: 'muslim',
      triggerKeywords: ['talaq', 'divorce', 'notice', 'chairman'],
      irac: {
        issue: 'Validation and legality of a verbal Talaq pronounced without giving written notice to the Chairman.',
        rule: 'Under Section 7 of the Muslim Family Laws Ordinance 1961, any husband who pronounces Talaq must send a written notice to the Chairman and supply a copy to the wife. Failure to do so is a criminal offence punishable by up to one year in prison or a BDT 10,000 fine.',
        application: 'Since the husband failed to send written notice to the Chairman, the verbal Talaq is not legally effective, and he is criminally liable under MFLO 1961.',
        conclusion: 'The Talaq is not effective yet because notice is mandatory. The husband must immediately send a written notice to the Chairman to start the 90-day period. Crucially, proceeding without notice is a criminal misdemeanor.'
      },
      relatedRules: ['fam-talaq-001'],
      escalate: true,
      escalateReason: 'Potential criminal misdemeanor charges for failure to notify the Chairman.'
    }
  },
  {
    id: 'scen-002',
    title: 'Hindu Separation & Maintenance',
    description: 'A Hindu wife is facing severe cruelty and wishes to live separately while demanding maintenance, as there is no civil divorce available.',
    lawArea: 'family',
    religion: 'hindu',
    qaEntry: {
      id: 'scen-qa-002',
      question: 'Can a Hindu wife in Chittagong separate from her husband due to cruelty and legally claim maintenance when divorce is not permitted under Hindu customary law?',
      jurisdiction: 'BD',
      religion: 'hindu',
      triggerKeywords: ['hindu', 'cruelty', 'separation', 'maintenance'],
      irac: {
        issue: 'Right of a Hindu wife to separate residence and maintenance on the ground of cruelty.',
        rule: 'Under the Hindu Married Women\'s Right to Separate Residence and Maintenance Act 1946, a Hindu wife is entitled to separate residence and maintenance if her husband is guilty of cruelty, conversion, or desertion.',
        application: 'Since the husband is guilty of cruelty, the wife can live separately. She can file a petition in the family court to enforce her right to separate residence and claim monthly maintenance.',
        conclusion: 'NO legal divorce for Hindus in BD. Only SEPARATION under 1946 Act. Consult advocate.'
      },
      relatedRules: ['fam-hindu-001', 'fam-hindu-002'],
      escalate: true,
      escalateReason: 'Complex personal law requiring specialized counsel.'
    }
  },
  {
    id: 'scen-003',
    title: 'Christian Divorce Desertion Ground',
    description: 'A Christian wife seeks dissolution of her marriage after her husband deserted her for more than three years.',
    lawArea: 'family',
    religion: 'christian',
    qaEntry: {
      id: 'scen-qa-003',
      question: 'Can a Christian woman get a divorce in Bangladesh if her husband has abandoned her and moved abroad for over two years?',
      jurisdiction: 'BD',
      religion: 'christian',
      triggerKeywords: ['christian', 'divorce', 'desertion', 'abandoned'],
      irac: {
        issue: 'Dissolution of Christian marriage on the ground of desertion.',
        rule: 'Under the Divorce Act 1869, a Christian marriage can be dissolved or a judicial separation obtained on grounds including desertion without reasonable excuse for two years or upwards.',
        application: 'Since the husband has deserted her for over two years without excuse, she has valid grounds. She must file a divorce petition in the District Judge court.',
        conclusion: 'File under Divorce Act 1869. Grounds include adultery+cruelty, conversion, desertion.'
      },
      relatedRules: ['fam-chr-001'],
      escalate: false
    }
  }
];

export function getScenariosByLawArea(lawArea: LawArea): LegalScenario[] {
  return DEFAULT_SCENARIOS.filter(s => s.lawArea === lawArea);
}

export function getScenarioById(id: string): LegalScenario | undefined {
  return DEFAULT_SCENARIOS.find(s => s.id === id);
}

export function getAllScenarios(): LegalScenario[] {
  return DEFAULT_SCENARIOS;
}
