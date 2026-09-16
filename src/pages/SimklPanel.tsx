import { useState } from 'react'
import { getSimklClientId, getSimklToken, setSimklCreds } from '../lib/simklAuth'
import { simklStartPin, simklPollPin } from '../api/simkl'

export default function SimklPanel() {
  const [clientId, setClientId] = useState(getSimklClientId())
  const [token, setToken] = useState(getSimklToken())
  const [pin, setPin] = useState('')
  const [msg, setMsg] = useState('')

  async function connect() {
    if (!clientId.trim()) {
      setMsg('Paste your Simkl client id first.')
      return
    }
    setMsg('Starting PIN…')
    try {
      const started = await simklStartPin(clientId.trim())
      setPin(started.user_code)
      setMsg(`Open ${started.verification_url || 'https://simkl.com/pin'} and enter ${started.user_code}`)
      const until = Date.now() + (started.expires_in || 900) * 1000
      const interval = Math.max(5, started.interval || 5) * 1000
      while (Date.now() < until) {
        await new Promise((r) => setTimeout(r, interval))
        const polled = await simklPollPin(clientId.trim(), started.user_code)
        if (polled?.access_token) {
          setToken(polled.access_token)
          setSimklCreds(clientId.trim(), polled.access_token)
          setMsg('Simkl connected. Progress will save there.')
          return
        }
      }
      setMsg('PIN expired. Try Connect again.')
    } catch (e: any) {
      setMsg(e?.message || 'Simkl connect failed')
    }
  }

  function saveManual() {
    setSimklCreds(clientId.trim(), token.trim())
    setMsg('Saved.')
  }

  return (
    <div className="p-8 max-w-2xl pt-0">
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden">
        <h3 className="px-5 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-widest border-b border-white/[0.04]">Simkl</h3>
        <div className="p-5 space-y-3">
          <p className="text-[10px] text-white/35 leading-relaxed">
            Create a free app at simkl.com/settings/developer/new then paste the client id and press Connect. Enter the PIN on simkl.com/pin.
          </p>
          <label className="text-xs text-white/50 block">Simkl client id</label>
          <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="client_id from Simkl developer settings" className="w-full h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white placeholder-white/15 focus:outline-none" />
          <label className="text-xs text-white/50 block">Access token (filled after PIN)</label>
          <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Will appear after Connect" type="password" className="w-full h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white placeholder-white/15 focus:outline-none" />
          {pin && <p className="text-lg tracking-[0.3em] text-white font-semibold">{pin}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={connect} className="h-8 px-3 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs text-white/70">Connect with PIN</button>
            <button type="button" onClick={saveManual} className="h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/50">Save</button>
          </div>
          {msg && <p className="text-[10px] text-white/40">{msg}</p>}
        </div>
      </div>
    </div>
  )
}
