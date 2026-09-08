import * as React from 'react'
import { motion } from 'framer-motion'
import { Play, Heart, Plus, Clock, TrendingUp, Loader2, ChevronRight } from 'lucide-react'
import { useStore } from '../store'
import { databaseService } from '../services/database'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { ScrollArea } from '../components/ui/ScrollArea'
import { Badge } from '../components/ui/Badge'
import { cn } from '../components/ui/Button'

const Section = ({ title, children }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="font-display font-semibold text-xl gradient-text">{title}</h2>
      </div>
    </div>
    {children}
  </motion.div>
)

export default function Home(): React.FC {
  const {
    currentPage,
    setCurrentPage,
    sidebarCollapsed,
    theme,
    setTheme,
  } = useStore()

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const systems = await databaseService.getSystems()
        const gamesResult = await databaseService.getGames(500, 0)
        if (gamesResult.success && gamesResult.data) {
          const games = gamesResult.data.map(row => ({
            id: row.id,
            name: row.name,
            platform: row.platform,
            emulatorId: row.emulator_id,
            isFavorite: !!row.is_favorite,
            lastPlayed: row.last_played,
            playtime: row.playtime || 0,
            launchCount: row.launch_count || 0,
            artworkUrl: row.artwork_url,
          } as any))

          // Store data in store
          // Note: In a full implementation, would update store state
        }
      } catch (error) {
        console.error('Home load error:', error)
      }
    }
    loadData()
  }, [setTheme])

  return (
    <ScrollArea className="h-full p-6 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <Section title="Favorites" subtitle="Your favorite games">
          <p>Favorites placeholder - would show favorite games</p>
        </Section>
        <Section title="Recently Played" subtitle="Games you've recently played">
          <p>Recently played placeholder</p>
        </Section>
        <Section title="Recently Added" subtitle="Newly added games">
          <p>Recently added placeholder</p>
        </Section>
        <Section title="Systems" subtitle="Quick access to your systems">
          <p>Systems placeholder - would show system cards</p>
        </Section>
      </motion.div>
    </ScrollArea>
  )
}