import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Mimix & Mimixa',
    short_name: 'Mimixa',
    description: 'Your Private Universe & Couples Game',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FFF5F7',
    theme_color: '#E8677D',
    icons: [
      {
        src: '/assets/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/assets/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
       {
        src: '/assets/logo.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}
