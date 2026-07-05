import type { KnowledgeBank } from "@/shared/types";

const rules = [
  { id: "fam-hindu-001", title: "Hindu Marriage & Divorce", source: "Customary Law / 1946 Act", rule: "No comprehensive Hindu Marriage Act in BD. No legal provision for divorce. Only separation under Hindu Married Women's Right to Separate Residence Act 1946.", certainty: "arguable" as const, religion: "hindu" as const },
  { id: "fam-hindu-002", title: "Hindu Separation", source: "Hindu Married Women's Right Act 1946", rule: "Hindu wife can claim separate residence and maintenance on grounds: cruelty, leprosy, conversion to another religion.", certainty: "confirmed" as const, religion: "hindu" as const },
  { id: "fam-hindu-003", title: "Hindu Adoption", source: "Hindu Adoptions and Maintenance Act 1956", rule: "Hindus can adopt. Father has primary right, mother can adopt if father dead or renounced world. Adopted child gets same rights as biological.", certainty: "confirmed" as const, religion: "hindu" as const },
  { id: "fam-hindu-004", title: "Hindu Succession", source: "Hindu Succession Act 1956", rule: "Property divided among Class I heirs (sons, daughters, widow). Daughter gets equal share as son. No concept of will for inherited property.", certainty: "confirmed" as const, religion: "hindu" as const },
];

const qaBank = [
  {
    id: "fam-hindu-qa-001", question: "Can Hindus get a divorce in Bangladesh?", jurisdiction: "BD", religion: "hindu" as const,
    triggerKeywords: ["hindu marriage", "hindu divorce"],
    irac: { issue: "Legal provision for Hindu divorce.", rule: "Bangladesh has NO comprehensive Hindu Marriage Act and NO provision for divorce. Only separation under 1946 Act on grounds like cruelty or conversion.", application: "Cannot file for civil divorce. Legal option is separation under 1946 Act to live separately and claim maintenance.", conclusion: "NO legal divorce for Hindus in BD. Only SEPARATION under 1946 Act. Consult advocate." },
    relatedRules: ["fam-hindu-001", "fam-hindu-002"], escalate: true, escalateReason: "Complex personal law requiring specialized counsel."
  },
  {
    id: "fam-hindu-qa-002", question: "Does a Hindu daughter get equal property rights?", jurisdiction: "BD", religion: "hindu" as const,
    triggerKeywords: ["hindu daughter", "property rights", "inheritance hindu"],
    irac: { issue: "Share of a daughter in Hindu property.", rule: "Under Hindu Succession Act 1956, daughter is Class I heir. She gets equal share as son in father's property.", application: "If father dies intestate, daughter can claim equal portion. This applies to separate property, not joint family property unless partitioned.", conclusion: "Yes, daughter gets equal share as son under 1956 Act." },
    relatedRules: ["fam-hindu-004"], escalate: false
  }
];

export const hinduFamilyData: KnowledgeBank = {
  label: "Hindu Family Law",
  religion: "hindu",
  rules,
  qaBank,
};
