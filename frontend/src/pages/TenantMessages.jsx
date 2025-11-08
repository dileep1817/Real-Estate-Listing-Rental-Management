import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getMessages, getConversationsForTenant, getThread, sendMessage, markThreadRead, deleteMessage } from '../state'

export default function TenantMessages() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [outgoing, setOutgoing] = useState('')
  const [selectedOwner, setSelectedOwner] = useState(null)

  useEffect(() => {
    setMessages(getMessages())
    const i = setInterval(() => setMessages(getMessages()), 1000)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    const me = user?.email || 'tenant@example.com'
    const conv = getConversationsForTenant(me)
    if (!selectedOwner && conv.length) setSelectedOwner(conv[0].ownerName)
  }, [user, messages, selectedOwner])

  useEffect(() => {
    if (!selectedOwner) return
    const me = user?.email || 'tenant@example.com'
    markThreadRead(selectedOwner, me, 'tenant')
  }, [selectedOwner, user, messages])

  return (
    <div className="container page" style={{ padding: 24 }}>
      <h1>Messages</h1>
      <div className="grid" style={{ gridTemplateColumns: '260px 1fr', gap: 16 }}>
        <div className="card stack" style={{ height: 420, overflow: 'auto' }}>
          <strong>Owners</strong>
          {getConversationsForTenant(user?.email || 'tenant@example.com').map(c => (
            <button key={c.ownerName} className={`row ${selectedOwner===c.ownerName ? 'active' : ''}`} onClick={() => setSelectedOwner(c.ownerName)} style={{ justifyContent: 'space-between' }}>
              <span>{c.ownerName}</span>
              <span className="badge">{c.unread || 0}</span>
            </button>
          ))}
        </div>
        <div className="card stack" style={{ height: 420 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>{selectedOwner || 'Select an owner'}</strong>
          </div>
          <div className="stack" style={{ flex: 1, overflow: 'auto', paddingRight: 4 }}>
            {selectedOwner && getThread(selectedOwner, user?.email || 'tenant@example.com').map(m => (
              <div key={m.id} className={`card ${m.fromRole==='tenant' ? 'self' : ''}`} style={{ alignSelf: m.fromRole==='tenant' ? 'flex-end' : 'flex-start', maxWidth: 380 }}>
                <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
                  <div className="muted" style={{ fontSize: 12 }}>{new Date(m.ts).toLocaleTimeString()}</div>
                  <button className="btn" onClick={() => { deleteMessage(m.id); setMessages(getMessages()) }} style={{ padding: '2px 6px' }}>Delete</button>
                </div>
                <div>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="row">
            <input className="input" placeholder={selectedOwner ? `Message ${selectedOwner}...` : 'Select an owner to chat'} value={outgoing} onChange={e => setOutgoing(e.target.value)} disabled={!selectedOwner} />
            <button className="btn btn-primary" disabled={!selectedOwner || !outgoing.trim()} onClick={() => {
              if (!selectedOwner || !outgoing.trim()) return
              sendMessage({ fromRole: 'tenant', toRole: 'owner', text: outgoing, ownerName: selectedOwner, tenantEmail: user?.email || 'tenant@example.com', tenantName: user?.name })
              setOutgoing('')
              setMessages(getMessages())
            }}>Send</button>
          </div>
        </div>
      </div>
    </div>
  )
}
