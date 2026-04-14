const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function uploadCSV(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Upload failed')
  }
  return res.json()
}


export async function analyseData(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/analyse`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Analysis failed')
  }
  return res.json()
}
