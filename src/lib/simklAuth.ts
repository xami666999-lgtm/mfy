const CID = 'simklClientId'
const TOK = 'simklToken'

function read(key: string) {
  try {
    const raw = localStorage.getItem('mfy-' + key)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return ''
}

function write(key: string, value: string) {
  try {
    localStorage.setItem('mfy-' + key, JSON.stringify(value))
    const api = (window as any).electronAPI
    if (api?.set) void api.set(key, value)
  } catch { /* ignore */ }
}

export function getSimklClientId() {
  return String(read(CID) || '')
}
export function getSimklToken() {
  return String(read(TOK) || '')
}
export function setSimklCreds(clientId: string, token: string) {
  write(CID, clientId)
  write(TOK, token)
}
export async function hydrateSimklFromElectron() {
  const api = (window as any).electronAPI
  if (!api?.get) return
  const cid = await api.get(CID)
  const tok = await api.get(TOK)
  if (cid) write(CID, cid)
  if (tok) write(TOK, tok)
}
