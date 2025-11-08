import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getMessagesFor, getConversationsForOwner, getThreadForOwner, sendMessage, markThreadRead, deleteMessage, getMessages } from '../state'

export default function OwnerMessages() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState('')
  const [selectedTenant, setSelectedTenant] = useState(null)

  useEffect(() => {
    setMessages(getMessagesFor('owner'))
    const i = setInterval(() => setMessages(getMessagesFor('owner')), 1000)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    if (!selectedTenant) return
    const owner = user?.name || 'Owner A'
    markThreadRead(owner, selectedTenant, 'owner')
  }, [selectedTenant, user, messages])

  return (
    <div className="container page" style={{ padding: 24 }}>
      <h1>Messages</h1>
      <div className="grid" style={{ gridTemplateColumns: '260px 1fr', gap: 16 }}>
        <div className="card stack" style={{ height: 420, overflow: 'auto' }}>
          <strong>Tenants</strong>
          {getConversationsForOwner(user?.name || 'Owner A').map(c => (
            <button key={c.tenantEmail} className={`row ${selectedTenant===c.tenantEmail ? 'active' : ''}`} onClick={() => setSelectedTenant(c.tenantEmail)} style={{ justifyContent: 'space-between' }}>
              <span>{c.tenantName || c.tenantEmail}</span>
              <span className="badge">{c.unread || 0}</span>
            </button>
          ))}
        </div>
        <div className="card stack" style={{ height: 420 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>{selectedTenant || 'Select a tenant'}</strong>
          </div>
          <div className="stack" style={{ flex: 1, overflow: 'auto', paddingRight: 4 }}>
            {selectedTenant && getThreadForOwner(selectedTenant).map(m => (
              <div key={m.id} className={`card ${m.fromRole==='owner' ? 'self' : ''}`} style={{ alignSelf: m.fromRole==='owner' ? 'flex-end' : 'flex-start', maxWidth: 380 }}>
                <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
                  <div className="muted" style={{ fontSize: 12 }}>{new Date(m.ts).toLocaleTimeString()} {m.readAt && m.fromRole==='owner' ? '• Read' : ''}</div>
                  <button className="btn" onClick={() => { deleteMessage(m.id); setMessages(getMessagesFor('owner')) }} style={{ padding: '2px 6px' }}>Delete</button>
                </div>
                <div>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="row">
            <input className="input" placeholder={selectedTenant ? `Message ${selectedTenant}...` : 'Select a tenant to chat'} value={reply} onChange={e => setReply(e.target.value)} disabled={!selectedTenant} />
            <button className="btn btn-primary" onClick={() => {
              if (!selectedTenant || !reply.trim()) return
              sendMessage({ fromRole: 'owner', toRole: 'tenant', text: reply, ownerName: user?.name || 'Owner A', tenantEmail: selectedTenant })
              setReply('')
              setMessages(getMessages())
            }} disabled={!selectedTenant || !reply.trim()}>Send</button>
          </div>
        </div>
      </div>
    </div>
  )
}
