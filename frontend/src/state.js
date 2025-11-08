// Simple shared state via localStorage for demo flows (no backend persistence)
const KEYS = {
  requests: 'booking_requests',
  messages: 'messages',
  profiles: 'profiles',
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// Messages
export function getMessages() {
  return read(KEYS.messages, [])
}

export function getMessagesFor(role) {
  const all = getMessages()
  return all.filter(m => m.toRole === role)
}

export function sendMessage({ fromRole, toRole, text, listingId = null, ownerName = null, tenantEmail = null, tenantName = null }) {
  const all = getMessages()
  const msg = {
    id: Date.now(),
    fromRole,
    toRole,
    text,
    listingId,
    ownerName,
    tenantEmail,
    tenantName,
    ts: new Date().toISOString(),
    readAt: null,
  }
  all.push(msg)
  write(KEYS.messages, all)
  return msg
}

export function deleteMessage(id) {
  const all = getMessages()
  const next = all.filter(m => m.id !== id)
  write(KEYS.messages, next)
  return true
}

export function renameOwnerInMessages(oldName, newName) {
  if (!oldName || !newName) return false
  const all = getMessages()
  let changed = false
  for (const m of all) {
    if ((m.ownerName || 'Owner') === oldName) {
      m.ownerName = newName
      changed = true
    }
  }
  if (changed) write(KEYS.messages, all)
  return changed
}

// Conversation helpers
export function getConversationsForTenant(tenantEmail) {
  const all = getMessages()
  const mine = all.filter(m => m.tenantEmail === tenantEmail || (!m.tenantEmail && m.toRole === 'tenant'))
  const byOwner = new Map()
  for (const m of mine) {
    const key = m.ownerName || 'Owner'
    const arr = byOwner.get(key) || []
    arr.push(m)
    byOwner.set(key, arr)
  }
  return Array.from(byOwner.entries()).map(([ownerName, msgs]) => ({
    ownerName,
    lastTs: msgs[msgs.length - 1]?.ts,
    count: msgs.length,
    unread: msgs.filter(x => x.toRole === 'tenant' && !x.readAt).length,
  })).sort((a,b) => new Date(b.lastTs || 0) - new Date(a.lastTs || 0))
}

export function getConversationsForOwner(ownerName) {
  const all = getMessages()
  // Relax filter so owner still sees conversations even if ownerName stored in messages differs
  const mine = all.filter(m => m.toRole === 'owner' || m.fromRole === 'owner' || (m.ownerName || 'Owner') === ownerName)
  const byTenant = new Map()
  for (const m of mine) {
    const key = m.tenantEmail || 'tenant@example.com'
    const arr = byTenant.get(key) || []
    arr.push(m)
    byTenant.set(key, arr)
  }
  return Array.from(byTenant.entries()).map(([tenantEmail, msgs]) => ({
    tenantEmail,
    tenantName: msgs.find(x => x.tenantName)?.tenantName || tenantEmail,
    lastTs: msgs[msgs.length - 1]?.ts,
    count: msgs.length,
    unread: msgs.filter(x => x.toRole === 'owner' && !x.readAt).length,
  })).sort((a,b) => new Date(b.lastTs || 0) - new Date(a.lastTs || 0))
}

export function getThread(ownerName, tenantEmail) {
  const all = getMessages()
  return all
    .filter(m => (m.ownerName || 'Owner') === (ownerName || 'Owner') && (m.tenantEmail || 'tenant@example.com') === (tenantEmail || 'tenant@example.com'))
    .sort((a,b) => new Date(a.ts) - new Date(b.ts))
}

// Owner-focused thread by tenant only (ignores ownerName mismatches)
export function getThreadForOwner(tenantEmail) {
  const all = getMessages()
  return all
    .filter(m => (m.tenantEmail || 'tenant@example.com') === (tenantEmail || 'tenant@example.com'))
    .sort((a,b) => new Date(a.ts) - new Date(b.ts))
}

export function markThreadRead(ownerName, tenantEmail, readerRole) {
  const all = getMessages()
  const now = new Date().toISOString()
  let changed = false
  for (const m of all) {
    if ((m.ownerName || 'Owner') === (ownerName || 'Owner') && (m.tenantEmail || 'tenant@example.com') === (tenantEmail || 'tenant@example.com')) {
      if (m.toRole === readerRole && !m.readAt) {
        m.readAt = now
        changed = true
      }
    }
  }
  if (changed) write(KEYS.messages, all)
}

// Profiles (email -> full name)
export function setProfile(email, name) {
  const profiles = read(KEYS.profiles, {})
  profiles[email] = name
  write(KEYS.profiles, profiles)
}

export function getProfileName(email) {
  const profiles = read(KEYS.profiles, {})
  return profiles[email]
}

// Booking Requests
export function getRequests() {
  return read(KEYS.requests, [])
}

export function addRequest({ listing, tenantEmail }) {
  const all = getRequests()
  const req = {
    id: Date.now(),
    listing,
    tenantEmail,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  all.push(req)
  write(KEYS.requests, all)
  return req
}

export function setRequestStatus(id, status) {
  const all = getRequests()
  const idx = all.findIndex(r => r.id === id)
  if (idx !== -1) {
    all[idx] = { ...all[idx], status }
    write(KEYS.requests, all)
    return all[idx]
  }
  return null
}
