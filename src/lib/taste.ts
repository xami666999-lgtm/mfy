export type TasteItem = { id: string; type: string; title: string; poster?: string }

function load() {
  try { return JSON.parse(localStorage.getItem('mfy-taste') || '{"likes":[],"dislikes":[]}') } catch { return { likes: [], dislikes: [] } }
}
function save(d: any) {
  try { localStorage.setItem('mfy-taste', JSON.stringify(d)) } catch {}
}

export function getTaste() { return load() }

export function markLike(item: TasteItem) {
  const d = load()
  d.likes = [item, ...(d.likes || []).filter((x: TasteItem) => String(x.id) !== String(item.id))].slice(0, 80)
  d.dislikes = (d.dislikes || []).filter((x: TasteItem) => String(x.id) !== String(item.id))
  save(d)
  return d
}

export function markDislike(item: TasteItem) {
  const d = load()
  d.dislikes = [item, ...(d.dislikes || []).filter((x: TasteItem) => String(x.id) !== String(item.id))].slice(0, 80)
  d.likes = (d.likes || []).filter((x: TasteItem) => String(x.id) !== String(item.id))
  save(d)
  return d
}

export function isLiked(id: string | number) {
  return (load().likes || []).some((x: TasteItem) => String(x.id) === String(id))
}

export function isDisliked(id: string | number) {
  return (load().dislikes || []).some((x: TasteItem) => String(x.id) === String(id))
}

export function getStars(id: string | number) {
  const n = Number((load().stars || {})[String(id)] || 0)
  return n >= 1 && n <= 5 ? n : 0
}

export function setStars(id: string | number, stars: number) {
  const d = load()
  d.stars = d.stars || {}
  if (stars <= 0) delete d.stars[String(id)]
  else d.stars[String(id)] = Math.max(1, Math.min(5, Math.round(stars)))
  save(d)
  return d.stars[String(id)] || 0
}

export type Mood = 'love' | 'like' | 'dislike' | ''

export function getMood(id: string | number): Mood {
  const m = (load().moods || {})[String(id)]
  return m === 'love' || m === 'like' || m === 'dislike' ? m : ''
}

export function setMood(id: string | number, mood: Mood) {
  const d = load()
  d.moods = d.moods || {}
  const cur = d.moods[String(id)]
  if (!mood || cur === mood) delete d.moods[String(id)]
  else d.moods[String(id)] = mood
  if (mood === 'dislike') d.likes = (d.likes || []).filter((x: TasteItem) => String(x.id) !== String(id))
  if (mood === 'like' || mood === 'love') d.dislikes = (d.dislikes || []).filter((x: TasteItem) => String(x.id) !== String(id))
  save(d)
  return (d.moods[String(id)] || '') as Mood
}
