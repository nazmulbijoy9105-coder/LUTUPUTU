import type { KnowledgeBank } from "@/shared/types";

const rules = [
  { id: "fam-chr-001", title: "Christian Divorce", source: "Divorce Act 1869", rule: "Christian marriage can be dissolved only on specific grounds: adultery, conversion, cruelty, desertion for 2+ years, unsound mind.", certainty: "confirmed" as const, religion: "christian" as const },
  { id: "fam-chr-002", title: "Christian Succession", source: "Succession Act 1925", rule: "Governed by the Succession Act 1925. Widow gets 1/3rd if children exist, 1/2nd if no children. Rest divided among children.", certainty: "confirmed" as const, religion: "christian" as const },
  { id: "fam-chr-003", title: "Christian Marriage", source: "Christian Marriage Act 1872", rule: "Marriage must be solemnized by a licensed minister or registrar under strict requirements. Minimum age is 21 for male, 18 for female.", certainty: "confirmed" as const, religion: "christian" as const },
];

const qaBank = [
  {
    id: "fam-chr-qa-001", question: "On what grounds can a Christian get a divorce in Bangladesh?", jurisdiction: "BD", religion: "christian" as const,
    triggerKeywords: ["christian divorce", "divorce act 1869"],
    irac: { issue: "Grounds for Christian divorce.", rule: "Under Divorce Act 1869, grounds are: adultery coupled with cruelty/desertion, conversion to another religion, cruelty, desertion for 2+ years, unsound mind for 2+ years.", application: "Must file suit in District Judge court. Need strict proof of grounds. Adultery alone is not enough; must be coupled with another ground.", conclusion: "File under Divorce Act 1869. Grounds include adultery+cruelty, conversion, desertion." },
    relatedRules: ["fam-chr-001"], escalate: false
  }
];

export const christianFamilyData: KnowledgeBank = {
  label: "Christian Family Law",
  religion: "christian",
  rules,
  qaBank,
};
