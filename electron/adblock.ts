import { session } from 'electron'

// Free ad-blocking: blocks known ad/tracker domains at the network layer
// so embedded players (sports iframes etc.) show no ads.
const AD_DOMAINS = [
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'google-analytics.com',
  'googletagmanager.com',
  'adservice.google.com',
  'scorecardresearch.com',
  'amazon-adsystem.com',
  'adnxs.com',
  'adsrvr.org',
  'rubiconproject.com',
  'criteo.com',
  'criteo.net',
  'taboola.com',
  'outbrain.com',
  'adroll.com',
  'pubmatic.com',
  'openx.net',
  'casalemedia.com',
  'indexww.com',
  'quantserve.com',
  'moatads.com',
  'tremorhub.com',
  'spotxchange.com',
  'adcolony.com',
  'vungle.com',
  'inmobi.com',
  'mopub.com',
  'chartbeat.com',
  'parsely.com',
  'segment.io',
  'mixpanel.com',
  'hotjar.com',
  'fullstory.com',
  'mouseflow.com',
  'clarity.ms',
  '2mdn.net',
  'gstatic.com/doubleclick',
  'adsafeprotected.com',
  'serving-sys.com',
  'smartadserver.com',
  'teads.tv',
  'tribalfusion.com',
  'yieldmo.com',
  'connatix.com',
  'embedly.com',
  'revcontent.com',
  'zemanta.com',
  'bidswitch.net',
  'appnexus.com',
  'bidr.io',
  'xandr.com',
  'popads.net',
  'propellerads.com',
  'trafficjunky.net',
  'exoclick.com',
  'adsterra.com',
  'adcash.com',
  'adbucks.io',
  'dianomi.com',
  'undertone.com',
  'verizonmedia.com',
  'oath.com',
  'advertising.com',
  'matichtv.com',
  'h5ast.stream',
  'ad-maven.com',
  'adexchangegate.com',
  'tsyndicate.com',
  'juicyads.com',
  'mgid.com',
]

const AD_PATTERNS = [
  /^https?:\/\/[^/]*\.?doubleclick\.net\//i,
  /^https?:\/\/[^/]*\.?googlesyndication\.com\//i,
  /^https?:\/\/[^/]*\.?googleadservices\.com\//i,
  /^https?:\/\/[^/]*\.?adsafeprotected\.com\//i,
  /\/adserver\.php/i,
  /\/adframe/i,
  /\/ads?\/(banner|iframe|servlet)/i,
  /\.adf\.ly\//i,
  /\/popunders?\.php/i,
]

const EXTRA = [
  'highperformancecpmgate.com', 'highcpmgate.com', 'clickadu.com', 'onclickalgo.com',
  'popcash.net', 'popunder.net', 'ad-maven.com', 'adexchangegate.com', 'tsyndicate.com',
  'bet365.com', 'bet365affiliates.com', 'trafficstars.com', 'hilltopads.net',
  'adsterra.com', 'juicyads.com', 'exoclick.com', 'propellerads.com', 'popads.net',
]

export function setupAdBlocker() {
  for (const d of EXTRA) {
    if (!AD_DOMAINS.includes(d)) AD_DOMAINS.push(d)
  }
  const sessions = [session.defaultSession, session.fromPartition('persist:mfy')]
  for (const ses of sessions) {
  ses.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
    const url = details.url
    const hostname = extractHostname(url)
    if (hostname && isAdHost(hostname)) {
      return callback({ cancel: true })
    }
    if (AD_PATTERNS.some((re) => re.test(url))) {
      return callback({ cancel: true })
    }
    callback({})
  })

  // Kill popup/redirect ads opened from embedded players
  ses.setPermissionCheckHandler((_wc, permission) => {
    const blocked: string[] = ['notifications', 'clipboard-sanitized-write', 'geolocation', 'midi', 'serial']
    return !blocked.includes(permission)
  })
  }
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return ''
  }
}

function isAdHost(hostname: string): boolean {
  const base = hostname.replace(/^www\./, '')
  return AD_DOMAINS.some((d) => base === d || base.endsWith('.' + d))
}