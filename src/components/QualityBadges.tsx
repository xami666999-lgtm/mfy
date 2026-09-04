const BADGES: { id: string; group: string; src: string; test: RegExp }[] = [
  { id: '4k', group: 'res', src: 'https://raw.githubusercontent.com/leonevz/Elite-Badges/main/Badges/4k_ultra_hd.png', test: /2160p|uhd|\b4k\b/i },
  { id: '1080', group: 'res', src: 'https://raw.githubusercontent.com/leonevz/Elite-Badges/main/Badges/1080p_full_hd.png', test: /1080p|fhd|full\s*hd/i },
  { id: '720', group: 'res', src: 'https://raw.githubusercontent.com/leonevz/Elite-Badges/main/Badges/720p_hd.png', test: /720p/i },
  { id: '480', group: 'res', src: 'https://raw.githubusercontent.com/leonevz/Elite-Badges/main/Badges/480p_sd.png', test: /480p|\bsd\b/i },
  { id: 'dv', group: 'vid', src: 'https://raw.githubusercontent.com/leonevz/Elite-Badges/main/Badges/dolby_vision.png', test: /dolby[\s._-]*vision|\bdv\b/i },
  { id: 'hdr', group: 'vid', src: 'https://raw.githubusercontent.com/leonevz/Elite-Badges/main/Badges/hdr.png', test: /\bhdr\b/i },
  { id: 'hdr10', group: 'vid', src: 'https://raw.githubusercontent.com/leonevz/Elite-Badges/main/Badges/hdr10.png', test: /hdr10(?!\+)/i },
  { id: 'hdr10p', group: 'vid', src: 'https://raw.githubusercontent.com/leonevz/Elite-Badges/main/Badges/hdr10_plus.png', test: /hdr10\+/i },
  { id: 'imax', group: 'vid', src: 'https://raw.githubusercontent.com/leonevz/Elite-Badges/main/Badges/imax.png', test: /\bimax\b/i },
  { id: 'atmos', group: 'aud', src: 'https://raw.githubusercontent.com/leonevz/Elite-Badges/main/Badges/dolby_atmos.png', test: /atmos/i },
  { id: 'ddp', group: 'aud', src: 'https://raw.githubusercontent.com/leonevz/Elite-Badges/main/Badges/dolby_digital.png', test: /dolby[\s._-]*digital|\bddp\b|\bac3\b/i },
  { id: 'truehd', group: 'aud', src: 'https://raw.githubusercontent.com/leonevz/Elite-Badges/main/Badges/truehd.png', test: /true[\s._-]*hd/i },
  { id: 'dts', group: 'aud', src: 'https://raw.githubusercontent.com/leonevz/Elite-Badges/main/Badges/dts.png', test: /\bdts\b/i },
  { id: '51', group: 'ch', src: 'https://raw.githubusercontent.com/leonevz/Elite-Badges/main/Badges/5_1_audio.png', test: /5[\s._-]*1/ },
  { id: '71', group: 'ch', src: 'https://raw.githubusercontent.com/leonevz/Elite-Badges/main/Badges/7_1_audio.png', test: /7[\s._-]*1/ },
]

export default function QualityBadges({ haystack = '' }: { haystack?: string; year?: string }) {
  const hits = BADGES.filter((b) => b.test.test(haystack || ''))
  if (!hits.length) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-4">
      {hits.map((b) => (
        <img key={b.id} src={b.src} alt={b.id} title={b.id} className="h-6 object-contain" referrerPolicy="no-referrer" />
      ))}
    </div>
  )
}
