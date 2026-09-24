import { useEffect, useState } from 'react'
import { getTitleLogo } from '../api/titleLogo'

export default function TitleLogo({
  id,
  type,
  title,
  className = '',
}: {
  id?: number | string | null
  type?: string
  title: string
  className?: string
}) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    const n = Number(id)
    const kind = type === 'movie' ? 'movie' : type === 'tv' || type === 'anime' ? 'tv' : null
    if (!n || !kind) {
      setSrc(null)
      return
    }
    let live = true
    getTitleLogo(kind, n).then((url) => {
      if (live) setSrc(url)
    })
    return () => {
      live = false
    }
  }, [id, type])

  if (src) {
    return (
      <img
        src={src}
        alt={title}
        className={`title-logo max-h-[150px] md:max-h-[168px] w-auto max-w-[min(560px,82vw)] object-contain object-left drop-shadow-[0_10px_28px_rgba(0,0,0,0.75)] mb-3 ${className}`}
      />
    )
  }
  return (
    <h1 className={`font-display text-5xl md:text-6xl font-bold text-white tracking-tight leading-[0.95] mb-3 drop-shadow-[0_4px_24px_rgba(0,0,0,0.65)] ${className}`} style={{ fontFamily: 'Sora, sans-serif' }}>
      {title}
    </h1>
  )
}
