import { useState } from 'react'
import { pearioWatchUrl, pearioUserUrl } from '../api/stremioAddons'

export default function TogetherPanel({
  streamUrl,
  imdbOrId,
  type,
  onClose,
  onSplitSports,
}: {
  streamUrl?: string
  imdbOrId?: string
  type?: 'movie' | 'series' | 'tv'
  onClose: () => void
  onSplitSports?: () => void
}) {
  const [user, setUser] = useState('')
  const room = pearioWatchUrl(String(imdbOrId || ''), type === 'movie' ? 'movie' : 'series')
  return (
    <div className="fixed inset-0 z-[130] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-[#140c14] border border-white/15 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="text-[10px] tracking-[0.3em] text-[#FF1493] mb-2">MFY TOGETHER</div>
        <h3 className="text-xl text-white font-semibold mb-4">Cast & watch together</h3>

        <p className="text-sm text-white/70 mb-2">Cast to TV</p>
        <p className="text-xs text-white/45 mb-3">
          Chromecast cannot play most in-app embeds (VidSrc / Pengu pages). Use a direct file or site-cast:
          copy the stream, then in Google Home / CATT run “cast this tab” or <code>catt cast_site URL</code>.
        </p>
        <div className="flex gap-2 mb-5">
          <button type="button" className="h-9 px-3 rounded-full bg-white text-black text-xs font-semibold" onClick={() => {
            const u = streamUrl || window.location.href
            navigator.clipboard?.writeText(u).catch(() => {})
          }}>Copy stream URL</button>
          <a className="h-9 px-3 rounded-full bg-white/10 text-white text-xs flex items-center" href="https://github.com/skorokithakis/catt" target="_blank" rel="noreferrer">CATT on GitHub</a>
        </div>

        <p className="text-sm text-white/70 mb-2">Watch a movie with someone</p>
        <p className="text-xs text-white/45 mb-3">Peario syncs the same title. Share the room, or search their username.</p>
        <div className="flex gap-2 mb-3">
          <button type="button" className="h-9 px-3 rounded-full bg-[#FF1493] text-white text-xs font-semibold" onClick={() => window.open(room, '_blank')}>Open Peario room</button>
          <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="their username" className="h-9 px-3 rounded-full bg-white/10 text-xs text-white flex-1" />
          <button type="button" className="h-9 px-3 rounded-full bg-white/10 text-white text-xs" onClick={() => user && window.open(pearioUserUrl(user), '_blank')}>Find</button>
        </div>

        <p className="text-sm text-white/70 mb-2">Movie + sports on one screen</p>
        <p className="text-xs text-white/45 mb-3">Sports Multi-view already splits games. Use Split sports to pin a live match next to this title.</p>
        {onSplitSports && (
          <button type="button" className="h-9 px-3 rounded-full bg-white/10 text-white text-xs" onClick={onSplitSports}>Split sports pane</button>
        )}
        <button type="button" className="block mt-4 text-xs text-white/40" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
