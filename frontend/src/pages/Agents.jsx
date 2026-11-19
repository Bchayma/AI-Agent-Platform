import React from 'react'
import { Search, Layers, FileText, Bot, Zap, ArrowDown } from 'lucide-react'

const AGENTS = [
  {
    name: 'CoordinatorAgent',
    role: 'Orchestrator & Brain',
    icon: Zap,
    color: '#f472b6',
    description: 'The central intelligence of the platform. Receives all user requests, analyzes intent using the LLM, and decides which agents to run in what order. Manages the full pipeline and collects results.',
    capabilities: ['Intent analysis', 'Dynamic pipeline routing', 'Agent orchestration', 'Result aggregation'],
    triggers: ['All task types', 'Auto-routing via LLM', 'Manual overrides'],
  },
  {
    name: 'ResearchAgent',
    role: 'Information Gatherer',
    icon: Search,
    color: '#38bdf8',
    description: 'Specialized in collecting comprehensive, structured information on any topic. Analyzes subjects from multiple angles, identifies key components, issues, and best practices.',
    capabilities: ['Topic analysis', 'Issue identification', 'Best practices research', 'Structured findings'],
    triggers: ['analyze', 'report', 'chat (when research needed)'],
  },
  {
    name: 'SummarizationAgent',
    role: 'Content Condenser',
    icon: Layers,
    color: '#a78bfa',
    description: 'Reduces large volumes of information into clear, actionable insights. Supports multiple output formats: bullet points, paragraphs, and executive summaries.',
    capabilities: ['Bullet point summaries', 'Paragraph summaries', 'Executive summaries', 'Key insight extraction'],
    triggers: ['summarize', 'analyze', 'report', 'chat (when condensing needed)'],
  },
  {
    name: 'DocumentationAgent',
    role: 'Technical Writer',
    icon: FileText,
    color: '#34d399',
    description: 'Transforms raw content into professional, production-ready technical documentation. Structures information with proper Markdown, headers, code examples, and navigation.',
    capabilities: ['Markdown documentation', 'Code examples', 'Quick-start guides', 'API documentation'],
    triggers: ['analyze (standard & deep)'],
  },
  {
    name: 'ReportAgent',
    role: 'Report Generator',
    icon: Bot,
    color: '#fbbf24',
    description: 'Creates formal, executive-ready business and technical reports. Includes all standard report sections, status indicators, metrics, and professional language.',
    capabilities: ['Executive summaries', 'Formal report structure', 'Risk analysis', 'Recommendation sections'],
    triggers: ['report'],
  },
]

const PIPELINES = [
  { label: 'Analyze (Standard)', agents: ['CoordinatorAgent','ResearchAgent','SummarizationAgent','DocumentationAgent'], color:'#6c63ff' },
  { label: 'Report',             agents: ['CoordinatorAgent','ResearchAgent','SummarizationAgent','ReportAgent'], color:'#a78bfa' },
  { label: 'Summarize',          agents: ['CoordinatorAgent','SummarizationAgent'], color:'#38bdf8' },
  { label: 'Chat (Auto)',        agents: ['CoordinatorAgent','ResearchAgent','SummarizationAgent'], color:'#34d399' },
]

const AGENT_COLORS = {
  CoordinatorAgent: '#f472b6',
  ResearchAgent: '#38bdf8',
  SummarizationAgent: '#a78bfa',
  DocumentationAgent: '#34d399',
  ReportAgent: '#fbbf24',
}

export default function Agents() {
  return (
    <div style={{ padding:'32px 28px', maxWidth:1000, margin:'0 auto' }}>
      <div style={{ marginBottom:32 }} className="animate-fade">
        <h1 style={{ fontSize:'1.5rem', fontWeight:800, marginBottom:6 }}>Agent Network</h1>
        <p style={{ color:'var(--text-muted)', fontSize:14 }}>
          5 specialized AI agents working in coordinated pipelines
        </p>
      </div>

      {/* Agent cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:18, marginBottom:40 }}>
        {AGENTS.map((agent, i) => {
          const Icon = agent.icon
          return (
            <div key={agent.name} className="glass animate-fade" style={{
              animationDelay:`${i*0.08}s`,
              padding:'22px', borderRadius:'var(--radius)',
              borderTop:`3px solid ${agent.color}`,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{
                  width:36, height:36, borderRadius:8,
                  background:`${agent.color}20`,
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                }}>
                  <Icon size={18} color={agent.color} />
                </div>
                <div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:agent.color, fontWeight:700 }}>
                    {agent.name}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{agent.role}</div>
                </div>
              </div>

              <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.65, marginBottom:14 }}>
                {agent.description}
              </p>

              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'var(--text-dim)', marginBottom:6 }}>Capabilities</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {agent.capabilities.map(c => (
                    <span key={c} style={{
                      padding:'3px 8px', borderRadius:4,
                      background:`${agent.color}12`, color:agent.color,
                      fontSize:11, fontWeight:600,
                    }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'var(--text-dim)', marginBottom:6 }}>Triggered by</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
                  {agent.triggers.join(' · ')}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pipelines */}
      <div>
        <h2 style={{ fontSize:14, textTransform:'uppercase', letterSpacing:2, color:'var(--text-muted)', marginBottom:18 }}>Execution Pipelines</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16 }}>
          {PIPELINES.map((p, i) => (
            <div key={p.label} className="glass animate-fade" style={{
              animationDelay:`${i*0.08+0.4}s`,
              padding:'18px', borderRadius:'var(--radius)',
              borderLeft:`3px solid ${p.color}`,
            }}>
              <div style={{ fontSize:13, fontWeight:700, color:p.color, marginBottom:14 }}>{p.label}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                {p.agents.map((a, ai) => (
                  <React.Fragment key={a}>
                    <div style={{
                      display:'flex', alignItems:'center', gap:8,
                      padding:'6px 10px', borderRadius:6,
                      background:`${AGENT_COLORS[a]}12`,
                    }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:AGENT_COLORS[a], flexShrink:0 }} />
                      <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:AGENT_COLORS[a], fontWeight:700 }}>
                        {a.replace('Agent','')}
                      </span>
                    </div>
                    {ai < p.agents.length - 1 && (
                      <div style={{ paddingLeft:22, color:'var(--text-dim)' }}>
                        <ArrowDown size={12} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
