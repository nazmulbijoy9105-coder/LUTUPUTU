import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Play, 
  HelpCircle,
  FileText,
  Workflow,
  Sparkles,
  Search,
  Cpu,
  ChevronRight,
  Maximize2
} from 'lucide-react';

interface ILRMFFlowchartProps {
  question: string;
  issue: string;
  ruleText: string;
  applicationText: string;
  conclusionText: string;
  relatedRules: string[];
  evaluationResult: any;
  isConsulting: boolean;
  consultingStep: string;
  isOfflineMode: boolean;
}

interface FlowNode {
  id: string;
  title: string;
  subtitle: string;
  status: 'PASS' | 'WEAK' | 'FAIL' | 'PENDING' | 'EMPTY';
  metric: string;
  description: string;
  details: string[];
  icon: string;
  colorClass: string;
  borderColor: string;
  bgClass: string;
}

export default function ILRMFFlowchart({
  question,
  issue,
  ruleText,
  applicationText,
  conclusionText,
  relatedRules,
  evaluationResult,
  isConsulting,
  consultingStep,
  isOfflineMode
}: ILRMFFlowchartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('facts');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [dimensions, setDimensions] = useState({ width: 800, height: 420 });

  // Handle resizing of parent container
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        // Keep height proportional or capped
        const calculatedHeight = width < 640 ? 600 : 380;
        setDimensions({ width: Math.max(width, 300), height: calculatedHeight });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Determine node states based on inputs and evaluationResult
  const stepsMap = React.useMemo(() => {
    const map: Record<string, any> = {};
    if (evaluationResult?.audit?.steps) {
      evaluationResult.audit.steps.forEach((s: any) => {
        map[s.step] = s;
      });
    }
    return map;
  }, [evaluationResult]);

  // Map the current consulting step to active index for pulsing
  const activeProcessingIndex = React.useMemo(() => {
    if (!isConsulting) return -1;
    const step = consultingStep.toLowerCase();
    if (step.includes('scan') || step.includes('fact') || step.includes('analyzing')) {
      return 0; // Facts
    }
    if (step.includes('determine') || step.includes('jurisdiction') || step.includes('keyword')) {
      return 1; // Issue
    }
    if (step.includes('rule') || step.includes('directory') || step.includes('mapping')) {
      return 2; // Rule
    }
    if (step.includes('construct') || step.includes('synthesize') || step.includes('reasoning')) {
      return 3; // Application
    }
    if (step.includes('verify') || step.includes('validate') || step.includes('token') || step.includes('citation')) {
      return 4; // Conclusion
    }
    return 5; // Verdict
  }, [isConsulting, consultingStep]);

  // Compile detailed list for each node
  const nodes: FlowNode[] = React.useMemo(() => {
    // 1. Facts
    const factsEntities = evaluationResult?.factCheck?.factEntities || [];
    const hasFacts = evaluationResult?.factCheck?.hasFacts;
    const factsStatus = isConsulting ? 'PENDING' : (question ? 'PASS' : 'EMPTY');

    // 2. Issue
    const issueStep = stepsMap['ISSUE'];
    let issueStatus: FlowNode['status'] = 'EMPTY';
    if (isConsulting) {
      issueStatus = activeProcessingIndex >= 1 ? 'PENDING' : 'EMPTY';
    } else if (issue) {
      issueStatus = issueStep?.valid || 'PASS';
    }

    // 3. Rule
    const ruleStep = stepsMap['RULE'];
    let ruleStatus: FlowNode['status'] = 'EMPTY';
    if (isConsulting) {
      ruleStatus = activeProcessingIndex >= 2 ? 'PENDING' : 'EMPTY';
    } else if (ruleText) {
      ruleStatus = ruleStep?.valid || 'PASS';
    }

    // 4. Application
    const appStep = stepsMap['APPLICATION'];
    let appStatus: FlowNode['status'] = 'EMPTY';
    if (isConsulting) {
      appStatus = activeProcessingIndex >= 3 ? 'PENDING' : 'EMPTY';
    } else if (applicationText) {
      appStatus = appStep?.valid || 'PASS';
    }

    // 5. Conclusion
    const concStep = stepsMap['CONCLUSION'];
    let concStatus: FlowNode['status'] = 'EMPTY';
    if (isConsulting) {
      concStatus = activeProcessingIndex >= 4 ? 'PENDING' : 'EMPTY';
    } else if (conclusionText) {
      concStatus = concStep?.valid || 'PASS';
    }

    // 6. Verdict
    const score = evaluationResult?.verdict?.score;
    let verdictStatus: FlowNode['status'] = 'EMPTY';
    if (isConsulting) {
      verdictStatus = activeProcessingIndex >= 5 ? 'PENDING' : 'EMPTY';
    } else if (score !== undefined) {
      verdictStatus = score >= 80 ? 'PASS' : score >= 50 ? 'WEAK' : 'FAIL';
    }

    return [
      {
        id: 'facts',
        title: 'Factual Input',
        subtitle: 'Case Scenario Specifics',
        status: factsStatus,
        metric: question ? `${question.length} chars` : '0 chars',
        description: 'Analyzes user-submitted domestic dispute scenario for justiciable family-law actions.',
        details: [
          `Factual character length: ${question ? question.length : 0} characters`,
          `Factual words: ${question ? question.split(/\s+/).filter(Boolean).length : 0} words`,
          `Status: ${hasFacts ? 'Justiciable scenario detected' : 'Awaiting factual details'}`,
          `Extracted entities: ${factsEntities.length > 0 ? factsEntities.join(', ') : 'None detected'}`
        ],
        icon: 'F',
        colorClass: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        borderColor: '#818cf8',
        bgClass: 'bg-indigo-50/10'
      },
      {
        id: 'issue',
        title: 'Issue Formulation (I)',
        subtitle: 'Justiciable Question',
        status: issueStatus,
        metric: issue ? `${issue.length} chars` : '0 chars',
        description: 'Formulates a tight legal question containing the material dispute facts and core parties.',
        details: [
          `Formulated issue length: ${issue ? issue.length : 0} characters`,
          `Compliance: ${issueStep?.valid || 'Awaiting audit'}`,
          `Audit Note: ${issueStep?.note || 'No validation note compiled.'}`
        ],
        icon: 'I',
        colorClass: 'text-violet-600 bg-violet-50 border-violet-200',
        borderColor: '#a78bfa',
        bgClass: 'bg-violet-50/10'
      },
      {
        id: 'rule',
        title: 'Statutory Rule (R)',
        subtitle: 'Precedent Mapping',
        status: ruleStatus,
        metric: `${relatedRules.length} rules mapped`,
        description: 'Maps the specific dispute with deterministic Bangladesh statutory codifications.',
        details: [
          `Citations included: ${ruleText ? 'Yes' : 'None'}`,
          `Linked statutes: ${relatedRules.length > 0 ? relatedRules.join(', ') : 'None'}`,
          `Compliance: ${ruleStep?.valid || 'Awaiting audit'}`,
          `Audit Note: ${ruleStep?.note || 'No validation note compiled.'}`
        ],
        icon: 'R',
        colorClass: 'text-amber-600 bg-amber-50 border-amber-200',
        borderColor: '#fbbf24',
        bgClass: 'bg-amber-50/10'
      },
      {
        id: 'application',
        title: 'Technical Reasoning (A)',
        subtitle: 'Logic Connective Audit',
        status: appStatus,
        metric: `Logic Weight: 50%`,
        description: 'Applies rules to facts utilizing strict logical connector constraints ("since", "because").',
        details: [
          `Audit Score: ${evaluationResult?.audit?.logicScore || 0}/100`,
          `Key logical connectors: ${['since', 'because', 'therefore', 'under'].filter(w => applicationText.toLowerCase().includes(w)).join(', ') || 'None detected'}`,
          `Compliance: ${appStep?.valid || 'Awaiting audit'}`,
          `Audit Note: ${appStep?.note || 'No validation note compiled.'}`
        ],
        icon: 'A',
        colorClass: 'text-teal-600 bg-teal-50 border-teal-200',
        borderColor: '#2dd4bf',
        bgClass: 'bg-teal-50/10'
      },
      {
        id: 'conclusion',
        title: 'Client Relief (C)',
        subtitle: 'Proposed Legal Action',
        status: concStatus,
        metric: `Resolution Draft`,
        description: 'States final outcome and outlines actionable steps or judicial advocate escalation rules.',
        details: [
          `Action verbs detected: ${['should', 'must', 'can', 'file'].filter(w => conclusionText.toLowerCase().includes(w)).join(', ') || 'None detected'}`,
          `Escalation flag: ${evaluationResult?.verdict?.escalate || evaluationResult?.escalate ? 'YES' : 'NO'}`,
          `Compliance: ${concStep?.valid || 'Awaiting audit'}`,
          `Audit Note: ${concStep?.note || 'No validation note compiled.'}`
        ],
        icon: 'C',
        colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        borderColor: '#34d399',
        bgClass: 'bg-emerald-50/10'
      },
      {
        id: 'verdict',
        title: 'Audit Verdict',
        subtitle: 'Chambers Compliance',
        status: verdictStatus,
        metric: evaluationResult?.verdict?.score !== undefined ? `Score: ${evaluationResult.verdict.score}/100` : 'No score',
        description: 'Compiles facts, law matching, and logic checks into a final deterministic compliance rating.',
        details: [
          `Chambers score: ${evaluationResult?.verdict?.score || 0}/100`,
          `Verdict Band: ${evaluationResult?.verdict?.verdict || 'Awaiting data'}`,
          `Facts specificity: ${evaluationResult?.factCheck?.score || 0}/100`,
          `Statutory alignment: ${evaluationResult?.lawMatch?.score || 0}/100`
        ],
        icon: '✓',
        colorClass: 'text-[#1e293b] bg-slate-50 border-slate-200',
        borderColor: '#475569',
        bgClass: 'bg-slate-50/10'
      }
    ];
  }, [question, issue, ruleText, applicationText, conclusionText, relatedRules, evaluationResult, isConsulting, stepsMap, activeProcessingIndex]);

  // Render D3 Flowchart
  useEffect(() => {
    if (!svgRef.current) return;

    const svgElement = d3.select(svgRef.current);
    svgElement.selectAll('*').remove(); // Clean previous elements

    const { width, height } = dimensions;
    const isMobile = width < 640;

    // Build responsive positions
    let nodeWidth = isMobile ? width * 0.85 : 190;
    let nodeHeight = isMobile ? 70 : 85;
    
    // Set viewbox for responsiveness
    svgElement
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const g = svgElement.append('g').attr('class', 'main-flow-container');

    // Setup markers for arrow heads
    svgElement.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', isMobile ? 8 : 12)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L10,0L0,4')
      .attr('fill', '#cbd5e1'); // gray-300

    // Highlight arrow marker
    svgElement.select('defs').append('marker')
      .attr('id', 'arrow-active')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', isMobile ? 8 : 12)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L10,0L0,4')
      .attr('fill', '#059669'); // emerald-600

    // Calculate node coordinates
    const layoutNodes = nodes.map((n, i) => {
      let x = 0;
      let y = 0;
      
      if (isMobile) {
        // Linear vertical chain on mobile
        x = (width - nodeWidth) / 2;
        y = i * 92 + 20;
      } else {
        // Structured loop-back Z-shape pipeline on desktop to fit nicely in 380px height
        // Row 1: Facts (0) -> Issue (1) -> Rule (2)
        // Row 2: Verdict (5) <- Conclusion (4) <- Application (3)
        const marginX = (width - (3 * nodeWidth)) / 4;
        const marginY = (height - (2 * nodeHeight)) / 3;

        if (i < 3) {
          x = marginX + i * (nodeWidth + marginX);
          y = marginY + 5;
        } else {
          // reverse direction for row 2 to make loop elegant
          const colIdx = 5 - i; // 3->2, 4->1, 5->0
          x = marginX + colIdx * (nodeWidth + marginX);
          y = marginY * 1.8 + nodeHeight;
        }
      }
      
      return { ...n, x, y };
    });

    // Draw connecting paths (Links)
    const links: any[] = [];
    for (let i = 0; i < layoutNodes.length - 1; i++) {
      links.push({
        source: layoutNodes[i],
        target: layoutNodes[i + 1],
        index: i
      });
    }

    const pathGenerator = (link: any) => {
      const s = link.source;
      const t = link.target;
      
      const sCenterX = s.x + nodeWidth / 2;
      const sCenterY = s.y + nodeHeight / 2;
      const tCenterX = t.x + nodeWidth / 2;
      const tCenterY = t.y + nodeHeight / 2;

      if (isMobile) {
        // Simple straight down vertical line
        return d3.line()([
          [sCenterX, s.y + nodeHeight],
          [tCenterX, t.y]
        ]);
      } else {
        // Desktop Curved Connection lines
        // Check if transition is side-by-side or row-to-row
        if (link.index === 2) {
          // Connection from Rule (Node 2) to Application (Node 3) - from Row 1 right to Row 2 right
          // S-shaped curve dropping down
          const startX = s.x + nodeWidth / 2;
          const startY = s.y + nodeHeight;
          const endX = t.x + nodeWidth / 2;
          const endY = t.y;
          const midY = (startY + endY) / 2;
          
          return `M ${startX} ${startY} 
                  C ${startX + 40} ${midY}, 
                    ${endX + 40} ${midY}, 
                    ${endX} ${endY}`;
        } else if (link.index >= 3) {
          // Row 2 flows from right to left (Node 3 -> Node 4 -> Node 5)
          const startX = s.x;
          const startY = s.y + nodeHeight / 2;
          const endX = t.x + nodeWidth;
          const endY = t.y + nodeHeight / 2;
          
          return `M ${startX} ${startY} L ${endX} ${endY}`;
        } else {
          // Row 1 flows from left to right (Node 0 -> Node 1 -> Node 2)
          const startX = s.x + nodeWidth;
          const startY = s.y + nodeHeight / 2;
          const endX = t.x;
          const endY = t.y + nodeHeight / 2;
          
          return `M ${startX} ${startY} L ${endX} ${endY}`;
        }
      }
    };

    // Render connection lines
    const linkPaths = g.selectAll('.flow-link')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'flow-link')
      .attr('d', pathGenerator)
      .attr('fill', 'none')
      .attr('stroke', (d) => {
        // Highlight active lines during consultation processing
        if (isConsulting && d.index < activeProcessingIndex) {
          return '#059669'; // Active processed (green)
        }
        return '#e2e8f0'; // Default gray-200
      })
      .attr('stroke-width', (d) => {
        if (isConsulting && d.index < activeProcessingIndex) return 3;
        return 2;
      })
      .attr('marker-end', (d) => {
        if (isConsulting && d.index < activeProcessingIndex) return 'url(#arrow-active)';
        return 'url(#arrow)';
      });

    // Add animating dash-array if the link is actively transmitting data
    linkPaths.filter((d) => isConsulting && d.index === activeProcessingIndex - 1)
      .attr('stroke', '#059669')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '6,4')
      .style('animation', 'flow-dash 1.2s linear infinite')
      .attr('marker-end', 'url(#arrow-active)');

    // Draw Node Groups
    const nodeGroups = g.selectAll('.flow-node')
      .data(layoutNodes)
      .enter()
      .append('g')
      .attr('class', 'flow-node')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedNodeId(d.id);
      });

    // Outer glow for active node / clicked node
    nodeGroups.append('rect')
      .attr('x', d => d.x - 4)
      .attr('y', d => d.y - 4)
      .attr('width', nodeWidth + 8)
      .attr('height', nodeHeight + 8)
      .attr('rx', 12)
      .attr('fill', 'none')
      .attr('stroke', (d) => {
        if (d.id === selectedNodeId) return '#10b981'; // clicked highlight
        if (isConsulting && activeProcessingIndex === nodes.indexOf(nodes.find(n => n.id === d.id)!)) {
          return '#f59e0b'; // active processing pulse
        }
        return 'none';
      })
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', (d) => {
        if (isConsulting && activeProcessingIndex === nodes.indexOf(nodes.find(n => n.id === d.id)!)) {
          return '4,4';
        }
        return 'none';
      })
      .style('opacity', 0.85);

    // Main Node Card Background
    nodeGroups.append('rect')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('rx', 10)
      .attr('fill', d => {
        if (d.status === 'EMPTY') return '#f8fafc'; // slate-50
        if (d.id === selectedNodeId) return '#ffffff';
        return '#ffffff';
      })
      .attr('stroke', d => {
        if (d.id === selectedNodeId) return '#10b981'; // emerald green border
        if (d.status === 'PASS') return '#bbf7d0'; // green border
        if (d.status === 'WEAK') return '#fef08a'; // amber border
        if (d.status === 'FAIL') return '#fecdd3'; // red border
        if (d.status === 'PENDING') return '#fde047'; // yellow animate border
        return '#e2e8f0'; // slate-200 border
      })
      .attr('stroke-width', d => d.id === selectedNodeId ? 2 : 1.5)
      .style('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.03))');

    // Status Indicator Light (Left Edge decoration)
    nodeGroups.append('rect')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('width', 5)
      .attr('height', nodeHeight)
      .attr('rx', 0)
      .style('clip-path', 'inset(0px 0px 0px 0px round 10px 0px 0px 10px)')
      .attr('fill', d => {
        if (d.status === 'PASS') return '#10b981'; // emerald
        if (d.status === 'WEAK') return '#f59e0b'; // amber
        if (d.status === 'FAIL') return '#ef4444'; // rose
        if (d.status === 'PENDING') return '#f59e0b'; // amber/orange
        return '#94a3b8'; // slate
      });

    // Node Title (HTML structure via foreignObject for clean multi-line wrapping and styling)
    nodeGroups.append('foreignObject')
      .attr('x', d => d.x + 12)
      .attr('y', d => d.y + 6)
      .attr('width', nodeWidth - 18)
      .attr('height', nodeHeight - 12)
      .append('xhtml:div')
      .style('font-family', 'inherit')
      .style('height', '100%')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('justify-content', 'center')
      .html((d) => {
        // Status indicator chip style
        let badgeColor = 'bg-slate-100 text-slate-500';
        let badgeLabel = 'Idle';
        if (d.status === 'PASS') {
          badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
          badgeLabel = 'Pass';
        } else if (d.status === 'WEAK') {
          badgeColor = 'bg-amber-50 text-amber-700 border-amber-100';
          badgeLabel = 'Weak';
        } else if (d.status === 'FAIL') {
          badgeColor = 'bg-rose-50 text-rose-700 border-rose-100';
          badgeLabel = 'Gap';
        } else if (d.status === 'PENDING') {
          badgeColor = 'bg-amber-100 text-amber-800 animate-pulse border-amber-200';
          badgeLabel = 'Auditing';
        } else if (d.status === 'EMPTY') {
          badgeColor = 'bg-slate-100 text-slate-400';
          badgeLabel = 'Unused';
        }

        const isNodeSelected = d.id === selectedNodeId;

        return `
          <div class="flex flex-col gap-0.5 select-none text-left">
            <div class="flex items-center justify-between gap-1.5 min-w-0">
              <span class="text-[11px] font-bold font-serif text-slate-900 truncate leading-tight ${isNodeSelected ? 'text-emerald-950 font-black' : ''}">${d.title}</span>
              <span class="text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-transparent shrink-0 ${badgeColor}">${badgeLabel}</span>
            </div>
            <p class="text-[9px] text-slate-400 font-mono truncate mt-0.5">${d.subtitle}</p>
            <div class="flex items-center justify-between mt-1 pt-1 border-t border-slate-50">
              <span class="text-[8px] font-mono font-medium text-slate-500 bg-slate-50 border border-slate-100 px-1 py-0.5 rounded truncate">${d.metric}</span>
              <span class="text-[8px] font-bold text-slate-400 group-hover:text-slate-600 flex items-center gap-0.5">
                ${isNodeSelected ? '<span class="text-emerald-600 font-bold">● Active</span>' : 'Inspect →'}
              </span>
            </div>
          </div>
        `;
      });

    // Setup CSS keyframe for flow-dash
    const styleId = 'flowchart-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @keyframes flow-dash {
          to {
            stroke-dashoffset: -20;
          }
        }
      `;
      document.head.appendChild(style);
    }

  }, [dimensions, nodes, selectedNodeId, isConsulting, activeProcessingIndex]);

  // Retrieve current selected node info
  const selectedNode = React.useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || nodes[0];
  }, [nodes, selectedNodeId]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" id="ilrmf-d3-flowchart-container">
      {/* Header Panel */}
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Workflow className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="font-serif italic text-slate-900 text-sm font-bold flex items-center gap-1.5">
              <span>ILRMF Logic Flow Auditing Path</span>
              {isOfflineMode && (
                <span className="text-[9px] font-mono font-bold uppercase bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">Offline</span>
              )}
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">D3.js Directed graph tracking strict sequential logic execution states</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Pass</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Weak/Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Gap/Hole</span>
          </div>
          {isConsulting && (
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded animate-pulse">
              <Cpu className="w-3 h-3 animate-spin" />
              <span>Analyzing Node...</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Flow Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 h-auto min-h-[380px]">
        {/* SVG Area (8 Cols) */}
        <div 
          ref={containerRef} 
          className="lg:col-span-8 bg-[#FAF9F5] p-2 relative flex items-center justify-center min-h-[340px] select-none"
        >
          {/* Watermark overlay */}
          <div className="absolute top-2 left-3 text-[9px] font-mono text-slate-400 pointer-events-none uppercase">
            Interactive D3 Graph Canvas • Scroll/Drag to inspect
          </div>
          <svg 
            ref={svgRef} 
            className="w-full h-full font-sans overflow-visible transition-all duration-300"
          />
        </div>

        {/* Detailed Inspector Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                Step Inspector Panel
              </span>
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Selected Node Core Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg font-serif italic text-sm font-bold flex items-center justify-center shrink-0 ${selectedNode.colorClass} border`}>
                  {selectedNode.icon}
                </div>
                <div>
                  <h4 className="font-serif text-slate-900 text-sm font-bold leading-tight">{selectedNode.title}</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedNode.subtitle}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50/50 border border-slate-100 p-3 rounded-xl">
                "{selectedNode.description}"
              </p>

              {/* Status checklist metrics */}
              <div className="space-y-2.5">
                <span className="text-[9px] font-mono font-bold uppercase text-slate-400 tracking-widest block">
                  Rule Audit Checklist & Hashes
                </span>
                
                <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                  {selectedNode.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-normal">
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick tips action box based on selected node */}
          <div className="mt-6 border-t border-slate-100 pt-4 bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/40">
            <h5 className="text-[10px] font-bold font-mono text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Deterministic Compliance Tip</span>
            </h5>
            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
              {selectedNode.id === 'facts' && 'Case facts must explicitly detail names, nikah certificate availability, and specific timeline indices to achieve high compliance ratings.'}
              {selectedNode.id === 'issue' && 'The issue is justiciable if it isolates the core statutory dispute without adding open-ended emotional narratives.'}
              {selectedNode.id === 'rule' && 'Deterministic linking to MFLO 1961 or statutory Hindu Married Women\'s Act avoids probabilistic AI hallucinations.'}
              {selectedNode.id === 'application' && 'Strengthen legal application by strictly using the structural logical connectors "since", "because", and "therefore".'}
              {selectedNode.id === 'conclusion' && 'Ensure the conclusion uses non-ambiguous action verbs (e.g. "must file", "should deliver notice") to provide legal certainty.'}
              {selectedNode.id === 'verdict' && 'A score above 80/100 represents a legally sound IRAC draft compliant with Neum Lex and Bangladesh High Court standards.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
