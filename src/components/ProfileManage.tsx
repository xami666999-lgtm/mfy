import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { tmdb, PROFILE_URL } from '../api/tmdb'

const SHOWS = [
  { kind: 'tv' as const, id: 66732, name: 'Stranger Things' },
  { kind: 'tv' as const, id: 100088, name: 'The Last of Us' },
  { kind: 'movie' as const, id: 438631, name: 'Dune' },
  { kind: 'tv' as const, id: 60574, name: 'Peaky Blinders' },
  { kind: 'tv' as const, id: 1398, name: 'The Sopranos' },
  { kind: 'movie' as const, id: 671, name: 'Harry Potter' },
]

type Face = { id: number; name: string; src: string }
type Group = { name: string; faces: Face[] }

function prefsKey(id: string) {
  return `mfy-profile-prefs:${id}`
}

export default function ProfileManage({ id, onClose }: { id: string; onClose: () => void }) {
  const { profiles, setProfiles, setProfileAvatar, setProfilePin, setCurrentProfile, currentProfile, autoplayNext, setAutoplayNext } = useStore()
  const profile = profiles.find((p) => p.id === id)
  const [name, setName] = useState(profile?.name || '')
  const [pinOn, setPinOn] = useState(Boolean(profile?.pin))
  const [pin, setPin] = useState(profile?.pin || '')
  const [faces, setFaces] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [prefs, setPrefs] = useState(() => {
    try {
      return { previews: true, skip: false, data: 'medium', lang: 'English', subs: 'Off', ...JSON.parse(localStorage.getItem(prefsKey(id)) || '{}') }
    } catch {
      return { previews: true, skip: false, data: 'medium', lang: 'English', subs: 'Off' }
    }
  })

  useEffect(() => {
    if (!faces || groups.length) return
    let dead = false
    Promise.all(SHOWS.map(async (show) => {
      const detail = show.kind === 'tv' ? await tmdb.getTVDetail(show.id) : await tmdb.getMovieDetail(show.id)
      const cast = (detail?.credits?.cast || []).filter((c: any) => c.profile_path).slice(0, 8)
      return {
        name: show.name,
        faces: cast.map((c: any) => ({ id: c.id, name: c.name, src: `${PROFILE_URL}${c.profile_path}` })),
      }
    })).then((rows) => { if (!dead) setGroups(rows.filter((g) => g.faces.length)) })
    return () => { dead = true }
  }, [faces, groups.length])

  function savePrefs(next: typeof prefs) {
    setPrefs(next)
    try { localStorage.setItem(prefsKey(id), JSON.stringify(next)) } catch {}
  }

  function saveName(value: string) {
    const trimmed = value.trim() || 'Profile'
    setName(trimmed)
    const next = profiles.map((p) => (p.id === id ? { ...p, name: trimmed } : p))
    setProfiles(next)
    if (currentProfile?.id === id) setCurrentProfile({ ...currentProfile, name: trimmed })
  }

  if (!profile) return null

  if (faces) {
    return (
      <div className="nf-manage">
        <div className="nf-faces">
          {groups.map((g) => (
            <section key={g.name}>
              <h3>{g.name}</h3>
              <div>
                {g.faces.map((f) => (
                  <button key={f.id} type="button" onClick={() => { setProfileAvatar(id, f.src); setFaces(false) }}>
                    <img src={f.src} alt={f.name} />
                  </button>
                ))}
              </div>
            </section>
          ))}
          <button type="button" className="nf-done" onClick={() => setFaces(false)}>Skip</button>
        </div>
      </div>
    )
  }

  return (
    <div className="nf-manage">
      <div className="nf-manage-card">
        <h1>Manage Profile</h1>
        <label className="nf-field">
          <span>Profile Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => saveName(name)} />
        </label>
        <button type="button" className="nf-face" onClick={() => setFaces(true)}>
          {profile.avatar ? <img src={profile.avatar} alt="" /> : <b>{name[0]}</b>}
          <i>Edit</i>
        </button>
        <p className="nf-kicker">Profile Settings</p>
        <div className="nf-rowline">
          <div><b>Lock Profile</b><small>Require a Profile PIN to enter this profile.</small></div>
          <button type="button" className={`nf-switch${pinOn ? ' on' : ''}`} onClick={() => {
            const next = !pinOn
            setPinOn(next)
            if (!next) setProfilePin(id, '')
          }} aria-label="Lock profile" />
        </div>
        {pinOn && (
          <input className="nf-pin" placeholder="4-digit PIN" value={pin} maxLength={4} onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 4)
            setPin(v)
            if (v.length === 4) setProfilePin(id, v)
          }} />
        )}
        <label className="nf-rowline">
          <b>Display Language</b>
          <select value={prefs.lang} onChange={(e) => savePrefs({ ...prefs, lang: e.target.value })}>
            {['English', 'Spanish', 'French', 'German', 'Portuguese'].map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        <label className="nf-rowline">
          <b>Subtitle Language</b>
          <select value={prefs.subs} onChange={(e) => savePrefs({ ...prefs, subs: e.target.value })}>
            {['Off', 'English', 'Spanish', 'French', 'Arabic'].map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        <div className="nf-rowline">
          <div><b>Autoplay Next Episode</b><small>Play the next episode automatically.</small></div>
          <button type="button" className={`nf-switch${autoplayNext ? ' on' : ''}`} onClick={() => setAutoplayNext(!autoplayNext)} />
        </div>
        <div className="nf-rowline">
          <div><b>Autoplay Previews</b><small>Play trailers while browsing.</small></div>
          <button type="button" className={`nf-switch${prefs.previews ? ' on' : ''}`} onClick={() => savePrefs({ ...prefs, previews: !prefs.previews })} />
        </div>
        <div className="nf-rowline">
          <div><b>Auto Skip Intro</b><small>Skip the intro when it is detected. A Skip button still appears.</small></div>
          <button type="button" className={`nf-switch${prefs.skip ? ' on' : ''}`} onClick={() => savePrefs({ ...prefs, skip: !prefs.skip })} />
        </div>
        <p className="nf-kicker">Data Usage</p>
        {([
          ['low', 'Low', 'Basic video and audio quality.'],
          ['medium', 'Medium', 'Standard video and audio quality.'],
          ['high', 'High', 'Best video and audio quality.'],
        ] as const).map(([key, label, copy]) => (
          <button key={key} type="button" className="nf-data" onClick={() => savePrefs({ ...prefs, data: key })}>
            <div><b>{label}</b><small>{copy}</small></div>
            <span className={prefs.data === key ? 'on' : ''} />
          </button>
        ))}
        <button type="button" className="nf-done" onClick={onClose}>Done</button>
      </div>
    </div>
  )
}
