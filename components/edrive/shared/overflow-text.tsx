'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OverflowText({
  value,
  fallback = '—',
  maxWidth = 'max-w-[14rem]',
  maxCharacters,
  copyable = false,
  className
}: {
  value: unknown;
  fallback?: string;
  maxWidth?: string;
  maxCharacters?: number;
  copyable?: boolean;
  className?: string;
}) {
  const text = String(value ?? '').trim() || fallback;
  const preview = maxCharacters && text.length > maxCharacters ? `${text.slice(0, maxCharacters).trimEnd()}…` : text;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeEscape);
    };
  }, [open]);

  async function copyText() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <span ref={rootRef} className={cn('relative inline-flex min-w-0 max-w-full align-middle', maxWidth)}>
      <button
        type="button"
        aria-label={`Show full text: ${text}`}
        aria-expanded={open}
        className={cn('min-w-0 max-w-full truncate text-left outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-primary/35', className)}
        onClick={() => setOpen((current) => !current)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={(event) => {
          if (!rootRef.current?.contains(event.relatedTarget as Node)) setOpen(false);
        }}
      >
        {preview}
      </button>
      {open && text !== fallback ? (
        <span
          role="tooltip"
          className="absolute left-0 top-[calc(100%+0.35rem)] z-[120] w-max max-w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-slate-950 px-3 py-2 text-left text-xs font-medium leading-5 text-white shadow-xl"
        >
          <span className="block whitespace-normal break-words">{text}</span>
          {copyable ? (
            <button type="button" onClick={() => void copyText()} className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-teal-200">
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}{copied ? 'Copied' : 'Copy'}
            </button>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
