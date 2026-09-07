import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { database } from '../database'

const CACHE_EXPIRY_DAYS = 30
const MAX_CACHE_SIZE_GB = 5

interface PipedInstance {
  url: string
  healthy: boolean
  lastChecked: number
}

interface StreamInfo {
  url: string
  mimeType: string
  quality: string
  bitrate: number
  contentLength?: number
}

interface ResolvedStream {
  streamUrl: string
  mimeType: string
  quality: string
  bitrate: number
  sourceType: 'piped' | 'youtube-music'
  cachedPath?: string
  contentLength?: number
}

const DEFAULT_PIPED_INSTANCES: PipedInstance[] = [
  { url: 'https://pipedapi.kavin.rocks', healthy: true, lastChecked: 0 },
  { url: 'https://piped.mha.fi', healthy: true, lastChecked: 0 },
  { url: 'https://piped.projectsegfau.lt', healthy: true, lastChecked: 0 },
  { url: 'https://piped-api.lunar.icu', healthy: true, lastChecked: 0 },
  { url: 'https://piped.kavin.rocks', healthy: true, lastChecked: 0 },
]

const DEFAULT_YTM_INSTANCES: string[] = [
  'https://ytmusicapi.vercel.app',
  'https://ytmusic-api.vercel.app',
]

let pipedInstances = [...DEFAULT_PIPED_INSTANCES]
let ytmInstances = [...DEFAULT_YTM_INSTANCES]
let currentPipedIndex = 0
let currentYtmIndex = 0

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(id)
  }
}

async function checkInstanceHealth(url: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${url}/api/v1/status`, { method: 'GET' }, 5000)
    return response.ok
  } catch {
    return false
  }
}

async function getHealthyPipedInstance(): Promise<string> {
  const now = Date.now()
  for (let i = 0; i < pipedInstances.length; i++) {
    const instance = pipedInstances[i]
    if (now - instance.lastChecked > 60000) {
      instance.healthy = await checkInstanceHealth(instance.url)
      instance.lastChecked = now
    }
    if (instance.healthy) {
      currentPipedIndex = i
      return instance.url
    }
  }
  return pipedInstances[0]?.url || DEFAULT_PIPED_INSTANCES[0].url
}

async function getHealthyYtmInstance(): Promise<string> {
  for (let i = 0; i < ytmInstances.length; i++) {
    try {
      const response = await fetchWithTimeout(`${ytmInstances[i]}/api/status`, { method: 'GET' }, 5000)
      if (response.ok) {
        currentYtmIndex = i
        return ytmInstances[i]
      }
    } catch {
      continue
    }
  }
  return ytmInstances[0] || DEFAULT_YTM_INSTANCES[0]
}

export async function setPipedInstances(instances: string[]) {
  pipedInstances = instances.map(url => ({ url, healthy: true, lastChecked: 0 }))
  currentPipedIndex = 0
}

export async function setYtmInstances(instances: string[]) {
  ytmInstances = instances
  currentYtmIndex = 0
}

async function getCachedStream(sourceUrl: string, sourceType: string): Promise<ResolvedStream | null> {
  const cached = database.getCachedStream(sourceUrl, sourceType)
  if (cached && fs.existsSync(cached.local_path)) {
    database.updateCachedStreamAccess(cached.id)
    return {
      streamUrl: `file://${cached.local_path}`,
      mimeType: cached.mime_type || 'audio/mpeg',
      quality: 'cached',
      bitrate: 0,
      sourceType: cached.source_type as 'piped' | 'youtube-music',
      cachedPath: cached.local_path,
      contentLength: cached.file_size,
    }
  }
  return null
}

