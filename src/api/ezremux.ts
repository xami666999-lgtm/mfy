/** Hardcoded EZRemux / AIOStreams v0.0.2 stream ranking
 *  https://gist.github.com/EZRY1/e4aec39d1586abd5eaa070ffdf66c08b
 */

const PREFERRED_RES = ['2160p', '4k', 'uhd', '1080p', '720p']
const EXCLUDED_RES = ['576p', '480p', '360p', '240p', '144p', '1440p']
const EXCLUDED_Q = ['cam', 'scr', 'ts', 'tc', 'hdtv', 'dvdrip', 'hdrip', 'webrip', 'web-dl', 'webdl', 'dvd remux']
const EXCLUDED_VIS = ['3d', 'upscaled', ' h-ou', 'h-sbs', 'sdr']
const PREFERRED_Q = ['bluray remux', 'remux', 'bluray', 'blu-ray']
const PREFERRED_VIS = ['imax', 'hdr+dv', 'hdr10+', 'dolby vision', 'dv', 'hdr']
const PREFERRED_AUD = ['truehd', 'dts-hd ma', 'dts:x', 'dts-x', 'flac', 'atmos']

export function ezScore(title: string) {
  const t = String(title || '').toLowerCase()
  if (!t) return 0
  if (EXCLUDED_Q.some((x) => t.includes(x))) return -1000
  if (EXCLUDED_RES.some((x) => t.includes(x))) return -800
  if (EXCLUDED_VIS.some((x) => t.includes(x))) return -400
  let n = 0
  if (t.includes('2160') || t.includes('4k') || t.includes('uhd')) n += 80
  else if (t.includes('1080')) n += 50
  else if (t.includes('720')) n += 20
  for (const q of PREFERRED_Q) if (t.includes(q)) n += 40
  for (const q of PREFERRED_VIS) if (t.includes(q)) n += 12
  for (const q of PREFERRED_AUD) if (t.includes(q)) n += 10
  if (t.includes('english') || /\beng\b/.test(t)) n += 6
  return n
}

export function ezRank<T extends { title?: string; quality?: string }>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const sa = ezScore(`${a.title || ''} ${a.quality || ''}`)
    const sb = ezScore(`${b.title || ''} ${b.quality || ''}`)
    return sb - sa
  }).filter((r) => ezScore(`${r.title || ''} ${r.quality || ''}`) > -500)
}

export const EZREMUX = {
  name: 'EZRemux',
  version: '0.0.2',
  gist: 'https://gist.github.com/EZRY1/e4aec39d1586abd5eaa070ffdf66c08b',
}
