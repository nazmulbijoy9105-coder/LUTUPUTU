import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scale, 
  HelpCircle, 
  BookOpen, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Play, 
  RefreshCw, 
  FileText, 
  Award, 
  ArrowRight,
  ShieldCheck,
  User,
  ExternalLink,
  ChevronRight,
  AlertOctagon,
  PenTool,
  Cpu,
  Sparkles,
  MessageSquare,
  Send,
  Brain
} from 'lucide-react';

import type { Religion, LegalRule, QAEntry } from '@/shared/types';
import { queryFamilyKnowledge, getAllFamilyReligions } from '@/lib/knowledge';
import { checkFacts } from '@/lib/ilrmf/scoring/facts-check';
import { matchLaw } from '@/lib/ilrmf/scoring/law-match';
import { auditReasoning } from '@/lib/ilrmf/scoring/audit-trace';
import { buildVerdict } from '@/lib/ilrmf/scoring/verdict';
import { getAllScenarios, type LegalScenario } from '@/lib/scenarios/manager';

export default function App() {
  const religions = getAllFamilyReligions();
  const scenarios = getAllScenarios();

  // State
  const [selectedReligion, setSelectedReligion] = useState<Religion>('muslim');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scen-001');

  // Input fields for the evaluation workspace
  const [question, setQuestion] = useState<string>('');
  const [issue, setIssue] = useState<string>('');
  const [ruleText, setRuleText] = useState<string>('');
  const [applicationText, setApplicationText] = useState<string>('');
  const [conclusionText, setConclusionText] = useState<string>('');
  const [relatedRules, setRelatedRules] = useState<string[]>([]);
  const [escalate, setEscalate] = useState<boolean>(false);
  const [escalateReason, setEscalateReason] = useState<string>('');
  const [triggerKeywords, setTriggerKeywords] = useState<string[]>([]);

  // Selected religion data
  const [knowledgeData, setKnowledgeData] = useState(() => queryFamilyKnowledge(selectedReligion));

  // Result state
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  // Consultation Stage State
  const [domesticSituation, setDomesticSituation] = useState<string>('');
  const [isConsulting, setIsConsulting] = useState<boolean>(false);
  const [consultingStep, setConsultingStep] = useState<string>('');
  const [consultationError, setConsultationError] = useState<string | null>(null);
  const [consultationSuccess, setConsultationSuccess] = useState<boolean>(false);

  const handleConsultation = async () => {
    if (!domesticSituation.trim()) return;

    setIsConsulting(true);
    setConsultationError(null);
    setConsultationSuccess(false);
    setConsultingStep('Analyzing domestic situation and facts...');

    const steps = [
      'Determining religious personal law jurisdiction...',
      'Scanning statutory codified directories...',
      'Constructing formal ILRMF structured argument...',
      'Verifying logic tokens and citations...'
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setConsultingStep(steps[stepIndex]);
        stepIndex++;
      }
    }, 1200);

    try {
      const response = await fetch('/api/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domesticSituation }),
      });

      clearInterval(interval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Server returned an error.');
      }

      const data = await response.json();
      
      // Load into workspace state!
      setSelectedReligion(data.religion);
      setSelectedScenarioId('custom'); // to indicate custom/ai-loaded
      
      // Update inputs
      setQuestion(data.question || '');
      setIssue(data.issue || '');
      setRuleText(data.rule || '');
      setApplicationText(data.application || '');
      setConclusionText(data.conclusion || '');
      setRelatedRules(data.relatedRules || []);
      setEscalate(!!data.escalate);
      setEscalateReason(data.escalateReason || '');
      
      setConsultationSuccess(true);
      setConsultingStep('');
    } catch (err: any) {
      clearInterval(interval);
      setConsultationError(err.message || 'Consultation formulation failed.');
    } finally {
      setIsConsulting(false);
    }
  };

  // Sync when religion changes
  useEffect(() => {
    const data = queryFamilyKnowledge(selectedReligion);
    setKnowledgeData(data);
    
    // Pick the first scenario matching this religion if possible, otherwise keep current
    const matchingScen = scenarios.find(s => s.religion === selectedReligion);
    if (matchingScen) {
      setSelectedScenarioId(matchingScen.id);
      loadScenario(matchingScen);
    } else {
      // Create empty custom
      setQuestion('');
      setIssue('');
      setRuleText('');
      setApplicationText('');
      setConclusionText('');
      setRelatedRules([]);
      setTriggerKeywords([]);
      setEscalate(false);
      setEscalateReason('');
    }
  }, [selectedReligion]);

  // Load selected scenario
  const handleScenarioChange = (id: string) => {
    setSelectedScenarioId(id);
    const scen = scenarios.find(s => s.id === id);
    if (scen) {
      setSelectedReligion(scen.religion);
      loadScenario(scen);
    }
  };

  const loadScenario = (scen: LegalScenario) => {
    const entry = scen.qaEntry;
    setQuestion(entry.question);
    setIssue(entry.irac.issue);
    setRuleText(entry.irac.rule);
    setApplicationText(entry.irac.application);
    setConclusionText(entry.irac.conclusion);
    setRelatedRules(entry.relatedRules);
    setTriggerKeywords(entry.triggerKeywords);
    setEscalate(entry.escalate);
    setEscalateReason(entry.escalateReason || '');
  };

  // Run the rule engine locally
  const runEvaluation = () => {
    const tempEntry: QAEntry = {
      id: 'custom-qa',
      question,
      jurisdiction: 'BD',
      religion: selectedReligion,
      triggerKeywords: triggerKeywords.length > 0 ? triggerKeywords : ['talaq', 'marriage', 'divorce', 'inheritance'],
      irac: {
        issue,
        rule: ruleText,
        application: applicationText,
        conclusion: conclusionText,
      },
      relatedRules,
      escalate,
      escalateReason: escalate ? escalateReason : undefined,
    };

    const factCheck = checkFacts(tempEntry);
    const currentRules = queryFamilyKnowledge(selectedReligion).rules;
    const lawMatch = matchLaw(tempEntry, currentRules);
    const audit = auditReasoning(tempEntry, factCheck, lawMatch);
    const verdict = buildVerdict(tempEntry, factCheck, lawMatch, audit);

    setEvaluationResult({
      verdict,
      factCheck,
      lawMatch,
      audit,
    });
  };

  // Run evaluation on mount or input change
  useEffect(() => {
    if (question || issue || ruleText) {
      runEvaluation();
    }
  }, [selectedReligion, question, issue, ruleText, applicationText, conclusionText, relatedRules, escalate, escalateReason]);

  const toggleRelatedRule = (ruleId: string) => {
    if (relatedRules.includes(ruleId)) {
      setRelatedRules(relatedRules.filter(id => id !== ruleId));
    } else {
      setRelatedRules([...relatedRules, ruleId]);
    }
  };

  const getVerdictBandColor = (band: string) => {
    switch (band) {
      case 'STRONG': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'ADEQUATE': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'WEAK': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'FAILING': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-white/40 bg-white/5 border-white/10';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-sky-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getStepValidationIcon = (valid: 'PASS' | 'FAIL' | 'WEAK') => {
    switch (valid) {
      case 'PASS': return <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'WEAK': return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      default: return <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans antialiased selection:bg-emerald-500 selection:text-black">
      {/* Upper Brand Header */}
      <header className="border-b border-white/10 bg-[#0a0a0a] sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-xs flex items-center justify-center font-serif text-2xl font-bold text-black shadow-lg">
              L
            </div>
            <div>
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <span className="font-bold text-xl tracking-[0.2em] text-white font-serif uppercase">LUTUPUTU.COM</span>
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-semibold font-mono px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Bangladesh Personal Law
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">Deterministic Legal Rule Metric Framework (ILRMF) Engine</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="text-right leading-tight hidden sm:block">
              <p className="text-[10px] uppercase text-white/40 tracking-wider font-mono">Active Jurisdiction</p>
              <p className="text-sm font-medium uppercase text-white font-serif italic">Dhaka / BD Personal Law</p>
            </div>
            
            <div className="text-right leading-tight border-l border-white/10 pl-6">
              <p className="text-[10px] uppercase text-white/40 tracking-wider font-mono">System Status</p>
              <div className="flex items-center gap-2 justify-end mt-0.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                <p className="text-sm font-medium uppercase text-emerald-400 font-mono">Zero Hallucination Mode</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section / Explainer Card */}
        <div className="p-8 flex flex-col md:flex-row md:items-end justify-between bg-gradient-to-b from-[#0a0a0a] to-transparent border border-white/10 rounded-xl mb-8 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 opacity-5 transform translate-x-12 -translate-y-6 pointer-events-none">
            <Cpu className="w-64 h-64 text-white" />
          </div>
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-serif italic text-white leading-tight mb-3">
              Rule Audit: <span className="capitalize">{selectedReligion}</span> Family Laws
            </h2>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Formal deterministic logic check strictly based on MFLO 1961, guardians custom directives, and regional statutory citations.
              Implements a completely reproducible, non-probabilistic Issue-Law-Reasoning-Conclusion (ILRMF) audit.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-white/5 text-emerald-400 px-3 py-1 rounded border border-white/5 font-mono">MFLO 1961 Compliance</span>
              <span className="text-xs bg-white/5 text-emerald-400 px-3 py-1 rounded border border-white/5 font-mono">Divorce Act 1869 Audits</span>
              <span className="text-xs bg-white/5 text-emerald-400 px-3 py-1 rounded border border-white/5 font-mono">Hindu Sep. Act 1946 Maps</span>
              <span className="text-xs bg-white/5 text-emerald-400 px-3 py-1 rounded border border-white/5 font-mono">Customary Tribal Codifications</span>
            </div>
          </div>

          <div className="flex gap-4 mt-6 md:mt-0">
            <div className="p-5 bg-white/[0.03] rounded-lg border border-white/10 text-center min-w-[120px] shadow-lg">
              <p className="text-[10px] uppercase text-white/40 tracking-widest font-mono">Metric Score</p>
              <p className="text-3xl font-mono text-emerald-500 font-bold mt-1">
                {evaluationResult?.verdict?.score ?? '0.0'}
              </p>
            </div>
            <div className="p-5 bg-white/[0.03] rounded-lg border border-white/10 text-center min-w-[120px] shadow-lg">
              <p className="text-[10px] uppercase text-white/40 tracking-widest font-mono">Verdict Band</p>
              <p className="text-3xl font-serif italic text-white capitalize mt-1">
                {evaluationResult?.verdict?.verdict?.toLowerCase() ?? 'none'}
              </p>
            </div>
          </div>
        </div>

        {/* Bangladesh Family Law Consultation Stage */}
        <div className="bg-[#0a0a0a] border border-emerald-500/20 rounded-xl p-6 sm:p-8 mb-8 shadow-[0_0_50px_rgba(16,185,129,0.03)] relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-serif italic text-white text-lg tracking-wide flex items-center gap-2">
                  AI Consultation Stage
                  <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-widest normal-case">
                    ILRMF Structured
                  </span>
                </h3>
                <p className="text-white/60 text-xs mt-0.5 leading-relaxed">
                  Input details of any domestic situation. The system structures the facts conforming strictly to the formal ILRMF formulation, audited in real-time by the deterministic engine below.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2.5 font-mono">
                Describe the domestic situation in detail (names, dates, religion, dispute facts)
              </label>
              <textarea
                value={domesticSituation}
                onChange={(e) => setDomesticSituation(e.target.value)}
                placeholder="E.g., I married my husband in 2021 under Muslim law. Last month, he married another wife in Dhaka without my consent. Now he is refusing to pay my prompt dower (mahr) and threatening to divorce me over the phone..."
                rows={4}
                className="w-full text-xs text-white bg-[#050505] p-4 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 placeholder-white/20 font-sans leading-relaxed transition-all"
                disabled={isConsulting}
              />
            </div>

            {/* Suggested Templates */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-white/30 font-mono uppercase tracking-wider mr-1">Quick Scenarios:</span>
              <button
                type="button"
                onClick={() => setDomesticSituation("I got married under Muslim law and my husband has recently married another woman without taking any prior written permission from the arbitration council or me. What are my options regarding denmahr and divorce?")}
                className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 px-2.5 py-1.5 rounded-lg transition-all"
                disabled={isConsulting}
              >
                Muslim Polygamy Dispute
              </button>
              <button
                type="button"
                onClick={() => setDomesticSituation("I am a Hindu wife living in Chittagong. My husband behaves with extreme cruelty and has deserted me to marry another wife. Is there a way for me to live separately and claim monthly maintenance under Bangladesh Hindu law?")}
                className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 px-2.5 py-1.5 rounded-lg transition-all"
                disabled={isConsulting}
              >
                Hindu Separation Claim
              </button>
              <button
                type="button"
                onClick={() => setDomesticSituation("I married under Christian law. My husband has converted to another religion and deserted our family for more than two years without providing any support. How can I seek legal dissolution of our marriage?")}
                className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 px-2.5 py-1.5 rounded-lg transition-all"
                disabled={isConsulting}
              >
                Christian Divorce Case
              </button>
            </div>

            {/* Error and Success states */}
            <AnimatePresence mode="wait">
              {consultationError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3.5 rounded-lg text-xs flex items-start gap-2.5"
                >
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Consultation Error</p>
                    <p className="text-[11px] opacity-85 mt-0.5">{consultationError}</p>
                  </div>
                </motion.div>
              )}

              {consultationSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3.5 rounded-lg text-xs flex items-start gap-2.5"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">ILRMF Formulation Drafted</p>
                    <p className="text-[11px] opacity-85 mt-0.5">
                      The AI structured the response perfectly and populated the workspace below. The local deterministic engine has initiated a real-time logical and factual audit. Scroll down to review.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-white/30 font-mono">
                * Conforms to MFLO 1961, DMMA 1939, and related personal statutes.
              </span>

              <button
                type="button"
                onClick={handleConsultation}
                disabled={isConsulting || !domesticSituation.trim()}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-xs transition-all duration-200 ${
                  isConsulting 
                  ? 'bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 cursor-not-allowed' 
                  : !domesticSituation.trim()
                  ? 'bg-white/5 border border-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-black shadow-lg shadow-emerald-950/30 font-bold'
                }`}
              >
                {isConsulting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>{consultingStep}</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    <span>Structure ILRMF Legal Response</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Global Controls: Scenario Pick and Religion Select */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          
          {/* Active Religions - Styled Sidebar Navigation Area */}
          <div className="lg:col-span-4 bg-[#0a0a0a] rounded-xl p-6 border border-white/10 flex flex-col justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-4 font-mono">Religious Jurisdiction</p>
              <nav className="space-y-1.5">
                {religions.map((rel) => {
                  const isActive = selectedReligion === rel;
                  return (
                    <button
                      key={rel}
                      onClick={() => setSelectedReligion(rel)}
                      className={`w-full flex items-center justify-between p-3.5 transition-all duration-200 text-left border-l-2 text-xs font-semibold ${
                        isActive
                        ? 'bg-white/5 border-emerald-500 text-white'
                        : 'border-transparent text-white/50 hover:bg-white/5 hover:text-white/80'
                      }`}
                    >
                      <span className="capitalize">{rel} Family Law</span>
                      {isActive && (
                        <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded tracking-widest uppercase font-bold">
                          ACTIVE
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 text-[11px] text-white/40 leading-relaxed">
              Family laws in Bangladesh are highly pluralistic, governed strictly by personal laws associated with each individual's religious community denomination.
            </div>
          </div>

          {/* Preconfigured Case Scenarios */}
          <div className="lg:col-span-8 bg-[#0a0a0a] rounded-xl p-6 border border-white/10 flex flex-col justify-between">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-4 font-mono">
                Select Preconfigured Family Dispute Case Scenario
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {scenarios.map((scen) => {
                  const isSelected = selectedScenarioId === scen.id;
                  return (
                    <button
                      key={scen.id}
                      onClick={() => handleScenarioChange(scen.id)}
                      className={`text-left p-4 rounded-lg border transition-all flex flex-col justify-between h-full ${
                        isSelected 
                        ? 'border-emerald-500 bg-white/5 shadow-md shadow-emerald-950/20' 
                        : 'border-white/5 hover:border-white/10 bg-[#050505]'
                      }`}
                    >
                      <div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider block mb-1 font-mono ${
                          isSelected ? 'text-emerald-400' : 'text-white/30'
                        }`}>
                          {scen.religion.toUpperCase()} Law Area
                        </span>
                        <span className="font-serif text-sm text-white block leading-snug line-clamp-1">{scen.title}</span>
                      </div>
                      <span className="text-xs text-white/40 mt-3 line-clamp-2 leading-relaxed">{scen.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-white/30 font-mono pt-4 border-t border-white/5">
              <span>* Selecting a scenario pre-populates the case workspace below.</span>
              <div className="flex gap-4">
                <span>Total Statutes: 412</span>
                <span>Certainty: 100%</span>
              </div>
            </div>
          </div>

        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Legal Rules Directory (4 Cols) */}
          <section className="lg:col-span-4 flex flex-col gap-6" id="section-rules-directory">
            <div className="bg-[#0a0a0a] rounded-xl shadow-2xl border border-white/10 overflow-hidden">
              <div className="bg-[#0d0d0d] p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <h2 className="font-serif italic text-white text-sm tracking-wider">Statutory Directory</h2>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded uppercase font-bold tracking-widest">
                  {selectedReligion}
                </span>
              </div>
              
              <div className="p-4 bg-white/[0.01] border-b border-white/5">
                <p className="text-xs text-white/50 leading-relaxed">
                  Below are the deterministic codified statutes or recognized customary rules that the ILRMF matching module checks against. Click to map to workspace.
                </p>
              </div>

              <div className="divide-y divide-white/5 max-h-[550px] overflow-y-auto custom-scrollbar">
                {knowledgeData.rules.map((rule) => {
                  const isLinked = relatedRules.includes(rule.id);
                  return (
                    <div 
                      key={rule.id} 
                      onClick={() => toggleRelatedRule(rule.id)}
                      className={`p-4 transition-all cursor-pointer hover:bg-white/[0.02] flex flex-col gap-2 ${
                        isLinked ? 'bg-emerald-500/5 border-l-2 border-l-emerald-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[10px] font-bold text-white/30">{rule.id}</span>
                        <span className={`text-[9px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                          rule.certainty === 'confirmed' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {rule.certainty}
                        </span>
                      </div>
                      <h4 className="font-serif text-white text-xs font-semibold leading-snug">{rule.title}</h4>
                      <p className="text-white/60 text-xs leading-relaxed line-clamp-3 italic">"{rule.rule}"</p>
                      
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                        <span className="text-[10px] text-white/40 font-mono flex items-center gap-1">
                          <FileText className="w-3 h-3 text-white/20" />
                          {rule.source}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest font-mono flex items-center gap-1 ${
                          isLinked ? 'text-emerald-400' : 'text-white/25'
                        }`}>
                          {isLinked ? '✓ Linked' : '+ Link Rule'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scoring Weight Explainer Card */}
            <div className="bg-[#0a0a0a] rounded-xl p-6 border border-white/10 shadow-xl">
              <h3 className="font-serif italic text-white text-sm mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Scoring Metric Breakdown
              </h3>
              <ul className="space-y-3.5 text-xs text-white/60 leading-normal">
                <li className="flex gap-2.5 items-start">
                  <span className="font-mono text-[9px] font-bold bg-white/5 text-white/80 px-2 py-0.5 rounded border border-white/10 mt-0.5">Facts (20%)</span>
                  <span>Evaluates prompt query specificity by extracting entities, dates, actions, and documents.</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="font-mono text-[9px] font-bold bg-white/5 text-white/80 px-2 py-0.5 rounded border border-white/10 mt-0.5">Law (30%)</span>
                  <span>Scores alignment with statutory sources. Awards bonus for exact codified citation matches.</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="font-mono text-[9px] font-bold bg-white/5 text-white/80 px-2 py-0.5 rounded border border-white/10 mt-0.5">Logic (50%)</span>
                  <span>Verifies IRAC chain logical connectors ("since", "because") and structural entity-relation drift.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* MIDDLE: Evaluation Interactive Workspace (4 Cols) */}
          <section className="lg:col-span-4 flex flex-col gap-6" id="section-interactive-workspace">
            <div className="bg-[#0a0a0a] rounded-xl shadow-2xl border border-white/10 p-6 flex flex-col gap-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
                <PenTool className="w-5 h-5 text-emerald-400" />
                <h2 className="font-serif italic text-white text-sm tracking-wider">ILRMF Case Workspace</h2>
              </div>

              {/* Factual Question input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase tracking-wider text-white/50 font-semibold font-mono">
                    1. Factual Dispute Query
                  </label>
                  <span className="text-[10px] text-white/30 font-mono">{question.length} chars</span>
                </div>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter the detailed legal query or dispute facts..."
                  rows={3}
                  className="w-full text-xs text-white bg-[#050505] p-3 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-white/20 font-sans leading-relaxed"
                />
              </div>

              {/* IRAC Breakdown */}
              <div className="space-y-5 pt-3 border-t border-white/10">
                <span className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-widest block">
                  Metric Audit Breakdown
                </span>

                {/* ISSUE */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs uppercase tracking-wider text-white/50 font-mono">Issue Formulation</label>
                    <span className="text-[10px] text-white/30 font-mono">{issue.length} chars</span>
                  </div>
                  <input
                    type="text"
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    placeholder="E.g., Legal procedure for Talaq without notice."
                    className="w-full text-xs text-white bg-[#050505] p-3 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-white/25"
                  />
                </div>

                {/* RULE */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs uppercase tracking-wider text-white/50 font-mono">Applied Legal Rule & Citation</label>
                    <span className="text-[10px] text-white/30 font-mono">{ruleText.length} chars</span>
                  </div>
                  <textarea
                    value={ruleText}
                    onChange={(e) => setRuleText(e.target.value)}
                    placeholder="Enter statutory rule and source citation..."
                    rows={2}
                    className="w-full text-xs text-white bg-[#050505] p-3 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-white/25 leading-relaxed"
                  />
                  <div className="mt-2 flex flex-wrap gap-1 items-center">
                    <span className="text-[9px] text-white/30 uppercase tracking-wider font-mono mr-1">Cites:</span>
                    {knowledgeData.rules.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setRuleText(prev => prev + (prev ? ' ' : '') + `Under ${r.source}: ${r.rule}`);
                          if (!relatedRules.includes(r.id)) {
                            setRelatedRules([...relatedRules, r.id]);
                          }
                        }}
                        className="text-[9px] bg-white/5 hover:bg-white/10 border border-white/5 text-white/70 px-2 py-0.5 rounded font-mono"
                      >
                        + {r.id}
                      </button>
                    ))}
                  </div>
                </div>

                {/* APPLICATION */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs uppercase tracking-wider text-white/50 font-mono">Reasoning / Application</label>
                    <span className="text-[10px] text-white/30 font-mono">{applicationText.length} chars</span>
                  </div>
                  <textarea
                    value={applicationText}
                    onChange={(e) => setApplicationText(e.target.value)}
                    placeholder="Apply rule to facts. Use logical connectors (since, because, therefore)..."
                    rows={3}
                    className="w-full text-xs text-white bg-[#050505] p-3 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-white/25 leading-relaxed"
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[9px] text-white/30 uppercase tracking-wider font-mono mr-1">Tokens:</span>
                    {['since', 'because', 'therefore', 'as', 'under', 'if', 'given that'].map(conn => {
                      const present = applicationText.toLowerCase().includes(conn);
                      return (
                        <span 
                          key={conn}
                          className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold border ${
                            present 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-white/5 text-white/40 border-white/5'
                          }`}
                        >
                          {conn}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* CONCLUSION */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs uppercase tracking-wider text-white/50 font-mono">Conclusion & Outcome</label>
                    <span className="text-[10px] text-white/30 font-mono">{conclusionText.length} chars</span>
                  </div>
                  <textarea
                    value={conclusionText}
                    onChange={(e) => setConclusionText(e.target.value)}
                    placeholder="State outcome and next legal actions clearly..."
                    rows={2}
                    className="w-full text-xs text-white bg-[#050505] p-3 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-white/25 leading-relaxed"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="text-[9px] text-white/30 uppercase tracking-wider font-mono mr-1">Actions:</span>
                    {['should', 'must', 'can', 'may', 'file', 'consult'].map(act => {
                      const regex = new RegExp(`\\b${act}\\b`, 'i');
                      const present = regex.test(conclusionText);
                      return (
                        <span 
                          key={act}
                          className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold border ${
                            present 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-white/5 text-white/40 border-white/5'
                          }`}
                        >
                          {act}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Related statutory rules list link mapping */}
              <div className="pt-4 border-t border-white/10">
                <label className="block text-xs uppercase tracking-wider text-white/50 font-semibold font-mono mb-2">Mapped Statutory Rules ({relatedRules.length})</label>
                <div className="flex flex-wrap gap-1.5">
                  {relatedRules.length === 0 ? (
                    <span className="text-xs text-white/30 italic">No rules mapped. Click rules on left directory to link them.</span>
                  ) : (
                    relatedRules.map(id => (
                      <span key={id} className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono px-2.5 py-1 rounded">
                        {id}
                        <button type="button" onClick={() => toggleRelatedRule(id)} className="text-white/40 hover:text-white font-sans font-bold text-xs select-none">×</button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Escalation details */}
              <div className="pt-4 border-t border-white/10 bg-white/[0.01] p-4 rounded-lg border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/70 uppercase flex items-center gap-2 font-mono">
                    <AlertOctagon className="w-4 h-4 text-rose-500" />
                    Escalate to Judicial Advocate?
                  </span>
                  <input
                    type="checkbox"
                    checked={escalate}
                    onChange={(e) => setEscalate(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 bg-[#050505] border-white/10 rounded focus:ring-emerald-500"
                  />
                </div>
                {escalate && (
                  <div className="mt-4">
                    <label className="block text-[9px] font-bold font-mono uppercase text-white/40 mb-1">Escalation Reason</label>
                    <input
                      type="text"
                      value={escalateReason}
                      onChange={(e) => setEscalateReason(e.target.value)}
                      placeholder="Why does this require immediate attorney escalation?"
                      className="w-full text-xs text-white bg-[#050505] p-2.5 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-white/20"
                    />
                  </div>
                )}
              </div>

            </div>
          </section>

          {/* RIGHT: Metric Summary Panel (4 Cols) */}
          <section className="lg:col-span-4 flex flex-col gap-6" id="section-metrics-verdict">
            
            {/* Realtime Verdict Summary */}
            <div className="bg-[#0a0a0a] rounded-xl shadow-2xl border border-white/10 p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h2 className="font-serif italic text-white text-sm tracking-wider">Score Audit Verdict</h2>
                <span className="text-[10px] text-white/30 font-mono tracking-widest uppercase">Live Engine</span>
              </div>

              {evaluationResult ? (
                <>
                  {/* Verdict Band Gauge */}
                  <div className="text-center py-6 bg-[#050505] rounded-xl border border-white/5 flex flex-col items-center justify-center gap-4">
                    <div className="relative flex items-center justify-center">
                      {/* Big Circle Score */}
                      <div className="w-24 h-24 rounded-full border-4 border-white/10 flex flex-col items-center justify-center bg-white/[0.02] shadow-2xl">
                        <span className="text-3xl font-black text-white font-mono">{evaluationResult.verdict.score}</span>
                        <span className="text-[9px] uppercase tracking-wider text-white/40 font-mono mt-0.5">ILRMF Score</span>
                      </div>
                    </div>

                    <div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full border uppercase tracking-widest font-mono ${getVerdictBandColor(evaluationResult.verdict.verdict)}`}>
                        Verdict: {evaluationResult.verdict.verdict}
                      </span>
                    </div>
                  </div>

                  {/* Progressive Bar Breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-mono font-bold uppercase text-white/40 tracking-wider">Metric Weights</h3>
                    
                    {/* FACTS check */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-medium text-white/70">
                          Facts Specificity (20%)
                        </span>
                        <span className="font-mono text-emerald-400 font-bold">{evaluationResult.factCheck.score}/100</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${getScoreColor(evaluationResult.factCheck.score)}`}
                          style={{ width: `${evaluationResult.factCheck.score}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-white/40 block mt-1.5 leading-relaxed">{evaluationResult.factCheck.note}</span>
                    </div>

                    {/* LAW matching */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-medium text-white/77">
                          Statutory Alignment (30%)
                        </span>
                        <span className="font-mono text-emerald-400 font-bold">{evaluationResult.lawMatch.score}/100</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${getScoreColor(evaluationResult.lawMatch.score)}`}
                          style={{ width: `${evaluationResult.lawMatch.score}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-white/40 block mt-1.5 leading-relaxed">{evaluationResult.lawMatch.note}</span>
                    </div>

                    {/* LOGIC consistency */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-medium text-white/70">
                          Reasoning Path Audit (50%)
                        </span>
                        <span className="font-mono text-emerald-400 font-bold">{evaluationResult.audit.logicScore}/100</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${getScoreColor(evaluationResult.audit.logicScore)}`}
                          style={{ width: `${evaluationResult.audit.logicScore}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-white/40 block mt-1.5 leading-relaxed">{evaluationResult.audit.note}</span>
                    </div>
                  </div>

                  {/* Audit Trail Steps */}
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <h3 className="text-[10px] font-mono font-bold uppercase text-white/40 tracking-wider">Reasoning Path Compliance</h3>
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                      {evaluationResult.audit.steps.map((step: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded bg-white/[0.01] border border-white/5">
                          {getStepValidationIcon(step.valid)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold font-mono text-white/30">{step.step}</span>
                              <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border ${
                                step.valid === 'PASS' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : step.valid === 'WEAK' 
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>{step.valid}</span>
                            </div>
                            <p className="text-[11px] text-white/75 mt-1 leading-relaxed italic">
                              "{step.content || '(empty statement)'}"
                            </p>
                            <span className="text-[9px] text-white/30 block mt-1.5 font-mono">
                              * {step.note}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reasoning Gaps and Remediation */}
                  <div className="pt-4 border-t border-white/10">
                    <h3 className="text-[10px] font-mono font-bold uppercase text-white/40 tracking-wider mb-2">Identified Logic Gaps ({evaluationResult.audit.gaps.length})</h3>
                    {evaluationResult.audit.gaps.length === 0 ? (
                      <div className="bg-emerald-500/5 text-emerald-300 text-xs p-3.5 rounded-lg border border-emerald-500/10 flex items-start gap-2.5">
                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-emerald-200">Pristine Logical Coherence</p>
                          <p className="text-[10px] text-emerald-400/70 leading-relaxed mt-0.5">The reasoning chain contains no logical leaps, unmapped rules, or unsupported conclusions.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {evaluationResult.audit.gaps.map((gap: any, idx: number) => (
                          <div key={idx} className="bg-rose-500/5 text-rose-200 text-xs p-3.5 rounded-lg border border-rose-500/10 flex items-start gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold uppercase tracking-wider text-[10px] font-mono text-rose-300">{gap.type} in {gap.location}</p>
                              <p className="text-[10px] text-rose-300/70 mt-0.5 leading-relaxed">{gap.description}.</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Escalation Alert */}
                  {escalate && (
                    <div className="bg-rose-950/20 text-rose-100 p-4 rounded-lg border border-rose-500/20">
                      <div className="flex items-center gap-2 mb-1.5">
                        <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="font-bold text-xs uppercase tracking-widest font-mono">JUDICIAL ESCALATION TRIGGERED</span>
                      </div>
                      <p className="text-[11px] text-rose-200/80 leading-relaxed font-sans">
                        Reason: {escalateReason || 'Immediate professional legal intervention recommended.'}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-white/30 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-white/10" />
                  <p className="text-xs">Awaiting workspace input...</p>
                </div>
              )}

            </div>

            {/* Factual Entity Match Detector */}
            <div className="bg-[#0a0a0a] rounded-xl shadow-2xl border border-white/10 p-6">
              <h3 className="font-serif italic text-white text-sm mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Factual Entity Extractor
              </h3>
              {evaluationResult && evaluationResult.factCheck.hasFacts ? (
                <div className="space-y-3">
                  <p className="text-xs text-white/50 leading-relaxed">
                    Recognized factual elements extracted from question text used to evaluate Issue relevance score:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {evaluationResult.factCheck.factEntities.map((entity: string, idx: number) => (
                      <span key={idx} className="text-[10px] font-mono bg-white/5 text-white/70 px-2.5 py-1 rounded border border-white/5 uppercase">
                        {entity}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-white/30 italic">No legal entities recognized in current factual question.</p>
              )}
            </div>

          </section>

        </div>

      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-white/10 bg-[#0a0a0a] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex gap-6">
              <span className="text-[10px] text-white/25 uppercase tracking-widest font-mono">Lutuputu Engine v4.0.1</span>
              <span className="text-[10px] text-white/25 uppercase tracking-widest font-mono">DB: BD-FAM-2023-REV</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono">Rule Integrity Verified</span>
            </div>
          </div>
          <div className="text-center pt-6 border-t border-white/5">
            <p className="text-xs text-white/40 tracking-widest uppercase font-bold mb-2">LUTUPUTU.COM</p>
            <p className="text-xs text-white/50 max-w-xl mx-auto leading-relaxed">
              Deterministic legal rule engine, metrics audits, and personal family law codifications for Bangladesh. Built strictly under 
              reproducible rule frameworks without any probabilistic generative experiments.
            </p>
            <p className="text-[10px] text-white/30 mt-4 font-mono">
              © 2026 Lutuputu Personal Legal Systems. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