async function cacheStream(streamUrl: string, sourceUrl: string, sourceType: string): Promise<string | null> {
  try {
    const cacheDir = database.getCacheStats ? path.dirname(database.getCacheStats() as any) : path.join(app.getPath('userData'), 'audio-cache')
    const hash = crypto.createHash('sha256').update(sourceUrl).digest('hex').substring(0, 16)
    const ext = path.extname(new URL(streamUrl).pathname) || '.mp3'
    const fileName = `${hash}${ext}`
    const filePath = path.join(cacheDir, fileName)

    if (fs.existsSync(filePath)) {
      return filePath
    }

    const response = await fetchWithTimeout(streamUrl, {}, 30000)
    if (!response.ok) return null

    const contentLength = parseInt(response.headers.get('content-length') || '0')
    const mimeType = response.headers.get('content-type') || 'audio/mpeg'

    const stats = database.getCacheStats()
    if (stats && stats.total_size && stats.total_size > MAX_CACHE_SIZE_GB * 1024 * 1024 * 1024) {
      database.cleanExpiredCache()
    }

    const fileStream = fs.createWriteStream(filePath)
    for await (const chunk of response.body as any) {
      fileStream.write(chunk)
    }
    fileStream.end()

    await new Promise((resolve, reject) => {
      fileStream.on('finish', resolve)
      fileStream.on('error', reject)
    })

    const finalStats = fs.statSync(filePath)
    const expiresAt = Math.floor(Date.now() / 1000) + CACHE_EXPIRY_DAYS * 24 * 60 * 60

    database.insertCachedStream({
      id: crypto.randomUUID(),
      source_url: sourceUrl,
      source_type: sourceType,
      local_path: filePath,
      file_size: finalStats.size,
      mime_type: mimeType,
      expires_at: expiresAt,
    })

    return filePath
  } catch (error) {
    console.error('Cache stream error:', error)
    return null
  }
}

export async function resolvePipedStream(videoId: string): Promise<ResolvedStream | null> {
  const sourceUrl = `https://www.youtube.com/watch?v=${videoId}`
  
  const cached = await getCachedStream(sourceUrl, 'piped')
  if (cached) return cached

  try {
    const instanceUrl = await getHealthyPipedInstance()
    const response = await fetchWithTimeout(`${instanceUrl}/api/v1/streams/${videoId}`, {}, 10000)
    
    if (!response.ok) {
      throw new Error(`Piped API error: ${response.status}`)
    }

    const data = await response.json() as { audioStreams?: any[] }
    if (!data.audioStreams || data.audioStreams.length === 0) {
      throw new Error('No audio streams found')
    }

    const bestStream = data.audioStreams
      .filter((s: any) => s.type === 'audio')
      .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0]

    if (!bestStream || !bestStream.url) {
      throw new Error('No valid audio stream URL')
    }

    const streamUrl = bestStream.url.startsWith('http') ? bestStream.url : `${instanceUrl}${bestStream.url}`
    
    const cachedPath = await cacheStream(streamUrl, sourceUrl, 'piped')

    return {
      streamUrl: cachedPath ? `file://${cachedPath}` : streamUrl,
      mimeType: bestStream.mimeType || 'audio/mpeg',
      quality: bestStream.quality || 'high',
      bitrate: bestStream.bitrate || 128000,
      sourceType: 'piped',
      cachedPath,
      contentLength: bestStream.contentLength,
    }
  } catch (error) {
    console.error('Piped stream resolution error:', error)
    return null
  }
}

export async function resolveYouTubeMusicStream(videoId: string): Promise<ResolvedStream | null> {
  const sourceUrl = `https://music.youtube.com/watch?v=${videoId}`

  const cached = await getCachedStream(sourceUrl, 'youtube-music')
  if (cached) return cached

  try {
    const instanceUrl = await getHealthyYtmInstance()
    const response = await fetchWithTimeout(`${instanceUrl}/api/v1/song/${videoId}`, {}, 10000)

    if (!response.ok) {
      throw new Error(`YTM API error: ${response.status}`)
    }

    const data = await response.json() as { streamingData?: { adaptiveFormats?: any[] } }
    if (!data.streamingData?.adaptiveFormats?.length) {
      throw new Error('No streaming formats found')
    }

    const audioFormats = data.streamingData.adaptiveFormats
      .filter((f: any) => f.mimeType?.startsWith('audio/'))
      .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))

    if (!audioFormats.length) {
      throw new Error('No audio formats found')
    }

    const bestFormat = audioFormats[0]
    const streamUrl = bestFormat.url

    const cachedPath = await cacheStream(streamUrl, sourceUrl, 'youtube-music')

    return {
      streamUrl: cachedPath ? `file://${cachedPath}` : streamUrl,
      mimeType: bestFormat.mimeType || 'audio/mpeg',
      quality: bestFormat.quality || 'high',
      bitrate: bestFormat.bitrate || 128000,
      sourceType: 'youtube-music',
      cachedPath,
      contentLength: bestFormat.contentLength,
    }
  } catch (error) {
    console.error('YouTube Music stream resolution error:', error)
    return null
  }
}

