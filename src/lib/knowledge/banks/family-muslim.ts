import type { KnowledgeBank } from "@/shared/types";

const rules = [
  { id: "fam-talaq-001", title: "Talaq Procedure", source: "Muslim Family Laws Ordinance 1961, Section 7", rule: "Husband must send written notice to Chairman. Talaq effective after 90 days. Without notice is criminal offence.", certainty: "confirmed" as const, religion: "muslim" as const },
  { id: "fam-khul-001", title: "Wife's Khul Divorce", source: "Dissolution of Muslim Marriages Act 1939, Section 2", rule: "Wife can obtain divorce by returning mahr or through court on grounds like cruelty, desertion, impotency.", certainty: "confirmed" as const, religion: "muslim" as const },
  { id: "fam-denmahr-001", title: "Denmahr Enforcement", source: "Muslim Family Laws Ordinance 1961 / Contract Act 1872", rule: "Prompt mahr payable on demand; deferred on divorce/death. Enforceable as debt. Unpaid prompt mahr gives right to refuse cohabitation.", certainty: "confirmed" as const, religion: "muslim" as const },
  { id: "fam-custody-001", title: "Child Custody (Hizanat)", source: "Guardians and Wards Act 1890", rule: "Mother gets custody of sons until age 7, daughters until puberty. Father is natural guardian. Welfare is paramount.", certainty: "confirmed" as const, religion: "muslim" as const },
  { id: "fam-maintenance-001", title: "Wife Maintenance", source: "Family Courts Ordinance 1985, Section 9", rule: "Wife entitled to maintenance during marriage and 3 months iddat. Court can attach property for recovery.", certainty: "confirmed" as const, religion: "muslim" as const },
  { id: "fam-polygamy-001", title: "Polygamy Permission", source: "Muslim Family Laws Ordinance 1961, Section 6", rule: "Man MUST apply to Chairman before second marriage. Without permission: 1 year jail or BDT 10,000 fine. Marriage valid but husband criminally liable.", certainty: "confirmed" as const, religion: "muslim" as const },
  { id: "fam-dowry-001", title: "Dowry Prohibition", source: "Dowry Prohibition Act 1980", rule: "Demanding/giving dowry is offence. Up to 5 years jail. Dowry death within 7 years = life imprisonment.", certainty: "confirmed" as const, religion: "muslim" as const },
  { id: "fam-dv-001", title: "Domestic Violence", source: "Domestic Violence Act 2010", rule: "Court can issue Protection/Residence Order within 3 days. Punishment up to 2 years.", certainty: "confirmed" as const, religion: "muslim" as const },
  { id: "fam-child-marriage-001", title: "Child Marriage Restraint", source: "Child Marriage Restraint Act 2017", rule: "Minimum age 21 (male), 18 (female). Arranging child marriage = 2 years jail or BDT 50,000 fine. Marriage is voidable.", certainty: "confirmed" as const, religion: "muslim" as const },
];

const qaBank = [
  {
    id: "fam-qa-001", question: "What is Talaq and how does it work under Bangladesh law?", jurisdiction: "BD", religion: "muslim" as const,
    triggerKeywords: ["talaq", "divorce", "muslim", "pronouncement"],
    irac: { issue: "Legal procedure for Talaq.", rule: "Under MFLO 1961 Section 7: (1) Written notice to Chairman, (2) Copy to wife, (3) 90-day waiting period. Without notice is criminal offence.", application: "Husband must send notice to Chairman. Talaq NOT effective until 90 days pass. If reconciliation succeeds, talaq revoked.", conclusion: "1. Husband sends notice to Chairman.\n2. 90-day waiting period.\n3. Talaq without notice is criminal." },
    relatedRules: ["fam-talaq-001"], escalate: false
  },
  {
    id: "fam-qa-006", question: "Can a Muslim man marry a second wife without permission?", jurisdiction: "BD", religion: "muslim" as const,
    triggerKeywords: ["polygamy", "second wife", "second marriage"],
    irac: { issue: "Consequence of second marriage without permission.", rule: "Under MFLO 1961 Section 6, man MUST apply to Chairman. Without permission: 1 year jail or BDT 10,000 fine. Marriage valid but criminally liable.", application: "If husband marries without permission, he commits offence. File complaint with Chairman. Wife gets immediate denmahr and ground for divorce.", conclusion: "Criminal offence: 1 year jail. Marriage valid but husband liable. Wife gets denmahr." },
    relatedRules: ["fam-polygamy-001"], escalate: true, escalateReason: "Requires immediate legal action to secure rights."
  },
  {
    id: "fam-qa-010", question: "What is the legal age of marriage and what happens if child marriage occurs?", jurisdiction: "BD", religion: "muslim" as const,
    triggerKeywords: ["child marriage", "age", "minor", "underage"],
    irac: { issue: "Legal age limits and penalties for child marriage.", rule: "Under Child Marriage Restraint Act 2017: Minimum 21 (male), 18 (female). Arranging = 2 years jail or BDT 50,000 fine. Marriage is voidable.", application: "If child marriage arranged, report to UNO or police. Court can issue injunction. If occurred, minor can annul after turning 18.", conclusion: "Age: Male 21, Female 18. Punishment: 2 years jail. Marriage voidable at child's option." },
    relatedRules: ["fam-child-marriage-001"], escalate: false
  }
];

export const muslimFamilyData: KnowledgeBank = {
  label: "Muslim Family Law",
  religion: "muslim",
  rules,
  qaBank,
};
