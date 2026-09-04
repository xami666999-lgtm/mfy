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
