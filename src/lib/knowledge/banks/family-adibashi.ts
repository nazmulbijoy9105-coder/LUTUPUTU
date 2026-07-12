import type { KnowledgeBank } from "@/shared/types";

const rules = [
  { id: "fam-adi-001", title: "Adibashi Customary Marriage", source: "Customary Law / Hill District Council Acts", rule: "Adibashi marriages are governed by customary laws of respective tribes (Chakma, Marma, Garo etc.). No formal registration required under general law, but local council recognition applies.", certainty: "arguable" as const, religion: "adibashi" as const },
  { id: "fam-adi-002", title: "Adibashi Succession", source: "Customary Law", rule: "Property succession follows tribal customs. Generally, sons inherit primarily, but matrilineal tribes (like Garo) pass property through female line (daughter inherits).", certainty: "arguable" as const, religion: "adibashi" as const },
  { id: "fam-adi-003", title: "Adibashi Customary Divorce", source: "Customary Law / Traditional Arbitration", rule: "Divorce is permitted under customary laws of specific tribes (Chakma, Marma), typically requiring mediation by local Headman, Karbari, or Circle Chief. Garo customs do not traditionally support divorce except in cases of proven extreme adultery/abandonment.", certainty: "arguable" as const, religion: "adibashi" as const },
];

const qaBank = [
  {
    id: "fam-adi-qa-001", question: "How is marriage and divorce handled for Adibashi people in Bangladesh?", jurisdiction: "BD", religion: "adibashi" as const,
    triggerKeywords: ["adibashi marriage", "tribal marriage", "hill tract marriage"],
    irac: { issue: "Legal status of Adibashi marriages.", rule: "Governed by customary laws of the specific tribe and Hill District Council acts, not general family laws. Divorce procedures also follow tribal customs.", application: "For legal issues, the local Headman or Circle Chief's decision is often primary. However, general laws like Dowry Act and DV Act still apply for criminal offences.", conclusion: "Adibashi marriage follows tribal custom. For criminal issues (dowry, DV), general laws apply. Consult lawyer familiar with specific tribal law." },
    relatedRules: ["fam-adi-001"], escalate: true, escalateReason: "Tribal law requires specialized local knowledge."
  }
];

export const adibashiFamilyData: KnowledgeBank = {
  label: "Adibashi Family Law",
  religion: "adibashi",
  rules,
  qaBank,
};
