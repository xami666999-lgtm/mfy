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

export default function QualityBadges({ haystack = '', year }: { haystack?: string; year?: string }) {
  const y = Number(year) || 0
  let text = haystack
  if (!/2160p|1080p|720p|\bhdr\b|atmos/i.test(text)) {
    text += y >= 2017 ? ' 2160p hdr atmos 1080p 5.1' : y >= 2010 ? ' 1080p hdr 5.1' : ' 1080p 5.1'
  }
  const groups = ['res', 'vid', 'aud', 'ch']
  return (
    <div className="flex flex-col gap-2 mb-4">
      {groups.map((g) => (
        <div key={g} className="flex flex-wrap items-center gap-1.5">
          {BADGES.filter((b) => b.group === g).map((b) => {
            const on = b.test.test(text)
            return (
              <img
                key={b.id}
                src={b.src}
                alt={b.id}
                title={b.id}
                className={`h-6 object-contain ${on ? 'opacity-100' : 'opacity-35'}`}
                referrerPolicy="no-referrer"
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
