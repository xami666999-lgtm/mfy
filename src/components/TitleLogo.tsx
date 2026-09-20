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
        className={`title-logo max-h-28 md:max-h-36 w-auto max-w-[min(520px,80vw)] object-contain object-left drop-shadow-[0_8px_24px_rgba(0,0,0,0.7)] mb-3 ${className}`}
      />
    )
  }
  return (
    <h1 className={`font-display text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.05] mb-3 drop-shadow-[0_4px_24px_rgba(0,0,0,0.65)] ${className}`}>
      {title}
    </h1>
  )
}
