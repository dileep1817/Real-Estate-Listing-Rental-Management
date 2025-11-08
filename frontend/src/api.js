const isVercel = typeof window !== 'undefined' && /vercel\.app$/.test(window.location.host);
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (isVercel ? 'https://backend-ejgmku3q2-dileep-kumars-projects-94cc4ebe.vercel.app' : 'https://backend-7pbtt1d1p-dileep-kumars-projects-94cc4ebe.vercel.app');

export async function getListings() {
  const res = await fetch(`${API_BASE}/listings`);
  if (!res.ok) throw new Error(`Failed to fetch listings: ${res.status}`);
  return res.json();
}

export async function getListing(id) {
  const res = await fetch(`${API_BASE}/listings/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch listing ${id}: ${res.status}`);
  return res.json();
}

export async function createListing(payload) {
  const res = await fetch(`${API_BASE}/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create listing: ${res.status}`);
  return res.json();
}

export async function updateListing(id, payload) {
  const res = await fetch(`${API_BASE}/listings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update listing ${id}: ${res.status}`);
  return res.json();
}

export async function deleteListing(id) {
  const res = await fetch(`${API_BASE}/listings/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete listing ${id}: ${res.status}`);
  return res.json();
}
