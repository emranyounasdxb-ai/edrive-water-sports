'use client';

import { useEffect } from 'react';

function textNodeOf(element: Element) {
  return Array.from(element.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
}

function rest(button: HTMLElement) {
  button.style.background = 'linear-gradient(180deg, #fff8eb 0%, #f7e5b2 52%, #e0bd6c 100%)';
  button.style.borderColor = 'rgba(178,132,39,0.36)';
  button.style.color = '#082532';
  button.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -7px 12px rgba(120,82,18,0.08), 0 7px 16px rgba(112,78,22,0.13)';
  button.style.transform = 'translateY(0)';
}

function hover(button: HTMLElement) {
  button.style.background = 'linear-gradient(180deg, #fff6da 0%, #f1d691 52%, #cfa03d 100%)';
  button.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -8px 13px rgba(112,73,13,0.10), 0 10px 20px rgba(112,78,22,0.18)';
  button.style.transform = 'translateY(-1px)';
}

export function HeaderVisualFix() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>('header button').forEach((button) => {
        const text = button.textContent?.trim() || '';
        if (text !== 'Check Status' && text !== 'Track Booking') return;
        const node = textNodeOf(button);
        if (node) node.textContent = 'Track Booking';
        button.style.transition = 'background 220ms ease, box-shadow 220ms ease, transform 220ms ease';
        rest(button);
        button.addEventListener('mouseenter', () => hover(button));
        button.addEventListener('mouseleave', () => rest(button));
      });

      document.querySelectorAll<HTMLElement>('header a[href="/admin"]').forEach((link) => {
        const text = link.textContent?.trim() || '';
        if (text !== 'Admin Portal' && text !== 'Staff Login') return;
        const node = textNodeOf(link);
        if (node) node.textContent = 'Staff Login';
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
