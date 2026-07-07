'use client';

import { useEffect } from 'react';

function setVisibleText(element: Element, label: string) {
  const textNode = Array.from(element.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
  if (textNode) textNode.textContent = label;
}

function applyHeaderActions() {
  document.querySelectorAll<HTMLElement>('header button').forEach((button) => {
    const text = button.textContent?.trim() || '';
    if (text !== 'Check Status' && text !== 'Track Booking') return;

    setVisibleText(button, 'Track Booking');
    button.setAttribute('aria-label', 'Track booking status by reference number');
    button.style.background = 'linear-gradient(135deg, #fff8e6 0%, #f6df9a 42%, #d7aa43 100%)';
    button.style.borderColor = 'rgba(176, 126, 33, 0.45)';
    button.style.color = '#082532';
    button.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -8px 14px rgba(139,92,18,0.10), 0 8px 18px rgba(117,79,18,0.16)';
  });

  document.querySelectorAll<HTMLElement>('header a[href="/admin"]').forEach((anchor) => {
    const text = anchor.textContent?.trim() || '';
    if (text !== 'Admin Portal' && text !== 'Staff Login') return;
    setVisibleText(anchor, 'Staff Login');
  });
}

export function HeaderActionRefiner() {
  useEffect(() => {
    applyHeaderActions();
    const timeout = window.setTimeout(applyHeaderActions, 650);
    const observer = new MutationObserver(applyHeaderActions);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      window.clearTimeout(timeout);
      observer.disconnect();
    };
  }, []);

  return null;
}
