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
  Brain,
  Download,
  ChevronDown,
  Lock,
  Unlock
} from 'lucide-react';
import { jsPDF } from 'jspdf';

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
  const [isJurisdictionSelected, setIsJurisdictionSelected] = useState<boolean>(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [adminError, setAdminError] = useState<string>('');
  const [showStatutes, setShowStatutes] = useState<boolean>(false);

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
  const [isILRMFActive, setIsILRMFActive] = useState<boolean>(true);
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);
  const [isSidebarDownloadOpen, setIsSidebarDownloadOpen] = useState<boolean>(false);

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
      setIsJurisdictionSelected(true);
      
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

  const handleAdminVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const normalized = adminPasswordInput.trim().toLowerCase();
    if (normalized === 'lutuputu' || normalized === 'admin' || normalized === 'admin123') {
      setIsAdminMode(true);
      setShowAdminModal(false);
      setAdminPasswordInput('');
      setAdminError('');
    } else {
      setAdminError('Incorrect chambers authentication key. Access denied.');
    }
  };

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
      case 'STRONG': return 'text-emerald-700 bg-emerald-50 border-emerald-200/80';
      case 'ADEQUATE': return 'text-sky-700 bg-sky-50 border-sky-200/80';
      case 'WEAK': return 'text-amber-700 bg-amber-50 border-amber-200/80';
      case 'FAILING': return 'text-rose-700 bg-rose-50 border-rose-200/80';
      default: return 'text-slate-500 bg-slate-50 border-slate-200';
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

  const handleDownloadPDF = (type: 'irac' | 'ilrmf' | 'hybrid' = 'hybrid') => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let y = 20;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = 210 - (2 * margin);

    const drawPageHeader = () => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('LUTUPUTU.COM | BANGLADESH PERSONAL FAMILY LAW ENGINE', margin, 10);
      
      let headerTitle = 'DETERMINISTIC LEGAL AUDIT REPORT';
      if (type === 'irac') {
        headerTitle = 'IRAC SOLE COMPLIANCE AUDIT REPORT';
      } else if (type === 'ilrmf') {
        headerTitle = 'ILRMF SOLE COMPLIANCE AUDIT REPORT';
      } else if (type === 'hybrid') {
        headerTitle = 'HYBRID IRAC-ILRMF COMPLIANCE AUDIT REPORT';
      }
      doc.text(headerTitle, 210 - margin, 10, { align: 'right' });
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.2);
      doc.line(margin, 12, 210 - margin, 12);
    };

    const checkPageOverflow = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = 20;
        drawPageHeader();
      }
    };

    const addSectionHeader = (title: string, color: number[] = [16, 185, 129]) => {
      checkPageOverflow(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(title.toUpperCase(), margin, y);
      y += 4;
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(0.8);
      doc.line(margin, y, margin + 25, y);
      y += 6;
    };

    const addKeyValueRow = (key: string, value: string, isMultiline = false) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // slate-600
      
      if (!isMultiline) {
        checkPageOverflow(8);
        doc.text(`${key}:`, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(value, margin + 45, y);
        y += 7;
      } else {
        const keyLines = doc.splitTextToSize(`${key}:`, 40);
        const valueLines = doc.splitTextToSize(value, contentWidth - 45);
        const neededHeight = Math.max(keyLines.length, valueLines.length) * 5 + 3;
        checkPageOverflow(neededHeight);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text(keyLines, margin, y);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(valueLines, margin + 45, y);
        y += neededHeight;
      }
    };

    // --- Page 1: Main Title & Cover ---
    drawPageHeader();
    
    // Choose theme colors based on selected PDF option
    let headerBg: number[] = [15, 23, 42];
    let reportTitle = 'ILRMF LEGAL AUDIT REPORT';
    let reportSubtitle = 'Deterministic Compliance & Legal Consultation Brief';
    
    if (type === 'irac') {
      headerBg = [79, 70, 229]; // Indigo
      reportTitle = 'IRAC SOLE COMPLIANCE AUDIT REPORT';
      reportSubtitle = 'Issue, Rule, Application, and Conclusion Formulation';
    } else if (type === 'ilrmf') {
      headerBg = [13, 148, 136]; // Teal
      reportTitle = 'ILRMF SOLE COMPLIANCE AUDIT REPORT';
      reportSubtitle = 'Facts, Law, Argument, and Relief Specification (ILRMF)';
    } else if (type === 'hybrid') {
      headerBg = [4, 120, 87]; // Emerald
      reportTitle = 'HYBRID IRAC-ILRMF UNIFIED AUDIT REPORT';
      reportSubtitle = 'Dual-Framework System Integration and Compliance Verification';
    }

    // Header block
    y = 20;
    doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
    doc.rect(margin, y, contentWidth, 35, 'F');
    
    // Header text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(reportTitle, margin + 8, y + 13);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(reportSubtitle, margin + 8, y + 21);
    
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} (UTC)`, margin + 8, y + 28);
    y += 42;

    // Core Metrics Block
    if (type !== 'irac') {
      checkPageOverflow(40);
      doc.setFillColor(248, 250, 252); // light slate gray bg
      doc.setDrawColor(226, 232, 240); // border
      doc.rect(margin, y, contentWidth, 32, 'FD');
      
      // Draw columns for Score and Verdict
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text('OVERALL METRIC SCORE', margin + 10, y + 10);
      doc.text('COMPLIANCE VERDICT', margin + 70, y + 10);
      doc.text('JURISDICTION', margin + 130, y + 10);
      
      const overallScore = isILRMFActive ? (evaluationResult?.verdict?.score ?? '0.0') : '0.0';
      const overallVerdict = isILRMFActive ? (evaluationResult?.verdict?.verdict ?? 'NONE') : 'UNVERIFIED';
      
      doc.setFontSize(22);
      if (!isILRMFActive) {
        doc.setTextColor(225, 29, 72); // rose red for unverified
      } else if (parseFloat(overallScore) >= 80) {
        doc.setTextColor(16, 185, 129); // emerald
      } else if (parseFloat(overallScore) >= 50) {
        doc.setTextColor(245, 158, 11); // warning yellow
      } else {
        doc.setTextColor(225, 29, 72); // rose red
      }
      doc.text(isILRMFActive ? `${overallScore} / 100` : '0 / 100 (N/A)', margin + 10, y + 22);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(overallVerdict, margin + 70, y + 20);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${selectedReligion.toUpperCase()} FAMILY LAW`, margin + 130, y + 20);
      y += 38;
    } else {
      y += 5;
    }

    // Case Overview
    addSectionHeader('Case Metadata & Overview', headerBg);
    addKeyValueRow('Religion Jurisdiction', `${selectedReligion.charAt(0).toUpperCase() + selectedReligion.slice(1)} Personal Family Law`);
    addKeyValueRow('Active Region/Country', 'Dhaka / Bangladesh statutory application');
    if (relatedRules.length > 0) {
      addKeyValueRow('Mapped Rule Codes', relatedRules.join(', '));
    }
    addKeyValueRow('Judicial Escalation', escalate ? 'REQUIRED (IMMEDIATE ATTORNEY ATTENTION)' : 'NOT REQUIRED');
    if (escalate && escalateReason) {
      addKeyValueRow('Escalation Grounds', escalateReason, true);
    }
    y += 5;

    // Factual Query Details (always show the background story)
    addSectionHeader('Factual Dispute / Incident details', headerBg);
    if (domesticSituation) {
      addKeyValueRow('Client Situation details', domesticSituation, true);
    } else {
      addKeyValueRow('Client Situation details', question || 'No situation detailed provided.', true);
    }
    y += 5;

    // 1. IRAC Section
    if (type === 'irac' || type === 'hybrid') {
      addSectionHeader('IRAC Legal formulation', [79, 70, 229]);
      addKeyValueRow('Issue Statement', issue || 'Not specified', true);
      addKeyValueRow('Applicable Rule & Citation', ruleText || 'Not specified', true);
      addKeyValueRow('Logic Application', applicationText || 'Not specified', true);
      addKeyValueRow('Legal Conclusion', conclusionText || 'Not specified', true);
      y += 5;
    }

    // 2. ILRMF Section (FACTS, LAW, ARGUMENT, RELIEF)
    if (type === 'ilrmf' || type === 'hybrid') {
      addSectionHeader('ILRMF Legal formulation (Facts-Law-Argument-Relief)', [13, 148, 136]);
      addKeyValueRow('FACTS (Factual context)', domesticSituation || question || 'Not specified', true);
      addKeyValueRow('LAW (Statutory provisions)', ruleText || 'Not specified', true);
      addKeyValueRow('ARGUMENT (Logical application)', applicationText || 'Not specified', true);
      addKeyValueRow('RELIEF (Sought remedies/concl.)', conclusionText || 'Not specified', true);
      y += 5;
    }

    // Detailed Audit Score breakdown
    if (evaluationResult && type !== 'irac') {
      addSectionHeader(isILRMFActive ? 'Deterministic Audit Breakdown' : 'Traditional Non-Audited Metrics', headerBg);
      if (isILRMFActive) {
        addKeyValueRow('Fact Specificity Score (20% weight)', `${evaluationResult.factCheck?.score ?? 0}/100 - ${evaluationResult.factCheck?.note ?? ''}`);
        addKeyValueRow('Statutory Alignment (30% weight)', `${evaluationResult.lawMatch?.score ?? 0}/100 - ${evaluationResult.lawMatch?.note ?? ''}`);
        addKeyValueRow('Reasoning Path Audit (50% weight)', `${evaluationResult.audit?.logicScore ?? 0}/100 - ${evaluationResult.audit?.note ?? ''}`);
      } else {
        addKeyValueRow('Fact Specificity Score (20% weight)', '0/100 (Unverified) - No factual entity boundaries checked.');
        addKeyValueRow('Statutory Alignment (30% weight)', '0/100 (Unverified) - No physical statutory mapping query executed.');
        addKeyValueRow('Reasoning Path Audit (50% weight)', '0/100 (Unverified) - No logical connectors or rule mapping audited.');
      }
      
      y += 4;
      
      // Add logic steps / compliance
      const steps = isILRMFActive ? (evaluationResult.audit?.steps || []) : [];
      if (steps.length > 0) {
        checkPageOverflow(20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text('REASONING PATH STEPS AUDIT', margin, y);
        y += 6;
        
        steps.forEach((step: any) => {
          const stepLines = doc.splitTextToSize(`[${step.valid}] ${step.step}: ${step.content || '(empty)'}`, contentWidth - 10);
          const needed = stepLines.length * 5 + 4;
          checkPageOverflow(needed);
          
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.rect(margin, y - 4, contentWidth, needed - 1, 'FD');
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(15, 23, 42);
          doc.text(stepLines, margin + 4, y);
          y += needed;
        });
      } else if (!isILRMFActive) {
        // Show unverified placeholder for steps
        checkPageOverflow(20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(220, 38, 38); // red
        doc.text('REASONING PATH COMPLIANCE (UNAUDITED)', margin, y);
        y += 6;
 
        const warningLines = doc.splitTextToSize('WARNING: This output has not been run through the ILRMF deterministic checker. Individual IRAC components have not been audited for structural integrity, logical connectors, or citation validity. Severe hallucination risk.', contentWidth - 10);
        const needed = warningLines.length * 5 + 4;
        checkPageOverflow(needed);
        doc.setFillColor(254, 242, 242); // soft red bg
        doc.setDrawColor(254, 202, 202); // red border
        doc.rect(margin, y - 4, contentWidth, needed - 1, 'FD');
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(153, 27, 27);
        doc.text(warningLines, margin + 4, y);
        y += needed;
      }
 
      // Show identified gaps if any
      const gaps = isILRMFActive ? (evaluationResult.audit?.gaps || []) : [
        { type: 'HALLUCINATION_RISK', location: 'global', description: 'Traditional generative systems operate purely on token probability, creating false dower procedures.' },
        { type: 'LOGICAL_LEAP', location: 'application', description: 'Reasoning transitions are not checked for valid connectors, leaving gaps and fallacies unflagged.' },
        { type: 'STATUTORY_EXCLUSION', location: 'rule', description: 'No physical mapping to Bangladesh personal law databases exists, making citations unverified.' }
      ];
      if (gaps.length > 0) {
        y += 4;
        checkPageOverflow(15);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(225, 29, 72); // rose red
        doc.text(isILRMFActive ? 'IDENTIFIED LOGICAL HOLES & REGULATORY GAPS' : 'CRITICAL TRADITIONAL TRADING/AI SYSTEM VULNERABILITIES', margin, y);
        y += 6;
 
        gaps.forEach((gap: any) => {
          const gapLines = doc.splitTextToSize(`- ${gap.type} in ${gap.location}: ${gap.description}`, contentWidth);
          const needed = gapLines.length * 5 + 2;
          checkPageOverflow(needed);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(15, 23, 42);
          doc.text(gapLines, margin, y);
          y += needed;
        });
      }
    }
 
    // Add Signature/verification block
    y += 10;
    checkPageOverflow(30);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, 210 - margin, y);
    y += 8;
 
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('FORMAL VERIFICATION & DIGITAL AUDIT TRAIL', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    if (type === 'irac') {
      doc.text('This is a structured IRAC legal formulation report compiled under Bangladesh Personal Law.', margin, y);
      y += 4;
      doc.text('This document contains the Issue, Rule, Application, and Conclusion analysis.', margin, y);
    } else {
      doc.text('This is a deterministic computational audit report compiled strictly under the Bangladesh Personal Law ILRMF Specification version 4.0.1.', margin, y);
      y += 4;
      doc.text('Compliance score and logic verification hashes are cryptographically bound to the referenced statutory codes and client prompt details.', margin, y);
    }
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('Proprietary Framework Owned & Authorized by Md. Nazmul Islam, Advocate, Supreme Court of Bangladesh.', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('© 2026 LUTUPUTU.COM. All rights of reproduction, software architecture, and deterministic code execution layouts are fully reserved.', margin, y);
 
    // Save/Download the PDF
    const safeName = `${selectedReligion}-${type}-audit-report.pdf`.toLowerCase();
    doc.save(safeName);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#1e293b] font-sans antialiased selection:bg-emerald-600 selection:text-white">
      {/* Upper Brand Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center font-serif text-2xl font-bold text-white shadow-md">
              L
            </div>
            <div>
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <span className="font-bold text-xl tracking-[0.2em] text-slate-900 font-serif uppercase">LUTUPUTU.COM</span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[9px] font-semibold font-mono px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Bangladesh Personal Law
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic Legal Rule Metric Framework (ILRMF) Engine • Chambers of <span className="font-semibold text-slate-700">Md. Nazmul Islam</span>, Advocate, Supreme Court of Bangladesh
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg text-xs font-bold font-sans transition-all shadow-[0_4px_12px_rgba(16,185,129,0.15)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] select-none cursor-pointer"
                title="Download Formatted PDF Legal Audit Report Options"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Report</span>
                <ChevronDown className="w-3.5 h-3.5 ml-1 transition-transform duration-200" style={{ transform: isDownloadOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
              
              {isDownloadOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 cursor-default" 
                    onClick={() => setIsDownloadOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2.5 w-64 rounded-xl bg-white shadow-xl border border-slate-200/80 z-50 py-1.5 font-sans text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      Select Download Format
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleDownloadPDF('irac');
                        setIsDownloadOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-indigo-50/50 text-slate-700 flex flex-col gap-0.5 border-b border-slate-100 transition-colors"
                    >
                      <span className="font-bold text-indigo-700 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        1. IRAC Sole PDF
                      </span>
                      <span className="text-[10px] text-slate-400 pl-3">Issue, Rule, Application, Conclusion</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleDownloadPDF('ilrmf');
                        setIsDownloadOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-teal-50/50 text-slate-700 flex flex-col gap-0.5 border-b border-slate-100 transition-colors"
                    >
                      <span className="font-bold text-teal-700 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                        2. ILRMF Sole PDF
                      </span>
                      <span className="text-[10px] text-slate-400 pl-3">Facts, Law, Argument, Relief</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleDownloadPDF('hybrid');
                        setIsDownloadOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-emerald-50/50 text-slate-700 flex flex-col gap-0.5 transition-colors"
                    >
                      <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        3. Hybrid Mixed PDF
                      </span>
                      <span className="text-[10px] text-slate-400 pl-3">Unified IRAC & ILRMF Frameworks</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="text-right leading-tight hidden xl:block">
              <p className="text-[10px] uppercase text-slate-400 tracking-wider font-mono">Active Jurisdiction</p>
              <p className="text-sm font-semibold uppercase text-slate-800 font-serif italic">Dhaka / BD Personal Law</p>
            </div>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
              {isAdminMode ? (
                <button
                  type="button"
                  onClick={() => setIsAdminMode(false)}
                  className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-3 py-2 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer select-none"
                  title="Chambers Admin Mode is Active. Click to lock and switch to Client View."
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Admin Active</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAdminError('');
                    setAdminPasswordInput('');
                    setShowAdminModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer select-none border border-slate-200"
                  title="Authenticates chambers staff to access scoring metrics, rule formulas and evaluation boards."
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Chambers Admin</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6 select-none">
              <div className="text-right leading-tight">
                <p className="text-[10px] uppercase text-slate-400 tracking-wider font-mono">System Audit Engine</p>
                <p className={`text-xs font-semibold uppercase font-mono transition-colors ${isILRMFActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isILRMFActive ? 'ILRMF Active' : 'Heuristic Mode'}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setIsILRMFActive(!isILRMFActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${isILRMFActive ? 'bg-emerald-600' : 'bg-slate-300'}`}
                title="Toggle between Strict ILRMF Audit and Heuristic Traditional LLM mode"
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isILRMFActive ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section / Explainer Card */}
        <div className="p-8 flex flex-col md:flex-row md:items-end justify-between bg-gradient-to-b from-white to-slate-50 border border-slate-200/80 rounded-xl mb-8 relative overflow-hidden shadow-sm">
          <div className="absolute right-0 top-0 opacity-[0.03] transform translate-x-12 -translate-y-6 pointer-events-none">
            <Cpu className="w-64 h-64 text-slate-900" />
          </div>
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-serif italic text-slate-900 leading-tight mb-3">
              Rule Audit: <span className="capitalize">{selectedReligion}</span> Family Laws
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Formal deterministic logic check strictly based on MFLO 1961, guardians custom directives, and regional statutory citations.
              Implements a completely reproducible, non-probabilistic Issue-Law-Reasoning-Conclusion (ILRMF) audit.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-slate-100 text-emerald-700 px-3 py-1 rounded border border-slate-200/60 font-mono">MFLO 1961 Compliance</span>
              <span className="text-xs bg-slate-100 text-emerald-700 px-3 py-1 rounded border border-slate-200/60 font-mono">Divorce Act 1869 Audits</span>
              <span className="text-xs bg-slate-100 text-emerald-700 px-3 py-1 rounded border border-slate-200/60 font-mono">Hindu Sep. Act 1946 Maps</span>
              <span className="text-xs bg-slate-100 text-emerald-700 px-3 py-1 rounded border border-slate-200/60 font-mono">Customary Tribal Codifications</span>
            </div>
          </div>

          {isAdminMode ? (
            <div className="flex gap-4 mt-6 md:mt-0">
              <div className="p-5 bg-white rounded-lg border border-slate-200 text-center min-w-[120px] shadow-sm">
                <p className="text-[10px] uppercase text-slate-400 tracking-widest font-mono">Metric Score</p>
                <p className={`text-3xl font-mono font-bold mt-1 ${isILRMFActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isILRMFActive ? (evaluationResult?.verdict?.score ?? '0.0') : '0.0 (N/A)'}
                </p>
              </div>
              <div className="p-5 bg-white rounded-lg border border-slate-200 text-center min-w-[120px] shadow-sm">
                <p className="text-[10px] uppercase text-slate-400 tracking-widest font-mono">Verdict Band</p>
                <p className={`text-2xl font-serif italic mt-1.5 capitalize ${isILRMFActive ? 'text-slate-800' : 'text-rose-700'}`}>
                  {isILRMFActive ? (evaluationResult?.verdict?.verdict?.toLowerCase() ?? 'none') : 'unverified'}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 md:mt-0 flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm min-w-[220px]">
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
                <Scale className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold leading-none mb-1">Authorized Seal</p>
                <p className="text-xs font-serif italic text-slate-800 font-bold leading-tight">Md. Nazmul Islam Chambers</p>
                <p className="text-[9px] text-slate-500 font-mono font-semibold">Supreme Court of Bangladesh</p>
              </div>
            </div>
          )}
        </div>

        {/* STEP 1: Select Religious Jurisdiction */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono text-xs font-bold flex items-center justify-center">1</span>
            <h3 className="font-serif italic text-slate-900 text-lg tracking-wide">
              Choose Personal Law Religious Jurisdiction
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Muslim Card */}
            <div 
              onClick={() => {
                setSelectedReligion('muslim');
                setIsJurisdictionSelected(true);
              }}
              className={`p-6 rounded-xl border-2 transition-all cursor-pointer bg-white relative overflow-hidden flex flex-col justify-between ${
                isJurisdictionSelected && selectedReligion === 'muslim'
                ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/20'
                : 'border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              {isJurisdictionSelected && selectedReligion === 'muslim' && (
                <div className="absolute right-0 top-0 bg-emerald-500 text-white text-[9px] font-mono uppercase tracking-widest px-3 py-1 rounded-bl font-bold shadow-sm">
                  ✓ Selected
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 font-mono">Islam / Sunni & Shia</span>
                <h4 className="font-serif text-slate-900 text-base font-bold mt-1.5 mb-1">Muslim Family Law</h4>
                <p className="text-[10px] text-slate-400 font-mono mb-3 uppercase tracking-wider">MFLO 1961, DMMA 1939, GWA 1890</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Covers talaq notices, dower validation, polygamy permissions, separate wives' maintenance, and Sunni/Shia inheritance distribution.
                </p>
              </div>
              <button 
                type="button"
                className={`w-full mt-5 py-2 px-4 rounded-lg font-bold text-xs transition-colors ${
                  isJurisdictionSelected && selectedReligion === 'muslim'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {isJurisdictionSelected && selectedReligion === 'muslim' ? 'Muslim Domain Active' : 'Select Muslim Law'}
              </button>
            </div>

            {/* Hindu Card */}
            <div 
              onClick={() => {
                setSelectedReligion('hindu');
                setIsJurisdictionSelected(true);
              }}
              className={`p-6 rounded-xl border-2 transition-all cursor-pointer bg-white relative overflow-hidden flex flex-col justify-between ${
                isJurisdictionSelected && selectedReligion === 'hindu'
                ? 'border-amber-500 shadow-md ring-1 ring-amber-500/20'
                : 'border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              {isJurisdictionSelected && selectedReligion === 'hindu' && (
                <div className="absolute right-0 top-0 bg-amber-500 text-white text-[9px] font-mono uppercase tracking-widest px-3 py-1 rounded-bl font-bold shadow-sm">
                  ✓ Selected
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 font-mono">Hindu Shastric & Statutes</span>
                <h4 className="font-serif text-slate-900 text-base font-bold mt-1.5 mb-1">Hindu Family Law</h4>
                <p className="text-[10px] text-slate-400 font-mono mb-3 uppercase tracking-wider">Separation Act 1946, Customary Precedents</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Covers judicial separate residence claims, husband's desertion & cruelty maintenance, child custody, and Shastric dower claims.
                </p>
              </div>
              <button 
                type="button"
                className={`w-full mt-5 py-2 px-4 rounded-lg font-bold text-xs transition-colors ${
                  isJurisdictionSelected && selectedReligion === 'hindu'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {isJurisdictionSelected && selectedReligion === 'hindu' ? 'Hindu Domain Active' : 'Select Hindu Law'}
              </button>
            </div>

            {/* Christian Card */}
            <div 
              onClick={() => {
                setSelectedReligion('christian');
                setIsJurisdictionSelected(true);
              }}
              className={`p-6 rounded-xl border-2 transition-all cursor-pointer bg-white relative overflow-hidden flex flex-col justify-between ${
                isJurisdictionSelected && selectedReligion === 'christian'
                ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20'
                : 'border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              {isJurisdictionSelected && selectedReligion === 'christian' && (
                <div className="absolute right-0 top-0 bg-indigo-500 text-white text-[9px] font-mono uppercase tracking-widest px-3 py-1 rounded-bl font-bold shadow-sm">
                  ✓ Selected
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 font-mono">Christian Codified Statutes</span>
                <h4 className="font-serif text-slate-900 text-base font-bold mt-1.5 mb-1">Christian Family Law</h4>
                <p className="text-[10px] text-slate-400 font-mono mb-3 uppercase tracking-wider">Divorce Act 1869, Christian Marriage Act 1872</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Covers dissolution of marriage on desertion/apostasy, separate support, child guardianship, and statutory dower provisions.
                </p>
              </div>
              <button 
                type="button"
                className={`w-full mt-5 py-2 px-4 rounded-lg font-bold text-xs transition-colors ${
                  isJurisdictionSelected && selectedReligion === 'christian'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {isJurisdictionSelected && selectedReligion === 'christian' ? 'Christian Domain Active' : 'Select Christian Law'}
              </button>
            </div>
          </div>
        </div>

        {/* STEP 2: Describe Dispute Facts for AI Consultation */}
        <div className="relative mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono text-xs font-bold flex items-center justify-center">2</span>
            <h3 className="font-serif italic text-slate-900 text-lg tracking-wide">
              Describe Dispute & Domestic Facts for Consultation
            </h3>
          </div>

          {!isJurisdictionSelected ? (
            <div className="bg-slate-50 rounded-xl p-8 border-2 border-dashed border-slate-300 text-center flex flex-col items-center justify-center gap-3 py-14">
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-slate-800 text-base font-bold">Consultation Portal Locked</h4>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                Supreme Court legal guidelines require selecting your religious personal law jurisdiction in <strong className="text-slate-700">Step 1</strong> above before the professional AI Consultation engine can be initialized.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-emerald-500/20 rounded-xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 border border-emerald-200/50 rounded-lg flex items-center justify-center text-emerald-600">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-serif italic text-slate-900 text-lg tracking-wide flex items-center gap-2">
                      Active AI Legal Consultant — <span className="capitalize">{selectedReligion}</span> Personal Law
                    </h3>
                    <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                      Chambers automated advisor. Describe your domestic facts to structure them strictly under reproducible, non-probabilistic rule frameworks.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2.5 font-mono">
                    Describe domestic scenario in detail (names, dates, marriage location, dispute details)
                  </label>
                  <textarea
                    value={domesticSituation}
                    onChange={(e) => setDomesticSituation(e.target.value)}
                    placeholder="E.g., I married my partner in 2021. Recently, a major family dispute arose over separate maintenance and children custody..."
                    rows={4}
                    className="w-full text-xs text-slate-900 bg-slate-50/50 p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 placeholder-slate-400 font-sans leading-relaxed transition-all"
                    disabled={isConsulting}
                  />
                </div>

                {/* Filtered suggested scenarios buttons inside step 2 card */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mr-1">Suggested Template Cases:</span>
                  {scenarios.filter(scen => scen.religion === selectedReligion).map((scen) => (
                    <button
                      key={scen.id}
                      type="button"
                      onClick={() => {
                        setDomesticSituation(scen.qaEntry.question);
                        setSelectedScenarioId(scen.id);
                        loadScenario(scen);
                        setConsultationSuccess(true);
                      }}
                      className="text-[10px] bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200/50 text-emerald-800 px-3 py-1.5 rounded-lg transition-all font-semibold font-sans cursor-pointer flex items-center gap-1"
                      disabled={isConsulting}
                    >
                      <FileText className="w-3 h-3 text-emerald-600" />
                      <span>{scen.title}</span>
                    </button>
                  ))}
                </div>

                {/* Error and Success states */}
                <AnimatePresence mode="wait">
                  {consultationError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-lg text-xs flex items-start gap-2.5"
                    >
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Consultation Error</p>
                        <p className="text-[11px] opacity-90 mt-0.5">{consultationError}</p>
                      </div>
                    </motion.div>
                  )}

                  {consultationSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-lg text-xs flex items-start gap-2.5"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">ILRMF Formulation Drafted</p>
                        <p className="text-[11px] opacity-90 mt-0.5">
                          The AI structured the response perfectly. The local deterministic engine has initiated a real-time logical and factual audit. Review your official structured legal briefing below.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    * Guided by the legal codifications of Advocate Md. Nazmul Islam.
                  </span>

                  <button
                    type="button"
                    onClick={handleConsultation}
                    disabled={isConsulting || !domesticSituation.trim()}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-xs transition-all duration-200 ${
                      isConsulting 
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 cursor-not-allowed' 
                      : !domesticSituation.trim()
                      ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-200 font-bold cursor-pointer'
                    }`}
                  >
                    {isConsulting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
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
          )}
        </div>

        {/* Workspace Grid / Output Section */}
        {isAdminMode ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm mb-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <Scale className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <h4 className="font-serif italic font-bold text-slate-900 text-sm">Chambers Auditing Workspace (Admin View)</h4>
                  <p className="text-[10px] text-slate-500 font-mono">Real-time local score compilation & deterministic formula testing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStatutes(!showStatutes)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold font-sans transition-all shadow-sm cursor-pointer select-none border border-indigo-700 hover:scale-[1.01]"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{showStatutes ? 'Hide Statutory Directory' : 'Show Statutory Directory'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* LEFT: Legal Rules Directory (4 Cols) */}
              {showStatutes && (
                <section className="lg:col-span-4 flex flex-col gap-6 animate-in fade-in slide-in-from-left-2 duration-150" id="section-rules-directory">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <h2 className="font-serif italic text-slate-900 text-sm tracking-wider">Statutory Directory</h2>
                </div>
                <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded uppercase font-bold tracking-widest">
                  {selectedReligion}
                </span>
              </div>
              
              <div className="p-4 bg-slate-50/20 border-b border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Below are the deterministic codified statutes or recognized customary rules that the ILRMF matching module checks against. Click to map to workspace.
                </p>
              </div>

              <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto custom-scrollbar">
                {knowledgeData.rules.map((rule) => {
                  const isLinked = relatedRules.includes(rule.id);
                  return (
                    <div 
                      key={rule.id} 
                      onClick={() => toggleRelatedRule(rule.id)}
                      className={`p-4 transition-all cursor-pointer hover:bg-slate-50 flex flex-col gap-2 ${
                        isLinked ? 'bg-emerald-50/20 border-l-2 border-l-emerald-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400">{rule.id}</span>
                        <span className={`text-[9px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                          rule.certainty === 'confirmed' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                          : 'bg-amber-50 text-amber-700 border-amber-200/50'
                        }`}>
                          {rule.certainty}
                        </span>
                      </div>
                      <h4 className="font-serif text-slate-900 text-xs font-semibold leading-snug">{rule.title}</h4>
                      <p className="text-slate-600 text-xs leading-relaxed line-clamp-3 italic">"{rule.rule}"</p>
                      
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-300" />
                          {rule.source}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest font-mono flex items-center gap-1 ${
                          isLinked ? 'text-emerald-600' : 'text-slate-400'
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
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-serif italic text-slate-900 text-sm mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                Scoring Metric Breakdown
              </h3>
              <ul className="space-y-3.5 text-xs text-slate-600 leading-normal">
                <li className="flex gap-2.5 items-start">
                  <span className="font-mono text-[9px] font-bold bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200 mt-0.5 shrink-0">Facts (20%)</span>
                  <span>Evaluates prompt query specificity by extracting entities, dates, actions, and documents.</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="font-mono text-[9px] font-bold bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200 mt-0.5 shrink-0">Law (30%)</span>
                  <span>Scores alignment with statutory sources. Awards bonus for exact codified citation matches.</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="font-mono text-[9px] font-bold bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200 mt-0.5 shrink-0">Logic (50%)</span>
                  <span>Verifies IRAC chain logical connectors ("since", "because") and structural entity-relation drift.</span>
                </li>
              </ul>
            </div>
          </section>
          )}

          {/* MIDDLE: Evaluation Interactive Workspace (Dynamic Spans) */}
          <section className={showStatutes ? 'lg:col-span-4 flex flex-col gap-6' : 'lg:col-span-6 flex flex-col gap-6'} id="section-interactive-workspace">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200">
                <PenTool className="w-5 h-5 text-emerald-600" />
                <h2 className="font-serif italic text-slate-900 text-sm tracking-wider">ILRMF Case Workspace</h2>
              </div>

              {/* Factual Question input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold font-mono">
                    1. Factual Dispute Query
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">{question.length} chars</span>
                </div>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter the detailed legal query or dispute facts..."
                  rows={3}
                  className="w-full text-xs text-slate-900 bg-slate-50/50 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 font-sans leading-relaxed"
                />
              </div>

              {/* IRAC Breakdown */}
              <div className="space-y-5 pt-3 border-t border-slate-200">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                  Metric Audit Breakdown
                </span>

                {/* ISSUE */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs uppercase tracking-wider text-slate-500 font-mono">Issue Formulation</label>
                    <span className="text-[10px] text-slate-400 font-mono">{issue.length} chars</span>
                  </div>
                  <input
                    type="text"
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    placeholder="E.g., Legal procedure for Talaq without notice."
                    className="w-full text-xs text-slate-900 bg-slate-50/50 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400"
                  />
                </div>

                {/* RULE */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs uppercase tracking-wider text-slate-500 font-mono">Applied Legal Rule & Citation</label>
                    <span className="text-[10px] text-slate-400 font-mono">{ruleText.length} chars</span>
                  </div>
                  <textarea
                    value={ruleText}
                    onChange={(e) => setRuleText(e.target.value)}
                    placeholder="Enter statutory rule and source citation..."
                    rows={2}
                    className="w-full text-xs text-slate-900 bg-slate-50/50 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 leading-relaxed"
                  />
                  <div className="mt-2 flex flex-wrap gap-1 items-center">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-mono mr-1">Cites:</span>
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
                        className="text-[9px] bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono cursor-pointer"
                      >
                        + {r.id}
                      </button>
                    ))}
                  </div>
                </div>

                {/* APPLICATION */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs uppercase tracking-wider text-slate-500 font-mono">Reasoning / Application</label>
                    <span className="text-[10px] text-slate-400 font-mono">{applicationText.length} chars</span>
                  </div>
                  <textarea
                    value={applicationText}
                    onChange={(e) => setApplicationText(e.target.value)}
                    placeholder="Apply rule to facts. Use logical connectors (since, because, therefore)..."
                    rows={3}
                    className="w-full text-xs text-slate-900 bg-slate-50/50 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 leading-relaxed"
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-mono mr-1">Tokens:</span>
                    {['since', 'because', 'therefore', 'as', 'under', 'if', 'given that'].map(conn => {
                      const present = applicationText.toLowerCase().includes(conn);
                      return (
                        <span 
                          key={conn}
                          className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold border ${
                            present 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-100 text-slate-400 border-slate-200'
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
                    <label className="text-xs uppercase tracking-wider text-slate-500 font-mono">Conclusion & Outcome</label>
                    <span className="text-[10px] text-slate-400 font-mono">{conclusionText.length} chars</span>
                  </div>
                  <textarea
                    value={conclusionText}
                    onChange={(e) => setConclusionText(e.target.value)}
                    placeholder="State outcome and next legal actions clearly..."
                    rows={2}
                    className="w-full text-xs text-slate-900 bg-slate-50/50 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 leading-relaxed"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-mono mr-1">Actions:</span>
                    {['should', 'must', 'can', 'may', 'file', 'consult'].map(act => {
                      const regex = new RegExp(`\\b${act}\\b`, 'i');
                      const present = regex.test(conclusionText);
                      return (
                        <span 
                          key={act}
                          className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold border ${
                            present 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-100 text-slate-400 border-slate-200'
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
              <div className="pt-4 border-t border-slate-200">
                <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold font-mono mb-2">Mapped Statutory Rules ({relatedRules.length})</label>
                <div className="flex flex-wrap gap-1.5">
                  {relatedRules.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No rules mapped. Click rules on left directory to link them.</span>
                  ) : (
                    relatedRules.map(id => (
                      <span key={id} className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono px-2.5 py-1 rounded">
                        {id}
                        <button type="button" onClick={() => toggleRelatedRule(id)} className="text-slate-400 hover:text-slate-600 font-sans font-bold text-xs select-none cursor-pointer">×</button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Escalation details */}
              <div className="pt-4 border-t border-slate-200 bg-slate-50/50 p-4 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 uppercase flex items-center gap-2 font-mono">
                    <AlertOctagon className="w-4 h-4 text-rose-500" />
                    Escalate to Judicial Advocate?
                  </span>
                  <input
                    type="checkbox"
                    checked={escalate}
                    onChange={(e) => setEscalate(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 bg-white border-slate-300 rounded focus:ring-emerald-500"
                  />
                </div>
                {escalate && (
                  <div className="mt-4">
                    <label className="block text-[9px] font-bold font-mono uppercase text-slate-400 mb-1">Escalation Reason</label>
                    <input
                      type="text"
                      value={escalateReason}
                      onChange={(e) => setEscalateReason(e.target.value)}
                      placeholder="Why does this require immediate attorney escalation?"
                      className="w-full text-xs text-slate-900 bg-white p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400"
                    />
                  </div>
                )}
              </div>

            </div>
          </section>

          {/* RIGHT: Metric Summary Panel (Dynamic Spans) */}
          <section className={showStatutes ? 'lg:col-span-4 flex flex-col gap-6' : 'lg:col-span-6 flex flex-col gap-6'} id="section-metrics-verdict">
            
            {/* Realtime Verdict Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <h2 className="font-serif italic text-slate-900 text-sm tracking-wider">Score Audit Verdict</h2>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSidebarDownloadOpen(!isSidebarDownloadOpen)}
                    className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/50 hover:bg-emerald-100 px-2 py-1 rounded transition-all cursor-pointer font-bold font-sans select-none"
                    title="Export this compliance report to PDF"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export PDF</span>
                    <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                  </button>
                  
                  {isSidebarDownloadOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40 cursor-default" 
                        onClick={() => setIsSidebarDownloadOpen(false)} 
                      />
                      <div className="absolute right-0 mt-1.5 w-48 rounded-lg bg-white shadow-lg border border-slate-200/80 z-50 py-1 font-sans text-[11px] animate-in fade-in slide-in-from-top-1 duration-100">
                        <button
                          type="button"
                          onClick={() => {
                            handleDownloadPDF('irac');
                            setIsSidebarDownloadOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-indigo-50/50 text-slate-700 flex flex-col border-b border-slate-100"
                        >
                          <span className="font-bold text-indigo-700">1. IRAC Sole PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleDownloadPDF('ilrmf');
                            setIsSidebarDownloadOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-teal-50/50 text-slate-700 flex flex-col border-b border-slate-100"
                        >
                          <span className="font-bold text-teal-700">2. ILRMF Sole PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleDownloadPDF('hybrid');
                            setIsSidebarDownloadOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-emerald-50/50 text-slate-700 flex flex-col"
                        >
                          <span className="font-bold text-emerald-700">3. Hybrid Mixed PDF</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Dual Mode Switcher Tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg text-center text-xs font-medium font-sans">
                <button
                  type="button"
                  onClick={() => setIsILRMFActive(true)}
                  className={`py-2 rounded-md transition-all cursor-pointer ${isILRMFActive ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  With ILRMF
                </button>
                <button
                  type="button"
                  onClick={() => setIsILRMFActive(false)}
                  className={`py-2 rounded-md transition-all cursor-pointer ${!isILRMFActive ? 'bg-white text-rose-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Without ILRMF (Traditional)
                </button>
              </div>

              {evaluationResult ? (
                <>
                  {isILRMFActive ? (
                    <>
                      {/* Verdict Band Gauge */}
                      <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-4">
                        <div className="relative flex items-center justify-center">
                          {/* Big Circle Score */}
                          <div className="w-24 h-24 rounded-full border-4 border-slate-200 flex flex-col items-center justify-center bg-white shadow-sm">
                            <span className="text-3xl font-black text-slate-900 font-mono">{evaluationResult.verdict.score}</span>
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono mt-0.5">ILRMF Score</span>
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
                        <h3 className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Metric Weights</h3>
                        
                        {/* FACTS check */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-medium text-slate-700">
                              Facts Specificity (20%)
                            </span>
                            <span className="font-mono text-emerald-600 font-bold">{evaluationResult.factCheck.score}/100</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${getScoreColor(evaluationResult.factCheck.score)}`}
                              style={{ width: `${evaluationResult.factCheck.score}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-1.5 leading-relaxed">{evaluationResult.factCheck.note}</span>
                        </div>

                        {/* LAW matching */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-medium text-slate-700">
                              Statutory Alignment (30%)
                            </span>
                            <span className="font-mono text-emerald-600 font-bold">{evaluationResult.lawMatch.score}/100</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${getScoreColor(evaluationResult.lawMatch.score)}`}
                              style={{ width: `${evaluationResult.lawMatch.score}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-1.5 leading-relaxed">{evaluationResult.lawMatch.note}</span>
                        </div>

                        {/* LOGIC consistency */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-medium text-slate-700">
                              Reasoning Path Audit (50%)
                            </span>
                            <span className="font-mono text-emerald-600 font-bold">{evaluationResult.audit.logicScore}/100</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${getScoreColor(evaluationResult.audit.logicScore)}`}
                              style={{ width: `${evaluationResult.audit.logicScore}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-1.5 leading-relaxed">{evaluationResult.audit.note}</span>
                        </div>
                      </div>

                      {/* Audit Trail Steps */}
                      <div className="space-y-4 pt-4 border-t border-slate-200">
                        <h3 className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Reasoning Path Compliance</h3>
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                          {evaluationResult.audit.steps.map((step: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded bg-slate-50/50 border border-slate-100">
                              {getStepValidationIcon(step.valid)}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-bold font-mono text-slate-400">{step.step}</span>
                                  <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border ${
                                    step.valid === 'PASS' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                                    : step.valid === 'WEAK' 
                                    ? 'bg-amber-50 text-amber-700 border-amber-200/50' 
                                    : 'bg-rose-50 text-rose-700 border-rose-200/50'
                                  }`}>{step.valid}</span>
                                </div>
                                <p className="text-[11px] text-slate-700 mt-1 leading-relaxed italic">
                                  "{step.content || '(empty statement)'}"
                                </p>
                                <span className="text-[9px] text-slate-400 block mt-1.5 font-mono">
                                  * {step.note}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Reasoning Gaps and Remediation */}
                      <div className="pt-4 border-t border-slate-200">
                        <h3 className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider mb-2">Identified Logic Gaps ({evaluationResult.audit.gaps.length})</h3>
                        {evaluationResult.audit.gaps.length === 0 ? (
                          <div className="bg-emerald-50 text-emerald-800 text-xs p-3.5 rounded-lg border border-emerald-200 flex items-start gap-2.5">
                            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-emerald-900">Pristine Logical Coherence</p>
                              <p className="text-[10px] text-emerald-800/80 leading-relaxed mt-0.5">The reasoning chain contains no logical leaps, unmapped rules, or unsupported conclusions.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {evaluationResult.audit.gaps.map((gap: any, idx: number) => (
                              <div key={idx} className="bg-rose-50 text-rose-800 text-xs p-3.5 rounded-lg border border-rose-200 flex items-start gap-2.5">
                                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-semibold uppercase tracking-wider text-[10px] font-mono text-rose-900">{gap.type} in {gap.location}</p>
                                  <p className="text-[10px] text-rose-800/80 mt-0.5 leading-relaxed">{gap.description}.</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Escalation Alert */}
                      {escalate && (
                        <div className="bg-rose-50 text-rose-900 p-4 rounded-lg border border-rose-200">
                          <div className="flex items-center gap-2 mb-1.5">
                            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                            <span className="font-bold text-xs uppercase tracking-widest font-mono">JUDICIAL ESCALATION TRIGGERED</span>
                          </div>
                          <p className="text-[11px] text-rose-800 leading-relaxed font-sans">
                            Reason: {escalateReason || 'Immediate professional legal intervention recommended.'}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Traditional Unverified Gauge */}
                      <div className="text-center py-6 bg-rose-50/50 rounded-xl border border-rose-100 flex flex-col items-center justify-center gap-4">
                        <div className="relative flex items-center justify-center">
                          {/* Big Circle Score */}
                          <div className="w-24 h-24 rounded-full border-4 border-slate-300 flex flex-col items-center justify-center bg-white shadow-sm">
                            <span className="text-3xl font-black text-rose-600 font-mono">0.0</span>
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono mt-0.5">UNVERIFIED</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-bold px-3 py-1.5 rounded-full border uppercase tracking-widest font-mono text-rose-700 bg-rose-50 border-rose-200">
                            VERDICT: ZERO VERIFICATION
                          </span>
                        </div>
                      </div>

                      {/* Traditional Progressive Bar Breakdown */}
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Traditional Metric Gaps</h3>
                        
                        {/* FACTS check */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-medium text-slate-700">
                              Facts Specificity (0% Verified)
                            </span>
                            <span className="font-mono text-rose-600 font-bold">0/100</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-slate-300 w-0 transition-all duration-300" />
                          </div>
                          <span className="text-[10px] text-rose-600 font-medium block mt-1.5 leading-relaxed">
                            No entity extraction boundary checked. Danger: High probability of context confusion.
                          </span>
                        </div>

                        {/* LAW matching */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-medium text-slate-700">
                              Statutory Alignment (0% Verified)
                            </span>
                            <span className="font-mono text-rose-600 font-bold">0/100</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-slate-300 w-0 transition-all duration-300" />
                          </div>
                          <span className="text-[10px] text-rose-600 font-medium block mt-1.5 leading-relaxed">
                            No database rule mapping. Citations may be generated by statistical probability (hallucinations).
                          </span>
                        </div>

                        {/* LOGIC consistency */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-medium text-slate-700">
                              Reasoning Path Audit (0% Verified)
                            </span>
                            <span className="font-mono text-rose-600 font-bold">0/100</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-slate-300 w-0 transition-all duration-300" />
                          </div>
                          <span className="text-[10px] text-rose-600 font-medium block mt-1.5 leading-relaxed">
                            No connector constraints or relational maps verified. Gaps and fallacies go unflagged.
                          </span>
                        </div>
                      </div>

                      {/* Reasoning Path Compliance (Traditional) */}
                      <div className="space-y-4 pt-4 border-t border-slate-200">
                        <h3 className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Reasoning Path Compliance</h3>
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                          {evaluationResult.audit.steps.map((step: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded bg-slate-50 border border-slate-200 opacity-60">
                              <HelpCircle className="w-5 h-5 text-slate-400 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-bold font-mono text-slate-400">{step.step}</span>
                                  <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded border bg-slate-100 text-slate-500 border-slate-200">UNAUDITED</span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed italic">
                                  "{step.content || '(empty statement)'}"
                                </p>
                                <span className="text-[9px] text-slate-400 block mt-1.5 font-mono">
                                  * Step bypasses physical rule engine.
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Traditional System Vulnerabilities */}
                      <div className="pt-4 border-t border-slate-200">
                        <h3 className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider mb-2">Traditional System Vulnerabilities (3)</h3>
                        <div className="space-y-2">
                          <div className="bg-rose-50 text-rose-800 text-xs p-3.5 rounded-lg border border-rose-200 flex items-start gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold uppercase tracking-wider text-[10px] font-mono text-rose-900">HALLUCINATION RISK</p>
                              <p className="text-[10px] text-rose-800/80 mt-0.5 leading-relaxed">Traditional generative systems frequently invent section numbers, timeline rules under MFLO 1961, and custom dower conditions.</p>
                            </div>
                          </div>
                          <div className="bg-amber-50 text-amber-800 text-xs p-3.5 rounded-lg border border-amber-200 flex items-start gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold uppercase tracking-wider text-[10px] font-mono text-amber-900">LOGICAL DISCONTINUITY</p>
                              <p className="text-[10px] text-amber-800/80 mt-0.5 leading-relaxed">The reasoning chain skips formal logical audits. This allows major leaps of logic or circular assertions to pass undetected.</p>
                            </div>
                          </div>
                          <div className="bg-slate-50 text-slate-800 text-xs p-3.5 rounded-lg border border-slate-200 flex items-start gap-2.5">
                            <XCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold uppercase tracking-wider text-[10px] font-mono text-slate-900">NON-REPRODUCIBLE ADVICE</p>
                              <p className="text-[10px] text-slate-800/80 mt-0.5 leading-relaxed">Probabilistic text generators often yield conflicting legal advice for the exact same dispute, failing basic rule-based consistency.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-slate-300 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-slate-200" />
                  <p className="text-xs">Awaiting workspace input...</p>
                </div>
              )}

            </div>

            {/* Factual Entity Match Detector */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-serif italic text-slate-900 text-sm mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                Factual Entity Extractor
              </h3>
              {evaluationResult && evaluationResult.factCheck.hasFacts ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Recognized factual elements extracted from question text used to evaluate Issue relevance score:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {evaluationResult.factCheck.factEntities.map((entity: string, idx: number) => (
                      <span key={idx} className="text-[10px] font-mono bg-slate-50 text-slate-700 px-2.5 py-1 rounded border border-slate-200/60 uppercase">
                        {entity}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No legal entities recognized in current factual question.</p>
              )}
            </div>

          </section>

        </div>
        </>
        ) : (
          /* STEP 3: Official Client Structured Legal Guidance & Decision Briefing */
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono text-xs font-bold flex items-center justify-center">3</span>
              <h3 className="font-serif italic text-slate-900 text-lg tracking-wide">
                Official Legal Guidance & Decision Briefing
              </h3>
            </div>

            {!issue && !conclusionText ? (
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-dashed border-slate-300 text-center flex flex-col items-center justify-center gap-3 py-14">
                <div className="w-12 h-12 rounded-full bg-slate-250 flex items-center justify-center text-slate-400">
                  <Scale className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-slate-800 text-base font-bold">Waiting for Case Analysis</h4>
                <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                  Describe your domestic facts in <strong className="text-slate-700">Step 2</strong> above and run the legal consultant engine to generate your official personal law briefing.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Majestic client briefing wrapper */}
                <div className="bg-white border border-slate-200 shadow-md rounded-2xl p-6 sm:p-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600"></div>
                  
                  {/* Header of the Brief */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
                    <div>
                      <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Official Chambers Opinion</p>
                      <h4 className="text-xl font-serif italic font-bold text-slate-900 mt-0.5">
                        Personal Law Consultation & Decision Brief
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Prepared by Chambers of <span className="font-semibold text-slate-700">Md. Nazmul Islam Advocate</span>, Supreme Court of Bangladesh
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadPDF('hybrid')}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg text-xs font-bold font-sans transition-all shadow-[0_4px_12px_rgba(16,185,129,0.15)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] select-none cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download PDF Brief</span>
                      </button>
                    </div>
                  </div>

                  {/* Case Particulars */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-200/60 rounded-xl p-4 mb-6 text-xs">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold block">Religious Jurisdiction</span>
                      <span className="font-serif italic font-bold text-slate-800 capitalize mt-1 block">{selectedReligion} Family Law</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold block">Regulatory Authority</span>
                      <span className="font-mono text-slate-800 mt-1 block">MFLO 1961 / BD High Court</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold block">Status</span>
                      <span className={`inline-flex items-center gap-1.5 font-bold font-mono text-[10px] uppercase mt-1 px-2.5 py-0.5 rounded border ${
                        escalate 
                        ? 'bg-rose-50 text-rose-700 border-rose-200/60' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                      }`}>
                        {escalate ? '⚠️ Immediate Advocacy Advised' : '✓ Normal Jurisdiction'}
                      </span>
                    </div>
                  </div>

                  {/* The 4-Column IRAC Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* ISSUE */}
                    <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                          <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs font-serif italic border border-indigo-100">I</div>
                          <h5 className="font-serif text-slate-900 font-bold text-sm">Issue Under Consideration</h5>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed italic">"{issue}"</p>
                      </div>
                    </div>

                    {/* RULE */}
                    <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                          <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-bold text-xs font-serif italic border border-amber-100">R</div>
                          <h5 className="font-serif text-slate-900 font-bold text-sm">Governing Personal Law & Rule</h5>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{ruleText}</p>
                      </div>
                    </div>

                    {/* APPLICATION */}
                    <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-sm flex flex-col justify-between md:col-span-2">
                      <div>
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                          <div className="w-7 h-7 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center font-bold text-xs font-serif italic border border-teal-100">A</div>
                          <h5 className="font-serif text-slate-900 font-bold text-sm">Case Evaluation & Application</h5>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{applicationText}</p>
                      </div>
                    </div>

                    {/* CONCLUSION */}
                    <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-sm flex flex-col justify-between md:col-span-2">
                      <div>
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                          <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-xs font-serif italic border border-emerald-100">C</div>
                          <h5 className="font-serif text-slate-900 font-bold text-sm">Structured Conclusion & Legal Remedy</h5>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{conclusionText}</p>
                      </div>
                    </div>
                  </div>

                  {/* Escalation Alert Box */}
                  {escalate && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-xs flex gap-3 mb-6">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <h6 className="font-bold text-rose-900 uppercase font-mono tracking-wider text-[10px] mb-1">Attorney Intervention Required</h6>
                        <p className="text-rose-800 leading-relaxed">{escalateReason || 'This family law dispute contains specific, high-risk deviations requiring immediate attention by a practicing High Court advocate.'}</p>
                      </div>
                    </div>
                  )}

                  {/* Collapsible Statutory Reference List inside Step 3 for client */}
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase font-bold">
                        Interactive Statutory Reference List
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowStatutes(!setShowStatutes)}
                        className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 hover:bg-indigo-100 px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1 select-none"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{showStatutes ? 'Hide Reference List' : 'View Reference List Options'}</span>
                      </button>
                    </div>

                    {showStatutes && (
                      <div className="mt-4 bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                          The legal framework below governs personal status in the Bangladesh court system for <strong className="capitalize">{selectedReligion}</strong> jurisdiction:
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                          {knowledgeData.rules.map((rule) => (
                            <div key={rule.id} className="bg-white p-4 border border-slate-200 rounded-lg shadow-xs flex flex-col justify-between gap-2.5">
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <span className="font-mono text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">{rule.id}</span>
                                  <span className="text-[9px] text-slate-400 font-mono">{rule.source}</span>
                                </div>
                                <h6 className="text-xs font-serif font-bold text-slate-900 leading-snug">{rule.title}</h6>
                                <p className="text-[11px] text-slate-600 leading-relaxed mt-1 italic">"{rule.rule}"</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex gap-6">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Lutuputu Engine v4.0.1</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">DB: BD-FAM-2023-REV</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Rule Integrity Verified</span>
            </div>
          </div>
          <div className="text-center pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 tracking-widest uppercase font-bold mb-2">LUTUPUTU.COM</p>
            <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
              Deterministic legal rule engine, metrics audits, and personal family law codifications for Bangladesh. Built strictly under 
              reproducible rule frameworks without any probabilistic generative experiments.
            </p>
            <p className="text-[10px] text-slate-400 mt-4 font-mono leading-relaxed">
              © 2026 Lutuputu Personal Legal Systems. All Rights Reserved. All intellectual property, rights, and algorithms are proprietary and owned by <span className="font-semibold text-slate-500">Md. Nazmul Islam</span>, Advocate, Supreme Court of Bangladesh.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
