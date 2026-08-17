import { BookOpen, Key, Play, List, Tv, Sparkles } from 'lucide-react'
import { useStore } from '../store'

export default function Guide() {
  const { setCurrentPage } = useStore()

  const steps = [
    {
      icon: Key,
      title: 'Add your TMDB key',
      body: 'Settings → TMDB API key. This powers movies, TV, posters, and cast. Optional: OMDb key for IMDb + Rotten Tomatoes scores.',
    },
    {
      icon: Sparkles,
      title: 'Browse Board & Discover',
      body: 'Trending rows, anime, and provider chips. Click a provider to see popular titles available there (metadata from TMDB).',
    },
    {
      icon: List,
      title: 'My List',
      body: 'Save titles with + / List. Progress from the player appears under Continue Watching on Board.',
    },
    {
      icon: Play,
      title: 'Playback',
      body: 'Configure AIOStreams URL and Real-Debrid in Settings when ready. Play uses those under the hood — no addon store in the UI.',
    },
    {
      icon: Tv,
      title: 'Shows & episodes',
      body: 'On a series detail page, pick a season and episode. Episode ratings come from TMDB when available.',
    },
  ]

  return (
    <div className="p-8 max-w-3xl mx-auto page-fade-enter">
      <div className="flex items-center gap-3 mb-2">
        <BookOpen className="w-5 h-5 text-[#FF1493]" />
        <h2 className="text-lg font-semibold text-white tracking-tight">Guide</h2>
      </div>
      <p className="text-sm text-white/35 mb-8 leading-relaxed">
        MFY is a catalog and player shell. Metadata comes from TMDB and AniList. Streams come only from services you configure (AIOStreams + Real-Debrid).
      </p>

      <div className="space-y-3">
        {steps.map((s, i) => {
          const Icon = s.icon
          return (
            <div
              key={s.title}
              className="flex gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
            >
              <div className="w-9 h-9 rounded-xl bg-[#FF1493]/12 border border-[#FF1493]/25 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-[#FF1493]" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white/25 mb-0.5">Step {i + 1}</div>
                <div className="text-sm font-semibold text-white mb-1">{s.title}</div>
                <p className="text-xs text-white/40 leading-relaxed">{s.body}</p>
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => setCurrentPage('settings')}
        className="mt-8 h-9 px-5 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90"
      >
        Open Settings
      </button>
    </div>
  )
}
