import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Graal — Fitness Tracker',
    short_name: 'Graal',
    description: 'Suivi entraînement, mensurations et diète avec analyse morphologique',
    start_url: '/',
    display: 'standalone',
    display_override: ['standalone'],
    background_color: '#09090b',
    theme_color: '#09090b',
    orientation: 'portrait',
    categories: ['fitness', 'health', 'lifestyle'],
    launch_handler: {
      client_mode: 'focus-existing',
    },
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/maskable-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Nouvelle séance',
        short_name: 'Séance',
        url: '/workout',
        icons: [{ src: '/icons/icon-192.svg', sizes: '192x192' }],
      },
      {
        name: 'Journal alimentaire',
        short_name: 'Diète',
        url: '/diet',
        icons: [{ src: '/icons/icon-192.svg', sizes: '192x192' }],
      },
      {
        name: 'Mensurations',
        short_name: 'Mesures',
        url: '/measurements',
        icons: [{ src: '/icons/icon-192.svg', sizes: '192x192' }],
      },
    ],
  }
}
