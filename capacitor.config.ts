import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.mfy.app',
  appName: 'MFY',
  webDir: 'dist',
  bundledWebRuntime: false,
  backgroundColor: '#0a0a0a',
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'MFY',
    limitsNavigationsToAppBoundDomains: false,
  },
  server: {
    iosScheme: 'https',
    allowNavigation: [
      '*.themoviedb.org',
      '*.tmdb.org',
      '*.youtube.com',
      '*.youtube-nocookie.com',
      '*.googleapis.com',
      '*.gstatic.com',
      '*.simkl.com',
      '*.trakt.tv',
    ],
  },
}

export default config
