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
        className={`title-logo ${className}`}
      />
    )
  }
  return (
    <h1 className={`title-logo fallback ${className}`}>
      {title}
    </h1>
  )
}
