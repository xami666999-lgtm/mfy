export function SkeletonPoster({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-poster" />
      ))}
    </>
  )
}

export function SkeletonHero() {
  return <div className="skeleton skeleton-hero" />
}

export function SkeletonText({ width = 'w-60' }: { width?: string }) {
  return <div className={`skeleton skeleton-text ${width}`} />
}
