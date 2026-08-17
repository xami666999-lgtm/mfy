export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date: string): string {
  if (!date) return 'TBA'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

export function getRatingColor(rating: number): string {
  if (rating >= 7) return 'text-green-400'
  if (rating >= 5) return 'text-yellow-400'
  return 'text-red-400'
}

export function getRatingBg(rating: number): string {
  if (rating >= 7) return 'bg-green-500/20 border-green-500/40'
  if (rating >= 5) return 'bg-yellow-500/20 border-yellow-500/40'
  return 'bg-red-500/20 border-red-500/40'
}

export function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, '')?.replace(/&[^;]+;/g, ' ') || ''
}

export function truncate(str: string, len: number): string {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}
