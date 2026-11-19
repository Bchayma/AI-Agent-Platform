import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTasksApi } from '../services/api'
import { formatDistanceToNow } from 'date-fns'
import { Activity, CheckCircle, XCircle, Clock, Zap, ArrowRight, Bot, FileText, Search, Layers } from 'lucide-react'

const AGENTS = [
  { name: 'ResearchAgent',       color: '#38bdf8', icon: Search,   desc: 'Gathers information from any topic' },
  { name: 'SummarizationAgent',  color: '#a78bfa', icon: Layers,   desc: 'Condenses content to key insights'  },
  { name: 'DocumentationAgent',  color: '#34d399', icon: FileText, desc: 'Creates professional documentation' },
  { name: 'ReportAgent',         color: '#fbbf24', icon: Bot,      desc: 'Generates formal business reports'  },
  { name: 'CoordinatorAgent',    color: '#f472b6', icon: Zap,      desc: 'Orchestrates the entire pipeline'   },
]

const STATUS_BADGE = {
  completed: { bg: 'rgba(52,211,153,.15)', color: '#34d399', icon: CheckCircle },
  failed:    { bg: 'rgba(248,113,113,.15)', color: '#f87171', icon: XCircle },
  running:   { bg: 'rgba(251,191,36,.15)',  color: '#fbbf24', icon: Clock },
}

export default function Dashboard() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  useEffect(() => {
    getTasksApi(10).then(r => setTasks(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const stats = {
    total:     tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed:    tasks.filter(t => t.status === 'failed').length,
    avgMs:     tasks.filter(t => t.duration_ms).reduce((a,t,_,arr) => a + t.duration_ms/arr.length, 0),
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, animationDelay:'.0s' }} className="animate-fade">
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <div style={{
            width:36, height:36, borderRadius:10,
            background:'linear-gradient(135deg,var(--accent),var(--accent-3))',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Zap size={18} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.7rem', fontWeight:800, letterSpacing:'-0.5px' }}>AgentOS Dashboard</h1>
        </div>
        <p style={{ color:'var(--text-muted)', fontSize:14 }}>
          Your multi-agent AI automation platform
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16, marginBottom:32 }}>
        {[
          { label:'Total Tasks',   value: stats.total,                     color:'var(--accent-2)' },
          { label:'Completed',     value: stats.completed,                 color:'var(--success)' },
          { label:'Failed',        value: stats.failed,                    color:'var(--error)' },
          { label:'Avg. Duration', value: stats.avgMs ? `${Math.round(stats.avgMs)}ms` : '—', color:'var(--accent-3)' },
        ].map((s,i) => (
          <div key={s.label} className="animate-fade glass" style={{
            animationDelay: `${i*0.08}s`,
            padding:'20px 22px', borderRadius:'var(--radius)',
          }}>
            <div style={{ fontSize:28, fontWeight:800, color:s.color, fontFamily:'var(--font-mono)' }}>{s.value}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4, textTransform:'uppercase', letterSpacing:1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom:32 }}>
        <h2 style={{ fontSize:14, textTransform:'uppercase', letterSpacing:2, color:'var(--text-muted)', marginBottom:14 }}>Quick Actions</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
          {[
  {
    label: 'Auto Agent',
    sub: 'Let the coordinator choose',
    path: '/new?tab=auto',
    color: '#f472b6',
  },
  {
    label: 'Analyze a Topic',
    sub: 'Research + Document',
    path: '/new?tab=analyze',
    color: '#6c63ff',
  },
  {
    label: 'Summarize Content',
    sub: 'Paste & condense',
    path: '/new?tab=summarize',
    color: '#38bdf8',
  },
  {
    label: 'Generate Report',
    sub: 'Full formal report',
    path: '/new?tab=report',
    color: '#a78bfa',
  },
  {
    label: 'AI Chat',
    sub: 'Free-form query',
    path: '/new?tab=chat',
    color: '#34d399',
  },
].map((a,i) => (
            <button key={a.label} onClick={() => nav(a.path)}
              className="animate-fade glass"
              style={{
                animationDelay: `${i*0.08+0.2}s`,
                padding:'18px 20px', borderRadius:'var(--radius)',
                cursor:'pointer', textAlign:'left', border:'1px solid var(--border)',
                background:'var(--bg-2)', transition:'all .2s',
                display:'flex', justifyContent:'space-between', alignItems:'center',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = a.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:4, color:'var(--text)' }}>{a.label}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{a.sub}</div>
              </div>
              <ArrowRight size={16} color={a.color} />
            </button>
          ))}
        </div>
      </div>

      {/* Agent overview */}
      <div style={{ marginBottom:32 }}>
        <h2 style={{ fontSize:14, textTransform:'uppercase', letterSpacing:2, color:'var(--text-muted)', marginBottom:14 }}>Agent Network</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
          {AGENTS.map((a,i) => {
            const Icon = a.icon
            return (
              <div key={a.name} className="animate-fade glass" style={{
                animationDelay: `${i*0.07+0.35}s`,
                padding:'16px', borderRadius:'var(--radius)',
                borderLeft: `3px solid ${a.color}`,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <Icon size={14} color={a.color} />
                  <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:a.color, fontWeight:700 }}>
                    {a.name.replace('Agent','')}
                  </span>
                </div>
                <p style={{ fontSize:11.5, color:'var(--text-muted)', lineHeight:1.5 }}>{a.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent tasks */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <h2 style={{ fontSize:14, textTransform:'uppercase', letterSpacing:2, color:'var(--text-muted)' }}>Recent Tasks</h2>
          <button onClick={() => nav('/history')} style={{
            background:'none', border:'none', color:'var(--accent-2)',
            cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', gap:4,
          }}>
            View all <ArrowRight size={13} />
          </button>
        </div>

        {loading ? (
          <div style={{ color:'var(--text-muted)', fontSize:14, padding:24 }}>Loading tasks…</div>
        ) : tasks.length === 0 ? (
          <div className="glass" style={{ padding:32, borderRadius:'var(--radius)', textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>
            No tasks yet. <button onClick={() => nav('/new')} style={{ background:'none', border:'none', color:'var(--accent-2)', cursor:'pointer' }}>Create your first task →</button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {tasks.slice(0,6).map(task => {
              const s = STATUS_BADGE[task.status] || STATUS_BADGE.running
              const Icon = s.icon
              return (
                <div key={task.task_id} onClick={() => nav(`/task/${task.task_id}`)}
                  className="glass"
                  style={{
                    padding:'14px 18px', borderRadius:'var(--radius)',
                    display:'flex', alignItems:'center', gap:14,
                    cursor:'pointer', transition:'all .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{
                    padding:'5px 10px', borderRadius:6,
                    background: s.bg, color: s.color,
                    fontSize:11, fontWeight:700, fontFamily:'var(--font-mono)',
                    textTransform:'uppercase', display:'flex', alignItems:'center', gap:5, flexShrink:0,
                  }}>
                    <Icon size={11} />
                    {task.status}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {task.input_text}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                      {task.task_type} · {formatDistanceToNow(new Date(task.created_at), { addSuffix:true })}
                    </div>
                  </div>
                  {task.duration_ms && (
                    <span style={{ fontSize:11, color:'var(--text-dim)', fontFamily:'var(--font-mono)', flexShrink:0 }}>
                      {Math.round(task.duration_ms)}ms
                    </span>
                  )}
                  <ArrowRight size={14} color="var(--text-dim)" />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
