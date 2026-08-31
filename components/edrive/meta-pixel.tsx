'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  connectMetaEvents,
  discardPendingMetaEvents,
  isMetaEligibleUrl,
  trackMetaContentView,
  trackMetaEvent,
  trackMetaInitiateCheckout,
  trackMetaPageView
} from '@/lib/meta-pixel';

const pixelId = '1139005827091005';
const scriptId = 'edrive-meta-pixel';

type MetaFbq = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: MetaFbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: MetaFbq;
    _fbq?: MetaFbq;
  }
}

function ensureMetaPixel() {
  if (window.fbq) return window.fbq;

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as MetaFbq;

  window.fbq = fbq;
  window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  fbq('set', 'autoConfig', false, pixelId);
  fbq('init', pixelId);

  if (!document.getElementById(scriptId)) {
    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  return fbq;
}

function isContactLink(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  const anchor = target.closest('a[href]');
  if (!anchor) return false;
  const href = anchor.getAttribute('href') || '';
  return href.startsWith('tel:')
    || href.startsWith('mailto:')
    || /(?:wa\.me|whatsapp\.com)/i.test(href);
}

export function MetaPixel() {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!isMetaEligibleUrl(url)) {
      discardPendingMetaEvents();
      return;
    }

    const fbq = ensureMetaPixel();
    const disconnect = connectMetaEvents((event) => fbq('track', event));
    const onClick = (event: MouseEvent) => {
      if (isMetaEligibleUrl(new URL(window.location.href)) && isContactLink(event.target)) {
        trackMetaEvent('Contact');
      }
    };

    document.addEventListener('click', onClick, true);
    trackMetaPageView(url);
    trackMetaContentView(url);
    trackMetaInitiateCheckout(url);

    return () => {
      document.removeEventListener('click', onClick, true);
      disconnect();
    };
  }, [pathname, search]);

  return null;
}
