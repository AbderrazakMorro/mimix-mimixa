/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry } from "@serwist/precaching";
import { installSerwist } from "@serwist/sw";
import { NetworkFirst } from "serwist";

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Apply Network First strategy for all Page navigations and API requests
    {
      matcher: ({ request, url }) => request.mode === 'navigate' || url.pathname.startsWith('/api/'),
      handler: new NetworkFirst({
        cacheName: 'mimix-network-first',
        networkTimeoutSeconds: 5,
      }),
    },
    ...defaultCache,
  ],
});
