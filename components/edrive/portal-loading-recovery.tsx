'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, RotateCcw, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';

function portalIsStillLoading() {
  return Array.from(document.querySelectorAll('div')).some((element) => element.textContent?.trim() === 'Loading portal...');
}

export function PortalLoadingRecovery() {
  const [show, setShow] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (portalIsStillLoading()) setShow(true);
    }, 10000);

    return () => window.clearTimeout(timeout);
  }, []);

  async function clearCacheAndRetry() {
    setWorking(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } finally {
      window.location.reload();
    }
  }

  async function signInAgain() {
    setWorking(true);
    await supabase.auth.signOut();
    window.location.assign('/admin/login/');
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#F4F7F8]/95 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[1.75rem] border border-border bg-white p-6 text-center shadow-[0_28px_80px_rgba(8,37,50,0.16)]">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary-50 text-primary"><RefreshCw className="size-5" aria-hidden="true" /></span>
        <h1 className="mt-4 font-heading text-2xl font-semibold text-primary-900">Portal is taking longer than expected</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Your saved session or browser cache may need a refresh.</p>
        <div className="mt-5 grid gap-2">
          <Button type="button" disabled={working} onClick={() => window.location.reload()} className="rounded-full"><RefreshCw className="size-4" aria-hidden="true" />Retry Portal</Button>
          <Button type="button" disabled={working} variant="outline" onClick={clearCacheAndRetry} className="rounded-full bg-white"><RotateCcw className="size-4" aria-hidden="true" />Clear Cache & Retry</Button>
          <Button type="button" disabled={working} variant="ghost" onClick={signInAgain} className="rounded-full"><LogIn className="size-4" aria-hidden="true" />Sign In Again</Button>
        </div>
      </div>
    </div>
  );
}