export async function resolveStream(trackId: string, sourceUrl: string, sourceType: 'piped' | 'youtube-music'): Promise<ResolvedStream | null> {
  let stream: ResolvedStream | null = null

  if (sourceType === 'piped') {
    const videoId = extractVideoId(sourceUrl)
    if (videoId) {
      stream = await resolvePipedStream(videoId)
    }
  } else if (sourceType === 'youtube-music') {
    const videoId = extractVideoId(sourceUrl)
    if (videoId) {
      stream = await resolveYouTubeMusicStream(videoId)
    }
  }

  if (!stream) {
    const fallbackType = sourceType === 'piped' ? 'youtube-music' : 'piped'
    if (fallbackType === 'piped') {
      const videoId = extractVideoId(sourceUrl)
      if (videoId) stream = await resolvePipedStream(videoId)
    } else {
      const videoId = extractVideoId(sourceUrl)
      if (videoId) stream = await resolveYouTubeMusicStream(videoId)
    }
  }

  if (stream) {
    const track = database.getTrack(trackId)
    if (track && stream.cachedPath) {
      database.updateTrackCachedPath(trackId, stream.cachedPath)
    }
  }

  return stream
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /music\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export async function searchPiped(query: string, type: 'tracks' | 'artists' | 'albums' = 'tracks', limit = 20) {
  try {
    const instanceUrl = await getHealthyPipedInstance()
    const response = await fetchWithTimeout(`${instanceUrl}/api/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`, {}, 10000)
    
    if (!response.ok) throw new Error(`Search failed: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error('Piped search error:', error)
    return null
  }
}

export async function searchYouTubeMusic(query: string, type: 'tracks' | 'artists' | 'albums' = 'tracks', limit = 20) {
  try {
    const instanceUrl = await getHealthyYtmInstance()
    const response = await fetchWithTimeout(`${instanceUrl}/api/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`, {}, 10000)

    if (!response.ok) throw new Error(`YTM Search failed: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error('YouTube Music search error:', error)
    return null
  }
}

export async function getTrendingTracks(limit = 50) {
  try {
    const instanceUrl = await getHealthyPipedInstance()
    const response = await fetchWithTimeout(`${instanceUrl}/api/v1/trending`, {}, 10000)
    
    if (!response.ok) throw new Error(`Trending failed: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error('Trending tracks error:', error)
    return null
  }
}

export async function getTrackInfo(videoId: string, sourceType: 'piped' | 'youtube-music') {
  try {
    if (sourceType === 'piped') {
      const instanceUrl = await getHealthyPipedInstance()
      const response = await fetchWithTimeout(`${instanceUrl}/api/v1/info/${videoId}`, {}, 10000)
      if (!response.ok) throw new Error(`Info failed: ${response.status}`)
      return await response.json()
    } else {
      const instanceUrl = await getHealthyYtmInstance()
      const response = await fetchWithTimeout(`${instanceUrl}/api/v1/song/${videoId}`, {}, 10000)
      if (!response.ok) throw new Error(`YTM Info failed: ${response.status}`)
      return await response.json()
    }
  } catch (error) {
    console.error('Track info error:', error)
    return null
  }
}

export async function getLyrics(videoId: string, sourceType: 'piped' | 'youtube-music') {
  try {
    if (sourceType === 'piped') {
      const instanceUrl = await getHealthyPipedInstance()
      const response = await fetchWithTimeout(`${instanceUrl}/api/v1/comments/${videoId}`, {}, 10000)
      if (!response.ok) throw new Error(`Lyrics failed: ${response.status}`)
      return await response.json()
    }
  } catch (error) {
    console.error('Lyrics error:', error)
  }
  return null
}