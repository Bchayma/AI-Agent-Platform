import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTasksApi } from '../services/api'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, XCircle, Clock, ArrowRight, RefreshCw } from 'lucide-react'

const STATUS = {
  completed: { color:'#34d399', bg:'rgba(52,211,153,.12)', icon: CheckCircle },
  failed:    { color:'#f87171', bg:'rgba(248,113,113,.12)', icon: XCircle },
  running:   { color:'#fbbf24', bg:'rgba(251,191,36,.12)',  icon: Clock },
}

const TYPE_COLOR = {
  analyze:   '#6c63ff',
  summarize: '#38bdf8',
  report:    '#a78bfa',
  chat:      '#34d399',
}

export default function TaskHistory() {
  const [tasks, setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const nav = useNavigate()

  const load = () => {
    setLoading(true)
    getTasksApi(50).then(r => setTasks(r.data)).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter || t.task_type === filter)

  return (
    <div style={{ padding:'32px 28px', maxWidth:900, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }} className="animate-fade">
        <div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:800, marginBottom:6 }}>Task History</h1>
          <p style={{ color:'var(--text-muted)', fontSize:14 }}>{tasks.length} tasks recorded</p>
        </div>
        <button onClick={load} style={{
          padding:'9px 16px', background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:'var(--radius-sm)', color:'var(--text-muted)', cursor:'pointer',
          display:'flex', alignItems:'center', gap:7, fontSize:13,
        }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:22, flexWrap:'wrap' }}>
        {['all','analyze','summarize','report','chat','completed','failed'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'6px 14px', borderRadius:20,
            background: filter === f ? 'var(--accent)' : 'var(--surface)',
            border: filter === f ? '1px solid var(--accent)' : '1px solid var(--border)',
            color: filter === f ? '#fff' : 'var(--text-muted)',
            cursor:'pointer', fontSize:12, fontWeight: filter === f ? 700 : 400,
            textTransform:'capitalize', transition:'all .15s',
          }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="glass" style={{ padding:40, textAlign:'center', color:'var(--text-muted)', fontSize:14, borderRadius:'var(--radius)' }}>
          No tasks found
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map((task, i) => {
            const s = STATUS[task.status] || STATUS.running
            const SIcon = s.icon
            return (
              <div key={task.task_id} onClick={() => nav(`/task/${task.task_id}`)}
                className="glass animate-fade"
                style={{
                  animationDelay:`${i*0.04}s`,
                  padding:'16px 20px', borderRadius:'var(--radius)',
                  display:'flex', alignItems:'center', gap:14,
                  cursor:'pointer', transition:'all .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {/* Type badge */}
                <span style={{
                  padding:'4px 10px', borderRadius:6,
                  background:`${TYPE_COLOR[task.task_type] || 'var(--accent)'}20`,
                  color: TYPE_COLOR[task.task_type] || 'var(--accent)',
                  fontSize:11, fontFamily:'var(--font-mono)', fontWeight:700,
                  flexShrink:0, textTransform:'uppercase',
                }}>
                  {task.task_type}
                </span>

                {/* Input preview */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:3 }}>
                    {task.input_text}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                    {formatDistanceToNow(new Date(task.created_at), { addSuffix:true })}
                    {task.duration_ms ? ` · ${Math.round(task.duration_ms)}ms` : ''}
                  </div>
                </div>

                {/* Status */}
                <div style={{
                  display:'flex', alignItems:'center', gap:5,
                  padding:'4px 10px', borderRadius:6,
                  background: s.bg, color: s.color,
                  fontSize:11, fontFamily:'var(--font-mono)', fontWeight:700,
                  flexShrink:0,
                }}>
                  <SIcon size={11} />
                  {task.status}
                </div>

                <ArrowRight size={14} color="var(--text-dim)" style={{ flexShrink:0 }} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
