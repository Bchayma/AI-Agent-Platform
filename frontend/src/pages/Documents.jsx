import React, { useState } from 'react'
import { FileUp, Search, Loader } from 'lucide-react'
import { uploadDocumentApi, searchDocumentsApi } from '../services/api'

export default function Documents() {
  const [collection, setCollection] = useState('default')
  const [file, setFile] = useState(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  async function upload() {
    if (!file) return
    setLoading(true); setMessage(null)
    try {
      const { data } = await uploadDocumentApi(file, collection)
      setMessage(`Indexed ${data.filename} (${data.chunks} chunks).`)
      setFile(null)
    } catch (error) {
      setMessage(error.response?.data?.detail || error.message)
    } finally { setLoading(false) }
  }

  async function search() {
    if (!query.trim()) return
    setLoading(true); setMessage(null)
    try {
      const { data } = await searchDocumentsApi(query, collection)
      setResults(data.results)
    } catch (error) {
      setMessage(error.response?.data?.detail || error.message)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 6 }}>Knowledge Base</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        Upload PDF, TXT, or Markdown documents for semantic retrieval in agent workflows.
      </p>
      <div className="glass" style={{ padding: 20, borderRadius: 'var(--radius)', marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, marginBottom: 8 }}>Collection</label>
        <input value={collection} onChange={e => setCollection(e.target.value)}
          style={{ width: '100%', padding: 10, marginBottom: 14, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)' }} />
        <input type="file" accept=".pdf,.txt,.md,.markdown" onChange={e => setFile(e.target.files[0])}
          style={{ color: 'var(--text-muted)', marginBottom: 14 }} />
        <button onClick={upload} disabled={loading || !file} style={{ padding: '9px 16px', border: 0, borderRadius: 6, background: 'var(--accent)', color: '#fff', cursor: file ? 'pointer' : 'not-allowed' }}>
          {loading ? <Loader size={14} className="animate-spin" /> : <FileUp size={14} />} Upload and index
        </button>
      </div>
      <div className="glass" style={{ padding: 20, borderRadius: 'var(--radius)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Search uploaded knowledge..." style={{ flex: 1, padding: 10, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)' }} />
          <button onClick={search} disabled={loading || !query.trim()} style={{ padding: '9px 16px', border: 0, borderRadius: 6, background: 'var(--accent-2)', color: '#fff' }}><Search size={14} /></button>
        </div>
        {message && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{message}</p>}
        {results.map((item, index) => (
          <div key={`${item.metadata?.document_id || index}-${index}`} style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <small style={{ color: 'var(--accent-2)' }}>{item.metadata?.source || 'Document'} · score {Number(item.score).toFixed(3)}</small>
            <p style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
