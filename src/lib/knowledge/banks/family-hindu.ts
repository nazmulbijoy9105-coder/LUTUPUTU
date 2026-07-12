import type { KnowledgeBank } from "@/shared/types";

const rules = [
  { id: "fam-hindu-001", title: "Hindu Marriage & Divorce", source: "Customary Hindu Law / Hindu Marriage Registration Act 2012", rule: "Bangladesh Hindu law has no legal provision for divorce. Marriages can be registered optionally under the 2012 Act, but it does not enable dissolution of marriage.", certainty: "confirmed" as const, religion: "hindu" as const },
  { id: "fam-hindu-002", title: "Hindu Separation", source: "Hindu Married Women's Right to Separate Residence and Maintenance Act 1946", rule: "Hindu wife can claim separate residence and maintenance on grounds: cruelty, desertion, second marriage of husband, conversion of husband.", certainty: "confirmed" as const, religion: "hindu" as const },
  { id: "fam-hindu-003", title: "Hindu Adoption", source: "Customary Hindu Law (Dattaka)", rule: "Governed by customary law. Only a male child can be adopted (Dattaka) under strict religious rites, primarily by a father or a widow with prior husband's consent. Adoption of female child is not recognized.", certainty: "confirmed" as const, religion: "hindu" as const },
  { id: "fam-hindu-004", title: "Hindu Succession & Inheritance", source: "Dayabhaga School of Hindu Law / Hindu Women's Rights to Property Act 1937", rule: "Governed by Dayabhaga school. Daughters do not get equal share as sons. Daughters only inherit in the absence of male descendants and the widow, taking a limited life interest. Under the 1937 Act (as applied in BD), a widow gets a share equal to a son in her husband's property, but only as a life interest.", certainty: "confirmed" as const, religion: "hindu" as const },
];

const qaBank = [
  {
    id: "fam-hindu-qa-001", question: "Can Hindus get a divorce in Bangladesh?", jurisdiction: "BD", religion: "hindu" as const,
    triggerKeywords: ["hindu marriage", "hindu divorce"],
    irac: { issue: "Legal provision for Hindu divorce.", rule: "Bangladesh has NO statutory provision for Hindu divorce. Only separate residence and maintenance can be claimed under the 1946 Act.", application: "A Hindu spouse cannot file for civil dissolution of marriage. They can live separately and claim maintenance if grounds such as cruelty or husband's second marriage are met.", conclusion: "No civil divorce is available for Hindus in Bangladesh under current family laws. Spouses can only seek legal separation and maintenance under the 1946 Act." },
    relatedRules: ["fam-hindu-001", "fam-hindu-002"], escalate: true, escalateReason: "Complex uncodified personal law requiring specialized counsel."
  },
  {
    id: "fam-hindu-qa-002", question: "Does a Hindu daughter get equal property rights?", jurisdiction: "BD", religion: "hindu" as const,
    triggerKeywords: ["hindu daughter", "property rights", "inheritance hindu"],
    irac: { issue: "Share of a daughter in Hindu property under Bangladesh law.", rule: "Under Dayabhaga law, daughters do not inherit equally with sons. They only inherit in the absence of sons, grandsons, and widows.", application: "If a Hindu man dies leaving both sons and daughters, the sons inherit the entire estate to the exclusion of daughters. Daughters only get maintenance/marriage expenses from the estate.", conclusion: "No, Hindu daughters do not get equal property rights in Bangladesh under the uncodified Dayabhaga law." },
    relatedRules: ["fam-hindu-004"], escalate: false
  }
];

export const hinduFamilyData: KnowledgeBank = {
  label: "Hindu Family Law",
  religion: "hindu",
  rules,
  qaBank,
};
