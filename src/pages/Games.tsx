import * as React from 'react'
import { motion } from 'framer-motion'
import { Play, Heart, Loader2, ChevronRight, Filter } from 'lucide-react'
import { useStore } from '../store'
import { databaseService } from '../services/database'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { ScrollArea } from '../components/ui/ScrollArea'
import { Badge } from '../components/ui/Badge'
import { cn } from '../components/ui/Button'

export default function Games(): React.FC {
  const {
    currentPage,
    setCurrentPage,
    sidebarCollapsed,
    theme,
    setTheme,
  } = useStore()

  return (
    <div className="h-full p-6">
      <h1 className="font-display font-bold text-2xl gradient-text">Games Library</h1>
      <p className="text-white/50 mt-1">Game library placeholder</p>
      <Button variant="ghost" size="sm" onClick={() => setCurrentPage('home')}>
        <Loader2 className="w-4 h-4 mr-1" /> Back Home
      </Button>
    </div>
  )
}