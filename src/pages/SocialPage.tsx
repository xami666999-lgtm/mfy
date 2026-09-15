import { useStore } from '../store'

export default function SocialPage() {
  const { profiles, currentProfile, watchHistory, userRatings, socialVisible, setSocialVisible, setCurrentPage, setSelectedMedia, switchProfile } = useStore()
  const others = profiles.filter((p) => p.id !== currentProfile?.id)
  const mine = watchHistory.filter((h) => !h.profileId || h.profileId === currentProfile?.id)
  const theirs = watchHistory.filter((h) => h.profileId && h.profileId !== currentProfile?.id)

  const shared = mine.filter((h) => theirs.some((t) => t.mediaId === h.mediaId && t.mediaType === h.mediaType))

  return (
    <div className="p-8 pb-20 text-white">
      <h1 className="text-2xl font-display font-bold">Friends</h1>
      <p className="text-white/45 text-sm mt-2 max-w-xl">
        Local only. Other MFY profiles on this device act as friends. Nothing is uploaded. Turn visibility off in this page if you do not want activity shown.
      </p>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={socialVisible} onChange={(e) => setSocialVisible(e.target.checked)} />
        Show profile activity on this device
      </label>

      <h2 className="mt-8 text-sm uppercase tracking-widest text-white/40">Profiles</h2>
      <div className="flex gap-3 mt-3">
        {profiles.map((p) => (
          <button key={p.id} className="px-4 py-3 rounded-xl bg-white/5 text-left" onClick={() => switchProfile(p.id)}>
            <div className="font-medium">{p.name}</div>
            <div className="text-xs text-white/40">{p.id === currentProfile?.id ? 'You' : 'Friend on this device'}</div>
          </button>
        ))}
      </div>
      {others.length === 0 && <p className="text-white/40 text-sm mt-3">Add another profile in Settings to see friend activity.</p>}

      {socialVisible && (
        <>
          <h2 className="mt-8 text-sm uppercase tracking-widest text-white/40">Shared titles</h2>
          <p className="text-xs text-white/40 mt-1">{shared.length} title{shared.length === 1 ? '' : 's'} in common</p>
          <div className="mt-3 space-y-2">
            {shared.slice(0, 20).map((h) => (
              <button key={h.id} className="block text-sm text-white/80" onClick={() => { setSelectedMedia({ id: h.mediaId, type: h.mediaType }); setCurrentPage('detail') }}>
                {h.title}
              </button>
            ))}
          </div>
          <h2 className="mt-8 text-sm uppercase tracking-widest text-white/40">Activity</h2>
          <div className="mt-3 space-y-2">
            {theirs.slice(0, 20).map((h) => {
              const who = profiles.find((p) => p.id === h.profileId)?.name || 'Friend'
              return (
                <button key={h.id} className="block text-sm text-white/70" onClick={() => { setSelectedMedia({ id: h.mediaId, type: h.mediaType }); setCurrentPage('detail') }}>
                  {who} watched {h.title}
                </button>
              )
            })}
            {theirs.length === 0 && <p className="text-white/35 text-sm">No other-profile history yet.</p>}
          </div>
          <h2 className="mt-8 text-sm uppercase tracking-widest text-white/40">Your ratings</h2>
          <p className="text-xs text-white/40 mt-1">{userRatings.length} saved locally</p>
        </>
      )}
    </div>
  )
}
