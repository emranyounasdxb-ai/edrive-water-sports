'use client';

import { useEffect } from 'react';

function updateText(element: HTMLElement, label: string) {
  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) node.textContent = label;
  }
}

function applyHeaderCtaRefinement() {
  document.querySelectorAll<HTMLElement>('header button').forEach((button) => {
    const text = button.textContent?.trim() || '';
    if (text !== 'Check Status' && text !== 'Track Booking') return;

    updateText(button, 'Track Booking');
    button.setAttribute('aria-label', 'Track booking status by reference number');
    button.classList.add('bg-[linear-gradient(135deg,#fff8e6_0%,#f6df9a_42%,#d7aa43_100%)]', 'border-[#d4a83e]/40', 'text-primary-900', 'shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-8px_14px_rgba(139,92,18,0.10),0_8px_18px_rgba(117,79,18,0.16)]', 'hover:bg-[linear-gradient(135deg,#fff4d5_0%,#edcf78_46%,#c9972f_100%)]');
  });

  document.querySelectorAll<HTMLElement>('header a[href="/admin"]').forEach((anchor) => {
    const text = anchor.textContent?.trim() || '';
    if (text !== 'Admin Portal' && text !== 'Staff Login') return;
    updateText(anchor, 'Staff Login');
  });
}

export function HeaderCtaRefiner() {
  useEffect(() => {
    applyHeaderCtaRefinement();
    const timeout = window.setTimeout(applyHeaderCtaRefinement, 500);
    return () => window.clearTimeout(timeout);
  }, []);

  return null;
}
