'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { connectMetaEvents, discardPendingMetaEvents, isMetaEligibleUrl } from '@/lib/meta-pixel';

export function MetaPixel() {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    let frame: HTMLIFrameElement | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let disconnect: (() => void) | undefined;
    let cancelled = false;
    const stop = () => {
      cancelled = true;
      clearTimeout(timer);
      disconnect?.();
      frame?.remove();
      discardPendingMetaEvents();
    };
    const mount = () => {
      if (cancelled || !isMetaEligibleUrl(new URL(window.location.href))) return;
      frame = document.createElement('iframe');
      // No allow-same-origin: Meta cannot inspect the parent URL, DOM or storage.
      frame.setAttribute('sandbox', 'allow-scripts');
      frame.referrerPolicy = 'no-referrer';
      frame.title = 'Marketing measurement';
      frame.style.cssText = 'position:fixed;bottom:0;left:0;width:1px;height:1px;border:0;pointer-events:none';
      frame.tabIndex = -1;
      frame.setAttribute('aria-hidden', 'true');
      frame.onload = () => {
        const send = (event: 'PageView' | 'CompleteRegistration') => {
          if (!cancelled && isMetaEligibleUrl(new URL(window.location.href))) {
            // An opaque sandbox origin requires '*'; the destination is this frame only.
            frame?.contentWindow?.postMessage(event, '*');
          }
        };
        send('PageView');
        disconnect = connectMetaEvents(send);
      };
      frame.src = '/meta-pixel-frame.html';
      document.body.appendChild(frame);
    };
    const schedule = () => { timer = setTimeout(mount, 600); };
    if (isMetaEligibleUrl(new URL(window.location.href))) {
      if (document.readyState === 'complete') schedule();
      else window.addEventListener('load', schedule, { once: true });
    } else discardPendingMetaEvents();
    window.addEventListener('hashchange', stop);
    window.addEventListener('popstate', stop);
    return () => {
      stop();
      window.removeEventListener('load', schedule);
      window.removeEventListener('hashchange', stop);
      window.removeEventListener('popstate', stop);
    };
  }, [pathname, search]);

  return null;
}
