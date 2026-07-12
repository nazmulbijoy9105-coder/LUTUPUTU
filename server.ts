import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// All statutory rules across religions
const ALL_RULES_METADATA = [
  // Muslim rules
  { id: "fam-talaq-001", title: "Talaq Procedure", rule: "Husband must send written notice to Chairman. Talaq effective after 90 days. Without notice is criminal offence.", religion: "muslim" },
  { id: "fam-khul-001", title: "Wife's Khul Divorce", rule: "Wife can obtain divorce by returning mahr or through court on grounds like cruelty, desertion, impotency.", religion: "muslim" },
  { id: "fam-denmahr-001", title: "Denmahr Enforcement", rule: "Prompt mahr payable on demand; deferred on divorce/death. Enforceable as debt. Unpaid prompt mahr gives right to refuse cohabitation.", religion: "muslim" },
  { id: "fam-custody-001", title: "Child Custody (Hizanat)", rule: "Mother gets custody of sons until age 7, daughters until puberty. Father is natural guardian. Welfare is paramount.", religion: "muslim" },
  { id: "fam-maintenance-001", title: "Wife Maintenance", rule: "Wife entitled to maintenance during marriage and 3 months iddat. Court can attach property for recovery.", religion: "muslim" },
  { id: "fam-polygamy-001", title: "Polygamy Permission", rule: "Man MUST apply to Chairman before second marriage. Without permission: 1 year jail or BDT 10,000 fine. Marriage valid but husband criminally liable.", religion: "muslim" },
  { id: "fam-dowry-001", title: "Dowry Prohibition", rule: "Demanding/giving dowry is offence. Up to 5 years jail. Dowry death within 7 years = life imprisonment.", religion: "muslim" },
  { id: "fam-dv-001", title: "Domestic Violence", rule: "Court can issue Protection/Residence Order within 3 days. Punishment up to 2 years.", religion: "muslim" },
  { id: "fam-child-marriage-001", title: "Child Marriage Restraint", rule: "Minimum age 21 (male), 18 (female). Arranging child marriage = 2 years jail or BDT 50,000 fine. Marriage is voidable.", religion: "muslim" },

  // Hindu rules
  { id: "fam-hindu-001", title: "Hindu Marriage & Divorce", rule: "No comprehensive Hindu Marriage Act in BD. No legal provision for divorce. Only separation under Hindu Married Women's Right to Separate Residence Act 1946.", religion: "hindu" },
  { id: "fam-hindu-002", title: "Hindu Separation", rule: "Hindu wife can claim separate residence and maintenance on grounds: cruelty, leprosy, conversion to another religion.", religion: "hindu" },
  { id: "fam-hindu-003", title: "Hindu Adoption", rule: "Hindus can adopt. Father has primary right, mother can adopt if father dead or renounced world. Adopted child gets same rights as biological.", religion: "hindu" },
  { id: "fam-hindu-004", title: "Hindu Succession", rule: "Property divided among Class I heirs (sons, daughters, widow). Daughter gets equal share as son. No concept of will for inherited property.", religion: "hindu" },

  // Christian rules
  { id: "fam-chr-001", title: "Christian Divorce", rule: "Christian marriage can be dissolved only on specific grounds: adultery, conversion, cruelty, desertion for 2+ years, unsound mind.", religion: "christian" },
  { id: "fam-chr-002", title: "Christian Succession", rule: "Governed by ISA 1925. Widow gets 1/3rd if children exist, 1/2nd if no children. Rest divided among children.", religion: "christian" },

  // Adibashi rules
  { id: "fam-adi-001", title: "Adibashi Customary Marriage", rule: "Adibashi marriages are governed by customary laws of respective tribes (Chakma, Marma, Garo etc.). No formal registration required under general law, but local council recognition applies.", religion: "adibashi" },
  { id: "fam-adi-002", title: "Adibashi Succession", rule: "Property succession follows tribal customs. Generally, sons inherit primarily, but matrilineal tribes (like Garo) pass property through female line (daughter inherits).", religion: "adibashi" }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini SDK with User-Agent set for telemetry as required by rules
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  // API endpoint for AI Consultation Stage
  app.post("/api/consult", async (req, res) => {
    try {
      const { domesticSituation } = req.body;
      if (!domesticSituation) {
        return res.status(400).json({ error: "domesticSituation is required" });
      }

      // Format the rules lists to send to Gemini so it has context and map to them correctly
      const rulesContext = ALL_RULES_METADATA.map(r => 
        `- ID: "${r.id}" | Title: "${r.title}" | Rule: "${r.rule}" | Religion: "${r.religion}"`
      ).join("\n");

      const prompt = `You are an expert Bangladesh Personal Family Law Consultant.
Analyze the following domestic situation/dispute details provided by a client:
"${domesticSituation}"

Match the situation to the appropriate religious personal law jurisdiction ('muslim', 'hindu', 'christian', or 'adibashi') and map it to our available database rules.
Here is the official database of statutes/rules you must match against. You MUST choose one or more appropriate rule IDs from this list to populate 'relatedRules':
${rulesContext}

Task: Structure a formal legal response conforming strictly to the Deterministic Legal Rule Metric Framework (ILRMF) Formulation (Issue, Rule, Application, Conclusion).

Requirements:
1. 'religion': Must be exactly one of 'muslim', 'hindu', 'christian', or 'adibashi'.
2. 'question': Set this EXACTLY to the client's actual original unmodified domestic situation text: "${domesticSituation.replace(/"/g, '\\"')}".
3. 'issue': Formulate a formal legal issue statement. To ensure it passes the deterministic facts-check audit:
   - It MUST refer only to the actual names of the parties present in the client situation (e.g., if the text mentions Farhana and Monir, use Farhana and Monir. Do NOT invent other names like Muammar or Anika Tabassum). If no specific names are mentioned, refer to them generically by their relationship roles (husband, wife).
   - It MUST explicitly contain at least two or three of the following exact lowercase words that are relevant to the case: 'husband', 'wife', 'child', 'talaq', 'agreement', 'custody', 'maintenance', 'mahr'.
   - Example: "Whether the dispute between the husband (Monir) and the wife (Farhana) regarding child custody and wife maintenance is legally actionable..."
4. 'rule': Provide the applicable statutory rule text, section, and legal citations. Keep it professional and compile the mapped statutory codes.
5. 'application': Apply the legal rule to the client's ACTUAL domestic situation facts in detail. You MUST construct a solid, multi-paragraph logical argument and actively use logical connectors like 'since', 'because', 'therefore', 'under', and 'given that' to ensure a high logic audit score. Mention ONLY facts that are actually present in the input text (e.g. if physical abuse or shouting is mentioned, apply it; do NOT mention unrelated facts like passport retention or wardrobe looting unless they are explicitly in the text).
6. 'conclusion': Formulate the final conclusion, the outcome, and practical, actionable next legal actions. The conclusion MUST be highly detailed (at least 150 characters) and MUST contain numbered steps starting with (1), (2), and optional (3), and MUST include specific auxiliary action verbs like 'must', 'should', or 'file' (e.g., "The client should file for protection orders under the Domestic Violence Act 2010...", "(2) The husband must...").
7. 'relatedRules': Extract the exact matching rule IDs from the provided database list that apply to this situation (e.g., ['fam-talaq-001', 'fam-custody-001', 'fam-dv-001']). Do not invent any new IDs.
8. 'escalate': Determine if this domestic situation involves immediate danger, criminal acts, coercion, threats, custody withholding, or severe legal urgency requiring professional advocate/court escalation (true/false).
9. 'escalateReason': Specify a clear, professional reason for immediate professional legal/court escalation if 'escalate' is true. Leave empty if false.

Return a JSON response matching the required schema. Ensure the response is highly detailed and complete.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              religion: {
                type: Type.STRING,
                description: "The religious personal law jurisdiction: 'muslim', 'hindu', 'christian', or 'adibashi'."
              },
              question: {
                type: Type.STRING,
                description: "A synthesized factual legal question describing the core dispute. It MUST be set exactly to the client's original unmodified domestic situation text."
              },
              issue: {
                type: Type.STRING,
                description: "A formal legal issue statement. To pass audit verification, it MUST explicitly contain the names of the parties involved (if mentioned in the situation text, e.g. Farhana and Monir) and at least two lowercase family law entities/roles mentioned in the situation (such as 'husband', 'wife', 'child', 'talaq', 'custody', 'maintenance', 'mahr', etc.)."
              },
              rule: {
                type: Type.STRING,
                description: "The applicable statutory rule text. It MUST explicitly quote/contain the exact official source name and year of the primary matched rules from the database list (e.g., 'Muslim Family Laws Ordinance 1961' or 'Guardians and Wards Act 1890') to ensure correct citation verification."
              },
              application: {
                type: Type.STRING,
                description: "A detailed logical application of the rules to the client's situation. It MUST be a solid multi-paragraph argument, at least 150 characters long, and MUST actively use logical connectors like 'since', 'because', 'therefore', 'under', 'if', and 'given that' to construct a complete reasoning chain."
              },
              conclusion: {
                type: Type.STRING,
                description: "The final conclusion and recommended next legal actions. It MUST be at least 150 characters long, contain numbered steps starting with (1), (2) describing actions the parties should take, and MUST use auxiliary verbs like 'must', 'should', 'file', or 'consult'."
              },
              relatedRules: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "The list of exact rule IDs from our database list that apply to this situation (e.g., ['fam-talaq-001', 'fam-custody-001']). Do NOT invent new IDs."
              },
              escalate: {
                type: Type.BOOLEAN,
                description: "Whether this case requires escalation to a professional advocate or court."
              },
              escalateReason: {
                type: Type.STRING,
                description: "The reason why immediate escalation is required."
              }
            },
            required: [
              "religion", "question", "issue", "rule", "application", "conclusion", "relatedRules", "escalate", "escalateReason"
            ]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini API");
      }

      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error("Consultation API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate legal consultation response." });
    }
  });

  // Serve static assets and handle SPA fallback in production/development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
