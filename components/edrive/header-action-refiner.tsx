'use client';

import { useEffect } from 'react';

export function HeaderActionRefiner() {
  useEffect(() => {
    const apply = () => {
      const statusButtons = Array.from(document.querySelectorAll('header button')).filter((button) => button.textContent?.includes('Check Status'));
      statusButtons.forEach((button) => {
        const textNode = Array.from(button.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
        if (textNode) textNode.textContent = 'Track Booking';
        button.setAttribute('aria-label', 'Track booking status by reference number');
        button.classList.add('bg-gradient-to-br', 'from-[#fff8e6]', 'via-[#f6df9a]', 'to-[#d7aa43]', 'border-[#b07e21]/35', 'text-primary-900', 'shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-8px_14px_rgba(139,92,18,0.10),0_8px_18px_rgba(117,79,18,0.16)]');
      });

      document.querySelectorAll('header a[href="/admin"]').forEach((anchor) => {
        const textNode = Array.from(anchor.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
        if (textNode) textNode.textContent = 'Staff Login';
      });
    };

    apply();
    const timer = window.setTimeout(apply, 650);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
