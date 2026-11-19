import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Plus, History, Bot, Menu, X,
  Zap, ChevronRight, Files
} from 'lucide-react'

const NAV = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/new',     icon: Plus,            label: 'New Task'  },
  { to: '/history', icon: History,         label: 'History'   },
  { to: '/agents',  icon: Bot,             label: 'Agents'    },
  { to: '/documents', icon: Files,         label: 'Knowledge' },
]

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)
  const loc = useLocation()

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      {/* ── Sidebar ─────────────────────────────── */}
      <aside style={{
        width: open ? 220 : 72,
        minWidth: open ? 220 : 72,
        background: 'var(--bg-2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width .25s ease, min-width .25s ease',
        overflow: 'hidden',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          padding: open ? '20px 18px' : '20px 18px',
          borderBottom: '1px solid var(--border)',
          minHeight: 64,
        }}>
          <div style={{
            width:32, height:32, borderRadius:8,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-3))',
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0,
          }}>
            <Zap size={16} color="#fff" />
          </div>
          {open && (
            <span style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap' }}>
              AgentOS
            </span>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'16px 8px', display:'flex', flexDirection:'column', gap:4 }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 8,
              color: isActive ? 'var(--accent-2)' : 'var(--text-muted)',
              background: isActive ? 'rgba(108,99,255,0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(108,99,255,0.2)' : '1px solid transparent',
              transition: 'all .15s',
              textDecoration: 'none',
              fontWeight: isActive ? 600 : 400,
              fontSize: 14,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            })}>
              <Icon size={18} style={{ flexShrink:0 }} />
              {open && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Toggle */}
        <button onClick={() => setOpen(!open)} style={{
          margin: '12px 8px',
          padding: '10px 12px',
          borderRadius: 8,
          background: 'transparent',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 13,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          transition: 'all .15s',
        }}>
          {open ? <X size={16} /> : <Menu size={16} />}
          {open && <span>Collapse</span>}
        </button>
      </aside>

      {/* ── Main ────────────────────────────────── */}
      <main style={{ flex:1, overflow:'auto', minWidth:0 }}>
        {children}
      </main>
    </div>
  )
}
