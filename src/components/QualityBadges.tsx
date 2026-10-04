import { useEffect, useState } from 'react'
import badges from '../data/badges.json'

type Filter = { id: string; name: string; groupId: string; pattern: string; imageURL: string }
type Group = { id: string; name: string }

const FILTERS = (badges as { filters: Filter[]; groups: Group[] }).filters
const GROUPS = (badges as { filters: Filter[]; groups: Group[] }).groups

function toRegExp(pattern: string): RegExp | null {
  let src = pattern || ''
  let flags = ''
  if (src.startsWith('(?i)')) {
    src = src.slice(4)
    flags = 'i'
  }
  try { return new RegExp(src, flags) } catch { return null }
}

const COMPILED = FILTERS.map((f) => ({ ...f, re: toRegExp(f.pattern) })).filter((f) => f.re)

export function matchBadgeFilters(text: string) {
  const hay = text || ''
  if (!hay.trim()) return []
  return COMPILED.filter((f) => f.re!.test(hay))
}

export function sourceBadge(text: string): string {
  const hit = matchBadgeFilters(text).find((f) => f.groupId === 'source')
  return hit?.imageURL || ''
}

const cropCache = new Map<string, string>()

export function BadgeImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [url, setUrl] = useState(cropCache.get(src) || src)
  useEffect(() => {
    if (!src || cropCache.has(src)) { setUrl(cropCache.get(src) || src); return }
    let dead = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const c = document.createElement('canvas')
        c.width = img.width
        c.height = img.height
        const ctx = c.getContext('2d', { willReadFrequently: true })
        if (!ctx) return
        ctx.drawImage(img, 0, 0)
        const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height)
        let minX = width, minY = height, maxX = 0, maxY = 0
        const step = width > 800 ? 3 : 1
        for (let y = 0; y < height; y += step) {
          for (let x = 0; x < width; x += step) {
            if (data[(y * width + x) * 4 + 3] > 18) {
              if (x < minX) minX = x
              if (y < minY) minY = y
              if (x > maxX) maxX = x
              if (y > maxY) maxY = y
            }
          }
        }
        if (maxX <= minX || maxY <= minY) return
        const pad = 6
        const sx = Math.max(0, minX - pad)
        const sy = Math.max(0, minY - pad)
        const sw = Math.min(width - sx, maxX - minX + pad * 2)
        const sh = Math.min(height - sy, maxY - minY + pad * 2)
        const out = document.createElement('canvas')
        out.width = sw
        out.height = sh
        out.getContext('2d')!.drawImage(c, sx, sy, sw, sh, 0, 0, sw, sh)
        const next = out.toDataURL('image/png')
        cropCache.set(src, next)
        if (!dead) setUrl(next)
      } catch { /* keep the original if the host blocks canvas reads */ }
    }
    img.src = src
    return () => { dead = true }
  }, [src])
  return <img className={className} src={url} alt={alt} title={alt} referrerPolicy="no-referrer" />
}

export default function QualityBadges({ haystack = '', providers = [] }: { haystack?: string; providers?: string[]; year?: string }) {
  const text = [haystack, ...(providers || [])].filter(Boolean).join('\n')
  const hits = matchBadgeFilters(text)
  if (!hits.length) return null
  return (
    <div className="mfy-badges">
      {GROUPS.map((g) => {
        const rows = hits.filter((h) => h.groupId === g.id)
        if (!rows.length) return null
        return (
          <div key={g.id} className="mfy-badge-line">
            <span>{g.name}</span>
            <div>
              {rows.map((b) => (
                <BadgeImg key={b.id} src={b.imageURL} alt={b.name} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
